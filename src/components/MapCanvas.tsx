import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import customShopMarker from "../assets/custom-location/shop.svg?raw";
import customUserMarker from "../assets/custom-location/user.svg?raw";
import customWarehouseMarker from "../assets/custom-location/warehouse.svg?raw";
import informatedCompletedMarker from "../assets/informated-location/completed.svg";
import informatedDefaultMarker from "../assets/informated-location/default.svg";
import informatedDisableMarker from "../assets/informated-location/disable.svg";
import informatedEmphasizedMarker from "../assets/informated-location/emphasized.svg";
import informatedSelectedMarker from "../assets/informated-location/selected.svg";
import { cloudMapIds, mapKey, mapLabCloudMapIdSource, mapPresets } from "../config/mapPresets";
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
    __mapLabGoogleMapsMapIds?: string;
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
  addListener: (eventName: "click" | "mouseout" | "mouseover", handler: () => void) => GoogleMapsListener;
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
    zIndex?: number;
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

interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

interface GoogleLatLngValue {
  lat: () => number;
  lng: () => number;
}

type GoogleLatLng = GoogleLatLngLiteral | GoogleLatLngValue;

interface MapMarkerHandle {
  remove: () => void;
}

interface PreviewMarkerItem {
  family: MarkerPreviewFamily;
  marker: MarkerPreviewState;
  position: GoogleLatLng;
}

interface DynamicRouteLayer {
  listeners: GoogleMapsListener[];
  markers: MapMarkerHandle[];
  overlays: MapMarkerHandle[];
  outline: GooglePolyline | null;
  route: GooglePolyline | null;
}

interface MapCanvasProps {
  mapCategory: MapCategory;
  lang: WorkbenchLanguage;
  controls: MapControlsState;
  compact?: boolean;
  dynamicRouteFamily?: RoutePreviewFamily;
  mapTheme?: MapTheme;
  previewDistribution?: "local" | "china" | "chinaCluster";
  previewFeature?: "point" | "line" | "area" | "container";
  previewMarkerFamily?: MarkerPreviewFamily;
  previewMarkers?: MarkerPreviewState[];
  previewRouteFamily?: RoutePreviewFamily;
  previewRouteState?: RoutePreviewVariant;
  previewRoutes?: RoutePreviewState[];
}

const center: GoogleLatLngLiteral = { lat: 31.225, lng: 121.45 };
const chinaCenter: GoogleLatLngLiteral = { lat: 35.8, lng: 103.8 };

const routePositions: GoogleLatLngLiteral[] = [
  { lat: 31.207, lng: 121.317 },
  { lat: 31.223, lng: 121.445 },
  { lat: 31.236, lng: 121.502 },
];

const routePreviewPosition: GoogleLatLngLiteral = { lat: 31.223, lng: 121.46 };
const routeArrowAnchor = { x: 9.79846, y: 2.12132 };
const routeArrowPath = "M1.06065 10.8591L9.79846 2.12132L18.5363 10.8591";
const routeWithNormalLocationArrowScale = {
  default: 7.83 / 20,
  focused: 12.36 / 20,
};

const routeWithNormalLocationPreviewPath: GoogleLatLngLiteral[] = [
  { lat: 31.1939, lng: 121.3382 },
  { lat: 31.1974, lng: 121.3528 },
  { lat: 31.2041, lng: 121.3751 },
  { lat: 31.2118, lng: 121.3976 },
  { lat: 31.2189, lng: 121.4214 },
  { lat: 31.2265, lng: 121.4489 },
  { lat: 31.2394, lng: 121.4715 },
  { lat: 31.2527, lng: 121.4836 },
  { lat: 31.2698, lng: 121.4929 },
  { lat: 31.2885, lng: 121.5008 },
  { lat: 31.3056, lng: 121.5071 },
  { lat: 31.3211, lng: 121.5124 },
  { lat: 31.3278, lng: 121.5152 },
];

const routeStateColors: Partial<Record<RoutePreviewVariant, string>> = {
  completed: "#9C9EAD",
  default: "#2A3EF4",
  muted: "#C9D2FC",
};

const routeArrowStateColors: Partial<Record<RoutePreviewVariant, string>> = {
  completed: "#C4C5CE",
  default: "#768BFF",
  muted: "#D9E0FD",
};

function resolveRouteStateColor(state?: RoutePreviewVariant) {
  return routeStateColors[state ?? "default"] ?? routeStateColors.default ?? "#2A3EF4";
}

function resolveRouteArrowStateColor(state?: RoutePreviewVariant) {
  return routeArrowStateColors[state ?? "default"] ?? routeArrowStateColors.default ?? "#768BFF";
}

function createEmptyDynamicRouteLayer(): DynamicRouteLayer {
  return {
    listeners: [],
    markers: [],
    overlays: [],
    outline: null,
    route: null,
  };
}

function clearDynamicRouteLayer(layer: DynamicRouteLayer) {
  layer.listeners.forEach((listener) => listener.remove());
  layer.listeners = [];
  layer.markers.forEach((marker) => marker.remove());
  layer.markers = [];
  layer.overlays.forEach((overlay) => overlay.remove());
  layer.overlays = [];
  layer.outline?.setMap(null);
  layer.route?.setMap(null);
  layer.outline = null;
  layer.route = null;
}

function getPathBounds(path: GoogleLatLngLiteral[]) {
  return path.reduce(
    (bounds, point) => ({
      east: Math.max(bounds.east, point.lng),
      north: Math.max(bounds.north, point.lat),
      south: Math.min(bounds.south, point.lat),
      west: Math.min(bounds.west, point.lng),
    }),
    {
      east: path[0]?.lng ?? center.lng,
      north: path[0]?.lat ?? center.lat,
      south: path[0]?.lat ?? center.lat,
      west: path[0]?.lng ?? center.lng,
    },
  );
}

function normalizeRouteNodeValue(value: string) {
  return value.trim();
}

interface RoutesApiLatLng {
  latitude: number;
  longitude: number;
}

interface RoutesApiResponse {
  routes?: Array<{
    polyline?: {
      encodedPolyline?: string;
    };
    viewport?: {
      high?: RoutesApiLatLng;
      low?: RoutesApiLatLng;
    };
  }>;
}

interface ComputedRoute {
  bounds?: {
    east: number;
    north: number;
    south: number;
    west: number;
  };
  path: GoogleLatLngLiteral[];
}

class RouteRequestError extends Error {
  code: "api-blocked" | "generic";

  constructor(code: RouteRequestError["code"]) {
    super(code);
    this.code = code;
  }
}

function decodeEncodedPolyline(encodedPolyline: string): GoogleLatLngLiteral[] {
  const path: GoogleLatLngLiteral[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encodedPolyline.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encodedPolyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      byte = encodedPolyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;
    path.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return path;
}

async function computeRouteWithRoutesApi(start: string, middle: string, end: string): Promise<ComputedRoute> {
  if (!mapKey) {
    throw new Error("missing-map-key");
  }

  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    body: JSON.stringify({
      computeAlternativeRoutes: false,
      destination: { address: end },
      intermediates: middle ? [{ address: middle }] : [],
      origin: { address: start },
      polylineEncoding: "ENCODED_POLYLINE",
      polylineQuality: "HIGH_QUALITY",
      routingPreference: "TRAFFIC_UNAWARE",
      travelMode: "DRIVE",
    }),
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": mapKey,
      "X-Goog-FieldMask": "routes.polyline.encodedPolyline,routes.viewport",
    },
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (errorText.includes("API_KEY_SERVICE_BLOCKED") || errorText.includes("Routes.ComputeRoutes are blocked")) {
      throw new RouteRequestError("api-blocked");
    }
    throw new RouteRequestError("generic");
  }

  const data = (await response.json()) as RoutesApiResponse;
  const route = data.routes?.[0];
  const encodedPolyline = route?.polyline?.encodedPolyline;

  if (!encodedPolyline) {
    throw new Error("routes-api-empty");
  }

  const path = decodeEncodedPolyline(encodedPolyline);
  if (path.length === 0) {
    throw new Error("routes-api-empty-path");
  }

  const high = route.viewport?.high;
  const low = route.viewport?.low;

  return {
    bounds:
      high && low
        ? {
            east: high.longitude,
            north: high.latitude,
            south: low.latitude,
            west: low.longitude,
          }
        : undefined,
    path,
  };
}

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

const chinaRegionalClusterPreviewPositions: Array<GoogleLatLngLiteral & { count: number }> = [
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

const chinaMicroClusterPreviewPositions: Array<GoogleLatLngLiteral & { count: number }> = [
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

const customMarkerStateColors: Partial<Record<MarkerPreviewVariant, string>> = {
  completed: "#9C9EAD",
  default: "#2A3EF4",
  muted: "#C9D2FC",
};

function createCustomMarkerAsset(asset: string, previewVariant?: MarkerPreviewVariant) {
  const stateColor = customMarkerStateColors[previewVariant ?? "default"] ?? customMarkerStateColors.default;
  return asset.replace(/var\(--fill-0,\s*#2A3EF4\)/gi, stateColor ?? "#2A3EF4");
}

function resetGoogleMapsScript() {
  document.querySelectorAll(`script[id="${scriptId}"], script[src*="maps.googleapis.com/maps/api/js"]`).forEach((script) => {
    script.remove();
  });
  delete window.google;
  window.__mapLabGoogleMapsMapIds = undefined;
  window.__mapLabGoogleMapsPromise = undefined;
}

function loadGoogleMaps(lang: WorkbenchLanguage) {
  if (!mapKey) {
    return Promise.reject(new Error("missing-map-key"));
  }

  const mapIdsKey = cloudMapIds.join(",");

  if (window.google?.maps && window.__mapLabGoogleMapsLanguage === lang && window.__mapLabGoogleMapsMapIds === mapIdsKey) {
    return Promise.resolve(window.google);
  }

  if (
    window.__mapLabGoogleMapsPromise &&
    window.__mapLabGoogleMapsLanguage === lang &&
    window.__mapLabGoogleMapsMapIds === mapIdsKey
  ) {
    return window.__mapLabGoogleMapsPromise;
  }

  if (
    window.google?.maps &&
    (window.__mapLabGoogleMapsLanguage !== lang || window.__mapLabGoogleMapsMapIds !== mapIdsKey)
  ) {
    resetGoogleMapsScript();
  } else if (
    window.__mapLabGoogleMapsLanguage &&
    (window.__mapLabGoogleMapsLanguage !== lang || window.__mapLabGoogleMapsMapIds !== mapIdsKey)
  ) {
    resetGoogleMapsScript();
  }

  window.__mapLabGoogleMapsLanguage = lang;
  window.__mapLabGoogleMapsMapIds = mapIdsKey;
  window.__mapLabGoogleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const region = lang === "zh" ? "CN" : "US";
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    const mapIdsQuery = cloudMapIds.length ? `&map_ids=${encodeURIComponent(cloudMapIds.join(","))}` : "";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(mapKey)}&language=${lang}&region=${region}&v=weekly${mapIdsQuery}`;
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
          ? `<span class="MapMarker__customAsset">${createCustomMarkerAsset(customMarkerAssets[customContent], previewVariant)}</span>`
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
      ${createHasArrowRouteShapeMarkup()}
      ${createCompositePoint(isProgress ? "normal" : pointKind, "start")}
      ${isProgress ? createCompositePoint("progress", "middle") : ""}
      ${createCompositePoint(isProgress ? "normal" : pointKind, "end")}
    </span>
  `;
}

function createRoutePreviewArrow(x: number, y: number, rotation: number) {
  return `<path d="${routeArrowPath}" transform="translate(${x} ${y}) rotate(${rotation}) translate(-${routeArrowAnchor.x} -${routeArrowAnchor.y})" />`;
}

function createRoutePreviewArrowMarkup() {
  return `
    <g class="MapRoutePreview__narrowArrows MapRoutePreview__narrowArrows--primary">
      ${createRoutePreviewArrow(84.1, 51.5, 44.5)}
      ${createRoutePreviewArrow(119.9, 69.9, -12.5)}
      ${createRoutePreviewArrow(163.4, 59.9, -13.9)}
      ${createRoutePreviewArrow(207.1, 49.1, -13.9)}
    </g>
    <g class="MapRoutePreview__narrowArrows MapRoutePreview__narrowArrows--secondary">
      ${createRoutePreviewArrow(70.9, 87.3, -17.7)}
      ${createRoutePreviewArrow(114.0, 74.0, -16.5)}
      ${createRoutePreviewArrow(157.7, 61.4, -13.9)}
      ${createRoutePreviewArrow(201.4, 50.6, -13.9)}
    </g>
  `;
}

function createHasArrowRouteShapeMarkup() {
  return `
    <svg aria-hidden="true" class="MapRouteComposite__routeSvg" viewBox="0 0 284 143">
      <path d="M250.229 52.9424L251.618 60.8213L251.792 61.8066L250.808 61.9795L134.326 82.5049C134.088 82.5469 133.855 82.6187 133.633 82.7168L31.3633 127.941L30.4492 128.346L30.0439 127.431L26.8086 120.113L26.4043 119.199L27.3193 118.794L129.589 73.5703C130.548 73.1461 131.556 72.8394 132.59 72.6572L249.071 52.1318L250.057 51.958L250.229 52.9424Z" fill="#009995" stroke="#ffffff" stroke-width="2" stroke-linecap="square"/>
      <path d="M59.9766 39.6748L132.202 66.3105C132.7 66.4942 133.238 66.5432 133.761 66.4512L249.071 46.1318L250.057 45.958L250.229 46.9424L251.618 54.8213L251.792 55.8066L250.808 55.9795L135.496 76.2988C133.231 76.6979 130.9 76.4891 128.742 75.6934L56.5176 49.0576L55.5791 48.7109L55.9248 47.7734L58.6924 40.2676L59.0391 39.3291L59.9766 39.6748Z" fill="#2A3EF4" stroke="#ffffff" stroke-width="2" stroke-linecap="square"/>
      <g class="MapRouteComposite__routeArrows MapRouteComposite__routeArrows--secondary">
        <path d="M139.002 70.7998L145.406 75.3022L140.904 81.7065" />
        <path d="M102.888 84.75L110.343 87.1376L107.956 94.5932" />
        <path d="M73.8877 97.75L81.3433 100.138L78.9557 107.593" />
        <path d="M173.553 64.7749L179.957 69.2773L175.455 75.6816" />
        <path d="M208.103 58.75L214.507 63.2524L210.004 69.6567" />
      </g>
      <g class="MapRouteComposite__routeArrows MapRouteComposite__routeArrows--primary">
        <path d="M131.783 65.6704L137.486 71.034L132.122 76.7365" />
        <path d="M99.6416 53.75L102.848 60.8919L95.706 64.0982" />
        <path d="M168.002 59.75L174.406 64.2524L169.904 70.6567" />
        <path d="M202.002 53.75L208.406 58.2524L203.904 64.6567" />
      </g>
    </svg>
  `;
}

function createRoutePrimitiveMarkup(variant: RoutePreviewVariant) {
  const visualVariant = variant === "selected" ? "selected" : variant === "inProgress" ? "inProgress" : variant;

  return `
    <span class="MapRoutePrimitive MapRoutePrimitive--${visualVariant}" aria-hidden="true">
      <span class="MapRoutePrimitive__track MapRoutePrimitive__track--completed"></span>
      <span class="MapRoutePrimitive__track MapRoutePrimitive__track--active"></span>
      <span class="MapRoutePrimitive__arrows"></span>
      ${
        visualVariant === "muted" || visualVariant === "completed"
          ? '<span class="MapRoutePrimitive__midPoint"></span>'
          : ""
      }
    </span>
  `;
}

function createRouteElement(family: RoutePreviewFamily, variant: RoutePreviewVariant, label: string) {
  const route = document.createElement("div");
  route.className = `MapRoutePreview MapRoutePreview--network MapMarker--interactive MapRoutePreview--${family} MapRoutePreview--${variant}`;
  route.tabIndex = 0;
  route.setAttribute("aria-label", label);
  route.setAttribute("role", "button");
  if (family === "normalHasArrow") {
    route.innerHTML = `
      <svg aria-hidden="true" class="MapRoutePreview__networkSvg" viewBox="0 0 282 121">
        <path class="MapRoutePreview__strokeBase" d="M52 20 L106 73 L151 63 L232 43" />
        <path class="MapRoutePreview__strokeBase" d="M28 101 L97 79 L151 63 L232 43" />
        <path class="MapRoutePreview__route MapRoutePreview__route--secondary" d="M28 101 L97 79 L151 63 L232 43" />
        <path class="MapRoutePreview__route MapRoutePreview__route--primary" d="M52 20 L106 73 L151 63 L232 43" />
        ${createRoutePreviewArrowMarkup()}
      </svg>
    `;
  } else if (
    family === "routeWithNormalLocation" ||
    family === "routeWithInformatedLocation" ||
    family === "routeWithProgress"
  ) {
    route.innerHTML = createCompositeRouteElement(family, variant);
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

function createRouteWithNormalLocationOverlay(
  googleMaps: GoogleMapsGlobal,
  map: GoogleMap,
  path: GoogleLatLngLiteral[],
  onFocusChange: (focused: boolean) => void,
  arrowScaleConfig = routeWithNormalLocationArrowScale,
  showArrows = true,
  routeState: RoutePreviewVariant = "default",
): MapMarkerHandle {
  class RouteOverlay extends googleMaps.maps.OverlayView {
    private container = document.createElement("div");
    private focused = false;
    private selected = false;

    constructor() {
      super();
      this.container.style.position = "absolute";
      this.container.style.pointerEvents = "none";
      this.container.style.zIndex = "10";
    }

    private isRouteHit(event: PointerEvent | MouseEvent) {
      return document
        .elementsFromPoint(event.clientX, event.clientY)
        .some((element) => element.classList.contains("MapRouteOverlay__hitArea"));
    }

    private handlePointerMove = (event: PointerEvent) => {
      if (this.isRouteHit(event)) {
        if (!this.focused) {
          this.setFocused(true);
        }
        return;
      }

      if (this.focused && !this.selected) {
        this.setFocused(false);
      }
    };

    private handleClick = (event: MouseEvent) => {
      if (!this.isRouteHit(event)) {
        return;
      }

      this.selected = !this.selected;
      this.setFocused(this.selected);
    };

    private render() {
      const projection = this.getProjection();
      if (!projection || path.length < 2) {
        return;
      }

      const projectedPath = path.map((point) => projection.fromLatLngToDivPixel(point));
      const padding = this.focused ? 30 : 24;
      const minX = Math.min(...projectedPath.map((point) => point.x)) - padding;
      const minY = Math.min(...projectedPath.map((point) => point.y)) - padding;
      const maxX = Math.max(...projectedPath.map((point) => point.x)) + padding;
      const maxY = Math.max(...projectedPath.map((point) => point.y)) + padding;
      const width = Math.max(1, maxX - minX);
      const height = Math.max(1, maxY - minY);
      const localPath = projectedPath.map((point) => ({ x: point.x - minX, y: point.y - minY }));
      const routeD = localPath.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
      const routeStroke = this.focused ? 12 : 8;
      const outlineStroke = routeStroke + 4;
      const routeColor = resolveRouteStateColor(routeState);
      const arrowColor = resolveRouteArrowStateColor(routeState);
      const arrowScale = this.focused ? arrowScaleConfig.focused : arrowScaleConfig.default;
      const arrowMarkup = showArrows ? this.createArrowMarkup(localPath, arrowScale, arrowColor) : "";
      const maskId = `routeWithNormalLocationMask-${Math.round(minX)}-${Math.round(minY)}-${this.focused ? "on" : "off"}`;

      this.container.style.left = `${minX}px`;
      this.container.style.top = `${minY}px`;
      this.container.style.width = `${width}px`;
      this.container.style.height = `${height}px`;
      this.container.innerHTML = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="${maskId}" maskUnits="userSpaceOnUse">
              <rect x="0" y="0" width="${width}" height="${height}" fill="black" />
              <path d="${routeD}" fill="none" stroke="white" stroke-width="${routeStroke}" stroke-linecap="round" stroke-linejoin="round" />
            </mask>
          </defs>
          <path d="${routeD}" fill="none" stroke="#ffffff" stroke-width="${outlineStroke}" stroke-linecap="round" stroke-linejoin="round" />
          <path d="${routeD}" fill="none" stroke="${routeColor}" stroke-width="${routeStroke}" stroke-linecap="round" stroke-linejoin="round" />
          <g mask="url(#${maskId})">
            ${arrowMarkup}
          </g>
          <path class="MapRouteOverlay__hitArea" d="${routeD}" fill="none" stroke="transparent" stroke-width="${Math.max(outlineStroke, 24)}" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: stroke; cursor: pointer;" />
        </svg>
      `;
    }

    private createArrowMarkup(points: Array<{ x: number; y: number }>, scale: number, color: string) {
      const arrows: string[] = [];
      let travelled = 0;
      let nextArrowDistance = 22;

      for (let index = 1; index < points.length; index += 1) {
        const start = points[index - 1];
        const end = points[index];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const segmentLength = Math.hypot(dx, dy);

        if (!segmentLength) {
          continue;
        }

        while (nextArrowDistance <= travelled + segmentLength) {
          const progress = (nextArrowDistance - travelled) / segmentLength;
          const x = start.x + dx * progress;
          const y = start.y + dy * progress;
          const rotation = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          arrows.push(
            `<path d="${routeArrowPath}" fill="none" stroke="${color}" stroke-width="3" transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale}) translate(-${routeArrowAnchor.x} -${routeArrowAnchor.y})" />`,
          );
          nextArrowDistance += 28;
        }

        travelled += segmentLength;
      }

      return arrows.join("");
    }

    private setFocused(focused: boolean) {
      this.focused = focused;
      onFocusChange(focused);
      this.render();
    }

    onAdd() {
      const svgPane = this.getPanes()?.overlayMouseTarget;
      if (!svgPane) {
        return;
      }

      document.addEventListener("pointermove", this.handlePointerMove);
      document.addEventListener("click", this.handleClick);
      svgPane.appendChild(this.container);
    }

    draw() {
      this.render();
    }

    onRemove() {
      document.removeEventListener("pointermove", this.handlePointerMove);
      document.removeEventListener("click", this.handleClick);
      this.container.remove();
    }
  }

  const overlay = new RouteOverlay();
  overlay.setMap(map);

  return {
    remove: () => overlay.setMap(null),
  };
}

function createOverlayMarker(
  googleMaps: GoogleMapsGlobal,
  map: GoogleMap,
  position: GoogleLatLng,
  element: HTMLElement,
  anchor: "bottom" | "center" = "bottom",
  zIndex?: number,
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
      if (zIndex !== undefined) {
        this.markerElement.style.zIndex = String(zIndex);
      }
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
  zIndex?: number,
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
    zIndex,
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
  dynamicRouteFamily,
  mapTheme = "light",
  previewDistribution = "local",
  previewFeature,
  previewMarkerFamily = "normal",
  previewMarkers,
  previewRouteFamily,
  previewRouteState = "default",
  previewRoutes,
}: MapCanvasProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const mapConfigKeyRef = useRef("");
  const polylineRef = useRef<GooglePolyline | null>(null);
  const polygonRef = useRef<GooglePolygon | null>(null);
  const dynamicRouteRef = useRef<DynamicRouteLayer>(createEmptyDynamicRouteLayer());
  const manualRoutePreviewRef = useRef<DynamicRouteLayer>(createEmptyDynamicRouteLayer());
  const markersRef = useRef<MapMarkerHandle[]>([]);
  const routePreviewsRef = useRef<MapMarkerHandle[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "missing-key" | "error">("idle");
  const [routeStatus, setRouteStatus] = useState<"idle" | "loading" | "error" | "api-blocked">("idle");
  const [previewZoom, setPreviewZoom] = useState(controls.zoom);
  const [debouncedRouteNodes, setDebouncedRouteNodes] = useState(controls.routeNodes);
  const preset = mapPresets[mapCategory][lang];
  const activeMapId = preset.mapId;
  const mapConfigKey = `${lang}:${mapCategory}:${preset.mapTypeId}:${activeMapId}`;
  const routeColor = mapCategory === "visualization" ? "#475569" : "#0f62fe";
  const markerLabels = useMemo(() => [t("map.warehouse"), t("map.hub"), t("map.destination")], [t]);
  const isCumulativePreview = previewMarkerFamily === "cumulative" && previewDistribution === "chinaCluster";
  const renderPreviewZoom = isCumulativePreview ? previewZoom : undefined;
  const dynamicRouteNodes = useMemo(
    () => debouncedRouteNodes.map((node) => ({ ...node, value: normalizeRouteNodeValue(node.value) })),
    [debouncedRouteNodes],
  );
  const canRenderDynamicRoute =
    Boolean(dynamicRouteFamily) &&
    Boolean(dynamicRouteNodes.find((node) => node.id === "start")?.value) &&
    Boolean(dynamicRouteNodes.find((node) => node.id === "end")?.value);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    console.info("[Map Lab] Google Maps Map ID", {
      mapCategory,
      mapId: activeMapId,
      mapTheme,
      source: mapLabCloudMapIdSource,
    });
  }, [activeMapId, mapCategory, mapTheme]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedRouteNodes(controls.routeNodes);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [controls.routeNodes]);

  useEffect(() => {
    let cancelled = false;

    setStatus("loading");
    loadGoogleMaps(lang)
      .then((googleMaps) => {
        if (cancelled || !rootRef.current) {
          return;
        }

        if (mapRef.current && mapConfigKeyRef.current !== mapConfigKey) {
          polylineRef.current?.setMap(null);
          polygonRef.current?.setMap(null);
          dynamicRouteRef.current.outline?.setMap(null);
          dynamicRouteRef.current.route?.setMap(null);
          dynamicRouteRef.current.listeners.forEach((listener) => listener.remove());
          markersRef.current.forEach((marker) => marker.remove());
          routePreviewsRef.current.forEach((route) => route.remove());
          polylineRef.current = null;
          polygonRef.current = null;
          dynamicRouteRef.current = createEmptyDynamicRouteLayer();
          markersRef.current = [];
          routePreviewsRef.current = [];
          mapRef.current = null;
          rootRef.current.replaceChildren();
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
            zoom: controls.zoom,
            zoomControl: controls.showMapUi,
          });

        mapRef.current = map;
        mapConfigKeyRef.current = mapConfigKey;
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
  }, [
    activeMapId,
    controls.showMapUi,
    lang,
    mapCategory,
    mapConfigKey,
    preset.mapTypeId,
    previewDistribution,
  ]);

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
      zoomControl: controls.showMapUi,
    });

    const shouldShowMarkers = !previewFeature || previewFeature === "point" || previewFeature === "container";
    const shouldShowRoutePreview =
      !canRenderDynamicRoute && previewFeature === "line" && Boolean(previewRouteFamily && previewRoutes?.length);
    const shouldShowLine =
      (!previewFeature || previewFeature === "line" || previewFeature === "container") &&
      !shouldShowRoutePreview &&
      !canRenderDynamicRoute;
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
    clearDynamicRouteLayer(manualRoutePreviewRef.current);

    const renderRoutePreviews = async () => {
      if (!shouldShowRoutePreview || !previewRouteFamily || !previewRoutes?.length) {
        return;
      }

      const selectedRoute = previewRoutes.find((route) => route.id === previewRouteState) ?? previewRoutes[0];

      if (
        previewRouteFamily === "normalNoArrow" ||
        previewRouteFamily === "normalHasArrow" ||
        previewRouteFamily === "routeWithNormalLocation"
      ) {
        const path = routeWithNormalLocationPreviewPath;
        const layer = manualRoutePreviewRef.current;
        const routeMarkerElements =
          previewRouteFamily === "routeWithNormalLocation"
            ? [
                createMarkerElement("dot", markerLabels[0], "default", "normal"),
                createMarkerElement("dot", markerLabels[2], "default", "normal"),
              ]
            : [];
        const setMarkerVariant = (focused: boolean) => {
          routeMarkerElements.forEach((markerElement) => {
            markerElement.classList.toggle("MapMarker--point-default", !focused);
            markerElement.classList.toggle("MapMarker--point-selected", focused);
          });
        };
        const routeOverlay = createRouteWithNormalLocationOverlay(
          googleMaps,
          map,
          path,
          setMarkerVariant,
          routeWithNormalLocationArrowScale,
          previewRouteFamily !== "normalNoArrow",
          previewRouteState,
        );
        layer.overlays = [routeOverlay];

        const markerHandles = await Promise.all(
          (previewRouteFamily === "routeWithNormalLocation" ? [path[0], path[path.length - 1]] : []).map((position, index) =>
            activeMapId
              ? createAdvancedMarker(googleMaps, map, position, routeMarkerElements[index], "center", 100)
              : Promise.resolve(createOverlayMarker(googleMaps, map, position, routeMarkerElements[index], "center", 100)),
          ),
        );

        if (cancelled) {
          markerHandles.forEach((marker) => marker.remove());
          clearDynamicRouteLayer(layer);
          return;
        }

        layer.markers = markerHandles;
        map.fitBounds(getPathBounds(path), 72);
        return;
      }

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
      clearDynamicRouteLayer(manualRoutePreviewRef.current);
    };
  }, [
    controls.markerStyle,
    controls.showMapUi,
    canRenderDynamicRoute,
    mapCategory,
    markerLabels,
    activeMapId,
    preset.mapTypeId,
    previewDistribution,
    previewFeature,
    previewMarkerFamily,
    previewMarkers,
    previewRouteFamily,
    previewRouteState,
    previewRoutes,
    renderPreviewZoom,
    routeColor,
    status,
  ]);

  useEffect(() => {
    if (!window.google?.maps || !mapRef.current || status !== "ready") {
      return;
    }

    const googleMaps = window.google;
    const map = mapRef.current;

    if (!canRenderDynamicRoute || !dynamicRouteFamily) {
      clearDynamicRouteLayer(dynamicRouteRef.current);
      setRouteStatus("idle");
      return;
    }

    let cancelled = false;
    const start = dynamicRouteNodes.find((node) => node.id === "start")?.value ?? "";
    const middle = dynamicRouteNodes.find((node) => node.id === "middle")?.value ?? "";
    const end = dynamicRouteNodes.find((node) => node.id === "end")?.value ?? "";
    const shouldShowArrows = dynamicRouteFamily !== "normalNoArrow";
    const shouldUseRouteOverlay =
      dynamicRouteFamily === "normalNoArrow" ||
      dynamicRouteFamily === "normalHasArrow" ||
      dynamicRouteFamily === "routeWithNormalLocation";

    clearDynamicRouteLayer(dynamicRouteRef.current);
    setRouteStatus("loading");

    void (async () => {
      try {
        const computedRoute = await computeRouteWithRoutesApi(start, middle, end);
        if (cancelled) {
          return;
        }

        const path = computedRoute.path;
        const layer = dynamicRouteRef.current;
        clearDynamicRouteLayer(layer);

        const routeMarkerPositions =
          dynamicRouteFamily === "normalHasArrow"
            ? []
            : middle
              ? [path[0], path[Math.floor(path.length / 2)], path[path.length - 1]]
              : [path[0], path[path.length - 1]];
        const routeMarkerLabels = dynamicRouteNodes.filter((node) => node.value).map((node) => node.value);
        const routeMarkerElements = routeMarkerPositions.map((_, index) =>
          createMarkerElement(
            controls.markerStyle,
            routeMarkerLabels[index] ?? markerLabels[index] ?? t("map.destination"),
            index === 0 ? "default" : index === routeMarkerPositions.length - 1 ? "emphasized" : "completed",
            "normal",
          ),
        );

        if (shouldUseRouteOverlay) {
          const setMarkerVariant = (focused: boolean) => {
            if (dynamicRouteFamily !== "routeWithNormalLocation") {
              return;
            }

            routeMarkerElements.forEach((markerElement) => {
              markerElement.classList.toggle("MapMarker--point-selected", focused);
            });
          };
          layer.overlays = [
            createRouteWithNormalLocationOverlay(
              googleMaps,
              map,
              path,
              setMarkerVariant,
              routeWithNormalLocationArrowScale,
              shouldShowArrows,
            ),
          ];
        } else {
          let selected = false;
          const routeIcons = () =>
            shouldShowArrows
              ? [
                  {
                    icon: {
                      anchor: new googleMaps.maps.Point(routeArrowAnchor.x, routeArrowAnchor.y),
                      fillOpacity: 0,
                      path: routeArrowPath,
                      scale: 1,
                      strokeColor: "#768bff",
                      strokeOpacity: 1,
                      strokeWeight: 3,
                    },
                    fixedRotation: false,
                    offset: "22px",
                    repeat: "45px",
                  },
                ]
              : [];
          const setFocused = (focused: boolean) => {
            layer.outline?.setOptions({
              strokeWeight: focused ? 20 : 12,
            });
            layer.route?.setOptions({
              icons: routeIcons(),
              strokeColor: focused ? "#2232c3" : "#2a3ef4",
              strokeWeight: focused ? 16 : 8,
              zIndex: focused ? 42 : 41,
            });
          };

          layer.outline = new googleMaps.maps.Polyline({
            clickable: false,
            geodesic: true,
            map,
            path,
            strokeColor: "#ffffff",
            strokeOpacity: 1,
            strokeWeight: 12,
            zIndex: 40,
          });
          layer.route = new googleMaps.maps.Polyline({
            clickable: true,
            geodesic: true,
            icons: routeIcons(),
            map,
            path,
            strokeColor: "#2a3ef4",
            strokeOpacity: 0.98,
            strokeWeight: 8,
            zIndex: 41,
          });
          layer.listeners = [
            layer.route.addListener("mouseover", () => setFocused(true)),
            layer.route.addListener("mouseout", () => {
              if (!selected) {
                setFocused(false);
              }
            }),
            layer.route.addListener("click", () => {
              selected = !selected;
              setFocused(selected);
            }),
          ];
        }

        const markerHandles = await Promise.all(
          routeMarkerPositions.map((position, index) => {
            const markerElement = routeMarkerElements[index];
            return activeMapId
              ? createAdvancedMarker(googleMaps, map, position, markerElement, "bottom", shouldUseRouteOverlay ? 100 : undefined)
              : Promise.resolve(createOverlayMarker(googleMaps, map, position, markerElement, "bottom", shouldUseRouteOverlay ? 100 : undefined));
          }),
        );

        if (cancelled) {
          markerHandles.forEach((marker) => marker.remove());
          clearDynamicRouteLayer(layer);
          return;
        }

        layer.markers = markerHandles;
        if (computedRoute.bounds) {
          map.fitBounds(computedRoute.bounds, 72);
        }
        setRouteStatus("idle");
      } catch (error) {
        if (!cancelled) {
          setRouteStatus(error instanceof RouteRequestError && error.code === "api-blocked" ? "api-blocked" : "error");
        }
      }
    })();

    return () => {
      cancelled = true;
      clearDynamicRouteLayer(dynamicRouteRef.current);
    };
  }, [
    activeMapId,
    canRenderDynamicRoute,
    controls.markerStyle,
    dynamicRouteFamily,
    dynamicRouteNodes,
    markerLabels,
    status,
    t,
  ]);

  useEffect(() => {
    return () => {
      clearDynamicRouteLayer(dynamicRouteRef.current);
      clearDynamicRouteLayer(manualRoutePreviewRef.current);
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
      {status === "ready" && routeStatus === "loading" ? (
        <div className="MapCanvas__routeState">{t("map.routeLoading")}</div>
      ) : null}
      {status === "ready" && routeStatus === "error" ? (
        <div className="MapCanvas__routeState MapCanvas__routeState--error">{t("map.routeError")}</div>
      ) : null}
      {status === "ready" && routeStatus === "api-blocked" ? (
        <div className="MapCanvas__routeState MapCanvas__routeState--error">{t("map.routeApiBlocked")}</div>
      ) : null}
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
