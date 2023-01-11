import * as React from 'react'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Partisipants from './Partisipants'
import Bucket from './Bucket'
import teams from './teams.json'

const Draw = () => {
  let buckets = new Map()
  teams.forEach(function (item) {
    if (!buckets.has(item.stars)) {
      buckets.set(item.stars, { stars: item.stars, teams: [] })
    }
    buckets.get(item.stars).teams.push(item)
  })
  buckets = new Map(
    [...buckets.entries()].sort(function (a, b) {
      const [keya] = a
      const [keyb] = b
      return keyb - keya
    })
  )

  return (
    <>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Partisipants buckets={buckets} />
        </Paper>
      </Grid>
      {[...buckets].map((item) => {
        const [key, bucket] = item
        return (
          <Grid item xs={12} key={key}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Bucket bucket={bucket} />
            </Paper>
          </Grid>
        )
      })}
    </>
  )
}

export default Draw
