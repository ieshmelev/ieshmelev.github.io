import * as React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Partisipants from "./Partisipants";
import Bucket from "./Bucket";
import teams from "./teams.json";

const mdTheme = createTheme();

function App() {
  let buckets = new Map();
  teams.forEach(function (item) {
    if (!buckets.has(item.stars)) {
      buckets.set(item.stars, { stars: item.stars, teams: [] });
    }
    buckets.get(item.stars).teams.push(item);
  });
  buckets = new Map(
    [...buckets.entries()].sort(function (a, b) {
      const [keya] = a;
      const [keyb] = b;
      return keyb - keya;
    })
  );

  return (
    <ThemeProvider theme={mdTheme}>
      <Box sx={{ display: "flex" }}>
        <MuiAppBar position="absolute">
          <Toolbar
            sx={{
              pr: "24px", // keep right padding when drawer closed
            }}
          >
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1 }}
            >
              Ballot
            </Typography>
          </Toolbar>
        </MuiAppBar>
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
                  <Partisipants buckets={buckets} />
                </Paper>
              </Grid>
              {[...buckets].map((item) => {
                const [key, bucket] = item;
                return (
                  <Grid item xs={12} key={key}>
                    <Paper
                      sx={{ p: 2, display: "flex", flexDirection: "column" }}
                    >
                      <Bucket bucket={bucket} />
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
