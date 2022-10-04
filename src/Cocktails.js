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
  ].sort()
  const tools = [
    ...new Set(
      cocktails.reduce((sum, current) => [...sum, ...current.tools], [])
    )
  ].sort()

  const [selectedIngredients, setSelectedIngredients] = React.useState(
    loadFromLS('ingredients')
  )
  const [selectedTools, setSelectedTools] = React.useState(loadFromLS('tools'))

  const readyForCook = []
  const needOneMore = []

  cocktails.forEach((cocktail) => {
    const iIngredients = selectedIngredients.filter((x) =>
      cocktail.ingredients.includes(x)
    )
    const diffIngredients = cocktail.ingredients.length - iIngredients.length
    if (diffIngredients > 1) {
      return
    }

    const iTools = selectedTools.filter((x) => cocktail.tools.includes(x))
    const diffTools = cocktail.tools.length - iTools.length
    if (diffTools > 1) {
      return
    }

    if (diffIngredients === 0 && diffTools === 0) {
      readyForCook.push(cocktail)
      return
    }

    const needIngredients = cocktail.ingredients.filter(
      (x) => !iIngredients.includes(x)
    )
    const needTools = cocktail.tools.filter((x) => !iTools.includes(x))
    needOneMore.push({ ...cocktail, needIngredients, needTools })
  })

  const compareItems = (a, b) => {
    const nameA = a.name.toUpperCase()
    const nameB = b.name.toUpperCase()
    if (nameA < nameB) {
      return -1
    }
    if (nameA > nameB) {
      return 1
    }
    return 0
  }

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
                <TextField {...params} label="ингредиенты" margin="normal" />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              value={selectedTools}
              multiple
              options={tools}
              sx={{ width: 1 }}
              onChange={(event, newValue) => {
                saveToLS('tools', newValue)
                setSelectedTools(newValue)
              }}
              renderInput={(params) => (
                <TextField {...params} label="штучки" margin="normal" />
              )}
            />
          </Grid>
        </Paper>
      </Grid>

      {readyForCook.length > 0 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Title>есть все для приготовления</Title>
            {readyForCook.sort(compareItems).map((cocktail) => (
              <div key={cocktail.name}>
                <Link href={cocktail.link} target="_blank" rel="noreferrer">
                  {cocktail.name}
                </Link>
              </div>
            ))}
          </Paper>
        </Grid>
      )}

      {needOneMore.length > 0 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Title>нужен еще один ингредиент и/или нужна еще одна штучка</Title>
            {needOneMore.sort(compareItems).map((cocktail) => (
              <div key={cocktail.name}>
                <Link href={cocktail.link} target="_blank" rel="noreferrer">
                  {cocktail.name}
                </Link>{' '}
                {': '}
                {[...cocktail.needIngredients, ...cocktail.needTools].join(
                  ', '
                )}
              </div>
            ))}
          </Paper>
        </Grid>
      )}
    </>
  )
}

export default Cocktails
