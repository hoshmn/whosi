import _ from "lodash";

export const displayPercent = (v) => {
  v = Number(v);
  if (!isFinite(v)) return "NA";
  if (v > 100) console.warn("Incorrect %");
  return _.round(v, 0).toString() + "%";
};

export const displayNumber = (v) => {
  // insert spaces rather than commas
  return _.round(v, 0)
    .toString()
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
};

export const transformLink = (t) =>
  t.replaceAll("<a ", "<a target='_blank' rel='noopener noreferrer'");
