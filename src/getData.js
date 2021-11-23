import { csv } from "d3-fetch";
import _ from "lodash";
import {
  coreColors,
  altColors,
  alt2Colors,
  colorGroups,
} from "./consts/colors";

// TODO: split up this file

// CONSTS
const DISABLED = false;
const tableDelin = "__";

// these are set in the home sheet for version controlability
const configurableGidNames = ["configs", "dictionary"];
// gids pointing to Sheet tabs
const gids = {
  home: "0",
  // configs: null,
  // dictionary: null,
  // // settings: null,
};
let chartConfigsMap = {};

let chartIds = [];
// const chartIds = [
//   "p95",
//   "plhiv_diagnosis",
//   "late_hiv",
//   "plhiv_art",
//   "new_art",
//   "plhiv_suppressed",
//   "testing_coverage",
//   "key_populations",
//   "policy_compliance",
// ];

// MAPS TO SPREADSHEET COLUMN NAMES:
// CONFIG SHEET - identifier fields (ie non-data fields)
const C = {
  chartId: "chart_id",
  sourceGid: "source_gid",
  element: "element",
  displayName: "display_name",
  colorOverride: "color_override",
  chartType: "chart_type",
  modelled: "modelled",
  formula: "formula",
  hidden: "hidden",
  valueField: "value_field",
  percentage: "percentage",
};

// DATA SHEETS - data fields (fields that configs can filter by)
const D = {
  // we preserve snake_case as a reminder that these are essentially database fields
  country_iso_code: "country_iso_code",
  sourceYear: "source_year",
  value: "value",
  year: "year",
  indicator: "indicator",
  indicator_description: "indicator_description",
  sex: "sex",
  age: "age",
  population_segment: "population_segment",
  population_sub_group: "population_sub_group",
  country_name: "country_name",
  area_name: "area_name",
  geographic_scope: "geographic_scope",
  value_upper: "value_upper",
  value_lower: "value_lower",
  value_comment: "value_comment",
  unit_format: "unit_format",
  source_organization: "source_organization",
  source_database: "source_database",
  notes: "notes",
  modality: "modality",
  modality_category: "modality_category",
  import_file: "import_file",
  import_timestamp: "import_timestamp",
  row_id: "row_id",
  suppressed: "suppressed",
};

// GENERATED FIELDS - fields we add for the app
const G = {
  // we use UPPER_CASE to distinguish from actual "database" fields from the Sheet
  DISPLAY_VALUE: "DISPLAY_VALUE",
};

// HELPERS
const getUrl = (gid) =>
  `https://docs.google.com/spreadsheets/d/e/2PACX-1vSAEOXOt5aHDcb35lpCsSO5AvHTZPplXHrHGaIXTJjCtW_B96D0MOItWZLGv1j4lagTxnuVClms6M0X/pub?gid=${gid}&single=true&output=csv`;

const configParser = (row) => {
  if (!row[C.chartId]) return;
  delete row[""];

  _.each(row, (value, key) => {
    if (value === "") delete row[key];
    else row[key] = value === "null" ? "" : value;
  });

  return row;
};

const filterByCountryGenerator = (country_iso_code) => {
  return (row) => (row[D.country_iso_code] === country_iso_code ? row : null);
};

const getElements = (chartConfig) =>
  Object.keys(chartConfig).filter((k) => k !== "all" && !k.startsWith("_key_"));

// omit element to get chart-wide setting
const getField = ({ element = "all", chartConfig, field }) =>
  _.get(chartConfig, [element, 0, field]);

// omit element to get chart-wide setting
const getFieldBoolean = ({ element = "all", chartConfig, field }) =>
  !!getField({ element, chartConfig, field });

const getFormula = ({ element, chartConfig }) =>
  getField({ element, chartConfig, field: C.formula });

const getBounds = (row = {}) => {
  const { [D.value_lower]: vLower, [D.value_upper]: vUpper } = row;
  if (!parseFloat(vLower) || !parseFloat(vUpper)) return;
  return [parseFloat(vLower), parseFloat(vUpper)];
};

const getColors = ({
  chartSettings,
  chartConfig,
  chartElements: visibleElements,
}) => {
  let groupIdx = parseInt(Math.abs(_.get(chartSettings, C.colorOverride)));
  groupIdx = ((groupIdx || 1) - 1) % colorGroups.length;

  const baseColors = colorGroups[groupIdx];
  const colors = visibleElements.map((element, idx) => {
    const override = getField({ chartConfig, element, field: C.colorOverride });
    return override || baseColors[idx % baseColors.length];
  });

  const type = _.get(chartSettings, C.chartType);
  if (type === "nested")
    colors.push(baseColors[visibleElements.length % baseColors.length]);

  return colors;
};

// turn "[2018-2020]" into [2018, 2019, 2020]
const transformYearRange = (range) => {
  const regex = /\[(\d+)-(\d+)\]/;
  const result = regex.exec(range);
  if (!result || !result.length > 1) return [];
  const y1 = parseInt(result[1]);
  const y2 = parseInt(result[2]);
  return _.range(y1, y2 + 1).map(String);
};

// derive a row filter of type { sex: "males", age: "15+" }
const getFilter = ({
  chartId,
  element,
  year = null,
  country_iso_code,
  chartConfigsMap,
}) => {
  // filter applied to all charts
  const allChartsFilter = _.get(chartConfigsMap, "all[0]", {});
  // filter applied to all elements within this chart
  const allElementsFilter = _.get(chartConfigsMap, [chartId, "all", 0], {});
  // filter applied to this element
  // (backupFilters may be used for source prioritization)
  const [elementFilter, ...backupFilters] = _.get(
    chartConfigsMap,
    [chartId, element],
    [{}]
  );
  // console.log(elementFilter);

  const filter = {
    ...allChartsFilter,
    ...allElementsFilter,
    ...elementFilter,
    country_iso_code,
  };
  if (!!year) filter.year = year;
  return filter;
};

const getRow = ({ filter, chartSourceData }) => {
  const matchingRows = _.filter(chartSourceData, (row) => {
    return _.every(filter, (val, key) => {
      // only filter by data sheet fields
      if (!D[key]) return true;
      // if no/null row value, matches if we're looking for null value
      if (!row[key]) return !val;
      return row[key].toLowerCase() === val.toLowerCase();
    });
  });
  // todo: maxBy year if no year set?
  return _.maxBy(matchingRows, D.sourceYear) || matchingRows[0];
};

const getDataPoint = ({
  chartId,
  element,
  year = null,
  country_iso_code,
  chartConfigsMap,
  chartSourceData,
  valueParser = parseInt,
}) => {
  const filter = getFilter({
    chartId,
    element,
    year,
    country_iso_code,
    chartConfigsMap,
    chartSourceData,
  });

  const row = getRow({ filter, chartSourceData });

  // usually we care about "value", but sometimes "value_comment"
  const valueField = _.get(filter, C.valueField, D.value);
  let value = _.get(row, valueField, null);
  // value = value && valueParser(value);
  value && _.set(row, G.DISPLAY_VALUE, valueParser(value));

  // TODO return whole row
  return { row, value };
};

const getCalculatedDataPoint = ({ chartConfig, element, dataPoints }) => {
  const rawFormula = getFormula({ element, chartConfig });
  let convertedFormula = rawFormula;
  _.each(dataPoints, (value, key) => {
    convertedFormula = convertedFormula.replace(key, value);
  });

  let result = null;
  try {
    result = eval(convertedFormula);
  } catch (error) {
    console.warn(`cannot evaluate ${rawFormula} (${convertedFormula})`);
    return { value: null };
  }

  // only allow numbers & arith operators (otherwise eg null will evaluate to 0)
  if (!/^[\d-+*\/\.]+$/.test(convertedFormula) || !_.isNumber(result)) {
    console.log(`missing values for ${rawFormula} (${convertedFormula})`);
    return { value: null };
  }

  // console.log(result);
  return { value: result };
};

// ASYNC FETCHERS
async function setConfigGids() {
  // return if already configured
  if (configurableGidNames.every((name) => !!gids[name])) return;
  const homeRows = await csv(getUrl(gids.home)).catch((e) => {
    console.error("error in csv(getUrl(gids.home)): ", e);
  });
  configurableGidNames.forEach((name) => {
    const lastConfiguredRow = _.findLast(homeRows, (r) => !!r[name]);
    if (!lastConfiguredRow) {
      console.error("No Sheet GID found for: ", name);
      return;
    }
    gids[name] = lastConfiguredRow[name];
  });
}

async function getChartConfigs() {
  const baseConfigs = await csv(getUrl(gids.configs), configParser).catch(
    (e) => {
      console.error("error in csv(getUrl(gids.configs), configParser): ", e);
    }
  );
  const shaped = _.groupBy(baseConfigs, C.chartId);

  const orderedChartIds = _.uniqBy(baseConfigs, "chart_id")
    .map((c) => c.chart_id)
    .filter((id) => id !== "all");

  const chartConfigs = _.mapValues(shaped, (configParams, name) => {
    // wise?
    if (name === "all") return configParams;
    return _.groupBy(configParams, C.element);
  });

  _.each(chartConfigs, (configParams, name) => {
    if (name === "all") return;
    _.each(configParams, (elemDetails, elementName) => {
      if (elementName === "all") return;
    });
  });

  return { chartConfigs, orderedChartIds };
}

async function getCharts(country_iso_code) {
  return await Promise.all(
    chartIds.map((chartId) => getChartOrTable(chartId, country_iso_code))
  ).catch((e) => {
    console.error("error in getCharts(): ", e);
  });
}

async function getChartOrTable(chartId, country_iso_code) {
  // if (chartId !== "plhiv_art") return;
  // console.log("creating : ", chartId);
  const chartConfig = chartConfigsMap[chartId];
  // the chart settings are the values on the chart config where element === "all"
  const chartSettings = _.get(chartConfig, "all[0]");

  if (!chartConfig || !chartSettings || !chartSettings[C.sourceGid]) {
    console.warn("skipping chart: ", chartId);
    return null;
  }
  const chartSourceData = await csv(
    getUrl(chartSettings[C.sourceGid]),
    filterByCountryGenerator(country_iso_code)
  ).catch((e) => {
    console.error("error in getChartOrTable()): ", e);
  });

  const getterMap = {
    table: getTable,
    // nested: getNested,
  };

  const getter = _.get(getterMap, chartSettings[C.chartType], getChart);

  return getter({
    chartId,
    chartSettings,
    chartConfigsMap,
    chartSourceData,
    country_iso_code,
  });
  // console.log(chartSourceData);
}

// function getNested({
//   chartId,
//   chartSettings,
//   chartConfigsMap,
//   chartSourceData,
//   country_iso_code,
// }) {
//   const chart = {
//     data,
//     chartId,
//     country_iso_code,
//     elements: elements,
//     type: _.get(chartSettings, C.chartType),
//     name: _.get(chartSettings, C.displayName, chartId),
//   };

//   return chart;
// };

function getTable({
  chartId,
  chartSettings,
  chartConfigsMap,
  chartSourceData,
  country_iso_code,
}) {
  const chartConfig = chartConfigsMap[chartId];

  const elements = getElements(chartConfig);
  const dataPoints = {};
  // add non-calculated points
  _.each(elements, (element) => {
    const isPercentage = getFieldBoolean({
      chartConfig,
      field: C.percentage,
    });
    const { row, value } = getDataPoint({
      chartId,
      element,
      country_iso_code,
      chartConfigsMap,
      chartSourceData,
      valueParser: isPercentage ? (x) => parseFloat(x) + "%" : _.identity,
    });
    dataPoints[element] = row;
    // dataPoints[element + "_row"] = row;
  });

  const rowNames = _.uniq(elements.map((elem) => elem.split(tableDelin)[0]));
  const colNames = _.uniq(elements.map((elem) => elem.split(tableDelin)[1]));

  const data = rowNames.map((rn) => ({
    row: _.get(chartConfig, [`_key_${rn}`, 0, C.displayName], rn),
    values: colNames.map((cn) => ({
      column: _.get(chartConfig, [`_key_${cn}`, 0, C.displayName], cn),
      value: _.get(dataPoints, `${rn}${tableDelin}${cn}`),
    })),
  }));
  const chart = {
    data,
    chartId,
    country_iso_code,
    elements: elements,
    type: _.get(chartSettings, C.chartType),
    name: _.get(chartSettings, C.displayName, chartId),
  };

  return chart;
}

function getChart({
  chartId,
  chartSettings,
  chartConfigsMap,
  chartSourceData,
  country_iso_code,
}) {
  const chartConfig = chartConfigsMap[chartId];

  const elements = getElements(chartConfig);
  const visibleElements = elements.filter(
    (element) => !getFieldBoolean({ element, chartConfig, field: C.hidden })
  );
  // console.log(elements);

  // NOTE: currently all charts range over years
  const year_range = _.get(chartConfig, ["all", 0, D.year]);
  const isTimeseries = year_range;
  const years_arr = isTimeseries ? transformYearRange(year_range) : ["all"];
  // console.log(years_arr);

  // getchartdata per element
  const data = _.map(years_arr, (year) => {
    const dataPoints = {};
    // add non-calculated points
    _.each(elements, (element) => {
      if (!!getFormula({ element, chartConfig })) return null;
      const { row, value } = getDataPoint({
        chartId,
        element,
        year: isTimeseries ? year : null,
        country_iso_code,
        chartConfigsMap,
        chartSourceData,
      });
      dataPoints[element] = value;
      dataPoints[element + "_bounds"] = getBounds(row);
      dataPoints[element + "_row"] = row;
    });
    // add calculated points (now that non-calculated constituents have values)
    _.each(elements, (element) => {
      if (!getFormula({ element, chartConfig })) return null;
      const { row, value } = getCalculatedDataPoint({
        element,
        chartConfig,
        dataPoints,
      });
      dataPoints[element] = value;
    });
    // delete elements used only as constituents in calculations
    _.each(elements, (element) => {
      if (getFieldBoolean({ element, chartConfig, field: C.hidden })) {
        // console.log("deleting: ", element);
        delete dataPoints[element];
      }
    });
    dataPoints.name = year;
    // console.log(dataPoints);
    return dataPoints;
  });

  const colors = getColors({
    chartSettings,
    chartConfig,
    chartElements: visibleElements,
  });

  const chart = {
    data: isTimeseries ? data : data[0],
    chartId,
    country_iso_code,
    elements: visibleElements,
    colors,
    type: _.get(chartSettings, C.chartType),
    name: _.get(chartSettings, C.displayName, chartId),
  };

  return chart;
}

// MAIN FUNCTION
async function getData(country_iso_code) {
  // if (DISABLED) return [];
  // CONFIGURE GIDS MAP
  await setConfigGids().catch((e) => {
    console.error("error in setConfigGids(): ", e);
  });

  // GRAB CONFIGS (unless already loaded)
  if (_.isEmpty(chartConfigsMap)) {
    const result = await getChartConfigs().catch((e) => {
      console.error("error in getChartConfigs(): ", e);
    });
    chartConfigsMap = result.chartConfigs;
    chartIds = result.orderedChartIds;
    console.log("@@@ ALL CONFIGS: ");
    console.log(chartConfigsMap);
  }

  // CREATE CHARTS
  const charts = await getCharts(country_iso_code).catch((e) => {
    console.error("error in getCharts(country_iso_code): ", e);
  });
  return charts;
}

export default getData;
