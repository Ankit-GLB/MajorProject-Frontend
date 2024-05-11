import React from "react";
import ReactDOM from "react-dom/client";
// import App from "./App.jsx";
import Aes from "./Aes.jsx";
import Navbar from "./Navbar.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* <App /> */}
    <Navbar />
    <Aes />
  </React.StrictMode>
);
