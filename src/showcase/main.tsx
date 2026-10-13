import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "../i18n";
import "../styles/tokens.css";
import "../styles/global.css";
import "../styles/hero-bleed.css";
import "./showcase.css";
import { ShowcaseApp } from "./ShowcaseApp";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ShowcaseApp />
    </BrowserRouter>
  </React.StrictMode>,
);
