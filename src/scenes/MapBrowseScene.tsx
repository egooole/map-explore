import { useState } from "react";
import { MapCanvas } from "../components/MapCanvas";
import { createDefaultControls, ParamPanel } from "../components/ParamPanel";
import { useWorkbenchStore } from "../store/workbenchStore";

export function MapBrowseScene() {
  const { mapCategory, lang } = useWorkbenchStore();
  const [controls, setControls] = useState(createDefaultControls);

  return (
    <section className="MapBrowseScene">
      <MapCanvas controls={controls} lang={lang} mapCategory={mapCategory} />
      <ParamPanel controls={controls} onChange={setControls} />
    </section>
  );
}
