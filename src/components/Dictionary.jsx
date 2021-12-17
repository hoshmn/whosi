import React from "react";
import Box from "@mui/material/Box";
import { Typography, useTheme } from "@mui/material";
import { CMS_FIELDS } from "../consts/data";
import { transformLink } from "../utils/display";

export const Dictionary = ({ dictionary }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        px: { xs: 3, lg: 10 },
        mx: { lg: 5 },
        mb: { lg: 5 },
        py: 9,
        mt: 9,
        background: theme.palette.background.paper,

        "& dl": {
          display: "inline-block",
          width: "100%",
          mt: 0,
          mb: { lg: 3 },
          fontSize: 15,
        },
        "& dd": { ml: 0, mt: { xs: 1 }, fontSize: 13 },
      }}
    >
      <Typography
        variant="h6"
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
  );
};
