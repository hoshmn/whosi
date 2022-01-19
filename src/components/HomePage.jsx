import React from "react";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import { CMS_FIELDS } from "../consts/data";
import { transformLink } from "../utils/display";
import { getRC, radColors } from "../consts/colors";

export const HomePage = ({ homeCopy }) => {
  if (!homeCopy || !homeCopy.length) return null; // TODO: spinner
  // console.log(homeCopy, homeCopy && homeCopy[0]);
  const tapFields = Object.keys(homeCopy[0]).filter((f) =>
    f.startsWith(CMS_FIELDS.TAP)
  );

  const getTapList = (f) => {
    return (
      <Box
        key={f}
        sx={{
          background: getRC(radColors.tomato, 7),
          p: 1,
          m: 1,
          borderRadius: "8px",
          // flexBasis: "250px",
          height: "100%",
        }}
      >
        {/* <b>{f.replace(CMS_FIELDS.TAP, "")}</b> */}
        <Typography
          variant="body1"
          sx={{
            fontSize: { sm: "smaller", md: "unset" },
          }}
          variant="h7"
          component="h3"
          dangerouslySetInnerHTML={{
            __html: f.replace(CMS_FIELDS.TAP, ""),
          }}
        />
        <ul
          style={{
            // listStyle: "none",
            paddingInlineStart: "20px",
          }}
        >
          {homeCopy.map(
            (row, i) =>
              !!row[f] && (
                <li key={row[f]}>
                  <Typography
                    variant="body1"
                    key={i}
                    // sx={{ maxWidth: 600, margin: "auto" }}
                    // pt={2}
                    sx={{
                      fontSize: { sm: "smaller", md: "unset" },
                    }}
                    // px={3}
                    dangerouslySetInnerHTML={{
                      __html: row[f],
                    }}
                  />
                </li>
              )
          )}
        </ul>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        pt: "72px", // TODO constify header height
        px: 3,
        maxWidth: "900px", // TODO replace with M breakpoint
        m: "auto",
      }}
    >
      <Box>
        {homeCopy.map(
          (row, i) =>
            !!row[CMS_FIELDS.blurb] && (
              <Typography
                variant="body1"
                key={i}
                sx={{
                  fontSize: { sm: "smaller", md: "unset" },
                }}
                // sx={{ maxWidth: 600, margin: "auto" }}
                pt={1}
                // px={3}
                dangerouslySetInnerHTML={{
                  __html: transformLink(row[CMS_FIELDS.blurb]),
                }}
              />
            )
        )}
      </Box>
      <Box py={5} className="tap-lists-container">
        <Typography
          variant="h6"
          component="h2"
          dangerouslySetInnerHTML={{
            __html: "Technical Assistance Providers",
          }}
        />
        <Box
          className="tap-lists"
          sx={{
            display: { sm: "flex" },
          }}
        >
          {tapFields.map((f) => getTapList(f))}
        </Box>
      </Box>
    </Box>
  );
};
