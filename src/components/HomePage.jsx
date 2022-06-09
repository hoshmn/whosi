import React from "react";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import { CMS_FIELDS } from "../consts/data";
import { transformLink } from "../utils/display";
import { getRC, radColors, themePrimary } from "../consts/colors";

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
          sx={
            {
              // fontSize: { xs: "smaller", md: "unset" },
            }
          }
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
                    sx={
                      {
                        // fontSize: { xs: "smaller", md: "unset" },
                      }
                    }
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
    <Box pb={5}>
      <Box
        sx={{
          // <img class='inserted-img left' src='assets/intro3.jpg' />
          pt: "calc(72px - 16px)", // TODO constify header height
          "& .images-wrapper": {
            display: { xs: "none", sm: "flex" },
            // width: '100vw',
            overflow: "hidden",
            position: "relative",
            mt: { lg: -6 },
            mx: { lg: -6 },

            "& p": {
              position: "absolute",
              bottom: 8,
              right: 10,
              m: 0,
              fontSize: { xs: "10px", md: "12px" },
              color: getRC(themePrimary, 7),
            },
            "& img": {
              // flex: "10px 1 1",
              maxWidth: "33.33%",
              objectFit: "cover",
            },
          },
        }}
        dangerouslySetInnerHTML={{
          __html: homeCopy[0][CMS_FIELDS.images],
        }}
      />
      <Box
        sx={{
          px: 3,
          maxWidth: "900px", // TODO replace with M breakpoint
          m: "auto",
        }}
      >
        <Box
          sx={{
            "& img": {
              display: { xs: "none", sm: "flex" },
              maxWidth: "100%",
            },
          }}
        >
          {homeCopy.map(
            (row, i) =>
              !!row[CMS_FIELDS.blurb] && (
                <Typography
                  variant="body1"
                  key={i}
                  sx={{}}
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
        {!!tapFields.length && (
          <Box className="tap-lists-container">
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
        )}
      </Box>
    </Box>
  );
};
