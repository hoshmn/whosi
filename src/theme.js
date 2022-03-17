import { createTheme } from "@mui/material";

export function createSiteTheme(colors) {
  const theme = createTheme({
    palette: {
      primary: {
        main: colors.primary[500].hex,
      },
      secondary: {
        main: colors.secondary[500].hex,
      },
    },
    // typography: {
    //   fontFamily: "Fira Sans",
    //   fontWeight: 400,
    //   color: variables.colors.textDark,
    //   lineHeight: 1.43,

    //   h1: {
    //     fontSize: "15px",
    //     color: variables.colors.textDark,
    //     fontWeight: 500,
    //     lineHeight: "18px",
    //   },
    //   h2: {
    //     fontSize: "14px",
    //     color: variables.colors.textDark,
    //     fontWeight: 500,
    //     lineHeight: "18px",
    //   },
    //   h3: {
    //     fontSize: "13px",
    //     color: variables.colors.textDark,
    //     fontWeight: 500,
    //     lineHeight: "18px",
    //   },
    //   // subtitle1: {},
    //   // subtitle2: {},
    //   // caption: {},

    //   body1: {
    //     // sm-label
    //     fontSize: "13px",
    //     color: variables.colors.textMedium,
    //     fontWeight: 400,
    //     lineHeight: "18.2px",
    //   },
    //   body2: {
    //     // xs-label
    //     fontSize: "12px",
    //     color: variables.colors.textMedium,
    //     fontWeight: 300,
    //     lineHeight: "16.9px",
    //   },
    //   caption: {
    //     // xxs-label
    //     fontSize: "10px",
    //     color: variables.colors.textMedium,
    //     fontWeight: 300,
    //     lineHeight: "12px",
    //   },
    // },
  });

  return theme;
}
