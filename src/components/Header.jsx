import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { CountrySelect } from "./CountrySelect";

export const Header = ({ selectedIso, handleCountryChange }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed">
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
