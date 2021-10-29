import { csv } from "d3-fetch";
import _ from "lodash";

// const urlData1 = "https://docs.google.com/spreadsheets/d/13kvd68Vjh35_7LL35D1tVM8vUy3_sxKkj_b3ZhzDw48/export?gid=0&format=csv"
const urlData1 =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAEOXOt5aHDcb35lpCsSO5AvHTZPplXHrHGaIXTJjCtW_B96D0MOItWZLGv1j4lagTxnuVClms6M0X/pub?gid=0&single=true&output=csv";
const urlMeta =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAEOXOt5aHDcb35lpCsSO5AvHTZPplXHrHGaIXTJjCtW_B96D0MOItWZLGv1j4lagTxnuVClms6M0X/pub?gid=1186908045&single=true&output=csv";
const metaParser = (row) => {
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

async function getData() {
  const baseConfigs = await csv(urlMeta, metaParser);
  // console.log(baseConfigs)
  const shaped = _.groupBy(baseConfigs, "chart");

  const chartConfigs = _.mapValues(shaped, (configParams, name) => {
    console.log(name);
    // wise?
    if (name === "all") return configParams;
    return _.groupBy(configParams, "element");
  });

  console.log("CC");
  console.log(chartConfigs);

  _.each(chartConfigs, (configParams, name) => {
    if (name === "all") return;
    console.log(name);
    console.log(configParams);

    _.each(configParams, (elemDetails, elementName) => {
      if (elementName === "all") return;
      console.log(elemDetails, elementName);
    });
  });

  const data = await csv(urlData1);
  console.log(data);
  return chartConfigs;
}

export default getData;
