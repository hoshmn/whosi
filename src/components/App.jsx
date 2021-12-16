// import "./styles.css";
import React from "react";
import _ from "lodash";
import { getSiteData, getChartData } from "../getData";
import { themePrimary, radColors, getRC } from "../consts/colors";
import { Container, Paper, Typography, useTheme } from "@mui/material";
import { Header } from "./Header";
import { Charts } from "./Charts";
import { Box } from "@mui/system";
import { transformLink } from "../utils/display";
import { HomePage } from "./HomePage";

const homeTexts = [
  `
Overview: The WHO Differentiated Services Delivery Strategic Initiatives dashboard brings together data on HIV testing services from various sources into one visual tool. We would like to acknowledge the support of the Ministries of Health of Member States, UNAIDS, the Bill and Melinda Gates Foundation, the President’s Emergency Programme for AIDS Relief (PEPFAR), USAID, the World Health Organization, and the Global Fund to Fight AIDS, Tuberculosis and Malaria. This project aims to provide local level data for in country action for policy-makers, programme directors, outreach workers and community activists among others. The most recent data available has been collected from the relevant organisation including UNAIDS (Spectrum estimates, Global AIDS Monitoring and the Key Population Atlas), UNPOP, UNICEF and the World Bank. USAID/PEPFAR have kindly provided HIV testing data by approach. Data gaps have been filled (where possible) by reviewing publicly available sources, most notably from Ministries of Health and PEPFAR country operational plans. All dashboards have been viewed and approved by the Ministries of Health. This dashboard does not cover in-depth policy information, PrEP or paediatric HIV testing but includes links to relevant sites that do cover this information.`,
  `Contact: Cheryl Case Johnson (johnsonc@who.int)`,
];

const SHOW_COLORS = false;

export default function App() {
  const [selectedIso, setIso] = React.useState(null);
  const [chartData, setChartData] = React.useState([]);

  const [dictionary, setDictionary] = React.useState([]);
  const [countries, setCountries] = React.useState([]);
  const [homeCopy, setHomeCopy] = React.useState([]);
  const [chartIds, setChartIds] = React.useState([]);
  const [chartConfigsMap, setChartConfigsMap] = React.useState(null);

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
  const loading = !_.some(chartData, (c) => c && c.countryIso === selectedIso);

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

      {!selectedIso ? (
        <HomePage homeCopy={homeCopy} />
      ) : loading ? (
        <Box pt={"50vh"}>
          <Typography
            variant="body1"
            sx={{ textAlign: "center" }}
            dangerouslySetInnerHTML={{
              __html: "loading...",
            }}
          />
        </Box>
      ) : (
        <Charts
          countries={countries}
          selectedIso={selectedIso}
          chartData={chartData}
        />
      )}
      {!!dictionary.length && !loading && (
        <Box
          sx={{
            px: { xs: 3, lg: 10 },
            mx: { lg: 5 },
            mb: { lg: 5 },
            py: 9,
            mt: 9,
            background: theme.palette.background.paper,
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            dangerouslySetInnerHTML={{
              __html: "Glossary",
            }}
          />
          <Box
            sx={{
              columnCount: { md: 2, xl: 3 },
              columnGap: { xs: "2rem", lg: "5rem" },
              mt: 3,
              "& dl": {
                display: "inline-block",
                mt: 0,
                mb: { lg: 3 },
              },
              "& dd": { ml: 0, mt: { xs: 1 } },
            }}
          >
            {dictionary
              .sort((a, b) => a.term.toLowerCase() > b.term.toLowerCase())
              .map(({ ["term"]: x, definition }) => {
                return (
                  <dl>
                    <dt>
                      <strong>{x}</strong>
                    </dt>
                    <dd>
                      <Typography
                        // sx={{ maxWidth: "500px" }}
                        dangerouslySetInnerHTML={{
                          __html: transformLink(definition),
                        }}
                      />
                    </dd>
                  </dl>
                );
              })}
          </Box>
        </Box>
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
