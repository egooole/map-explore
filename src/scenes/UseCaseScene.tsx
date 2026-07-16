import { useState } from "react";
import gtsTmsProduct from "../assets/use-case/gts-tms.svg";
import { MapCanvas } from "../components/MapCanvas";
import { createDefaultControls, ParamPanel } from "../components/ParamPanel";
import { useWorkbenchStore } from "../store/workbenchStore";

export function UseCaseScene() {
  const { mapCategory, lang, mapTheme } = useWorkbenchStore();
  const [controls, setControls] = useState(createDefaultControls);

  return (
    <section className="UseCaseScene">
      <div className="UseCaseScene__product">
        <div className="UseCaseProduct">
          <img alt="GTS TMS product interface" className="UseCaseProduct__image" src={gtsTmsProduct} />
          <div className="UseCaseProduct__map" aria-label="Google Maps product layer">
            <MapCanvas
              compact
              controls={controls}
              dynamicRouteFamily="routeWithNormalLocation"
              hideDynamicRouteMarkers
              hidePreviewContent
              lang={lang}
              mapCategory={mapCategory}
              mapTheme={mapTheme}
            />
          </div>
        </div>
      </div>
      <ParamPanel controls={controls} onChange={setControls} />
    </section>
  );
}
