import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { CountrySelect } from "./CountrySelect";
import { getRC, headerColor } from "../consts/colors";

export const Header = ({ selectedIso, handleCountryChange }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ background: getRC(headerColor, 8) }}>
        <Toolbar>
          <CountrySelect
            handleCountryChange={handleCountryChange}
            selectedIso={selectedIso}
          />
        </Toolbar>
      </AppBar>
    </Box>
  );
};
