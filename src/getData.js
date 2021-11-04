import { csv } from "d3-fetch";
import _ from "lodash";

// CONSTS
const DISABLED = true;

// these are set in the home sheet for version controlability
const configurableGidNames = ["configs", "dictionary", "settings"];
const gids = {
  home: "1188341414",
  // configs: null,
  // dictionary: null,
  // settings: null,
  data: {}
};
let chartSettingsMap = {};
let chartConfigsMap = {};

const chartIds = [
  "p95",
  "plhiv_diagnosis",
  "late_hiv",
  "plhiv_art",
  "new_art",
  "plhiv_suppressed",
  "testing_coverage",
  "key_populations",
  "policy_compliance"
];

const chartIdCol = "chartId";
const elementCol = "element";
const nonDataColumnNames = [chartIdCol, elementCol];

// HELPERS
const getUrl = (gid) =>
  `https://docs.google.com/spreadsheets/d/e/2PACX-1vSAEOXOt5aHDcb35lpCsSO5AvHTZPplXHrHGaIXTJjCtW_B96D0MOItWZLGv1j4lagTxnuVClms6M0X/pub?gid=${gid}&single=true&output=csv`;

const configParser = (row) => {
  if (!row[chartIdCol]) return;
  delete row[""];

  _.each(row, (value, key) => {
    if (value === "") delete row[key];
    else row[key] = value === "null" ? "" : value;
  });

  return row;
};

const filterByCountryGenerator = (country_iso_code) => {
  return (row) => (row["country_iso_code"] === country_iso_code ? row : null);
};

const transformYearRange = (range) => {
  const regex = /\[(\d+)-(\d+)\]/;
  const result = regex.exec(range);
  if (!result || !result.length > 1) return [];
  const y1 = parseInt(result[1]);
  const y2 = parseInt(result[2]);
  return _.range(y1, y2 + 1).map(String);
};

const getFilter = ({
  chartId,
  element,
  year,
  country_iso_code,
  chartConfigsMap
}) => {
  // filter applied to all charts
  const allChartsFilter = _.get(chartConfigsMap, "all[0]", {});
  // filter applied to all elements within this chart
  const allElementsFilter = _.get(chartConfigsMap, `${chartId}.all[0]`, {});
  // console.log(allChartsFilter)
  // console.log(allElementsFilter)
  // filter applied to this element
  // backupFilters may be used for source prioritization
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
    year,
    country_iso_code
  };
  return filter;
};

const getRow = ({ filter, chartSourceData }) => {
  const matchingRows = _.filter(chartSourceData, (row) => {
    // console.log(row)
    return _.every(filter, (val, key) => {
      // don't filter by chartId, element
      if (nonDataColumnNames.includes(key)) return true;
      // if no/null row value, matches if we're looking for null value
      if (!row[key]) return !val;
      return row[key].toLowerCase() === val.toLowerCase();
    });
  });
  return _.maxBy(matchingRows, "source_year") || matchingRows[0];
  // matchingRows.length && console.log("!!@!", dataPoint, matchingRows);
};

const getDataPoint = ({
  chartId,
  element,
  year,
  country_iso_code,
  chartConfigsMap,
  chartSourceData
}) => {
  const filter = getFilter({
    chartId,
    element,
    year,
    country_iso_code,
    chartConfigsMap,
    chartSourceData
  });
  // console.log(filter);
  // console.log(chartSourceData);

  const row = getRow({ filter, chartSourceData });

  // todo: numeric values
  return (row && row["value"] && parseFloat(row["value"])) || null;
};

// ASYNC FETCHERS
async function setConfigGids() {
  const homeRows = await csv(getUrl(gids.home));
  configurableGidNames.forEach((name) => {
    const lastConfiguredRow = _.findLast(homeRows, (r) => !!r[name]);
    gids[name] = lastConfiguredRow[name];
  });
}

async function getChartConfigs() {
  const baseConfigs = await csv(getUrl(gids.configs), configParser);
  const shaped = _.groupBy(baseConfigs, chartIdCol);
  // console.log(shaped)
  const chartConfigs = _.mapValues(shaped, (configParams, name) => {
    // console.log(name);
    // wise?
    if (name === "all") return configParams;
    return _.groupBy(configParams, elementCol);
  });

  _.each(chartConfigs, (configParams, name) => {
    if (name === "all") return;
    _.each(configParams, (elemDetails, elementName) => {
      if (elementName === "all") return;
    });
  });
  // console.log(data);
  return chartConfigs;
}

async function getCharts(country_iso_code) {
  return await Promise.all(
    chartIds.map((id) => getChart(id, country_iso_code))
  );
}
async function getChart(chartId, country_iso_code) {
  if (chartId !== "late_hiv") return;
  console.log("creating : ", chartId);
  console.log(chartSettingsMap[chartId]);
  const chartConfig = chartConfigsMap[chartId];
  console.log(chartConfigsMap[chartId]);
  const chartSettings = chartSettingsMap[chartId];

  const chartSourceData = await csv(
    getUrl(chartSettings.source_gid),
    filterByCountryGenerator(country_iso_code)
  );
  console.log(chartSourceData);

  const elements = Object.keys(chartConfig).filter((k) => k !== "all");
  console.log(elements);

  const year_range = _.get(chartConfig, "all[0].year");
  const years_arr = transformYearRange(year_range);
  console.log(years_arr);

  // getchartdata per element
  const data = _.map(years_arr, (year) => {
    const dataPoints = {};
    _.each(
      elements,
      (element) =>
        (dataPoints[element] = getDataPoint({
          chartId,
          element,
          year,
          country_iso_code,
          chartConfigsMap,
          chartSourceData
        }))
    );
    dataPoints.name = year;
    console.log(dataPoints);
    return dataPoints;
  });

  const chart = {
    data,
    chartId
  };

  return chart;
}

// MAIN FUNCTION
async function getData(country_iso_code = "MOZ") {
  if (DISABLED) return [];
  // CONFIGURE GIDS MAP
  await setConfigGids();

  // GRAB SETTINGS
  const settingsRows = await csv(getUrl(gids.settings));
  chartSettingsMap = _.keyBy(settingsRows, "id");

  // GRAB CONFIGS
  chartConfigsMap = await getChartConfigs();
  console.log(chartConfigsMap);

  // CREATE CHARTS
  const charts = await getCharts(country_iso_code);
  return charts;
}

export default getData;
