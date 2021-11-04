import { csv } from "d3-fetch";
import _ from "lodash";

const getUrl = (gid) =>
  `https://docs.google.com/spreadsheets/d/e/2PACX-1vSAEOXOt5aHDcb35lpCsSO5AvHTZPplXHrHGaIXTJjCtW_B96D0MOItWZLGv1j4lagTxnuVClms6M0X/pub?gid=${gid}&single=true&output=csv`;
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

const chartNames = [
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

// const urlData1 = "https://docs.google.com/spreadsheets/d/13kvd68Vjh35_7LL35D1tVM8vUy3_sxKkj_b3ZhzDw48/export?gid=0&format=csv"
// const urlData1 =
//   "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAEOXOt5aHDcb35lpCsSO5AvHTZPplXHrHGaIXTJjCtW_B96D0MOItWZLGv1j4lagTxnuVClms6M0X/pub?gid=0&single=true&output=csv";
// const urlMeta =
// "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAEOXOt5aHDcb35lpCsSO5AvHTZPplXHrHGaIXTJjCtW_B96D0MOItWZLGv1j4lagTxnuVClms6M0X/pub?gid=1186908045&single=true&output=csv";

const configParser = (row) => {
  if (!row.chart) return;
  delete row[""];
  row.chart = row.chart.replace(/\s+/g, "_");

  const keys = Object.keys(row);
  const constraintKeys = keys.filter((k) => k.match(/c\d+k/));
  // console.log(constraintKeys)
  row.constraints = [];
  constraintKeys.forEach((k) => {
    const key = row[k].toLowerCase();
    const v = k.slice(0, -1) + "v";
    let value = row[v];
    value = !value || value === "null" ? null : value.toLowerCase();

    delete row[k];
    delete row[v];
    if (!key) return;
    // console.log(key, value)
    row.constraints.push({ key, value });
  });
  // const output = {}
  // console.log(constraints)
  return row;
};

async function setConfigGids() {
  const homeRows = await csv(getUrl(gids.home));
  configurableGidNames.forEach((name) => {
    const lastConfiguredRow = _.findLast(homeRows, (r) => !!r[name]);
    gids[name] = lastConfiguredRow[name];
  });
}

async function getChartConfigs() {
  const baseConfigs = await csv(getUrl(gids.configs), configParser);
  const shaped = _.groupBy(baseConfigs, "chart");
  const chartConfigs = _.mapValues(shaped, (configParams, name) => {
    // console.log(name);
    // wise?
    if (name === "all") return configParams;
    return _.groupBy(configParams, "element");
  });

  // console.log("CC");
  // console.log(chartConfigs);

  _.each(chartConfigs, (configParams, name) => {
    if (name === "all") return;
    // console.log(name);
    // console.log(configParams);

    _.each(configParams, (elemDetails, elementName) => {
      if (elementName === "all") return;
      // console.log(elemDetails, elementName);
    });
  });
  // console.log(data);
  return chartConfigs;
}

const filterByCountryGenerator = (iso_code) => {
  return (row) => (row.country_iso_code === iso_code ? row : null);
};

async function getCharts(iso_code) {
  return await Promise.all(chartNames.map((name) => getChart(name, iso_code)));
  // return await getChart("late_hiv", iso_code)
}
async function getChart(name, iso_code) {
  if (name !== "late_hiv") return;
  console.log("creating : ", name);
  console.log(chartSettingsMap[name]);
  const chartConfig = chartConfigsMap[name];
  console.log(chartConfigsMap[name]);
  const chartSettings = chartSettingsMap[name];
  const allData = await csv(
    getUrl(chartSettings.source_gid),
    filterByCountryGenerator(iso_code)
  );
  console.log(allData);

  const elements = Object.keys(chartConfig).filter((k) => k !== "all");
  console.log(elements);
  // getchartdata per element
  return allData;
}

async function getData(iso_code = "MOZ") {
  // CONFIGURE GIDS MAP
  await setConfigGids();
  // console.log(gids)

  // GRAB SETTINGS
  const settingsRows = await csv(getUrl(gids.settings));
  // console.log("!!!!!!!", settingsRows);
  chartSettingsMap = _.keyBy(settingsRows, "id");

  // GRAB CONFIGS
  chartConfigsMap = await getChartConfigs();
  console.log(chartConfigsMap);
  // const data = await csv(urlData1);

  // CREATE CHARTS
  const charts = await getCharts(iso_code);
  return charts;
}

export default getData;
