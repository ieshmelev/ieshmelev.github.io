import * as React from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import CasinoIcon from "@mui/icons-material/Casino";
import {
  GridRowModes,
  DataGrid,
  GridToolbarContainer,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Title from "./Title";

function EditToolbar(props) {
  const { setRows, setRowModesModel, ballot } = props;

  const handleAddClick = () => {
    let id = 0;
    setRows((oldRows) => {
      oldRows.forEach((item) => {
        id = item.id > id ? item.id : id;
      });
      id++;
      return [...oldRows, { id, name: "", team: "", isNew: true }];
    });
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
    }));
  };

  return (
    <GridToolbarContainer>
      <Button color="primary" startIcon={<AddIcon />} onClick={handleAddClick}>
        Add
      </Button>
      <Button color="primary" startIcon={<CasinoIcon />} onClick={ballot}>
        Ballot
      </Button>
    </GridToolbarContainer>
  );
}

EditToolbar.propTypes = {
  setRowModesModel: PropTypes.func.isRequired,
  setRows: PropTypes.func.isRequired,
  ballot: PropTypes.func.isRequired,
};

const Partisipants = ({ buckets }) => {
  const savePartisipants = (data) => {
    localStorage.setItem("foo", JSON.stringify(data));
  };

  const loadPartisipants = () => {
    let partisipants = [];
    let lsPartisipants = localStorage.getItem("foo");
    if (lsPartisipants !== null) {
      partisipants = JSON.parse(lsPartisipants);
    }
    return partisipants;
  };

  const [rows, setRows] = React.useState(loadPartisipants());
  const [rowModesModel, setRowModesModel] = React.useState({});

  const handleRowEditStart = (params, event) => {
    event.defaultMuiPrevented = true;
  };

  const handleRowEditStop = (params, event) => {
    event.defaultMuiPrevented = true;
  };

  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id) => () =>
    processRowsUpdate(rows.filter((row) => row.id !== id));

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = rows.find((row) => row.id === id);
    if (editedRow.isNew) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate = (newRow) => {
    const updatedRow = { ...newRow, isNew: false };
    processRowsUpdate(
      rows.map((row) => (row.id === newRow.id ? updatedRow : row))
    );
    return updatedRow;
  };

  const processRowsUpdate = (rows) => {
    savePartisipants(rows);
    setRows(rows);
  };

  const suffle = (data) =>
    data
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

  const rand = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  };

  const ballot = () => {
    let used = [];

    const trows = suffle(rows).map((trow) => {
      const teams = suffle(
        trow.buckets
          .split(",")
          .reduce(
            (sum, current) => [...sum, ...buckets.get(Number(current)).teams],
            []
          )
          .filter((team) => !used.includes(team.id))
      );
      const team = teams[rand(0, teams.length)];
      used.push(team.id);
      return { ...trow, team: team.title };
    });

    processRowsUpdate(
      rows.map((row) => {
        return {
          ...row,
          ...trows.find((trow) => row.id === trow.id),
        };
      })
    );
  };

  const columns = [
    { field: "name", headerName: "Name", editable: true, flex: 1 },
    {
      field: "buckets",
      headerName: "Buckets",
      editable: true,
      flex: 1,
    },
    { field: "team", headerName: "Team", flex: 1 },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",

      cellClassName: "actions",
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Save"
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  return (
    <React.Fragment>
      <Title>Partisipants</Title>
      <Box
        sx={{
          height: 400,
          width: "100%",
          "& .actions": {
            color: "text.secondary",
          },
          "& .textPrimary": {
            color: "text.primary",
          },
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
            Toolbar: EditToolbar,
          }}
          componentsProps={{
            toolbar: { setRows, setRowModesModel, ballot },
          }}
          experimentalFeatures={{ newEditingApi: true }}
        />
      </Box>
    </React.Fragment>
  );
};

export default Partisipants;
