import {
  tomato,
  red,
  crimson,
  pink,
  plum,
  purple,
  violet,
  indigo,
  blue,
  cyan,
  teal,
  green,
  grass,
  orange,
  brown,
  sky,
  mint,
  lime,
  yellow,
  amber,
  gray,
  mauve,
  slate,
  sage,
  olive,
  sand,
  gold,
  bronze,
} from "@radix-ui/colors";

// keep in sync with index.html
export const backgroundColor = mauve;
export const headerColor = sky;
export const coreColors = [orange, grass, plum];
export const altColors = [tomato, indigo, gold];
export const alt2Colors = [sky, brown, violet, sand];
export const colorGroups = [coreColors, altColors, alt2Colors];
export const fillIntensity = 7;
export const strokeIntensity = 10;

export const radColors = [
  tomato,
  red,
  crimson,
  pink,
  plum,
  purple,
  violet,
  indigo,
  blue,
  cyan,
  teal,
  green,
  grass,
  orange,
  brown,
  sky,
  mint,
  lime,
  yellow,
  amber,
  gray,
  mauve,
  slate,
  sage,
  olive,
  sand,
  gold,
  bronze,
];

export const getRC = (radColor, idx) => {
  // return custom colors as-is
  if (typeof radColor === "string") return radColor;
  const c1 = Object.keys(radColor)[0];
  const c = c1.replace(/\d/, "") + idx;
  return radColor[c];
};
