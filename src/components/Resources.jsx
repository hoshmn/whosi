import React from "react";
import { Modal, Paper, Typography, Box, IconButton, useTheme } from "@mui/material";
import { getRC, themePrimary } from "../consts/colors";
import { Close } from "@mui/icons-material";

export const Resources = ({
  open,
  close,
  publications,
  webinars,
  resourceNameMap,
}) => {
  const theme = useTheme();
  return (
    <Modal
    open={open}
    onBackdropClick={close}
      sx={{
        p: 4,
        "& .MuiPaper-root": {
          height: "100%",
        },
        "& .contents": {
          p: 4,
          position: "relative"
        },
        "& .MuiButtonBase-root": {
          position: "absolute",
          right: theme.spacing(4),
          top: theme.spacing(4),
        },
      }}
    >
      <Paper>
        <Box className="contents">
          {/* <Button */}
          <IconButton onClick={close}>
            {/* ✕ */}
            <Close />
          </IconButton>
          <Typography variant="h6" component="h1">
            Resources
          </Typography>
        </Box>
      </Paper>
    </Modal>
  );
};
