import { csv } from "d3-fetch";
import _ from "lodash";
import {
  CONFIG_FIELDS as C,
  DATA_FIELDS as D,
  GID_MAP,
  CONFIGURABLE_GID_NAMES,
  TABLE_DELIN,
} from "./consts/data";
import {
  getUrl,
  configParser,
  filterByCountryGenerator,
  getElements,
  getFieldBoolean,
  getFormula,
  getBounds,
  getColors,
  transformYearRange,
  getDataPoint,
  getCalculatedDataPoint,
} from "./utils/data";
import { displayPercent } from "./utils/display";

// NOTE: *bad practice* currently these are set as global state
// so that after the data fetch for the first country we can just
// fetch chart data on subsequent searches
let chartConfigsMap = {};
let chartIds = [];

// ASYNC FETCHERS
async function setConfigGids() {
  // return if already configured
  if (CONFIGURABLE_GID_NAMES.every((name) => !!GID_MAP[name])) return;
  const homeRows = await csv(getUrl(GID_MAP.home)).catch((e) => {
    console.error("error in csv(getUrl(GID_MAP.home)): ", e);
  });
  CONFIGURABLE_GID_NAMES.forEach((name) => {
    const lastConfiguredRow = _.findLast(homeRows, (r) => !!r[name]);
    if (!lastConfiguredRow) {
      console.error("No Sheet GID found for: ", name);
      return;
    }
    GID_MAP[name] = lastConfiguredRow[name];
  });
}

async function getChartConfigs() {
  const baseConfigs = await csv(getUrl(GID_MAP.configs), configParser).catch(
    (e) => {
      console.error("error in csv(getUrl(GID_MAP.configs), configParser): ", e);
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
  // if (chartId !== "key_populations") return;
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
}

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
  const isPercentage = getFieldBoolean({
    chartConfig,
    field: C.percentage,
  });
  _.each(elements, (element) => {
    const { row, value } = getDataPoint({
      chartId,
      element,
      country_iso_code,
      chartConfigsMap,
      chartSourceData,
      valueParser: isPercentage ? displayPercent : _.identity,
    });
    dataPoints[element] = row;
    // dataPoints[element + "_row"] = row;
  });

  const rowNames = _.uniq(elements.map((elem) => elem.split(TABLE_DELIN)[0]));
  const colNames = _.uniq(elements.map((elem) => elem.split(TABLE_DELIN)[1]));

  const data = rowNames.map((rn) => ({
    row: _.get(chartConfig, [`_key_${rn}`, 0, C.displayName], rn),
    values: colNames.map((cn) => ({
      column: _.get(chartConfig, [`_key_${cn}`, 0, C.displayName], cn),
      value: _.get(dataPoints, `${rn}${TABLE_DELIN}${cn}`),
    })),
  }));
  const chart = {
    data,
    chartId,
    country_iso_code,
    elements: elements,
    isPercentage,
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
      dataPoints[element + "_row"] = row;
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
    isPercentage: getFieldBoolean({
      chartConfig,
      field: C.percentage,
    }),
    type: _.get(chartSettings, C.chartType),
    name: _.get(chartSettings, C.displayName, chartId),
  };

  return chart;
}
// ___ END ASYNC FETCHERS _____

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
