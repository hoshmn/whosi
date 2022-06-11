import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { useTheme } from "@mui/material";
import { CountrySelect } from "./CountrySelect";
import { getRC, headerColor } from "../consts/colors";
import { Link } from "@mui/material";
import { CMS_FIELDS as C } from "../consts/data";

const iconWidthWho = 56;
const iconWidthTgf = 50;

export const Header = ({
  selectedIso,
  handleCountryChange,
  countries,
  viewingResources,
  openResources,
  siteCopy,
}) => {
  const theme = useTheme();
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar sx={{ position: "fixed", background: getRC(headerColor, 5) }}>
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            height: { xs: theme.spacing(8) },
            "& .logo-links": {
              ml: "auto",
              display: "flex",
              px: 1,
            },
            "& .logo-link": {
              my: "auto",
              "& img": {
                boxSizing: "border-box",
                // height: "100%",
                p: 1,
                width: "auto",
              },

              "&.who": {
                maxWidth: {
                  xs: iconWidthWho,
                  md: "unset",
                },
                "& img": {
                  height: { xs: theme.spacing(7) },
                  clipPath: {
                    xs: `polygon(0 0, ${iconWidthWho}px 0, ${iconWidthWho}px 100%, 0 100%)`,
                    md: "unset",
                  },
                },
              },
              "&.tgf": {
                maxWidth: {
                  xs: iconWidthTgf,
                  md: "unset",
                },
                "& img": {
                  height: { xs: theme.spacing(6.5) },
                  clipPath: {
                    xs: `polygon(0 0, ${iconWidthTgf}px 0, ${iconWidthTgf}px 100%, 0 100%)`,
                    md: "unset",
                  },
                },
              },
            },
          }}
        >
          <CountrySelect
            countries={countries}
            handleCountryChange={handleCountryChange}
            selectedIso={selectedIso}
          />
          <Box className="logo-links">
            <Link
              title="The Global Fund"
              className="logo-link tgf"
              href={"https://www.theglobalfund.org/en/"}
            >
              <img src="assets/tgf_logo.png" />
            </Link>
            <Link
              title="World Health Organization"
              className="logo-link who"
              href={"https://www.who.int/"}
            >
              <img src="assets/who_logo.svg" />
            </Link>
          </Box>
          <Link href={null} onClick={openResources} sx={{ cursor: "pointer" }}>
            {_.get(siteCopy, [C.resources_title, "value"], "Resources")}
          </Link>
        </Toolbar>
      </AppBar>
    </Box>
  );
};
