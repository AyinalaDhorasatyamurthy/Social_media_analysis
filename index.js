import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Render the App component inside the root div in index.html
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);