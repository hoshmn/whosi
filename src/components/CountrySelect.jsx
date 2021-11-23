import React from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { COUNTRIES } from "../consts/countries";

export const CountrySelect = ({ handleCountryChange, selectedIso }) => {
  return (
    <FormControl sx={{ width: 200, marginTop: 1, marginBottom: 1 }}>
      <InputLabel id="country">Country</InputLabel>
      <Select
        labelId="country"
        id="country-select"
        value={selectedIso || "home"}
        label="Country"
        onChange={handleCountryChange}
      >
        <MenuItem value={"home"}>Select a country...</MenuItem>
        {COUNTRIES.map(({ id, name }) => (
          <MenuItem key={id} value={id}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
