import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "../i18n";
import "../styles/tokens.css";
import "../styles/global.css";
import "../styles/hero-bleed.css";
import "../styles/hero-reference.css";
import "../showcase/showcase.css";
import { ShowcaseExampleApp } from "./ShowcaseExampleApp";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ShowcaseExampleApp />
    </BrowserRouter>
  </React.StrictMode>,
);
