import * as React from 'react'
import PropTypes from 'prop-types'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Close'
import CasinoIcon from '@mui/icons-material/Casino'
import {
  GridRowModes,
  DataGrid,
  GridToolbarContainer,
  GridActionsCellItem
} from '@mui/x-data-grid'
import Box from '@mui/material/Box'
import MultiSelectEditComponent from './MultiSelectEditComponent'
import Title from './Title'
import { rand, suffle, saveToLS, loadFromLS } from './Utils'

const EditToolbar = (props) => {
  const { setRows, setRowModesModel, draw } = props

  const handleAddClick = () => {
    let id = 0
    setRows((oldRows) => {
      oldRows.forEach((item) => {
        id = item.id > id ? item.id : id
      })
      id++
      return [...oldRows, { id, name: '', buckets: '', team: '', isNew: true }]
    })
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' }
    }))
  }

  return (
    <GridToolbarContainer>
      <Button color="primary" startIcon={<AddIcon />} onClick={handleAddClick}>
        Add
      </Button>
      <Button color="primary" startIcon={<CasinoIcon />} onClick={draw}>
        Draw
      </Button>
    </GridToolbarContainer>
  )
}

EditToolbar.propTypes = {
  setRowModesModel: PropTypes.func.isRequired,
  setRows: PropTypes.func.isRequired,
  draw: PropTypes.func.isRequired
}

const Partisipants = (props) => {
  const { buckets } = props

  const [rows, setRows] = React.useState(loadFromLS('partisipants'))
  const [rowModesModel, setRowModesModel] = React.useState({})

  const handleRowEditStart = (params, event) => {
    event.defaultMuiPrevented = true
  }

  const handleRowEditStop = (params, event) => {
    event.defaultMuiPrevented = true
  }

  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } })
  }

  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } })
  }

  const handleDeleteClick = (id) => () =>
    processRowsUpdate(rows.filter((row) => row.id !== id))

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true }
    })

    const editedRow = rows.find((row) => row.id === id)
    if (editedRow.isNew) {
      setRows(rows.filter((row) => row.id !== id))
    }
  }

  const processRowUpdate = (newRow) => {
    const updatedRow = { ...newRow, isNew: false }
    processRowsUpdate(
      rows.map((row) => (row.id === newRow.id ? updatedRow : row))
    )
    return updatedRow
  }

  const processRowsUpdate = (rows) => {
    saveToLS('partisipants', rows)
    setRows(rows)
  }

  const draw = () => {
    const used = []

    const trows = suffle(rows).map((row) => {
      const teams = suffle(
        row.buckets
          .split(',')
          .map((item) => Number(item))
          .reduce(
            (sum, current) =>
              buckets.has(current)
                ? [...sum, ...buckets.get(current).teams]
                : sum,
            []
          )
          .filter((team) => !used.includes(team.id))
      )
      console.log(`draw for: ${row.name}`)
      console.log('teams:', teams)
      if (teams.length === 0) {
        console.log('')
        return row
      }
      const r = rand(0, teams.length)
      console.log(`draw: ${r}`)
      console.log('team:', teams[r])
      console.log('')
      used.push(teams[r].id)
      return { ...row, team: teams[r].title }
    })

    processRowsUpdate(
      rows.map((row) => {
        return {
          ...row,
          ...trows.find((trow) => row.id === trow.id)
        }
      })
    )
  }

  const columns = [
    { field: 'name', headerName: 'Name', editable: true, flex: 1 },
    {
      field: 'buckets',
      headerName: 'Buckets',
      editable: true,
      renderEditCell: (params) => (
        <MultiSelectEditComponent
          {...params}
          valueOptions={[...buckets].map((bucket) => {
            const [key] = bucket
            return key.toString()
          })}
        />
      ),
      flex: 1
    },
    { field: 'team', headerName: 'Team', flex: 1 },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',

      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              key="save"
              icon={<SaveIcon />}
              label="Save"
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              key="cancel"
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />
          ]
        }

        return [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />
        ]
      }
    }
  ]

  return (
    <>
      <Title>Partisipants</Title>
      <Box
        sx={{
          height: 400,
          width: '100%',
          '& .actions': {
            color: 'text.secondary'
          },
          '& .textPrimary': {
            color: 'text.primary'
          }
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowEditStart={handleRowEditStart}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          components={{
            Toolbar: EditToolbar
          }}
          componentsProps={{
            toolbar: { setRows, setRowModesModel, draw }
          }}
          experimentalFeatures={{ newEditingApi: true }}
        />
      </Box>
    </>
  )
}

Partisipants.propTypes = {
  buckets: PropTypes.any.isRequired
}

export default Partisipants
