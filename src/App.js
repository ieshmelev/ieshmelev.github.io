import React, { useState } from "react";
//mock data
import data from "./data.json";
//components
import Header from "./Header";
import ToDoList from "./ToDoList";
import ToDoForm from "./ToDoForm";

import "./App.css";

function App() {
  const saveToDoList = (data) => {
    localStorage.setItem("toDoList", JSON.stringify(data));
  };

  const loadToDoList = () => {
    let toDoList = data;
    let lsToDoList = localStorage.getItem("toDoList");
    if (lsToDoList !== null) {
      toDoList = JSON.parse(lsToDoList);
    }
    saveToDoList(toDoList);
    return toDoList;
  };

  const [toDoList, setToDoList] = useState(loadToDoList());

  const handleToggle = (id) => {
    let mapped = toDoList.map((task) => {
      return task.id === Number(id)
        ? { ...task, complete: !task.complete }
        : { ...task };
    });
    saveToDoList(mapped);
    setToDoList(mapped);
  };

  const handleFilter = () => {
    let filtered = toDoList.filter((task) => {
      return !task.complete;
    });
    setToDoList(filtered);
  };

  const addTask = (userInput) => {
    let copy = [...toDoList];
    copy = [
      ...copy,
      { id: toDoList.length + 1, task: userInput, complete: false },
    ];
    saveToDoList(copy);
    setToDoList(copy);
  };

  return (
    <div className="App">
      <Header />
      <ToDoList
        toDoList={toDoList}
        handleToggle={handleToggle}
        handleFilter={handleFilter}
      />
      <ToDoForm addTask={addTask} />
    </div>
  );
}

export default App;
