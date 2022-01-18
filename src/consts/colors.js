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

// keep in sync with index.html background
export const themePrimary = green;
// export const themePrimary = sand;
export const themeSecondary = indigo;
export const headerColor = teal;
// export const headerColor = amber;
export const coreColors = [orange, grass, plum];
export const altColors = [tomato, indigo, gold];
export const alt2Colors = [sky, brown, violet, sand];
export const colorGroups = [coreColors, altColors, alt2Colors];
// these intensities correspond to the radix index to use
export const fillIntensity = 8;
export const strokeIntensity = 11;

export const radColors = {
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
};

export const getRC = (radColor, idx) => {
  // return custom colors as-is
  if (typeof radColor === "string") return radColor;
  const c1 = Object.keys(radColor)[0];
  const c = c1.replace(/\d/, "") + idx;
  return radColor[c];
};
