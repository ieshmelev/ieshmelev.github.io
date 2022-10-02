import * as React from 'react'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import HomeIcon from '@mui/icons-material/Home'
import CasinoIcon from '@mui/icons-material/Casino'
import LocalBarIcon from '@mui/icons-material/LocalBar'

export const listItems = (
  <React.Fragment>
    <ListItemButton>
      <ListItemIcon>
        <HomeIcon />
      </ListItemIcon>
      <ListItemText primary="Home" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <CasinoIcon />
      </ListItemIcon>
      <ListItemText primary="Draw" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <LocalBarIcon />
      </ListItemIcon>
      <ListItemText primary="Cocktails" />
    </ListItemButton>
  </React.Fragment>
)
