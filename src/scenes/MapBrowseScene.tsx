import { useState } from "react";
import { MapCanvas } from "../components/MapCanvas";
import { createDefaultControls, ParamPanel } from "../components/ParamPanel";
import { useWorkbenchStore } from "../store/workbenchStore";

export function MapBrowseScene() {
  const { mapCategory, lang, mapTheme } = useWorkbenchStore();
  const [controls, setControls] = useState(createDefaultControls);

  return (
    <section className="MapBrowseScene">
      <MapCanvas controls={controls} lang={lang} mapCategory={mapCategory} mapTheme={mapTheme} />
      <ParamPanel controls={controls} onChange={setControls} />
    </section>
  );
}
