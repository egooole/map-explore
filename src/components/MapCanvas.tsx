import { DivIcon } from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, ZoomControl } from "react-leaflet";
import { useTranslation } from "react-i18next";
import { mapPresets } from "../config/mapPresets";
import type { MapCategory, WorkbenchLanguage } from "../store/workbenchStore";
import type { MapControlsState, MarkerStyle } from "../types";

interface MapCanvasProps {
  mapCategory: MapCategory;
  lang: WorkbenchLanguage;
  controls: MapControlsState;
  compact?: boolean;
}

const routePositions: [number, number][] = [
  [31.207, 121.317],
  [31.223, 121.445],
  [31.236, 121.502],
];

function ZoomSync({ zoom }: { zoom: number }) {
  const map = useMap();
  map.setZoom(zoom);
  return null;
}

function markerIcon(style: MarkerStyle) {
  const className = `MapMarker MapMarker--${style}`;
  return new DivIcon({
    className,
    html: style === "dot" ? "<span></span>" : "<span><i></i></span>",
    iconSize: [34, 42],
    iconAnchor: [17, 34],
  });
}

export function MapCanvas({ mapCategory, lang, controls, compact = false }: MapCanvasProps) {
  const { t } = useTranslation();
  const preset = mapPresets[mapCategory][lang];
  const routeColor = mapCategory === "visualization" ? "#475569" : "#2563eb";

  return (
    <section className={`MapCanvas ${compact ? "MapCanvas--compact" : ""} MapCanvas--${mapCategory}`}>
      <MapContainer
        attributionControl={controls.showMapUi}
        center={[31.225, 121.45]}
        className="MapCanvas__leaflet"
        scrollWheelZoom
        zoom={controls.zoom}
        zoomControl={false}
      >
        <TileLayer attribution={preset.attribution} url={preset.tileUrl} />
        <ZoomSync zoom={controls.zoom} />
        {controls.showMapUi ? <ZoomControl position="bottomright" /> : null}
        <Polyline pathOptions={{ color: routeColor, dashArray: mapCategory === "visualization" ? "8 8" : undefined, weight: 4 }} positions={routePositions} />
        {routePositions.map((position, index) => (
          <Marker icon={markerIcon(controls.markerStyle)} key={`${position[0]}-${position[1]}`} position={position}>
            <Tooltip direction="top" offset={[0, -24]} permanent={index === 2}>
              {t(index === 0 ? "map.warehouse" : index === 1 ? "map.hub" : "map.destination")}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
      <div className="MapCanvas__meta">
        <span>{t(`map.${mapCategory}`)}</span>
        <span>{t(`map.${lang}`)}</span>
      </div>
      <div className="MapCanvas__poi" aria-hidden="true">
        <span>{t("map.poi")}</span>
        <span>{controls.markerStyle === "custom" ? t("map.customMarker") : controls.markerStyle}</span>
      </div>
    </section>
  );
}
