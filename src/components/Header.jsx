import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { CountrySelect } from "./CountrySelect";
import { getRC, headerColor } from "../consts/colors";
import { Link } from "@mui/material";

export const Header = ({
  selectedIso,
  handleCountryChange,
  countries,
  viewingResources,
  openResources,
}) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar sx={{ position: "fixed", background: getRC(headerColor, 5) }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <CountrySelect
            countries={countries}
            handleCountryChange={handleCountryChange}
            selectedIso={selectedIso}
          />
          <Link href={null} onClick={openResources} sx={{ cursor: "pointer" }}>
            DSD testing, treatment and AHD Resources Hub
          </Link>
        </Toolbar>
      </AppBar>
    </Box>
  );
};
