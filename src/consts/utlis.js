import _ from "lodash";

export const displayPercent = (v) => {
  v = Number(v);
  if (!isFinite(v)) return "NA";
  if (v > 100) console.warn("Incorrect %");
  return _.round(v, 0).toString() + "%";
};
// function displayPercent({ v, adjust = false, decimals = 0 }) {
//   if (!_.isNumber(v)) {
//     console.warn("NaN fed to displayPercent: ", v);
//     return null;
//   }
//   const val = adjust ? v * 100 : v;

//   if (val > 100) {
//     console.warn("Incorrect %");
//   }
//   if (val < 0.1) {
//     return "<0.1%";
//   }
//   if (val < 0.5 && !decimals) {
//     return "<0.5%";
//   }
//   let str = _.round(val, decimals).toString();
//   if (!str.includes(".") && decimals) {
//     str += ".0"; // TODO: this doesn't accommodate decimals > 1
//   }
//   return str + "%";
// }

// TODO: use?
// function displayNumber({ v, unrounded = false }) {
//   if (!_.isNumber(v)) {
//     console.warn("NaN fed to displayNumber: ", v);
//     return null;
//   }

//   if (v > 1000000000) {
//     return _.round(v / 1000000000, 1).toString() + " billion";
//   }
//   if (v > 1000000) {
//     return _.round(v / 1000000, 1).toString() + " million";
//   }
//   if (v < 100) {
//     return "<100";
//   }
//   if (v < 200) {
//     return "<200";
//   }
//   if (v < 500) {
//     return "<500";
//   }
//   if (v < 1000) {
//     return "<1000";
//   }

//   // still make sure unrounded # is an integer
//   let str = unrounded
//     ? _.round(v).toString()
//     : Number(v.toPrecision(2)).toString();
//   let spaced = "";
//   let spacer = "";
//   let slStart;
//   while (str.length) {
//     spaced = str.slice(-3) + spacer + spaced;
//     str = str.slice(0, -3);
//     spacer = " ";
//   }

//   return spaced;
// }
