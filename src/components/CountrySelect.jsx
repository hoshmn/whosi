import React from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

export const CountrySelect = ({
  handleCountryChange,
  selectedIso,
  countries,
}) => {
  const unselectedCountry = !countries.length
    ? "Loading..."
    : !!selectedIso
    ? "none"
    : "Select a country...";
  return (
    <FormControl
      className="country-select"
      sx={{ width: 300, marginTop: 1, marginBottom: 1 }}
    >
      <InputLabel id="country">Country</InputLabel>
      <Select
        labelId="country"
        id="country-select"
        value={selectedIso || "home"}
        label="Country"
        onChange={handleCountryChange}
      >
        <MenuItem value={"home"}>{unselectedCountry}</MenuItem>
        {countries.map(({ iso, name }) => (
          <MenuItem key={iso} value={iso}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
