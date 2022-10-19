import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { useTheme, useMediaQuery, Button } from "@mui/material";
import { CountrySelect } from "./CountrySelect";
import { getRC, headerColor } from "../consts/colors";
import { Link } from "@mui/material";
import { CMS_FIELDS as C } from "../consts/data";

export const Header = ({
  selectedIso,
  handleCountryChange,
  countries,
  openResources,
  siteCopy,
}) => {
  const theme = useTheme();
  const whoIcon = useMediaQuery(theme.breakpoints.down("sm"))
    ? "assets/who_logo_sm.jpg"
    : "assets/who_logo.svg";
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar sx={{ position: "fixed", background: getRC(headerColor, 1) }}>
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            height: { xs: theme.spacing(9) },
            "& .country-select": {
              ml: "auto",
              pr: 1,
            },
            "& .logo-links": {
              display: "flex",
              // px: 1,
            },
            "& .logo-link": {
              my: "auto",
              "& img": {
                boxSizing: "border-box",
                p: 1,
                pl: {
                  xs: 0,
                  sm: 1,
                },
                width: "auto",
              },
              "&.tgf img": {
                height: { xs: theme.spacing(6.5), sm: theme.spacing(7) },
              },
              "&.who img": {
                height: { xs: theme.spacing(7.5), sm: theme.spacing(7) },
              },
            },
          }}
        >
          <Box className="logo-links">
            <Link
              title="World Health Organization"
              className="logo-link who"
              href={"https://www.who.int/"}
            >
              <img src={whoIcon} />
            </Link>
            {/* Note: hide logo until approved by TGF */}
            {/* <Link
              title="The Global Fund"
              className="logo-link tgf"
              href={"https://www.theglobalfund.org/en/"}
            >
              <img src="assets/tgf_logo.png" />
            </Link> */}
          </Box>
          <CountrySelect
            countries={countries}
            handleCountryChange={handleCountryChange}
            selectedIso={selectedIso}
          />
          <Button
            onClick={openResources}
            variant="outlined"
            sx={{ lineHeight: 1.2, width: "min-content", flexShrink: 0, mx: 1 }}
          >
            {_.get(siteCopy, [C.resources_title, "value"], "Resources")}
          </Button>
          <Link
            href="https://forms.gle/rHoQxCVRbxkJSGBa6"
            target="__blank"
            flexShrink={0}
          >
            Feedback
          </Link>
        </Toolbar>
      </AppBar>
    </Box>
  );
};
