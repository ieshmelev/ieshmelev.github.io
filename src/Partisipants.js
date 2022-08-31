import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Title from "./Title";

// Generate Order Data
function createData(id, name, buckets, team) {
  return { id, name, buckets, team };
}

const rows = [
  createData(0, "Elvis Presley", [5, 4.5], "Paris Saint-Germain"),
  createData(1, "Paul McCartney", [5], "Liverpool"),
  createData(2, "Tom Scholz", [5], "Manchester City"),
  createData(3, "Michael Jackson", [5], "Bayern München"),
  createData(4, "Bruce Springsteen", [5], "Real Madrid"),
];

const Partisipants = () => {
  return (
    <React.Fragment>
      <Title>Partisipants</Title>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Buckets</TableCell>
            <TableCell>Team</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.buckets}</TableCell>
              <TableCell>{row.team}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </React.Fragment>
  );
};

export default Partisipants;
