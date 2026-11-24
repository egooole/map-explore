import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import "../i18n";
import "../styles/tokens.css";
import "../styles/global.css";
import "../styles/hero-bleed.css";
import "./showcase.css";
import App from "../App";
import { ShowcaseApp } from "./ShowcaseApp";

function isManualHashRoute() {
  return window.location.hash.startsWith("#/manual");
}

function ShowcaseEntry() {
  const [showManual, setShowManual] = useState(isManualHashRoute);

  useEffect(() => {
    const syncEntryRoute = () => setShowManual(isManualHashRoute());
    window.addEventListener("hashchange", syncEntryRoute);
    return () => window.removeEventListener("hashchange", syncEntryRoute);
  }, []);

  return showManual ? (
    <HashRouter>
      <App />
    </HashRouter>
  ) : (
    <BrowserRouter>
      <ShowcaseApp />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ShowcaseEntry />
  </React.StrictMode>,
);
