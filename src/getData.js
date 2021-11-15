import { csv } from "d3-fetch";
import _ from "lodash";

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
// let chartSettingsMap = {};
let chartConfigsMap = {};

// TODO: populate dynamically
const chartIds = [
  "plhiv_diagnosis",
  "p95",
  "late_hiv",
  "plhiv_art",
  "new_art",
  "plhiv_suppressed",
  "testing_coverage",
  "key_populations",
  "policy_compliance",
];

// MAPS TO SPREADSHEET COLUMN NAMES:
// CONFIG SHEET - identifier fields (ie non-data fields)
const C = {
  chartId: "chart_id",
  sourceGid: "source_gid",
  element: "element",
  displayName: "display_name",
  chartType: "chart_type",
  modelled: "modelled",
  formula: "formula",
  hidden: "hidden",
  valueField: "value_field",
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

// SETTINGS SHEET
const S = {
  sourceGid: "source_gid",
  chartType: "chart_type",
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

const getFormula = ({ element, chartConfig }) =>
  _.get(chartConfig, [element, 0, C.formula]);

const getIsHidden = ({ element, chartConfig }) =>
  !!_.get(chartConfig, [element, 0, C.hidden]);

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
  valueParser = parseFloat,
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
  if (row) debugger;
  // usually we care about "value", but sometimes "value_comment"
  const valueField = _.get(filter, C.valueField, D.value);
  const value = _.get(row, valueField);
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
  const homeRows = await csv(getUrl(gids.home));
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
  const baseConfigs = await csv(getUrl(gids.configs), configParser);
  const shaped = _.groupBy(baseConfigs, C.chartId);

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

  return chartConfigs;
}

async function getCharts(country_iso_code) {
  return await Promise.all(
    chartIds.map((chartId) => getChartOrTable(chartId, country_iso_code))
  );
}

async function getChartOrTable(chartId, country_iso_code) {
  // if (chartId !== "plhiv_art") return;
  // console.log("creating : ", chartId);
  const chartConfig = chartConfigsMap[chartId];
  // const chartSettings = chartSettingsMap[chartId];
  // the chart settings are the values on the chart config where element === "all"
  const chartSettings = _.get(chartConfig, "all[0]");

  if (!chartConfig || !chartSettings || !chartSettings[S.sourceGid]) {
    console.warn("skipping chart: ", chartId);
    return null;
  }
  const chartSourceData = await csv(
    getUrl(chartSettings[S.sourceGid]),
    filterByCountryGenerator(country_iso_code)
  );

  const getter = chartSettings[S.chartType] === "table" ? getTable : getChart;

  return getter({
    chartId,
    chartSettings,
    chartConfigsMap,
    chartSourceData,
    country_iso_code,
  });
  // console.log(chartSourceData);
}

function getTable({
  chartId,
  chartSettings,
  chartConfigsMap,
  chartSourceData,
  country_iso_code,
}) {
  const chartConfig = chartConfigsMap[chartId];

  const elements = Object.keys(chartConfig).filter((k) => k !== "all");
  const dataPoints = {};
  // add non-calculated points
  _.each(elements, (element) => {
    const { row, value } = getDataPoint({
      chartId,
      element,
      country_iso_code,
      chartConfigsMap,
      chartSourceData,
      valueParser: _.identity,
    });
    dataPoints[element] = row;
    // dataPoints[element + "_row"] = row;
  });

  const rowNames = _.uniq(elements.map((elem) => elem.split(tableDelin)[0]));
  const colNames = _.uniq(elements.map((elem) => elem.split(tableDelin)[1]));

  const data = rowNames.map((rn) => ({
    row: rn,
    values: colNames.map((cn) => ({
      column: cn,
      value: _.get(dataPoints, `${rn}${tableDelin}${cn}`),
    })),
  }));
  const chart = {
    data,
    chartId,
    country_iso_code,
    elements: elements,
    type: _.get(chartSettings, S.chartType),
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

  const elements = Object.keys(chartConfig).filter((k) => k !== "all");
  // console.log(elements);

  // NOTE: currently all charts range over years
  const year_range = _.get(chartConfig, ["all", 0, D.year]);
  const years_arr = transformYearRange(year_range);
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
        year,
        country_iso_code,
        chartConfigsMap,
        chartSourceData,
      });
      dataPoints[element] = value;
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
      if (getIsHidden({ element, chartConfig })) {
        // console.log("deleting: ", element);
        delete dataPoints[element];
      }
    });
    dataPoints.name = year;
    // console.log(dataPoints);
    return dataPoints;
  });

  const chart = {
    data,
    chartId,
    country_iso_code,
    elements: elements.filter(
      (element) => !getIsHidden({ element, chartConfig })
    ),
    type: _.get(chartSettings, S.chartType),
  };

  return chart;
}

// MAIN FUNCTION
async function getData(country_iso_code) {
  if (DISABLED) return [];
  // CONFIGURE GIDS MAP
  await setConfigGids();

  // // GRAB SETTINGS (unless already loaded)
  // if (_.isEmpty(chartSettingsMap)) {
  //   const settingsRows = await csv(getUrl(gids.settings));
  //   chartSettingsMap = _.keyBy(settingsRows, C.chartId);
  //   console.log("@@@ ALL SETTINGS: ");
  //   console.log(chartSettingsMap);
  // }

  // GRAB CONFIGS (unless already loaded)
  if (_.isEmpty(chartConfigsMap)) {
    chartConfigsMap = await getChartConfigs();
    console.log("@@@ ALL CONFIGS: ");
    console.log(chartConfigsMap);
  }

  // CREATE CHARTS
  const charts = await getCharts(country_iso_code);
  return charts;
}

export default getData;
