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
  });

  return theme;
}
