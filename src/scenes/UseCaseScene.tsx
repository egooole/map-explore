import { useState } from "react";
import { createDefaultControls, ParamPanel } from "../components/ParamPanel";
import { PhoneFrame } from "../components/PhoneFrame";
import { useWorkbenchStore } from "../store/workbenchStore";

export function UseCaseScene() {
  const { mapCategory, lang, mapTheme } = useWorkbenchStore();
  const [controls, setControls] = useState(createDefaultControls);

  return (
    <section className="UseCaseScene">
      <div className="UseCaseScene__phone">
        <PhoneFrame controls={controls} lang={lang} mapCategory={mapCategory} mapTheme={mapTheme} />
      </div>
      <ParamPanel controls={controls} onChange={setControls} />
    </section>
  );
}
