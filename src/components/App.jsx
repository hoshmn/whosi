// import "./styles.css";
import React from "react";
import _ from "lodash";
import { getSiteData, getChartData } from "../getData";
import { themePrimary, radColors, getRC } from "../consts/colors";
import {
  CircularProgress,
  Container,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { Header } from "./Header";
import { Charts } from "./Charts";
import { Box } from "@mui/system";
import { transformLink } from "../utils/display";
import { HomePage } from "./HomePage";
import { Dictionary } from "./Dictionary";

const SHOW_COLORS = false;

export default function App() {
  const [selectedIso, setIso] = React.useState(null);
  const [chartData, setChartData] = React.useState([]);

  const [dictionary, setDictionary] = React.useState([]);
  const [countries, setCountries] = React.useState([]);
  const [homeCopy, setHomeCopy] = React.useState([]);
  const [chartIds, setChartIds] = React.useState([]);
  const [chartConfigsMap, setChartConfigsMap] = React.useState(null);

  const [dashExpanded, setDashExpanded] = React.useState(false);
  const toggleDashExpanded = () => setDashExpanded(!dashExpanded);

  // on page load, get site-wide data
  React.useEffect(() => {
    getSiteData().then((result) => {
      setDictionary(result.dictionary.filter((d) => d.term && d.definition));
      setCountries(result.countries.filter((c) => c.iso && c.name));
      setHomeCopy(result.homecopy);
      setChartIds(result.chartIds);
      setChartConfigsMap(result.chartConfigsMap);
    });
  }, []);

  // on country selection change, get country-specific chart data
  React.useEffect(() => {
    if (!selectedIso) return;
    getChartData({ chartConfigsMap, chartIds, selectedIso }).then((result) => {
      console.log("@@@ ALL DATA: ");
      console.log(result.charts);
      setChartData(result.charts);
    });
  }, [selectedIso]);

  const updateCountry = (e) => {
    const value = e.target.value;
    const realIso = _.some(countries, ({ iso }) => iso === value);
    setIso(realIso ? value : null);
  };

  // console.log("*", chartData);
  const loading =
    !homeCopy.length ||
    (selectedIso &&
      !_.some(chartData, (c) => c && c.countryIso === selectedIso));

  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        // keep in sync with index.html background
        background: getRC(themePrimary, 3),
        color: getRC(themePrimary, 12),
        fontFamily: theme.typography.fontFamily,
        p: { lg: 6 },
      }}
    >
      <Header
        countries={countries}
        handleCountryChange={updateCountry}
        selectedIso={selectedIso}
      />
      <br />

      {loading ? (
        <Box pt={"45vh"} sx={{ textAlign: "center" }}>
          <CircularProgress color="secondary" />
          <Typography
            mt={1}
            variant="body1"
            dangerouslySetInnerHTML={{
              __html: "Loading...",
            }}
          />
        </Box>
      ) : !selectedIso ? (
        <HomePage homeCopy={homeCopy} />
      ) : (
        <Charts
          countries={countries}
          selectedIso={selectedIso}
          chartData={chartData}
          dashExpanded={dashExpanded}
          toggleDashExpanded={toggleDashExpanded}
        />
      )}
      {!!dictionary.length && !loading && dashExpanded && (
        <Dictionary dictionary={dictionary} />
      )}
      {SHOW_COLORS &&
        radColors.map((rc) => (
          <>
            <br></br>
            {_.map(Object.keys(radColors[0]), (meh, idx) => (
              <span
                style={{
                  background: getRC(rc, idx + 1),
                  height: "70px",
                  width: "70px",
                  display: "inline-block",
                  textAlign: "center",
                }}
              >
                {idx + 1}
              </span>
            ))}
            {Object.keys(rc)[0].replace(/\d/, "")}
          </>
        ))}
    </Paper>
  );
}
