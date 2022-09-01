import * as React from "react";
import Title from "./Title";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import "./Bucket.css";
import Rating from "@mui/material/Rating";

const Bucket = ({ bucket }) => {
  return (
    <React.Fragment>
      <Title>
        <Rating
          name="half-rating-read"
          defaultValue={bucket.stars}
          precision={0.5}
          readOnly
        />
      </Title>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container columns={{ xs: 4, sm: 8, md: 12 }}>
          {bucket.teams.map((team) => (
            <Grid
              item
              xs={2}
              sm={2}
              md={2}
              key={team.id}
              align="center"
              sx={{ mb: 2 }}
            >
              <p>{team.title}</p>
              <img
                src={team.img}
                alt={team.title}
                className="logo"
                loading="lazy"
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </React.Fragment>
  );
};

export default Bucket;
