import { render } from "react-dom";

import App from "./components/App";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { getRC, themePrimary, themeSecondary } from "./consts/colors";
import reportWebVitals from "./reportWebVitals";
import { sendToVercelAnalytics } from "./vitals";

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
    fontWeight: 400,
    lineHeight: 1.43,

    h1: {
      fontSize: { xs: '15px', md: '18px' },
      fontWeight: 500,
      lineHeight: 1.43,
    },
    h2: {
      fontSize: { xs: '14px', md: '17px' },
      fontWeight: 500,
      lineHeight: 1.43,
      
    },
    h3: {
      fontSize: { xs: '13px', md: '16px' },
      fontWeight: 500,
      lineHeight: 1.43,
      
    },
    // // subtitle1: {},
    // // subtitle2: {},
    // // caption: {},

    body1: {
      // sm-label
      fontSize: { xs: '13px', md: '16px' },
      fontWeight: 400,
      lineHeight: 1.43,
    },
    body2: {
      // xs-label
      fontSize: { xs: '12px', md: '14px' },
      fontWeight: 300,
      lineHeight: 1.43,
    },
    // caption: {
    //   // xxs-label
    //   fontSize: '10px',
    //   fontWeight: 300,
    //   lineHeight: '12px',
    // },
  },
});

function ThemedApp() {
  return <ThemeProvider theme={theme}><App /></ThemeProvider>;
}


const rootElement = document.getElementById("root");
render(<ThemedApp />, rootElement);

reportWebVitals(sendToVercelAnalytics);