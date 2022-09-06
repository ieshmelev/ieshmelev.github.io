import * as React from 'react'
import PropTypes from 'prop-types'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Rating from '@mui/material/Rating'
import Title from './Title'
import './Bucket.css'

const Bucket = (props) => {
  const { bucket } = props

  return (
    <>
      <Title>
        <Rating defaultValue={bucket.stars} precision={0.5} readOnly />
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
    </>
  )
}

Bucket.propTypes = {
  bucket: PropTypes.object.isRequired
}

export default Bucket
