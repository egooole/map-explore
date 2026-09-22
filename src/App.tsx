import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { GuideScene } from "./scenes/GuideScene";
import { HomeScene } from "./scenes/HomeScene";
import { MapBrowseScene } from "./scenes/MapBrowseScene";
import { ManualScene } from "./scenes/ManualScene";
import { UseCaseScene } from "./scenes/UseCaseScene";
import { useWorkbenchStore, WorkbenchView } from "./store/workbenchStore";

const routeViews: Record<string, WorkbenchView> = {
  "/home": "home",
  "/browse": "browse",
  "/use-case": "use-case",
  "/manual": "manual",
  "/guide": "guide",
};

function RouteStoreSync() {
  const location = useLocation();
  const setView = useWorkbenchStore((state) => state.setView);

  useEffect(() => {
    const nextView = routeViews[location.pathname];
    if (nextView) {
      setView(nextView);
    }
  }, [location.pathname, setView]);

  return null;
}

function App() {
  return (
    <div className="AppShell">
      <RouteStoreSync />
      <Sidebar />
      <main className="MainStage">
        <Routes>
          <Route element={<HomeScene />} path="/home" />
          <Route element={<MapBrowseScene />} path="/browse" />
          <Route element={<UseCaseScene />} path="/use-case" />
          <Route element={<ManualScene />} path="/manual" />
          <Route element={<GuideScene />} path="/guide" />
          <Route element={<Navigate replace to="/home" />} path="*" />
        </Routes>
      </main>
    </div>
  );
}

export default App;
