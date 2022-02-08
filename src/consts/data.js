// export CONSTS
export const DISABLED = false;
export const PRE_LOAD_DATA = true;
export const TABLE_DELIN = "__";
export const MULTI_LINE_TEXT_DELIN = "__";

// sheets we can just grab copy directly from
export const CMS_SHEETS = [
  "dictionary",
  "countries",
  "homecopy",
  "publications",
  "webinars",
  "resourcenamemap",
];
// these are set in the home sheet for version controlability
export const CONFIGURABLE_GID_NAMES = ["configs", ...CMS_SHEETS];
// gids pointing to Sheet tabs
export const GID_MAP = {
  home: "0",
  // configs: null,
  // dictionary: null,
  // countries: null,
  // homepage: null,
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
  chartType: "chart_type",
  element: "element",
  displayName: "display_name",
  sourceLink: "source_link",
  sourceName: "source_name",
  iconPath: "icon_path",
  hiddenUntilExpand: "hidden_until_expand",
  capPercentage: "cap_percentage",
  percentageDecimals: "percentage_decimals",
  coarseIntegerFormatting: "coarse_integer_formatting",
  colorOverride: "color_override",
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
  Deliverable: "Deliverable",
  Supplier: "Supplier",

  REGEX: {
    // match all fields of type "Q1 2022"
    quarter: /Q\d\s\d{4}/,
  },
};

// values in the config Sheet that hold special meanings
// see also SPECIAL_FILTERS_MAP
export const SPECIAL_VALUES = {
  all: "all",
  _page_element_: "_page_element_",
  _key_: "_key_",
  _color_by_: "_color_by_",
  link_url: "link_url",
};

// fields used in the "cms" sheets (countries, dictionary, etc)
export const CMS_FIELDS = {
  // dictionary
  term: "term",
  definition: "definition",
  // countries
  iso: "iso",
  name: "name",
  // homecopy
  blurb: "blurb",
  TAP: "_TAP_", // prefix to fields for the Technical Assistance Provider fields
};

// RESOURCE FIELDS - fields we add for the app
export const RESOURCE_FIELDS = {
  // we use UPPER_CASE to distinguish from actual "database" fields from the Sheet
  title: "title",
  title_link: "title_link",
  authors: "authors",
  journal: "journal",
  volume_page: "volume_page",
  tags: "tags",
  type: "type",
  country: "country",
  region: "region",
  date: "date",
  language: "language",
  description: "description",
  link_1: "link_1",
  link_1_title: "link_1_title",
  link_2_title: "link_2",
  link_2_title: "link_2_title",
  link_3_title: "link_3",
  link_3_title: "link_3_title",
  link_4_title: "link_4",
  link_4_title: "link_4_title",
  link_5_title: "link_5",
  link_5_title: "link_5_title",
  link_6_title: "link_6",
  link_6_title: "link_6_title",
  link_7_title: "link_7",
  link_7_title: "link_7_title",
  link_8_title: "link_8",
  link_8_title: "link_8_title",
  link_9_title: "link_9",
  link_9_title: "link_9_title",
};

// GENERATED FIELDS - fields we add for the app
export const GENERATED_FIELDS = {
  // we use UPPER_CASE to distinguish from actual "database" fields from the Sheet
  DISPLAY_NAME: "DISPLAY_NAME",
  DISPLAY_VALUE: "DISPLAY_VALUE",
  DISPLAY_VALUE_LOWER: `DISPLAY_${DATA_FIELDS.value_lower.toUpperCase()}`,
  DISPLAY_VALUE_UPPER: `DISPLAY_${DATA_FIELDS.value_upper.toUpperCase()}`,
};
