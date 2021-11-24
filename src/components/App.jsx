import "./styles.css";
import React from "react";
import _ from "lodash";
import getData from "../getData";
import { backgroundColor, radColors, getRC } from "../consts/colors";
import { Container, Paper, Typography } from "@mui/material";
import { Header } from "./Header";
import { Charts } from "./Charts";
import { COUNTRIES } from "../consts/countries";
import { Box } from "@mui/system";
import { transformLink } from "../utils/display";

const homeTexts = [
  `
Overview: The HTS dashboard brings together data on HIV testing services from various sources into one visual tool. We would like to acknowledge the support of the Ministries of Health of Member States, UNAIDS, the Bill and Melinda Gates Foundation, the President’s Emergency Programme for AIDS Relief (PEPFAR), USAID, the World Health Organization, and the Global Fund to Fight AIDS, Tuberculosis and Malaria. This project aims to provide local level data for in country action for policy-makers, programme directors, outreach workers and community activists among others. The most recent data available has been collected from the relevant organisation including UNAIDS (Spectrum estimates, Global AIDS Monitoring and the Key Population Atlas), UNPOP, UNICEF and the World Bank. USAID/PEPFAR have kindly provided HIV testing data by approach. Data gaps have been filled (where possible) by reviewing publicly available sources, most notably from Ministries of Health and PEPFAR country operational plans. All dashboards have been viewed and approved by the Ministries of Health. This dashboard does not cover in-depth policy information, PrEP or paediatric HIV testing but includes links to relevant sites that do cover this information.`,
  `Contact: Cheryl Case Johnson (johnsonc@who.int)`,
];

const SHOW_COLORS = false;

export default function App() {
  const [chartData, setChartData] = React.useState([]);
  const [dictionary, setDictionary] = React.useState([]);
  // TODO undo
  const [selectedIso, setIso] = React.useState("NGA");

  React.useEffect(() => {
    if (!selectedIso) return;
    getData(selectedIso).then((result) => {
      console.log("@@@ ALL DATA: ");
      console.log(result.charts);
      setChartData(result.charts);
      if (_.isEmpty(dictionary)) {
        setDictionary(result.dictionary);
      }
    });
  }, [selectedIso]);

  const updateCountry = (e) => {
    const value = e.target.value;
    const realIso = _.some(COUNTRIES, ({ id }) => id === value);
    setIso(realIso ? value : null);
  };

  // console.log("*", chartData);
  const loading = !_.some(
    chartData,
    (c) => c && c.country_iso_code === selectedIso
  );
  return (
    <Paper
      elevation={0}
      style={{ background: "none", color: getRC(backgroundColor, 12) }}
    >
      <Header handleCountryChange={updateCountry} selectedIso={selectedIso} />
      <br />

      {!selectedIso ? (
        <Box pt={"20vh"}>
          {homeTexts.map((text, i) => (
            <Typography
              variant="body1"
              key={i}
              sx={{ maxWidth: 600, margin: "auto" }}
              pt={2}
              px={3}
              dangerouslySetInnerHTML={{
                __html: text,
              }}
            />
          ))}
        </Box>
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
        <Charts selectedIso={selectedIso} chartData={chartData} />
      )}
      {!!dictionary.length && !loading && (
        <Box p={3} mt={5}>
          <Typography
            variant="h4"
            component="h2"
            dangerouslySetInnerHTML={{
              __html: "Glossary",
            }}
          />
          {dictionary.map(({ term, definition }) => {
            return (
              <dl key={term}>
                <dt>
                  <strong>{term}</strong>
                </dt>
                <dd>
                  <Typography
                    sx={{ maxWidth: "500px" }}
                    dangerouslySetInnerHTML={{
                      __html: transformLink(definition),
                    }}
                  />
                </dd>
              </dl>
            );
          })}
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
