import * as React from "react";
import Title from "./Title";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

const TeamsBucket = () => {
  return (
    <React.Fragment>
      <Title>Bucket</Title>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container columns={{ xs: 4, sm: 8, md: 12 }}>
          {Array.from(Array(7)).map((_, index) => (
            <Grid item xs={2} sm={2} md={2} key={index}>
              <img
                src={`https://fifastatic.fifaindex.com/FIFA22/teams/dark/73.png`}
                alt={"alt"}
                loading="lazy"
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </React.Fragment>
  );
};

export default TeamsBucket;
