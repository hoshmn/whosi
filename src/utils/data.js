import _ from "lodash";
import { colorGroups } from "../consts/colors";
import {
  CONFIG_FIELDS as C,
  DATA_FIELDS as D,
  GENERATED_FIELDS as G,
} from "../consts/data";

// HELPERS
export const getUrl = (gid) =>
  `https://docs.google.com/spreadsheets/d/e/2PACX-1vSAEOXOt5aHDcb35lpCsSO5AvHTZPplXHrHGaIXTJjCtW_B96D0MOItWZLGv1j4lagTxnuVClms6M0X/pub?gid=${gid}&single=true&output=csv`;

export const configParser = (row) => {
  if (!row[C.chartId]) return;
  delete row[""];

  _.each(row, (value, key) => {
    // remove k/v pair for actually empty values
    if (value === "") delete row[key];
    // turn "null" in sheet into "" values
    else row[key] = value === "null" ? "" : value;
  });

  return row;
};

export const filterByCountryGenerator = (country_iso_code) => {
  return (row) => (row[D.country_iso_code] === country_iso_code ? row : null);
};

// determine actual chart elements from chart config
export const getElements = (chartConfig) =>
  Object.keys(chartConfig).filter((k) => k !== "all" && !k.startsWith("_key_"));

// omit element to get chart-wide setting
export const getField = ({ element = "all", chartConfig, field }) =>
  _.get(chartConfig, [element, 0, field]);

// omit element to get chart-wide setting
export const getFieldBoolean = ({ element = "all", chartConfig, field }) =>
  !!getField({ element, chartConfig, field });

export const getFormula = ({ element, chartConfig }) =>
  getField({ element, chartConfig, field: C.formula });

export const getBounds = (row = {}) => {
  const { [D.value_lower]: vLower, [D.value_upper]: vUpper } = row;
  if (!parseFloat(vLower) || !parseFloat(vUpper)) return;
  return [parseFloat(vLower), parseFloat(vUpper)];
};

// determine a chart's colors based on its override settings
export const getColors = ({
  chartSettings,
  chartConfig,
  chartElements: visibleElements,
}) => {
  // chart-wide override determines which color group to use
  let groupIdx = parseInt(Math.abs(_.get(chartSettings, C.colorOverride)));
  groupIdx = ((groupIdx || 1) - 1) % colorGroups.length;

  const baseColors = colorGroups[groupIdx];
  const colors = visibleElements.map((element, idx) => {
    // element-specific overrides trump the base group color
    const override = getField({ chartConfig, element, field: C.colorOverride });
    return override || baseColors[idx % baseColors.length];
  });

  const type = _.get(chartSettings, C.chartType);
  // nested boxes charts need one more color than they have elements
  if (type === "nested")
    colors.push(baseColors[visibleElements.length % baseColors.length]);

  return colors;
};

// turn "[2018-2020]" into [2018, 2019, 2020]
export const transformYearRange = (range) => {
  const regex = /\[(\d+)-(\d+)\]/;
  const result = regex.exec(range);
  if (!result || !result.length > 1) return [];
  const y1 = parseInt(result[1]);
  const y2 = parseInt(result[2]);
  return _.range(y1, y2 + 1).map(String);
};

// derive a row filter of type { sex: "males", age: "15+" }
export const getFilter = ({
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

// find appropriate row using filter
export const getRow = ({ filter, chartSourceData }) => {
  const matchingRows = _.filter(chartSourceData, (row) => {
    return _.every(filter, (val, key) => {
      // only filter by data sheet fields
      if (!D[key]) return true;
      // if no/null row value, matches if we're looking for null value
      if (!row[key]) return !val;
      return row[key].toLowerCase() === val.toLowerCase();
    });
  });

  // find highest year, use source year to break ties
  return _.maxBy(matchingRows, (r) => {
    const y = Number(_.get(r, D.year, 0));
    const sy = Number(_.get(r, D.sourceYear, 0));
    return y + sy / 10000;
  });
};

// find/create data point to use for a line point or table cell
export const getDataPoint = ({
  chartId,
  element,
  year = null,
  country_iso_code,
  chartConfigsMap,
  chartSourceData,
  valueParser = _.round,
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

  // add display name for elements appearance in legend, tooltip
  const displayName = getField({
    element,
    chartConfig: chartConfigsMap[chartId],
    field: C.displayName,
  });
  displayName && _.set(row, G.DISPLAY_NAME, displayName);

  return { row, value };
};

// create derived data point (from other found points) using formula provided in Sheet
export const getCalculatedDataPoint = ({
  chartConfig,
  element,
  dataPoints,
}) => {
  const rawFormula = getFormula({ element, chartConfig });
  let convertedFormula = rawFormula;

  // where the *magic* happens: formula is converted from the
  // string provided in the Sheet to an actual mathematical
  // expression by swapping element names for their values
  // e.g.:  total_hiv-aware  becomes  7843-384
  _.each(dataPoints, (value, key) => {
    convertedFormula = convertedFormula.replace(key, value);
  });

  let result = null;
  // attempt to evaluate the resulting expression
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

  // add display name for elements appearance in legend, tooltip
  const displayName =
    getField({
      element,
      chartConfig,
      field: C.displayName,
    }) || element;

  // console.log(result);
  return { value: result, row: { [G.DISPLAY_NAME]: displayName } };
};
