import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./i18n";
import "./styles/tokens.css";
import "./styles/global.css";
import App from "./App";

function redirectDirectRouteToHashRoute() {
  if (window.location.hash) {
    return;
  }

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const pathname = window.location.pathname.replace(/\/$/, "");
  const directAppRoutes = ["/home", "/browse", "/use-case", "/manual", "/guide"];
  const isDirectAppRoute = directAppRoutes.some((route) => pathname === `${basePath}${route}`);

  if (!isDirectAppRoute) {
    return;
  }

  const routePath = pathname.slice(basePath.length) || "/home";
  window.history.replaceState(null, "", `${basePath}/#${routePath}${window.location.search}`);
}

redirectDirectRouteToHashRoute();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
