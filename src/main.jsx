import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    {/* 🔔 Global Toast */}
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "#111",
          color: "#fff",
          borderRadius: "8px",
        },
      }}
    />

    <App />
  </BrowserRouter>
);
