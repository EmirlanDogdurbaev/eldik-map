import { Route, Routes } from "react-router-dom";
import "./App.css";
import Login from "./components/Login/Login";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<div>hello</div>} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
