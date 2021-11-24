import { render } from "react-dom";

import App from "./components/App";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { getRC, themePrimary, themeSecondary } from "./consts/colors";
// import { red } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    primary: {
      main: getRC(themePrimary, 11),
    },
    secondary: {
      main: getRC(themeSecondary, 8),
    },
  },
  typography: {
    fontFamily: [
      'Archivo',
      'sans-serif',
    ].join(','),
  },
});

function ThemedApp() {
  return <ThemeProvider theme={theme}><App /></ThemeProvider>;
}


const rootElement = document.getElementById("root");
render(<ThemedApp />, rootElement);
