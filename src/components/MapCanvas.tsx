import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import customShopMarker from "../assets/custom-location/shop.svg";
import customUserMarker from "../assets/custom-location/user.svg";
import customWarehouseMarker from "../assets/custom-location/warehouse.svg";
import informatedCompletedMarker from "../assets/informated-location/completed.svg";
import informatedDefaultMarker from "../assets/informated-location/default.svg";
import informatedDisableMarker from "../assets/informated-location/disable.svg";
import informatedEmphasizedMarker from "../assets/informated-location/emphasized.svg";
import informatedSelectedMarker from "../assets/informated-location/selected.svg";
import normalRouteHasArrowDefault from "../assets/route/normal-route-has-arrow-default.svg";
import normalRouteHasArrowHover from "../assets/route/normal-route-has-arrow-hover.svg";
import { mapExploreDarkStyles, mapExploreVisualizationDarkStyles } from "../config/googleMapStyles";
import { mapKey, mapPresets } from "../config/mapPresets";
import type { MapCategory, MapTheme, WorkbenchLanguage } from "../store/workbenchStore";
import type {
  CustomMarkerContent,
  MapControlsState,
  MarkerPreviewFamily,
  MarkerPreviewState,
  MarkerPreviewVariant,
  MarkerStyle,
  RoutePreviewFamily,
  RoutePreviewState,
  RoutePreviewVariant,
} from "../types";

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
  addListener: (eventName: "zoom_changed", handler: () => void) => GoogleMapsListener;
  controls: Record<number, { clear: () => void }>;
  fitBounds: (bounds: unknown, padding?: number) => void;
  getZoom: () => number | undefined;
  setCenter: (center: GoogleLatLng) => void;
  setOptions: (options: Record<string, unknown>) => void;
  setZoom: (zoom: number) => void;
}

interface GoogleMapsListener {
  remove: () => void;
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
    anchorLeft?: string;
    anchorTop?: string;
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

interface PreviewMarkerItem {
  family: MarkerPreviewFamily;
  marker: MarkerPreviewState;
  position: GoogleLatLng;
}

interface MapCanvasProps {
  mapCategory: MapCategory;
  lang: WorkbenchLanguage;
  controls: MapControlsState;
  compact?: boolean;
  mapTheme?: MapTheme;
  previewDistribution?: "local" | "china" | "chinaCluster";
  previewFeature?: "point" | "line" | "area" | "container";
  previewMarkerFamily?: MarkerPreviewFamily;
  previewMarkers?: MarkerPreviewState[];
  previewRouteFamily?: RoutePreviewFamily;
  previewRoutes?: RoutePreviewState[];
}

const center: GoogleLatLng = { lat: 31.225, lng: 121.45 };
const chinaCenter: GoogleLatLng = { lat: 35.8, lng: 103.8 };

const routePositions: GoogleLatLng[] = [
  { lat: 31.207, lng: 121.317 },
  { lat: 31.223, lng: 121.445 },
  { lat: 31.236, lng: 121.502 },
];

const routePreviewPosition: GoogleLatLng = { lat: 31.223, lng: 121.46 };

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

const chinaPointPreviewPositions: GoogleLatLng[] = [
  { lat: 39.9042, lng: 116.4074 },
  { lat: 39.3434, lng: 117.3616 },
  { lat: 38.0428, lng: 114.5149 },
  { lat: 31.2304, lng: 121.4737 },
  { lat: 31.2989, lng: 120.5853 },
  { lat: 30.2741, lng: 120.1551 },
  { lat: 32.0603, lng: 118.7969 },
  { lat: 29.8683, lng: 121.544 },
  { lat: 23.1291, lng: 113.2644 },
  { lat: 22.5431, lng: 114.0579 },
  { lat: 23.0207, lng: 113.7518 },
  { lat: 22.2707, lng: 113.5767 },
  { lat: 30.5728, lng: 104.0668 },
  { lat: 29.563, lng: 106.5516 },
  { lat: 34.3416, lng: 108.9398 },
  { lat: 36.0611, lng: 103.8343 },
  { lat: 43.8256, lng: 87.6168 },
  { lat: 38.4872, lng: 106.2309 },
  { lat: 36.6171, lng: 101.7782 },
  { lat: 45.8038, lng: 126.5349 },
  { lat: 43.8171, lng: 125.3235 },
  { lat: 41.8057, lng: 123.4315 },
  { lat: 30.5928, lng: 114.3055 },
  { lat: 28.2282, lng: 112.9388 },
  { lat: 26.0745, lng: 119.2965 },
  { lat: 24.4798, lng: 118.0894 },
  { lat: 25.0389, lng: 102.7183 },
  { lat: 26.647, lng: 106.6302 },
  { lat: 22.817, lng: 108.3669 },
  { lat: 20.044, lng: 110.1999 },
];

const chinaClusterPreviewPositions: GoogleLatLng[] = [
  { lat: 39.94, lng: 116.42 },
  { lat: 37.2, lng: 118.48 },
  { lat: 43.92, lng: 125.38 },
  { lat: 31.18, lng: 121.34 },
  { lat: 30.08, lng: 118.95 },
  { lat: 30.58, lng: 104.08 },
  { lat: 34.26, lng: 108.95 },
  { lat: 30.55, lng: 114.32 },
  { lat: 23.05, lng: 113.55 },
  { lat: 24.75, lng: 118.1 },
  { lat: 26.5, lng: 106.6 },
  { lat: 22.75, lng: 108.35 },
  { lat: 36.1, lng: 103.75 },
  { lat: 43.78, lng: 87.62 },
];

const chinaRegionalClusterPreviewPositions: Array<GoogleLatLng & { count: number }> = [
  { count: 10, lat: 39.9, lng: 116.4 },
  { count: 32, lat: 36.67, lng: 117.05 },
  { count: 7, lat: 41.82, lng: 123.43 },
  { count: 5, lat: 45.76, lng: 126.64 },
  { count: 44, lat: 31.23, lng: 121.47 },
  { count: 37, lat: 30.27, lng: 120.16 },
  { count: 45, lat: 32.06, lng: 118.8 },
  { count: 30, lat: 29.87, lng: 121.54 },
  { count: 56, lat: 23.13, lng: 113.26 },
  { count: 48, lat: 22.54, lng: 114.06 },
  { count: 64, lat: 23.02, lng: 113.75 },
  { count: 52, lat: 22.27, lng: 113.58 },
  { count: 35, lat: 30.57, lng: 104.07 },
  { count: 29, lat: 29.56, lng: 106.55 },
  { count: 21, lat: 30.59, lng: 114.31 },
  { count: 31, lat: 28.23, lng: 112.94 },
  { count: 18, lat: 34.34, lng: 108.94 },
  { count: 20, lat: 36.06, lng: 103.83 },
  { count: 16, lat: 26.08, lng: 119.3 },
  { count: 18, lat: 24.48, lng: 118.09 },
  { count: 14, lat: 25.04, lng: 102.72 },
  { count: 20, lat: 26.65, lng: 106.63 },
  { count: 12, lat: 22.82, lng: 108.37 },
  { count: 16, lat: 20.04, lng: 110.2 },
];

const chinaMicroClusterPreviewPositions: Array<GoogleLatLng & { count: number }> = [
  { count: 3, lat: 39.9, lng: 116.4 },
  { count: 7, lat: 39.13, lng: 117.2 },
  { count: 12, lat: 36.67, lng: 117.05 },
  { count: 20, lat: 37.87, lng: 112.55 },
  { count: 14, lat: 31.23, lng: 121.47 },
  { count: 11, lat: 31.14, lng: 121.58 },
  { count: 19, lat: 30.27, lng: 120.16 },
  { count: 18, lat: 32.06, lng: 118.8 },
  { count: 13, lat: 29.87, lng: 121.54 },
  { count: 22, lat: 23.13, lng: 113.26 },
  { count: 18, lat: 22.54, lng: 114.06 },
  { count: 16, lat: 23.02, lng: 113.75 },
  { count: 20, lat: 22.27, lng: 113.58 },
  { count: 12, lat: 30.57, lng: 104.07 },
  { count: 17, lat: 29.56, lng: 106.55 },
  { count: 9, lat: 30.59, lng: 114.31 },
  { count: 12, lat: 28.23, lng: 112.94 },
  { count: 8, lat: 34.34, lng: 108.94 },
  { count: 10, lat: 36.06, lng: 103.83 },
  { count: 6, lat: 26.08, lng: 119.3 },
  { count: 10, lat: 24.48, lng: 118.09 },
  { count: 7, lat: 25.04, lng: 102.72 },
  { count: 7, lat: 26.65, lng: 106.63 },
  { count: 8, lat: 22.82, lng: 108.37 },
];

const chinaLeafPointPreviewPositions: GoogleLatLng[] = [
  { lat: 31.23, lng: 121.47 },
  { lat: 31.14, lng: 121.58 },
  { lat: 31.31, lng: 121.39 },
  { lat: 30.27, lng: 120.16 },
  { lat: 30.18, lng: 120.21 },
  { lat: 32.06, lng: 118.8 },
  { lat: 23.13, lng: 113.26 },
  { lat: 23.02, lng: 113.75 },
  { lat: 22.54, lng: 114.06 },
  { lat: 22.27, lng: 113.58 },
  { lat: 30.57, lng: 104.07 },
  { lat: 29.56, lng: 106.55 },
  { lat: 30.59, lng: 114.31 },
  { lat: 28.23, lng: 112.94 },
  { lat: 39.9, lng: 116.4 },
  { lat: 39.13, lng: 117.2 },
  { lat: 36.67, lng: 117.05 },
  { lat: 34.34, lng: 108.94 },
  { lat: 26.08, lng: 119.3 },
  { lat: 24.48, lng: 118.09 },
  { lat: 25.04, lng: 102.72 },
  { lat: 26.65, lng: 106.63 },
  { lat: 22.82, lng: 108.37 },
  { lat: 20.04, lng: 110.2 },
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

const customMarkerAssets: Partial<Record<CustomMarkerContent, string>> = {
  shop: customShopMarker,
  user: customUserMarker,
  warehouse: customWarehouseMarker,
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
  count?: number,
  customContent?: CustomMarkerContent,
) {
  const marker = document.createElement("div");
  const previewClass = previewFamily === "normal" ? "point" : previewFamily;
  marker.className = previewVariant ? `MapMarker MapMarker--${previewClass}-${previewVariant}` : `MapMarker MapMarker--${style}`;
  marker.innerHTML =
    previewVariant && previewFamily === "informated"
      ? `<span class="MapMarker__asset"><img alt="" class="MapMarker__assetBase" src="${informatedMarkerAssets[previewVariant]}" /><img alt="" class="MapMarker__assetSelected" src="${informatedSelectedMarker}" /></span>`
      : previewVariant && previewFamily === "cumulative"
        ? `<span class="MapMarker__cluster"><b>${count ?? ""}</b></span>`
      : previewVariant && previewFamily === "custom" && customContent
        ? customMarkerAssets[customContent]
          ? `<span class="MapMarker__customAsset"><img alt="" src="${customMarkerAssets[customContent]}" /></span>`
          : `<span class="MapMarker__customTextPin"><b>${customContent === "number" ? "2" : "O"}</b></span>`
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

function createCompositePoint(kind: "normal" | "informated" | "progress", position: "start" | "middle" | "end") {
  if (kind === "informated") {
    return `
      <span class="MapRouteComposite__point MapRouteComposite__point--informated MapRouteComposite__point--${position}">
        <span class="MapMarker__asset">
          <img alt="" class="MapMarker__assetBase" src="${informatedDefaultMarker}" />
          <img alt="" class="MapMarker__assetSelected" src="${informatedSelectedMarker}" />
        </span>
      </span>
    `;
  }

  if (kind === "progress") {
    return `
      <span class="MapRouteComposite__point MapRouteComposite__point--progress MapRouteComposite__point--${position}" aria-hidden="true">
        <span class="MapRouteComposite__progressHalo"></span>
        <span class="MapRouteComposite__progressPin">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4.5 11.1 19.2 4.7 12.8 19.5 10.4 13.7 4.5 11.1Z" />
          </svg>
        </span>
      </span>
    `;
  }

  return `
    <span class="MapRouteComposite__point MapRouteComposite__point--normal MapRouteComposite__point--${position}">
      <span><i></i></span>
    </span>
  `;
}

function createCompositeRouteElement(family: RoutePreviewFamily, variant: RoutePreviewVariant) {
  const pointKind = family === "routeWithInformatedLocation" ? "informated" : "normal";
  const isProgress = family === "routeWithProgress";
  const progressVariant = isProgress && variant === "default" ? "inProgress" : variant;

  return `
    <span class="MapRouteComposite MapRouteComposite--${family} MapRouteComposite--${progressVariant}">
      <span class="MapRouteComposite__line" aria-hidden="true">
        <span class="MapRouteComposite__segment MapRouteComposite__segment--completed"></span>
        <span class="MapRouteComposite__segment MapRouteComposite__segment--active"></span>
        <span class="MapRouteComposite__arrows"></span>
      </span>
      ${createCompositePoint(isProgress ? "normal" : pointKind, "start")}
      ${isProgress ? createCompositePoint("progress", "middle") : ""}
      ${createCompositePoint(isProgress ? "normal" : pointKind, "end")}
    </span>
  `;
}

function createRouteElement(family: RoutePreviewFamily, variant: RoutePreviewVariant, label: string) {
  const route = document.createElement("div");
  route.className = `MapRoutePreview MapRoutePreview--network MapMarker--interactive MapRoutePreview--${family} MapRoutePreview--${variant}`;
  route.tabIndex = 0;
  route.setAttribute("aria-label", label);
  route.setAttribute("role", "button");
  if (family === "routeWithNormalLocation" || family === "routeWithInformatedLocation" || family === "routeWithProgress") {
    route.innerHTML = createCompositeRouteElement(family, variant);
  } else if (family === "normalHasArrow") {
    route.innerHTML = `
      <img alt="" class="MapRoutePreview__asset MapRoutePreview__asset--default" src="${normalRouteHasArrowDefault}" />
      <img alt="" class="MapRoutePreview__asset MapRoutePreview__asset--hover" src="${normalRouteHasArrowHover}" />
    `;
  } else {
    route.innerHTML = `
    <svg aria-hidden="true" class="MapRoutePreview__networkSvg" viewBox="0 0 282 121">
      <path class="MapRoutePreview__strokeBase" d="M52 20 L106 73 L151 63 L232 43" />
      <path class="MapRoutePreview__strokeBase" d="M28 101 L97 79 L151 63 L232 43" />
      <path class="MapRoutePreview__route MapRoutePreview__route--secondary" d="M28 101 L97 79 L151 63 L232 43" />
      <path class="MapRoutePreview__route MapRoutePreview__route--primary" d="M52 20 L106 73 L151 63 L232 43" />
      <g class="MapRoutePreview__arrows MapRoutePreview__arrows--secondary">
        <path d="M58 90 L72 85 L61 79 L69 76 L83 83 L67 92 Z" />
        <path d="M110 76 L126 71 L113 65 L122 62 L138 69 L121 78 Z" />
        <path d="M176 59 L191 54 L178 48 L187 45 L203 52 L186 61 Z" />
      </g>
      <g class="MapRoutePreview__arrows MapRoutePreview__arrows--primary">
        <path d="M78 44 L91 57 L75 58 L82 64 L101 59 L85 39 Z" />
        <path d="M126 69 L142 66 L129 59 L138 56 L154 63 L137 72 Z" />
        <path d="M176 59 L191 54 L178 48 L187 45 L203 52 L186 61 Z" />
      </g>
    </svg>
    <span class="MapRoutePreview__pin MapRoutePreview__pin--one">1</span>
    <span class="MapRoutePreview__pin MapRoutePreview__pin--two">2</span>
    <span class="MapRoutePreview__destination" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M4.75 9.4 12 5l7.25 4.4v8.85H4.75V9.4Z" />
        <path d="M8 18.25v-5.5h8v5.5M7.25 10.3h9.5" />
      </svg>
    </span>
    <span class="MapRoutePreview__routeTooltip">
      <b>ATL Hub → EWR Hub</b>
      <small><span>Text here</span><span>Text here</span></small>
      <small><span>Text here</span><span>Text here</span></small>
    </span>
  `;
  }

  route.addEventListener("click", () => {
    const canvas = route.closest(".MapCanvas");
    canvas?.querySelectorAll(".MapRoutePreview.is-selected").forEach((selectedRoute) => {
      if (selectedRoute !== route) {
        selectedRoute.classList.remove("is-selected");
      }
    });
    route.classList.toggle("is-selected");
  });
  route.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      route.click();
    }
  });

  const tooltip = document.createElement("div");
  tooltip.className = "MapMarker__tooltip";
  tooltip.textContent = label;
  route.appendChild(tooltip);

  return route;
}

function resolvePreviewCenter(previewDistribution: MapCanvasProps["previewDistribution"]) {
  return previewDistribution === "china" || previewDistribution === "chinaCluster" ? chinaCenter : center;
}

function resolvePreviewPositions(previewDistribution: MapCanvasProps["previewDistribution"]) {
  if (previewDistribution === "chinaCluster") {
    return chinaClusterPreviewPositions;
  }

  return previewDistribution === "china" ? chinaPointPreviewPositions : pointPreviewPositions;
}

function resolveCumulativePreviewItems(zoom: number, previewMarkers: MarkerPreviewState[] | undefined): PreviewMarkerItem[] {
  if (zoom >= 7) {
    const variants: MarkerPreviewVariant[] = ["default", "completed", "muted", "default", "emphasized", "completed"];
    return chinaLeafPointPreviewPositions.map((position, index) => ({
      family: "normal" as MarkerPreviewFamily,
      marker: {
        id: variants[index % variants.length],
        label: previewMarkers?.[0]?.label ?? "Normal point",
      },
      position,
    }));
  }

  if (zoom >= 6) {
    return chinaMicroClusterPreviewPositions.map((cluster) => ({
      family: "cumulative" as MarkerPreviewFamily,
      marker: {
        count: cluster.count,
        id: "default" as MarkerPreviewVariant,
        label: `Cluster ${cluster.count}`,
      },
      position: { lat: cluster.lat, lng: cluster.lng },
    }));
  }

  if (zoom >= 5) {
    return chinaRegionalClusterPreviewPositions.map((cluster) => ({
      family: "cumulative" as MarkerPreviewFamily,
      marker: {
        count: cluster.count,
        id: "default" as MarkerPreviewVariant,
        label: `Cluster ${cluster.count}`,
      },
      position: { lat: cluster.lat, lng: cluster.lng },
    }));
  }

  return (previewMarkers ?? []).map((marker, index) => ({
    family: "cumulative" as MarkerPreviewFamily,
    marker,
    position: chinaClusterPreviewPositions[index % chinaClusterPreviewPositions.length],
  }));
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
  anchor: "bottom" | "center" = "bottom",
): Promise<MapMarkerHandle> {
  const { AdvancedMarkerElement } = await googleMaps.maps.importLibrary("marker");
  element.classList.add("MapMarker--advanced");
  const anchorOptions =
    anchor === "center"
      ? {
          anchorLeft: "-50%",
          anchorTop: "-50%",
        }
      : {
          anchorLeft: "-50%",
          anchorTop: "-100%",
        };
  const marker = new AdvancedMarkerElement({
    ...anchorOptions,
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
  mapTheme = "light",
  previewDistribution = "local",
  previewFeature,
  previewMarkerFamily = "normal",
  previewMarkers,
  previewRouteFamily,
  previewRoutes,
}: MapCanvasProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const polylineRef = useRef<GooglePolyline | null>(null);
  const polygonRef = useRef<GooglePolygon | null>(null);
  const markersRef = useRef<MapMarkerHandle[]>([]);
  const routePreviewsRef = useRef<MapMarkerHandle[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "missing-key" | "error">("idle");
  const [previewZoom, setPreviewZoom] = useState(controls.zoom);
  const preset = mapPresets[mapCategory][lang];
  const darkStyles = mapCategory === "visualization" ? mapExploreVisualizationDarkStyles : mapExploreDarkStyles;
  const activeStyles = mapTheme === "dark" ? darkStyles : preset.mapId ? undefined : preset.styles;
  const activeMapId = mapTheme === "dark" ? undefined : preset.mapId;
  const routeColor = mapCategory === "visualization" ? "#475569" : "#0f62fe";
  const markerLabels = useMemo(() => [t("map.warehouse"), t("map.hub"), t("map.destination")], [t]);
  const isCumulativePreview = previewMarkerFamily === "cumulative" && previewDistribution === "chinaCluster";
  const renderPreviewZoom = isCumulativePreview ? previewZoom : undefined;

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
            center: resolvePreviewCenter(previewDistribution),
            clickableIcons: mapCategory === "entity",
            disableDefaultUI: !controls.showMapUi,
            gestureHandling: "greedy",
            mapId: activeMapId,
            mapTypeControl: false,
            mapTypeId: preset.mapTypeId,
            streetViewControl: controls.showMapUi,
            styles: activeStyles,
            zoom: controls.zoom,
            zoomControl: controls.showMapUi,
          });

        mapRef.current = map;
        setPreviewZoom(map.getZoom() ?? controls.zoom);
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
  }, [activeMapId, activeStyles, controls.showMapUi, lang, mapCategory, preset.mapTypeId, previewDistribution]);

  useEffect(() => {
    if (!mapRef.current || status !== "ready") {
      return;
    }

    setPreviewZoom(mapRef.current.getZoom() ?? controls.zoom);
    const listener = mapRef.current.addListener("zoom_changed", () => {
      setPreviewZoom(mapRef.current?.getZoom() ?? controls.zoom);
    });

    return () => listener.remove();
  }, [controls.zoom, status]);

  useEffect(() => {
    if (!mapRef.current || status !== "ready") {
      return;
    }

    mapRef.current.setCenter(resolvePreviewCenter(previewDistribution));
    mapRef.current.setZoom(controls.zoom);
  }, [controls.zoom, previewDistribution, previewFeature, previewMarkerFamily, status]);

  useEffect(() => {
    if (!window.google?.maps || !mapRef.current || status !== "ready") {
      return;
    }

    const googleMaps = window.google;
    const map = mapRef.current;

    map.setOptions({
      clickableIcons: mapCategory === "entity",
      disableDefaultUI: !controls.showMapUi,
      mapId: activeMapId,
      mapTypeControl: false,
      mapTypeId: preset.mapTypeId,
      streetViewControl: controls.showMapUi,
      styles: activeStyles,
      zoomControl: controls.showMapUi,
    });

    const shouldShowMarkers = !previewFeature || previewFeature === "point" || previewFeature === "container";
    const shouldShowRoutePreview = previewFeature === "line" && Boolean(previewRouteFamily && previewRoutes?.length);
    const shouldShowLine = (!previewFeature || previewFeature === "line" || previewFeature === "container") && !shouldShowRoutePreview;
    const shouldShowArea = previewFeature === "area" || previewFeature === "container";

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
    routePreviewsRef.current.forEach((route) => route.remove());
    routePreviewsRef.current = [];

    const renderRoutePreviews = async () => {
      if (!shouldShowRoutePreview || !previewRouteFamily || !previewRoutes?.length) {
        return;
      }

      const selectedRoute = previewRoutes.find((route) => route.id === "default") ?? previewRoutes[0];
      const routeElement = createRouteElement(previewRouteFamily, selectedRoute.id, selectedRoute.label);
      const routeHandles = [
        await (activeMapId
          ? createAdvancedMarker(googleMaps, map, routePreviewPosition, routeElement, "center")
          : Promise.resolve(createOverlayMarker(googleMaps, map, routePreviewPosition, routeElement, "center"))),
      ];

      if (cancelled) {
        routeHandles.forEach((route) => route.remove());
        return;
      }

      routePreviewsRef.current = routeHandles;
    };

    const renderMarkers = async () => {
      if (!shouldShowMarkers) {
        return;
      }

      if (previewMarkers?.length) {
        const markerItems: PreviewMarkerItem[] =
          isCumulativePreview
            ? resolveCumulativePreviewItems(renderPreviewZoom ?? controls.zoom, previewMarkers)
            : previewMarkers.map((marker, index) => {
                const previewPositions = resolvePreviewPositions(previewDistribution);
                return {
                  family: previewMarkerFamily,
                  marker,
                  position: previewPositions[index % previewPositions.length],
                };
              });

        const markerHandles = await Promise.all(
          markerItems.map(({ family, marker, position }) => {
            const markerElement = createMarkerElement(
              controls.markerStyle,
              marker.label,
              marker.id,
              family,
              marker.count,
              marker.customContent,
            );
            if (family === "cumulative" && marker.count) {
              markerElement.addEventListener("click", () => {
                map.setZoom(Math.min((map.getZoom() ?? renderPreviewZoom ?? controls.zoom) + 1, 8));
              });
            }

            return activeMapId
              ? createAdvancedMarker(googleMaps, map, position, markerElement, "center")
              : Promise.resolve(createOverlayMarker(googleMaps, map, position, markerElement, "center"));
          }),
        );

        if (cancelled) {
          markerHandles.forEach((marker) => marker.remove());
          return;
        }

        markersRef.current = markerHandles;
        return;
      }

      markersRef.current = await Promise.all(
        routePositions.map((position, index) => {
          const markerElement = createMarkerElement(controls.markerStyle, markerLabels[index]);
          return activeMapId
            ? createAdvancedMarker(googleMaps, map, position, markerElement)
            : Promise.resolve(createOverlayMarker(googleMaps, map, position, markerElement));
        }),
      );
    };

    renderRoutePreviews().catch(() => {
      if (!cancelled) {
        setStatus("error");
      }
    });

    renderMarkers().catch(() => {
      if (!cancelled) {
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      routePreviewsRef.current.forEach((route) => route.remove());
      routePreviewsRef.current = [];
    };
  }, [
    controls.markerStyle,
    controls.showMapUi,
    mapCategory,
    markerLabels,
    activeMapId,
    preset.mapTypeId,
    activeStyles,
    previewDistribution,
    previewFeature,
    previewMarkerFamily,
    previewMarkers,
    previewRouteFamily,
    previewRoutes,
    renderPreviewZoom,
    routeColor,
    status,
  ]);

  useEffect(() => {
    return () => {
      polylineRef.current?.setMap(null);
      polygonRef.current?.setMap(null);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      routePreviewsRef.current.forEach((route) => route.remove());
      routePreviewsRef.current = [];
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
