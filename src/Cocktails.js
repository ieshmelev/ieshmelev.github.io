import * as React from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Link from '@mui/material/Link'
import Title from './Title'
import { saveToLS, loadFromLS } from './Utils'
import cocktails from './cocktails.json'

const Cocktails = () => {
  const ingredients = [
    ...new Set(
      cocktails.reduce((sum, current) => [...sum, ...current.ingredients], [])
    )
  ]
  const devices = [
    ...new Set(
      cocktails.reduce((sum, current) => [...sum, ...current.devices], [])
    )
  ]

  const [selectedIngredients, setSelectedIngredients] = React.useState(
    loadFromLS('ingredients')
  )
  const [selectedDevices, setSelectedDevices] = React.useState(
    loadFromLS('devices')
  )

  const readyForCook = []
  const needOneMore = []

  cocktails.forEach((coctail) => {
    const iIngredients = selectedIngredients.filter((x) =>
      coctail.ingredients.includes(x)
    )
    const diffIngredients = coctail.ingredients.length - iIngredients.length
    if (diffIngredients > 1) {
      return
    }

    const iDevices = selectedDevices.filter((x) => coctail.devices.includes(x))
    const diffDevices = coctail.devices.length - iDevices.length
    if (diffDevices > 1) {
      return
    }

    if (diffIngredients === 0 && diffDevices === 0) {
      readyForCook.push(coctail)
      return
    }

    const needIngredients = coctail.ingredients.filter(
      (x) => !iIngredients.includes(x)
    )
    const needDevices = coctail.devices.filter((x) => !iDevices.includes(x))
    needOneMore.push({ ...coctail, needIngredients, needDevices })
  })

  return (
    <>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Grid item xs={12}>
            <Autocomplete
              value={selectedIngredients}
              multiple
              options={ingredients}
              sx={{ width: 1 }}
              onChange={(event, newValue) => {
                saveToLS('ingredients', newValue)
                setSelectedIngredients(newValue)
              }}
              renderInput={(params) => (
                <TextField {...params} label="Ingredients" margin="normal" />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              value={selectedDevices}
              multiple
              options={devices}
              sx={{ width: 1 }}
              onChange={(event, newValue) => {
                saveToLS('devices')
                setSelectedDevices(newValue)
              }}
              renderInput={(params) => (
                <TextField {...params} label="Devices" margin="normal" />
              )}
            />
          </Grid>
        </Paper>
      </Grid>

      {readyForCook.length > 0 && (
        <Grid item xs={12}>
          <Title>ready for cook</Title>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            {readyForCook.map((coctail) => (
              <div key={coctail.name}>
                <Link href={coctail.link}>{coctail.name}</Link>
              </div>
            ))}
          </Paper>
        </Grid>
      )}

      {needOneMore.length > 0 && (
        <Grid item xs={12}>
          <Title>need one more ingredient or/and device</Title>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            {needOneMore.map((coctail) => (
              <div key={coctail.name}>
                <Link href={coctail.link}>{coctail.name}</Link> need:
                {[...coctail.needIngredients, ...coctail.needDevices].join()}
              </div>
            ))}
          </Paper>
        </Grid>
      )}
    </>
  )
}

export default Cocktails
