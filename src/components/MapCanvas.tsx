import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import informatedCompletedMarker from "../assets/informated-location/completed.svg";
import informatedDefaultMarker from "../assets/informated-location/default.svg";
import informatedDisableMarker from "../assets/informated-location/disable.svg";
import informatedEmphasizedMarker from "../assets/informated-location/emphasized.svg";
import informatedSelectedMarker from "../assets/informated-location/selected.svg";
import { mapKey, mapPresets } from "../config/mapPresets";
import type { MapCategory, WorkbenchLanguage } from "../store/workbenchStore";
import type { MapControlsState, MarkerPreviewFamily, MarkerPreviewState, MarkerPreviewVariant, MarkerStyle } from "../types";

declare global {
  interface Window {
    google?: GoogleMapsGlobal;
    __mapLabGoogleMapsLanguage?: WorkbenchLanguage;
    __mapLabGoogleMapsPromise?: Promise<GoogleMapsGlobal>;
  }
}

type GoogleMapsGlobal = {
  maps: {
    ControlPosition: Record<string, number>;
    importLibrary: (library: "marker") => Promise<GoogleMarkerLibrary>;
    Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap;
    OverlayView: typeof GoogleOverlayView;
    Point: new (x: number, y: number) => unknown;
    Polygon: new (options: Record<string, unknown>) => GooglePolygon;
    Polyline: new (options: Record<string, unknown>) => GooglePolyline;
    Size: new (width: number, height: number) => unknown;
  };
};

interface GoogleMap {
  controls: Record<number, { clear: () => void }>;
  fitBounds: (bounds: unknown, padding?: number) => void;
  setCenter: (center: GoogleLatLng) => void;
  setOptions: (options: Record<string, unknown>) => void;
  setZoom: (zoom: number) => void;
}

interface GooglePolyline {
  setMap: (map: GoogleMap | null) => void;
  setOptions: (options: Record<string, unknown>) => void;
}

interface GooglePolygon {
  setMap: (map: GoogleMap | null) => void;
  setOptions: (options: Record<string, unknown>) => void;
}

interface GoogleAdvancedMarker {
  map: GoogleMap | null;
}

type GoogleMarkerLibrary = {
  AdvancedMarkerElement: new (options: {
    content: HTMLElement;
    gmpClickable?: boolean;
    map: GoogleMap;
    position: GoogleLatLng;
    title?: string;
  }) => GoogleAdvancedMarker;
};

declare class GoogleOverlayView {
  draw(): void;
  getPanes(): { overlayMouseTarget: HTMLElement } | null;
  getProjection(): { fromLatLngToDivPixel: (position: GoogleLatLng) => { x: number; y: number } } | null;
  onAdd(): void;
  onRemove(): void;
  setMap(map: GoogleMap | null): void;
}

interface GoogleLatLng {
  lat: number;
  lng: number;
}

interface MapMarkerHandle {
  remove: () => void;
}

interface MapCanvasProps {
  mapCategory: MapCategory;
  lang: WorkbenchLanguage;
  controls: MapControlsState;
  compact?: boolean;
  previewFeature?: "point" | "line" | "area" | "container";
  previewMarkerFamily?: MarkerPreviewFamily;
  previewMarkers?: MarkerPreviewState[];
}

const center: GoogleLatLng = { lat: 31.225, lng: 121.45 };

const routePositions: GoogleLatLng[] = [
  { lat: 31.207, lng: 121.317 },
  { lat: 31.223, lng: 121.445 },
  { lat: 31.236, lng: 121.502 },
];

const pointPreviewPositions: GoogleLatLng[] = [
  { lat: 31.235, lng: 121.391 },
  { lat: 31.219, lng: 121.404 },
  { lat: 31.226, lng: 121.432 },
  { lat: 31.229, lng: 121.438 },
  { lat: 31.221, lng: 121.444 },
  { lat: 31.216, lng: 121.451 },
  { lat: 31.205, lng: 121.474 },
  { lat: 31.244, lng: 121.488 },
  { lat: 31.228, lng: 121.503 },
  { lat: 31.199, lng: 121.517 },
  { lat: 31.238, lng: 121.528 },
  { lat: 31.211, lng: 121.535 },
];

const areaPositions: GoogleLatLng[] = [
  { lat: 31.214, lng: 121.405 },
  { lat: 31.237, lng: 121.427 },
  { lat: 31.232, lng: 121.474 },
  { lat: 31.202, lng: 121.463 },
  { lat: 31.196, lng: 121.421 },
];

const scriptId = "map-lab-google-maps";
const interactivePointVariants: MarkerPreviewVariant[] = ["default", "completed", "emphasized"];

const informatedMarkerAssets: Record<MarkerPreviewVariant, string> = {
  completed: informatedCompletedMarker,
  default: informatedDefaultMarker,
  emphasized: informatedEmphasizedMarker,
  muted: informatedDisableMarker,
  selected: informatedSelectedMarker,
};

function resetGoogleMapsScript() {
  document.querySelectorAll(`script[id="${scriptId}"], script[src*="maps.googleapis.com/maps/api/js"]`).forEach((script) => {
    script.remove();
  });
  delete window.google;
  window.__mapLabGoogleMapsPromise = undefined;
}

function loadGoogleMaps(lang: WorkbenchLanguage) {
  if (!mapKey) {
    return Promise.reject(new Error("missing-map-key"));
  }

  if (window.google?.maps && window.__mapLabGoogleMapsLanguage === lang) {
    return Promise.resolve(window.google);
  }

  if (window.__mapLabGoogleMapsPromise && window.__mapLabGoogleMapsLanguage === lang) {
    return window.__mapLabGoogleMapsPromise;
  }

  if (window.__mapLabGoogleMapsLanguage && window.__mapLabGoogleMapsLanguage !== lang) {
    resetGoogleMapsScript();
  }

  window.__mapLabGoogleMapsLanguage = lang;
  window.__mapLabGoogleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const region = lang === "zh" ? "CN" : "US";
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(mapKey)}&language=${lang}&region=${region}&v=weekly`;
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google);
      } else {
        reject(new Error("google-maps-unavailable"));
      }
    };
    script.onerror = () => reject(new Error("google-maps-load-error"));
    document.head.appendChild(script);
  });

  return window.__mapLabGoogleMapsPromise;
}

function createMarkerElement(
  style: MarkerStyle,
  label: string,
  previewVariant?: MarkerPreviewVariant,
  previewFamily: MarkerPreviewFamily = "normal",
) {
  const marker = document.createElement("div");
  const previewClass = previewFamily === "normal" ? "point" : previewFamily;
  marker.className = previewVariant ? `MapMarker MapMarker--${previewClass}-${previewVariant}` : `MapMarker MapMarker--${style}`;
  marker.innerHTML =
    previewVariant && previewFamily === "informated"
      ? `<span class="MapMarker__asset"><img alt="" class="MapMarker__assetBase" src="${informatedMarkerAssets[previewVariant]}" /><img alt="" class="MapMarker__assetSelected" src="${informatedSelectedMarker}" /></span>`
      : style === "dot" && !previewVariant
        ? "<span></span>"
        : "<span><i></i></span>";

  if (previewVariant && interactivePointVariants.includes(previewVariant)) {
    marker.classList.add("MapMarker--interactive");
    marker.tabIndex = 0;
    marker.setAttribute("aria-label", label);
    marker.setAttribute("role", "button");
    marker.addEventListener("click", () => {
      const canvas = marker.closest(".MapCanvas");
      canvas?.querySelectorAll(".MapMarker.is-selected").forEach((selectedMarker) => {
        if (selectedMarker !== marker) {
          selectedMarker.classList.remove("is-selected");
        }
      });
      marker.classList.toggle("is-selected");
    });
    marker.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        marker.click();
      }
    });
  }

  const tooltip = document.createElement("div");
  tooltip.className = "MapMarker__tooltip";
  tooltip.textContent = label;
  marker.appendChild(tooltip);

  return marker;
}

function createOverlayMarker(
  googleMaps: GoogleMapsGlobal,
  map: GoogleMap,
  position: GoogleLatLng,
  element: HTMLElement,
  anchor: "bottom" | "center" = "bottom",
): MapMarkerHandle {
  class MarkerOverlay extends googleMaps.maps.OverlayView {
    private markerElement = element;

    onAdd() {
      this.getPanes()?.overlayMouseTarget.appendChild(this.markerElement);
    }

    draw() {
      const pixel = this.getProjection()?.fromLatLngToDivPixel(position);
      if (!pixel) {
        return;
      }
      const anchorTransform = anchor === "center" ? "translate(-50%, -50%)" : "translate(-50%, -100%)";
      this.markerElement.style.transform = `translate(${pixel.x}px, ${pixel.y}px) ${anchorTransform}`;
    }

    onRemove() {
      this.markerElement.remove();
    }
  }

  const overlay = new MarkerOverlay();
  overlay.setMap(map);
  return {
    remove: () => overlay.setMap(null),
  };
}

async function createAdvancedMarker(
  googleMaps: GoogleMapsGlobal,
  map: GoogleMap,
  position: GoogleLatLng,
  element: HTMLElement,
): Promise<MapMarkerHandle> {
  const { AdvancedMarkerElement } = await googleMaps.maps.importLibrary("marker");
  element.classList.add("MapMarker--advanced");
  const marker = new AdvancedMarkerElement({
    content: element,
    gmpClickable: element.classList.contains("MapMarker--interactive"),
    map,
    position,
    title: element.getAttribute("aria-label") ?? undefined,
  });

  return {
    remove: () => {
      marker.map = null;
      element.remove();
    },
  };
}

export function MapCanvas({
  mapCategory,
  lang,
  controls,
  compact = false,
  previewFeature,
  previewMarkerFamily = "normal",
  previewMarkers,
}: MapCanvasProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const polylineRef = useRef<GooglePolyline | null>(null);
  const polygonRef = useRef<GooglePolygon | null>(null);
  const markersRef = useRef<MapMarkerHandle[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "missing-key" | "error">("idle");
  const preset = mapPresets[mapCategory][lang];
  const routeColor = mapCategory === "visualization" ? "#475569" : "#0f62fe";
  const markerLabels = useMemo(() => [t("map.warehouse"), t("map.hub"), t("map.destination")], [t]);

  useEffect(() => {
    let cancelled = false;

    setStatus("loading");
    loadGoogleMaps(lang)
      .then((googleMaps) => {
        if (cancelled || !rootRef.current) {
          return;
        }

        const map =
          mapRef.current ??
          new googleMaps.maps.Map(rootRef.current, {
            center,
            clickableIcons: mapCategory === "entity",
            disableDefaultUI: !controls.showMapUi,
            gestureHandling: "greedy",
            mapId: preset.mapId,
            mapTypeControl: false,
            mapTypeId: preset.mapTypeId,
            streetViewControl: controls.showMapUi,
            styles: preset.styles,
            zoom: controls.zoom,
            zoomControl: controls.showMapUi,
          });

        mapRef.current = map;
        setStatus("ready");
      })
      .catch((error: Error) => {
        if (cancelled) {
          return;
        }
        setStatus(error.message === "missing-map-key" ? "missing-key" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [controls.showMapUi, controls.zoom, lang, mapCategory, preset.mapId, preset.mapTypeId, preset.styles]);

  useEffect(() => {
    if (!window.google?.maps || !mapRef.current || status !== "ready") {
      return;
    }

    const googleMaps = window.google;
    const map = mapRef.current;

    map.setOptions({
      clickableIcons: mapCategory === "entity",
      disableDefaultUI: !controls.showMapUi,
      mapId: preset.mapId,
      mapTypeControl: false,
      mapTypeId: preset.mapTypeId,
      streetViewControl: controls.showMapUi,
      styles: preset.styles,
      zoomControl: controls.showMapUi,
    });
    map.setCenter(center);
    map.setZoom(controls.zoom);

    const shouldShowMarkers = !previewFeature || previewFeature === "point";
    const shouldShowLine = !previewFeature || previewFeature === "line";
    const shouldShowArea = previewFeature === "area";

    if (!polylineRef.current) {
      polylineRef.current = new googleMaps.maps.Polyline({
        geodesic: true,
        map,
        path: routePositions,
      });
    }

    polylineRef.current.setOptions({
      icons:
        mapCategory === "visualization"
          ? [
              {
                icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
                offset: "0",
                repeat: "16px",
              },
            ]
          : [],
      path: routePositions,
      strokeColor: routeColor,
      strokeOpacity: shouldShowLine ? (mapCategory === "visualization" ? 0 : 0.94) : 0,
      strokeWeight: 4,
    });
    polylineRef.current.setMap(shouldShowLine ? map : null);

    if (!polygonRef.current) {
      polygonRef.current = new googleMaps.maps.Polygon({
        map,
        paths: areaPositions,
      });
    }

    polygonRef.current.setOptions({
      fillColor: mapCategory === "visualization" ? "#475569" : "#0f62fe",
      fillOpacity: mapCategory === "visualization" ? 0.16 : 0.18,
      paths: areaPositions,
      strokeColor: mapCategory === "visualization" ? "#334155" : "#0f62fe",
      strokeOpacity: 0.8,
      strokeWeight: 2,
    });
    polygonRef.current.setMap(shouldShowArea ? map : null);

    let cancelled = false;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const renderMarkers = async () => {
      if (!shouldShowMarkers) {
        return;
      }

      if (previewMarkers?.length) {
        const markerHandles = await Promise.all(
          previewMarkers.map((marker, index) => {
            const markerElement = createMarkerElement(controls.markerStyle, marker.label, marker.id, previewMarkerFamily);
            const markerPosition = pointPreviewPositions[index % pointPreviewPositions.length];

            return previewMarkerFamily === "informated" && preset.mapId
              ? createAdvancedMarker(googleMaps, map, markerPosition, markerElement)
              : Promise.resolve(createOverlayMarker(googleMaps, map, markerPosition, markerElement, "center"));
          }),
        );

        if (cancelled) {
          markerHandles.forEach((marker) => marker.remove());
          return;
        }

        markersRef.current = markerHandles;
        return;
      }

      markersRef.current = routePositions.map((position, index) =>
        createOverlayMarker(googleMaps, map, position, createMarkerElement(controls.markerStyle, markerLabels[index])),
      );
    };

    renderMarkers().catch(() => {
      if (!cancelled) {
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [
    controls.markerStyle,
    controls.showMapUi,
    controls.zoom,
    mapCategory,
    markerLabels,
    preset.mapId,
    preset.mapTypeId,
    preset.styles,
    previewFeature,
    previewMarkerFamily,
    previewMarkers,
    routeColor,
    status,
  ]);

  useEffect(() => {
    return () => {
      polylineRef.current?.setMap(null);
      polygonRef.current?.setMap(null);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, []);

  return (
    <section className={`MapCanvas ${compact ? "MapCanvas--compact" : ""} MapCanvas--${mapCategory}`}>
      <div className="MapCanvas__google" ref={rootRef} />
      {status === "loading" ? <div className="MapCanvas__state">{t("map.loading")}</div> : null}
      {status === "missing-key" ? <div className="MapCanvas__state">{t("map.googleKeyMissing")}</div> : null}
      {status === "error" ? <div className="MapCanvas__state">{t("map.loadError")}</div> : null}
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
