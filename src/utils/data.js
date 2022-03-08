import _ from "lodash";
import { colorGroups } from "../consts/colors";
import {
  CONFIG_FIELDS as C,
  DATA_FIELDS as D,
  GENERATED_FIELDS as G,
  SPECIAL_VALUES as S,
} from "../consts/data";
import { capValue, displayNumber, displayPercent } from "./display";

// functions to test whether a row matches a filter for special Sheet cell input values
const SPECIAL_FILTERS_MAP = {
  _NONE_: _.negate(_.identity), // cells only included if empty
  _SOMETHING_: _.identity, // cells only included if not empty
  _ANY_: _.stubTrue, // allow any cell value (to overwrite broader filter)
};
// default function to test whether a row matches a filter
const defaultCompFn = (cellVal, filterVal) =>
  cellVal.toLowerCase() === filterVal.toLowerCase();

// HELPERS
export const getUrl = (gid) =>
  `https://docs.google.com/spreadsheets/d/e/2PACX-1vSAEOXOt5aHDcb35lpCsSO5AvHTZPplXHrHGaIXTJjCtW_B96D0MOItWZLGv1j4lagTxnuVClms6M0X/pub?gid=${gid}&single=true&output=csv`;

export const configParser = (row) => {
  if (!row[C.chartId]) return;
  // if (row[C.chartId].startsWith(S._page_element_)) {}
  delete row[""];

  _.each(row, (value, key) => {
    // remove k/v pair for actually empty values
    if (value === "") delete row[key];
    // turn "null" in sheet into "" values
    // else row[key] = value === "null" ? "" : value;
  });

  return row;
};

export const filterByCountryGenerator = (selectedIso) => {
  return (row) => (row[D.country_iso_code] === selectedIso ? row : null);
};

// determine actual chart elements from chart config
export const getElements = (chartConfig) =>
  Object.keys(chartConfig).filter((k) => k !== S.all && !k.startsWith(S._key_));

// get setting from element, else chart, else global
export const getSetting = ({
  element = S.all,
  chartConfigsMap,
  field,
  chartId = S.all,
}) =>
  _.get(chartConfigsMap, [chartId, element, 0, field]) ||
  _.get(chartConfigsMap, [chartId, S.all, 0, field]) ||
  _.get(chartConfigsMap, [S.all, 0, field]);

// omit element to get chart-wide setting
export const getField = ({ element = S.all, chartConfig, field }) =>
  _.get(chartConfig, [element, 0, field]);

// omit element to get chart-wide setting
export const getFieldBoolean = ({ element = S.all, chartConfig, field }) =>
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
  selectedIso,
  chartConfigsMap,
}) => {
  // filter applied to all charts
  const allChartsFilter = _.get(chartConfigsMap, [S.all, 0], {});
  // filter applied to all elements within this chart
  const allElementsFilter = _.get(chartConfigsMap, [chartId, S.all, 0], {});
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
    selectedIso,
  };
  if (!!year) filter.year = year;
  return filter;
};

// find appropriate row using filter
export const getRow = ({ filter, chartSourceData }) => {
  const matchingRows = _.filter(chartSourceData, (row) => {
    return _.every(filter, (filterVal, field) => {
      // only filter by data sheet fields
      if (!D[field]) return true;

      const cellVal = row[field] || "";
      let comparisonFn = SPECIAL_FILTERS_MAP[filterVal] || defaultCompFn;

      // if (!row[field]) return !filterVal;
      return !!comparisonFn(cellVal, filterVal);
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
  selectedIso,
  chartConfigsMap,
  chartSourceData,
  // valueParser = _.identity,
}) => {
  const filter = getFilter({
    chartId,
    element,
    year,
    selectedIso,
    chartConfigsMap,
    chartSourceData,
  });

  const row = getRow({ filter, chartSourceData });

  // usually we care about "value", but sometimes "value_comment"
  const valueField = _.get(filter, C.valueField, D.value);
  let value = _.get(row, valueField, null);

  if (!row || !value) return {};

  // add display name for elements appearance in legend, tooltip
  const displayName = getField({
    element,
    chartConfig: chartConfigsMap[chartId],
    field: C.displayName,
  });
  displayName && _.set(row, G.DISPLAY_NAME, displayName);

  // assume that value_comment (or other non-value) field is for non-numeric column
  if (valueField && valueField !== D.value) return { row, value };

  // assume that value holds numeric data, proceed to process
  return capAndFormat({ row, value, chartConfigsMap, chartId, element });
};

// mutates its row input!
// applies caps and display formatting settings to numeric row/values
export const capAndFormat = ({
  row,
  value,
  chartConfigsMap,
  chartId,
  element,
}) => {
  let displayValue = value;

  const isPercentage = getFieldBoolean({
    chartConfig: chartConfigsMap[chartId],
    field: C.percentage,
  });

  if (isPercentage) {
    const cap = getSetting({
      chartConfigsMap,
      chartId,
      element,
      field: C.capPercentage,
    });
    const decimals = getSetting({
      chartConfigsMap,
      chartId,
      element,
      field: C.percentageDecimals,
    });

    // value = value && valueParser(value);
    const options = { cap, decimals };
    // be sure to capture display value BEFORE capping, so it includes >
    displayValue = displayPercent(value, options);
    value = capValue(value, options);
    // overwriting
    capValue && _.set(row, D.value, value);

    [D.value_lower, D.value_upper].forEach((F) => {
      const v = _.get(row, F);

      // formatted capped val for tooltips
      v && _.set(row, `DISPLAY_${F.toUpperCase()}`, displayPercent(v, options));

      // capped val for plotting
      const cv = v && capValue(v, options);
      cv && _.set(row, F, cv);
    });
  } else {
    // is integer
    const coarseFormatting = !!getSetting({
      chartConfigsMap,
      chartId,
      element,
      field: C.coarseIntegerFormatting,
    });
    displayValue = displayNumber(value, { coarseFormatting });

    [D.value_lower, D.value_upper].forEach((F) => {
      let v = _.get(row, F);
      // formatted value for tooltips
      v && _.set(row, `DISPLAY_${F.toUpperCase()}`, displayNumber(v));
      // v && _.set(row, F, v);
    });
  }

  // formatted value for tooltips
  displayValue && _.set(row, G.DISPLAY_VALUE, displayValue);

  return { row, value };
};

// create derived data point (from other found points) using formula provided in Sheet
export const getCalculatedDataPoint = ({
  chartConfigsMap,
  element,
  dataPoints,
  chartId,
}) => {
  const chartConfig = chartConfigsMap[chartId];
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
    console.warn(`missing values for ${rawFormula} (${convertedFormula})`);
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
  return capAndFormat({
    value: result,
    row: { [G.DISPLAY_NAME]: displayName },
    chartConfigsMap,
    chartId,
    element,
  });
};

// TODO: logic is specific to DELIVERABLE chart. make universal.
export const findLeastUpdatedDeliverableCell = (groupData, col) => {
  const { columnName } = col;
  // ordered least to most complete
  const statuses = ["Delayed", "Planned", "Started", "Ongoing", "Completed"];
  let i = 0;

  let someCell = {};
  let theCell = null;
  while (i < statuses.length) {
    // TODO: refactor for clarity
    groupData.find((r) => {
      someCell = r.values.find((v) => v.sourceColumnName === columnName);
      if (_.get(someCell, "value") === statuses[i]) {
        theCell = someCell;
        return true;
      }
    });
    if (theCell) return theCell;
    i++;
  }
  return someCell;
};
