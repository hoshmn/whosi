import React from "react";
import {
  Button,
  FormControl,
  Link,
  Modal,
  Paper,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { getRC, themePrimary } from "../consts/colors";
import { encrypter } from "../utils/display";

// Note: not meant to be secure, only to limit early access to those granted entry

export const Login = ({ open, setEntered }) => {
  const [errored, setErrored] = React.useState(false);
  const [password, setPassword] = React.useState("");

  const handleSubmit = () => {
    // alert("entered: " + password + " | " + encrypter(password));
    const correct = encrypter(password) === "22362b2a302d213624140516100d05085617130d0a03";
    setErrored(!correct);
    setPassword("");
    if (correct) setEntered(true);
  };

  const handleKeyPress = (e) =>
    e.code.toLowerCase() === "enter" && handleSubmit();

  const updatePassword = (e) => setPassword(e.target.value);
  return (
    <Modal
      open={open}
      sx={{
        "& .MuiBackdrop-root": {
          // backdropFilter: "blur(2px)",
          backgroundColor: getRC(themePrimary, 3),
        },
        "& .MuiPaper-root": {
          width: 400,
          maxWidth: "94vw",
          margin: "auto",
          marginTop: "35vh",
        },
        "& .contents": {
          p: 4,
        },
        "& .form": {
          display: "flex",
          flexDirection: "row",
        },
        "& .MuiTextField-root": {
          width: "100%",
          pr: 1,
        },
        "& .MuiButton-root": {
          mb: "20px",
          color: "white",
        },
        "& .MuiTypography-root": {
          mt: 1,
        },
        "& .MuiLink-root": {
          textDecoration: "none",
        },
      }}
    >
      <Paper>
        <Box className="contents">
          <FormControl className="form">
            <TextField
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              value={password}
              autoFocus={true}
              variant="outlined"
              onChange={updatePassword}
              onKeyPress={handleKeyPress}
              onSubmit={handleSubmit}
              error={errored}
              helperText={
                errored ? "Incorrect password" : "Enter site password"
              }
            />
            <Button variant="contained" onClick={handleSubmit}>
              Go
            </Button>
          </FormControl>
          <Typography variant="body2">
            Contact{" "}
            <Link
              underline="none"
              variant="body2"
              href="mailto:pintocl@who.int"
              target="_blank"
              rel="noopener noreferrer"
            >
              Clarice Pinto
            </Link>{" "}
            for access.
          </Typography>
        </Box>
      </Paper>
    </Modal>
  );
};
