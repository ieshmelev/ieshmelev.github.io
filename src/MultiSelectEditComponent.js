import * as React from 'react'
import PropTypes from 'prop-types'
import { useGridApiContext } from '@mui/x-data-grid'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

const MultiSelectEditComponent = (props) => {
  const { id, value, field, valueOptions } = props
  const apiRef = useGridApiContext()
  const handleChange = (event) => {
    const {
      target: { value }
    } = event
    apiRef.current.setEditCellValue({ id, field, value: value.join() })
  }

  return (
    <Select
      multiple
      value={value.split(',').filter((item) => item !== '')}
      onChange={handleChange}
      sx={{ width: 1 }}
    >
      {valueOptions.map((item) => (
        <MenuItem key={item} value={item}>
          {item}
        </MenuItem>
      ))}
    </Select>
  )
}

MultiSelectEditComponent.propTypes = {
  id: PropTypes.number.isRequired,
  value: PropTypes.string.isRequired,
  field: PropTypes.string.isRequired,
  valueOptions: PropTypes.array.isRequired
}

export default MultiSelectEditComponent
