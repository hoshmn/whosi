// export CONSTS
export const DISABLED = false;
export const TABLE_DELIN = "__";
export const MULTI_LINE_TEXT_DELIN = "__";

// these are set in the home sheet for version controlability
export const CONFIGURABLE_GID_NAMES = ["configs", "dictionary"];
// gids pointing to Sheet tabs
export const GID_MAP = {
  home: "0",
  // configs: null,
  // dictionary: null,
  // // settings: null,
};

// now extracted from chart configs sheet
// export const chartIds = [
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
export const CONFIG_FIELDS = {
  chartId: "chart_id",
  sourceGid: "source_gid",
  element: "element",
  displayName: "display_name",
  capPercentage: "cap_percentage",
  percentageDecimals: "percentage_decimals",
  coarseIntegerFormatting: "coarse_integer_formatting",
  colorOverride: "color_override",
  chartType: "chart_type",
  modelled: "modelled",
  formula: "formula",
  hidden: "hidden",
  valueField: "value_field",
  percentage: "percentage",
};

// DATA SHEETS - data fields (fields that configs can filter by)
export const DATA_FIELDS = {
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
  source_display: "source_display",
  notes: "notes",
  modality: "modality",
  modality_category: "modality_category",
  import_file: "import_file",
  import_timestamp: "import_timestamp",
  row_id: "row_id",
  suppressed: "suppressed",
};

// GENERATED FIELDS - fields we add for the app
export const GENERATED_FIELDS = {
  // we use UPPER_CASE to distinguish from actual "database" fields from the Sheet
  DISPLAY_NAME: "DISPLAY_NAME",
  DISPLAY_VALUE: "DISPLAY_VALUE",
  DISPLAY_VALUE_LOWER: `DISPLAY_${DATA_FIELDS.value_lower.toUpperCase()}`,
  DISPLAY_VALUE_UPPER: `DISPLAY_${DATA_FIELDS.value_upper.toUpperCase()}`,
};
