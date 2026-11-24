import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import i18n from "../i18n";
import "../styles/tokens.css";
import "../styles/global.css";
import "../styles/hero-bleed.css";
import "./showcase.css";
import App from "../App";
import { useWorkbenchStore, WorkbenchLanguage } from "../store/workbenchStore";
import { ShowcaseApp } from "./ShowcaseApp";

function isManualHashRoute() {
  return window.location.hash.startsWith("#/manual");
}

function syncManualLanguageFromHash() {
  const query = window.location.hash.split("?", 2)[1];
  const requestedLanguage = new URLSearchParams(query).get("lang");

  if (requestedLanguage !== "zh" && requestedLanguage !== "en") {
    return;
  }

  useWorkbenchStore.getState().setLang(requestedLanguage as WorkbenchLanguage);
  void i18n.changeLanguage(requestedLanguage);
  document.documentElement.lang = requestedLanguage === "zh" ? "zh-CN" : "en";
}

function ShowcaseEntry() {
  const [showManual, setShowManual] = useState(() => {
    const shouldShowManual = isManualHashRoute();
    if (shouldShowManual) {
      syncManualLanguageFromHash();
    }
    return shouldShowManual;
  });

  useEffect(() => {
    const syncEntryRoute = () => {
      const shouldShowManual = isManualHashRoute();
      if (shouldShowManual) {
        syncManualLanguageFromHash();
      }
      setShowManual(shouldShowManual);
    };
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
