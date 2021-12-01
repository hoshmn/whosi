import { csv } from "d3-fetch";
import _ from "lodash";
import {
  CONFIG_FIELDS as C,
  DATA_FIELDS as D,
  GENERATED_FIELDS as G,
  GID_MAP,
  CONFIGURABLE_GID_NAMES,
  TABLE_DELIN
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
  getField
} from "./utils/data";

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

  const chartIds = _.uniqBy(baseConfigs, "chart_id")
    .map((c) => c.chart_id)
    .filter((id) => id !== "all");

  const chartConfigsMap = _.mapValues(shaped, (configParams, name) => {
    // wise?
    if (name === "all") return configParams;
    return _.groupBy(configParams, C.element);
  });

  _.each(chartConfigsMap, (configParams, name) => {
    if (name === "all") return;
    _.each(configParams, (elemDetails, elementName) => {
      if (elementName === "all") return;
    });
  });

  return { chartConfigsMap, chartIds };
}

async function getAllDataFromTab(gid) {
  // console.log("get data from", gid);
  return await csv(getUrl(gid)).catch((e) => {
    console.error("error in getChartOrTable()): ", e);
  });
}

// so we only request data from each tab once
// after first dashboard load, countries should load instantly
const memoizedGetAllDataFromTab = _.memoize(getAllDataFromTab);

async function getCountryDataFromTab(gid, selectedIso) {
  const allData = await memoizedGetAllDataFromTab(gid);

  return allData.filter((d) => filterByCountryGenerator(selectedIso)(d));
}

async function getCharts({ chartConfigsMap, chartIds, selectedIso }) {
  return await Promise.all(
    chartIds.map((chartId) =>
      getChartOrTable({ chartConfigsMap, chartId, selectedIso })
    )
  ).catch((e) => {
    console.error("error in getCharts(): ", e);
  });
}

async function getChartOrTable({ chartConfigsMap, chartId, selectedIso }) {
  // if (
  //   ![
  // "intro",
  // "p95",
  // "plhiv_diagnosis",
  // "late_hiv"
  //   ].includes(chartId)
  // )
  // return;
  // console.log("creating : ", chartId);
  const chartConfig = chartConfigsMap[chartId];
  // the chart settings are the values on the chart config where element === "all"
  const chartSettings = _.get(chartConfig, "all[0]");

  if (!chartConfig || !chartSettings || !chartSettings[C.sourceGid]) {
    console.warn("skipping chart: ", chartId);
    return null;
  }
  const chartSourceData = await getCountryDataFromTab(
    chartSettings[C.sourceGid],
    selectedIso
  );

  const getterMap = {
    table: getTable,
    text: getText
    // nested: getNested, // uses chart
  };

  const getter = _.get(getterMap, chartSettings[C.chartType], getChart);

  return getter({
    chartId,
    chartSettings,
    chartConfigsMap,
    chartSourceData,
    selectedIso
  });
}

function getText({
  chartId,
  chartSettings,
  chartConfigsMap,
  chartSourceData,
  selectedIso
}) {
  console.log(
    chartId,
    chartSettings,
    chartConfigsMap,
    chartSourceData,
    selectedIso
  );

  const elements = getElements(chartConfigsMap[chartId]);
  const textValues = {};
  _.each(elements, (element) => {
    const { row, value } = getDataPoint({
      chartId,
      element,
      selectedIso,
      chartConfigsMap,
      chartSourceData
      // valueParser: isPercentage
    });
    textValues[element] = value;
    textValues[`${element}_row`] = row;
  });

  return {
    textValues,
    chartId,
    countryIso: selectedIso,
    elements,
    type: _.get(chartSettings, C.chartType),
    name: _.get(chartSettings, C.displayName, chartId)
  };
}

function getTable({
  chartId,
  chartSettings,
  chartConfigsMap,
  chartSourceData,
  selectedIso
}) {
  const chartConfig = chartConfigsMap[chartId];

  const elements = getElements(chartConfig);
  const dataPoints = {};
  // add non-calculated points
  const isPercentage = getFieldBoolean({
    chartConfig,
    field: C.percentage
  });
  _.each(elements, (element) => {
    const { row, value } = getDataPoint({
      chartId,
      element,
      selectedIso,
      chartConfigsMap,
      chartSourceData
      // valueParser: isPercentage
    });
    dataPoints[element] = value;
    dataPoints[element + "_row"] = row;
  });

  const rowNames = _.uniq(elements.map((elem) => elem.split(TABLE_DELIN)[0]));
  const colNames = _.uniq(elements.map((elem) => elem.split(TABLE_DELIN)[1]));

  const data = rowNames.map((rn) => ({
    row: _.get(chartConfig, [`_key_${rn}`, 0, C.displayName], rn),
    values: colNames.map((cn) => ({
      column: _.get(chartConfig, [`_key_${cn}`, 0, C.displayName], cn),
      value: _.get(dataPoints, `${rn}${TABLE_DELIN}${cn}`),
      sheetRow: _.get(dataPoints, `${rn}${TABLE_DELIN}${cn}_row`)
    }))
  }));
  const chart = {
    data,
    chartId,
    countryIso: selectedIso,
    elements: elements,
    isPercentage,
    type: _.get(chartSettings, C.chartType),
    name: _.get(chartSettings, C.displayName, chartId)
  };

  return chart;
}

function getChart({
  chartId,
  chartSettings,
  chartConfigsMap,
  chartSourceData,
  selectedIso
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
        selectedIso,
        chartConfigsMap,
        chartSourceData
      });
      dataPoints[element] = value;
      dataPoints[element + "_row"] = row;
      dataPoints[element + "_bounds"] = getBounds(row);
    });

    // add calculated points (now that non-calculated constituents have values)
    _.each(elements, (element) => {
      if (!getFormula({ element, chartConfig })) return null;
      const { row, value } = getCalculatedDataPoint({
        chartId,
        element,
        chartConfigsMap,
        dataPoints
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

  const elementNameMap = {};
  _.each(
    visibleElements,
    (element) =>
      (elementNameMap[element] = getField({
        element,
        chartConfig: chartConfigsMap[chartId],
        field: C.displayName
      }))
  );

  const colors = getColors({
    chartSettings,
    chartConfig,
    chartElements: visibleElements
  });

  const chart = {
    data: isTimeseries ? data : data[0],
    chartId,
    countryIso: selectedIso,
    elements: visibleElements,
    elementNameMap,
    colors,
    isPercentage: getFieldBoolean({
      chartConfig,
      field: C.percentage
    }),
    type: _.get(chartSettings, C.chartType),
    name: _.get(chartSettings, C.displayName, chartId)
  };

  return chart;
}
// ___ END ASYNC FETCHERS _____

// MAIN FUNCTIONS

/** SITE DATA - runs once on site load */
export async function getSiteData() {
  // if (DISABLED) return [];
  // CONFIGURE GIDS MAP
  await setConfigGids().catch((e) => {
    console.error("error in setConfigGids(): ", e);
  });

  // GRAB DICTIONARY
  const dictionary = await csv(getUrl(GID_MAP.dictionary)).catch((e) =>
    console.error("error in getDictionary: ", e)
  );

  // GRAB DICTIONARY
  const countries = await csv(getUrl(GID_MAP.countries)).catch((e) =>
    console.error("error in getcountries: ", e)
  );

  // GRAB CONFIGS
  const { chartConfigsMap, chartIds } = await getChartConfigs().catch((e) =>
    console.error("error in getChartConfigs(): ", e)
  );
  console.log("@@@ ALL CONFIGS: ");
  console.log(chartConfigsMap);

  return { dictionary, countries, chartConfigsMap, chartIds };
}

/** CREATE CHARTS - whenever selected country changes */
export async function getChartData({ chartConfigsMap, chartIds, selectedIso }) {
  const charts = await getCharts({
    chartConfigsMap,
    chartIds,
    selectedIso
  }).catch((e) => {
    console.error("error in getCharts(selectedIso): ", e);
  });

  return { charts };
}
