import _ from "lodash";

export const displayPercent = (v) => {
  v = Number(v);
  if (!isFinite(v)) return "NA";
  if (v > 100) console.warn("Incorrect %");
  return _.round(v, 0).toString() + "%";
};
