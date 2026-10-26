import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import routeLocationPin from "../assets/route/location-pin.svg";
import routeLocationPinDisabled from "../assets/informated-location/disable.svg";
import routeProgressLocationPin from "../assets/route/progress-location.svg";
import { cloudMapIds, mapKey, mapLabCloudMapIdSource, mapPresets } from "../config/mapPresets";
import { createPointMarkerElement } from "../map-components/point";
import type { MapCategory, MapTheme, WorkbenchLanguage } from "../store/workbenchStore";
import type {
  CustomMarkerContent,
  ManagedRoute,
  MapControlsState,
  MarkerPreviewFamily,
  MarkerPreviewState,
  MarkerPreviewVariant,
  MarkerStyle,
  RoutePreviewFamily,
  RoutePreviewState,
  RoutePreviewVariant,
} from "../types";

/**
 * 这里补充 Google Maps 的最小 TypeScript 类型。
 * 项目没有引入完整的 @types/google.maps，所以只声明当前文件实际用到的 API。
 * 如果后面要新增 Google Maps 能力，比如 InfoWindow、Circle、DirectionsRenderer，
 * 可以在这些类型里继续追加对应字段。
 */
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
    importLibrary: {
      (library: "core"): Promise<GoogleCoreLibrary>;
      (library: "marker"): Promise<GoogleMarkerLibrary>;
    };
    Data: new (options: { map?: GoogleMap }) => GoogleDataLayer;
    Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap;
    OverlayView: typeof GoogleOverlayView;
    Point: new (x: number, y: number) => unknown;
    Polygon: new (options: Record<string, unknown>) => GooglePolygon;
    Polyline: new (options: Record<string, unknown>) => GooglePolyline;
    Size: new (width: number, height: number) => unknown;
  };
};

type GoogleCoreLibrary = {
  ColorScheme: {
    DARK: unknown;
    LIGHT: unknown;
  };
};

interface GoogleMap {
  addListener: (eventName: "click" | "zoom_changed", handler: () => void) => GoogleMapsListener;
  controls: Record<number, { clear: () => void }>;
  fitBounds: (bounds: unknown, padding?: number) => void;
  getDiv: () => HTMLElement;
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
  addEventListener: (eventName: string, handler: () => void) => void;
  map: GoogleMap | null;
}

interface GoogleDataFeature {
  getProperty: (name: string) => unknown;
}

interface GoogleDataMouseEvent {
  feature: GoogleDataFeature;
  latLng?: GoogleLatLng;
}

interface GoogleDataLayer {
  addGeoJson: (geoJson: GeoJsonFeatureCollection) => GoogleDataFeature[];
  addListener: (eventName: "click" | "mouseout" | "mouseover", handler: (event: GoogleDataMouseEvent) => void) => GoogleMapsListener;
  forEach: (callback: (feature: GoogleDataFeature) => void) => void;
  remove: (feature: GoogleDataFeature) => void;
  setMap: (map: GoogleMap | null) => void;
  setStyle: (style: (feature: GoogleDataFeature) => Record<string, unknown>) => void;
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
  static preventMapHitsAndGesturesFrom(element: HTMLElement): void;
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
  id?: string;
  marker: MarkerPreviewState;
  position: GoogleLatLng;
}

interface CumulativeClusterNode {
  count: number;
  depth: number;
  position: GoogleLatLngLiteral;
  seed: number;
}

interface GeoJsonFeatureCollection {
  features: Array<Record<string, unknown>>;
  name?: string;
  type: "FeatureCollection";
}

interface RegionManifestEntry {
  bbox: {
    east: number;
    north: number;
    south: number;
    west: number;
  };
  center: GoogleLatLngLiteral;
  countryCode: string;
  filePath: string;
  id: string;
  level: string;
  nameEn: string;
  nameZh: string;
  parentId?: string;
  source: string;
}

interface RegionManifest {
  generatedAt: string;
  regions: RegionManifestEntry[];
}

export interface PreviewMarkerGroup {
  distribution?: MapCanvasProps["previewDistribution"];
  family: MarkerPreviewFamily;
  ids?: string[];
  markers: MarkerPreviewState[];
  positions?: GoogleLatLngLiteral[];
}

export interface PreviewTooltipData {
  clickable?: boolean;
  hint?: string;
  metrics: Array<{ label: string; value: string }>;
  placement?: "above" | "below";
  status?: {
    label: string;
    tone: "fully" | "partial" | "none";
  };
  title: string;
}

export interface PreviewRegionShape {
  color: string;
  id: string;
  name: string;
  path: GoogleLatLngLiteral[];
}

export interface PreviewRouteGroup {
  colorId?: ManagedRoute["colorId"];
  family: RoutePreviewFamily;
  id?: string;
  path?: GoogleLatLngLiteral[];
  progressPointIndex?: number;
  routes: RoutePreviewState[];
  state?: RoutePreviewVariant;
  stopPositions?: GoogleLatLngLiteral[];
}

export interface PreviewProgressInfo {
  metrics: Array<{ label: string; value: string }>;
  title: string;
}

interface DynamicRouteLayer {
  listeners: GoogleMapsListener[];
  markers: MapMarkerHandle[];
  overlays: MapMarkerHandle[];
  polylines: GooglePolyline[];
  outline: GooglePolyline | null;
  route: GooglePolyline | null;
}

type MapMarkerAnchor = "bottom" | "center" | "pin-tip" | "tooltip-above" | "tooltip-below";

/**
 * MapCanvas 的 props 是整个地图画布的控制入口。
 * - controls：来自右侧参数面板，控制 zoom、marker style、路线输入等。
 * - previewFeature：组件手册里只展示点/线/面/容器中的某一类。
 * - previewMarkerFamily / previewRouteFamily：决定预览哪一种组件样式。
 * - previewRouteState：组件手册里状态切换按钮传进来的路线状态。
 */
export interface MapCanvasProps {
  mapCategory: MapCategory;
  lang: WorkbenchLanguage;
  controls: MapControlsState;
  compact?: boolean;
  dynamicRouteFamily?: RoutePreviewFamily;
  hideDynamicRouteMarkers?: boolean;
  mapTheme?: MapTheme;
  previewDistribution?: "local" | "china" | "chinaCluster";
  previewFeature?: "point" | "line" | "area" | "container";
  previewRegionColors?: Record<string, string>;
  previewRegionInteraction?: "single" | "multi";
  previewRegionIds?: string[];
  previewRegionMetrics?: Record<string, Array<{ label: string; value: string }>>;
  previewRegionShapes?: PreviewRegionShape[];
  previewRegionState?: "default" | "selected";
  previewRegionStyles?: Record<string, {
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
  }>;
  previewDimmedRegionIds?: string[];
  previewFitRegionId?: string;
  previewFlashRegionId?: string;
  previewRegionTooltip?: (regionId: string) => PreviewTooltipData | null;
  hidePreviewContent?: boolean;
  previewMarkerFamily?: MarkerPreviewFamily;
  previewMarkerGroups?: PreviewMarkerGroup[];
  previewMarkerTooltip?: (markerId: string) => PreviewTooltipData | null;
  previewMarkers?: MarkerPreviewState[];
  previewProgressInfo?: PreviewProgressInfo;
  previewProgressSelected?: boolean;
  previewRouteFamily?: RoutePreviewFamily;
  previewRouteGroups?: PreviewRouteGroup[];
  previewSelectedRouteId?: string;
  onPreviewProgressClearSelection?: () => void;
  onPreviewProgressSelect?: () => void;
  onPreviewRouteClearSelection?: () => void;
  onPreviewRouteHover?: (routeId: string | null) => void;
  onPreviewRouteSelect?: (routeId: string) => void;
  onPreviewMarkerHover?: (markerId: string | null) => void;
  onPreviewRegionClick?: (regionId: string) => void;
  onPreviewRegionHover?: (regionId: string | null) => void;
  previewHoveredRouteId?: string;
  previewRouteState?: RoutePreviewVariant;
  previewRoutes?: RoutePreviewState[];
}

/**
 * 地图默认中心点。
 * center 用在上海局部预览；chinaCenter 用在全国聚合点预览。
 * 修改这里会影响组件手册和地图浏览初始看到的地图区域。
 */
const center: GoogleLatLngLiteral = { lat: 31.225, lng: 121.45 };
const chinaCenter: GoogleLatLngLiteral = { lat: 35.8, lng: 103.8 };

/**
 * 最基础的静态路线坐标。
 * 当页面没有选择组件手册里的高级路线预览，也没有输入动态起终点时，会用这条简单路线。
 */
const routePositions: GoogleLatLngLiteral[] = [
  { lat: 31.207, lng: 121.317 },
  { lat: 31.223, lng: 121.445 },
  { lat: 31.236, lng: 121.502 },
];

const routePreviewPosition: GoogleLatLngLiteral = { lat: 31.223, lng: 121.46 };

/**
 * 箭头 SVG 的几何参数。
 * routeArrowPath：箭头的 SVG path，当前默认朝上，方便根据路线切线旋转。
 * routeArrowAnchor：旋转锚点，影响箭头贴在线上的位置。
 * 如果箭头“方向对但位置偏”，优先检查 anchor；如果“整体转歪”，优先检查 path 默认朝向。
 */
const routeArrowAnchor = { x: 9.79846, y: 2.12132 };
const routeArrowPath = "M1.06065 10.8591L9.79846 2.12132L18.5363 10.8591";

/**
 * Route with normal location 的箭头尺寸。
 * default：静态态箭头大小；focused：hover / selected 后箭头大小。
 * 数字写成“设计稿像素 / path 基准宽度 20”，方便从设计稿尺寸换算。
 */
const routeWithNormalLocationArrowScale = {
  default: 7.83 / 20,
  focused: 12.36 / 20,
};

/**
 * 组件手册中路线预览使用的固定路线。
 * 这是一条“看起来像真实道路”的经纬度路径，不会每次打开都请求 Routes API。
 * 如果想让预览路线更弯或经过更多道路，可以在这里继续增加坐标点。
 */
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

const routeWithProgressRatio = 0.58;

/**
 * 线组件的状态色。
 * default / muted / completed 对应状态切换按钮中的 默认 / Disable / 已完成。
 */
const routeStateColors: Partial<Record<RoutePreviewVariant, string>> = {
  completed: "#9C9EAD",
  default: "#2A3EF4",
  muted: "#C9D2FC",
};

/**
 * 箭头颜色单独配置。
 * 因为箭头在视觉上比路线主体更浅，所以没有直接复用 routeStateColors。
 */
const routeArrowStateColors: Partial<Record<RoutePreviewVariant, string>> = {
  completed: "#C4C5CE",
  default: "#768BFF",
  muted: "#D9E0FD",
};

type DynamicRouteColorId = ManagedRoute["colorId"];

interface DynamicRouteStyle {
  arrowColor: string;
  arrowFocusedColor: string;
  color: string;
  focusedColor: string;
}

interface RouteProgressOverlayConfig {
  completedColor: string;
  info?: PreviewProgressInfo;
  onSelect?: () => void;
  pathIndex?: number;
  ratio: number;
  selected?: boolean;
}

interface RouteOverlayInteractionConfig {
  hovered?: boolean;
  onHoverChange?: (hovered: boolean) => void;
  onSelect?: () => void;
  selected?: boolean;
}

const dynamicRouteStyles: Record<DynamicRouteColorId, DynamicRouteStyle> = {
  route1: {
    arrowColor: "#768BFF",
    arrowFocusedColor: "#768BFF",
    color: "#2A3EF4",
    focusedColor: "#2232C3",
  },
  route2: {
    arrowColor: "#9EE1DD",
    arrowFocusedColor: "#9EE1DD",
    color: "#009995",
    focusedColor: "#017B77",
  },
  route3: {
    arrowColor: "#D9D0F7",
    arrowFocusedColor: "#D9D0F7",
    color: "#9583FF",
    focusedColor: "#8575FF",
  },
};

const disabledDynamicRouteStyles: Record<DynamicRouteColorId, DynamicRouteStyle> = {
  route1: {
    arrowColor: "#99A6FA",
    arrowFocusedColor: "#99A6FA",
    color: "#C9D2FC",
    focusedColor: "#C9D2FC",
  },
  route2: {
    arrowColor: "#6FCBC7",
    arrowFocusedColor: "#6FCBC7",
    color: "#9EE1DD",
    focusedColor: "#9EE1DD",
  },
  route3: {
    arrowColor: "#C5B9F9",
    arrowFocusedColor: "#C5B9F9",
    color: "#D9D0F7",
    focusedColor: "#D9D0F7",
  },
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
    polylines: [],
    outline: null,
    route: null,
  };
}

/**
 * 清理地图上的动态路线层。
 * Google Maps 上创建的 marker / polyline / overlay 不会随 React 自动卸载，
 * 所以每次切换组件、重新搜索路线或页面卸载时，都要手动 remove / setMap(null)。
 */
function clearDynamicRouteLayer(layer: DynamicRouteLayer) {
  layer.listeners.forEach((listener) => listener?.remove?.());
  layer.listeners = [];
  layer.markers.forEach((marker) => marker.remove());
  layer.markers = [];
  layer.overlays.forEach((overlay) => overlay.remove());
  layer.overlays = [];
  layer.polylines.forEach((polyline) => polyline.setMap(null));
  layer.polylines = [];
  layer.outline?.setMap(null);
  layer.route?.setMap(null);
  layer.outline = null;
  layer.route = null;
}

/**
 * 根据一组经纬度计算地图可视范围。
 * map.fitBounds 会用这个范围把整条路线自动放进视口。
 */
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

/**
 * Google Routes API 返回的 encoded polyline 是压缩字符串。
 * 这个函数把它解码成 [{ lat, lng }] 坐标数组，后面才能画真实道路路线。
 */
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

/**
 * 用 Google Routes API 根据起点 / 中途点 / 终点生成真实路线。
 * 这里影响路线结果的关键参数：
 * - travelMode: DRIVE 表示驾车路线。
 * - polylineQuality: HIGH_QUALITY 表示返回更细的路线点，弯道更自然。
 * - routingPreference: TRAFFIC_UNAWARE 表示暂不考虑实时交通。
 */
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
const regionManifestUrl = `${import.meta.env.BASE_URL}geo/manifest.json`;
let regionManifestPromise: Promise<RegionManifest> | null = null;
const regionGeoJsonCache = new Map<string, Promise<GeoJsonFeatureCollection>>();

const regionDataStyles = {
  default: {
    fillColor: "#2A3EF4",
    fillOpacity: 0.1,
    strokeColor: "#2A3EF4",
    strokeWeight: 2,
  },
  disabled: {
    fillColor: "#2A3EF4",
    fillOpacity: 0.06,
    strokeColor: "#C9D2FC",
    strokeWeight: 2,
  },
  selected: {
    fillColor: "#2A3EF4",
    fillOpacity: 0.4,
    strokeColor: "#2A3EF4",
    strokeWeight: 2,
  },
};

const multiRegionDataStyles = {
  default: {
    fillOpacity: 0.08,
    strokeOpacity: 1,
    strokeWeight: 2,
  },
  pressed: {
    fillOpacity: 0.1,
    strokeOpacity: 0.2,
    strokeWeight: 2,
  },
};

function loadRegionManifest() {
  if (!regionManifestPromise) {
    regionManifestPromise = fetch(regionManifestUrl).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load region manifest: ${response.status}`);
      }
      return response.json() as Promise<RegionManifest>;
    });
  }

  return regionManifestPromise;
}

function resolveAssetUrl(filePath: string) {
  const base = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return `${base}${filePath}`;
}

function loadRegionGeoJson(region: RegionManifestEntry) {
  if (!regionGeoJsonCache.has(region.id)) {
    regionGeoJsonCache.set(
      region.id,
      fetch(resolveAssetUrl(region.filePath)).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load region geojson ${region.id}: ${response.status}`);
        }
        const geoJson = (await response.json()) as GeoJsonFeatureCollection;
        geoJson.features = geoJson.features.map((feature) => ({
          ...feature,
          properties: {
            ...((feature.properties as Record<string, unknown> | undefined) ?? {}),
            mapLabId: region.id,
          },
        }));
        return geoJson;
      }),
    );
  }

  return regionGeoJsonCache.get(region.id)!;
}

function createRegionLabelElement(
  region: RegionManifestEntry,
  metrics: Array<{ label: string; value: string }> = [{ label: "Selected", value: "--" }],
) {
  const label = document.createElement("div");
  label.className = "MapRegionLabel";

  const title = document.createElement("strong");
  title.textContent = region.nameZh || region.nameEn;
  label.append(title);

  metrics.forEach((metric) => {
    const row = document.createElement("span");
    const name = document.createElement("em");
    const value = document.createElement("b");
    name.textContent = metric.label;
    value.textContent = metric.value;
    row.append(name, value);
    label.append(row);
  });

  return label;
}

function createPreviewTooltipElement(data: PreviewTooltipData) {
  const tooltip = document.createElement("div");
  tooltip.className = `MapCoverageTooltip is-${data.placement ?? "above"}`;
  tooltip.setAttribute("role", "tooltip");

  const header = document.createElement("div");
  header.className = "MapCoverageTooltip__header";
  const title = document.createElement("strong");
  title.textContent = data.title;
  header.append(title);

  if (data.status) {
    const status = document.createElement("span");
    status.className = `MapCoverageTooltip__status is-${data.status.tone}`;
    status.textContent = data.status.label;
    header.append(status);
  }
  tooltip.append(header);

  const metrics = document.createElement("div");
  metrics.className = "MapCoverageTooltip__metrics";
  data.metrics.forEach((metric) => {
    const row = document.createElement("div");
    const label = document.createElement("span");
    const value = document.createElement("strong");
    label.textContent = metric.label;
    value.textContent = metric.value;
    row.append(label, value);
    metrics.append(row);
  });
  tooltip.append(metrics);

  if (data.hint) {
    const hint = document.createElement("p");
    hint.className = "MapCoverageTooltip__hint";
    hint.textContent = data.hint;
    tooltip.append(hint);
  }

  return tooltip;
}

function clampPreviewTooltipToMap(map: GoogleMap, tooltip: HTMLElement) {
  window.requestAnimationFrame(() => {
    if (!tooltip.isConnected) return;
    const mapRect = map.getDiv().getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const safeInset = 12;
    let offsetX = 0;
    if (tooltipRect.left < mapRect.left + safeInset) {
      offsetX = mapRect.left + safeInset - tooltipRect.left;
    } else if (tooltipRect.right > mapRect.right - safeInset) {
      offsetX = mapRect.right - safeInset - tooltipRect.right;
    }
    tooltip.style.translate = `${offsetX}px 0`;
    tooltip.style.setProperty("--map-tooltip-pointer-shift", `${-offsetX}px`);
  });
}

/**
 * 重置 Google Maps 脚本缓存。
 * 当语言或 mapIds 变化时，需要重新加载脚本，否则 Google Maps 会继续沿用旧语言/旧 Map ID。
 */
function resetGoogleMapsScript() {
  document.querySelectorAll(`script[id="${scriptId}"], script[src*="maps.googleapis.com/maps/api/js"]`).forEach((script) => {
    script.remove();
  });
  delete window.google;
  window.__mapLabGoogleMapsMapIds = undefined;
  window.__mapLabGoogleMapsPromise = undefined;
}

/**
 * 加载 Google Maps JavaScript API。
 * 关键参数：
 * - key：来自 VITE_MAP_KEY。
 * - language / region：跟随工作台语言切换。
 * - map_ids：告诉 Google 预加载哪个 Cloud Map ID，Advanced Marker 和云端样式都依赖它。
 */
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

function createRouteLocationPinElement(label: string, disabled = false) {
  const marker = document.createElement("div");
  marker.className = "MapMarker MapMarker--advanced MapMarker--route-location-pin";
  marker.setAttribute("aria-label", label);
  marker.setAttribute("role", "img");

  const asset = document.createElement("img");
  asset.alt = "";
  asset.src = disabled ? routeLocationPinDisabled : routeLocationPin;
  marker.appendChild(asset);

  return marker;
}

function createCompositePoint(kind: "normal" | "progress", position: "start" | "middle" | "end") {
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

/**
 * 静态组件手册里的组合路线预览。
 * 组合逻辑是：路线 SVG + 起点/终点点组件；progress 类型会额外加一个中间进度点。
 * 后续新增“路线 + 点”的组合组件时，可以复用这个思路，而不是重新写一套路线。
 */
function createCompositeRouteElement(family: RoutePreviewFamily, variant: RoutePreviewVariant) {
  const isProgress = family === "routeWithProgress";
  const progressVariant = isProgress && variant === "default" ? "inProgress" : variant;

  return `
    <span class="MapRouteComposite MapRouteComposite--${family} MapRouteComposite--${progressVariant}">
      ${createHasArrowRouteShapeMarkup()}
      ${createCompositePoint("normal", "start")}
      ${isProgress ? createCompositePoint("progress", "middle") : ""}
      ${createCompositePoint("normal", "end")}
    </span>
  `;
}

/**
 * 创建静态 SVG 预览中的箭头。
 * x / y 控制箭头位置；rotation 控制箭头角度。
 * 这是纯静态预览，不会跟随真实地图道路自动转向。
 */
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

function offsetGroupedPreviewPosition(
  position: GoogleLatLng,
  family: MarkerPreviewFamily,
  markerIndex: number,
  groupCount: number,
  previewDistribution: MapCanvasProps["previewDistribution"],
) {
  if (groupCount <= 1 || previewDistribution === "chinaCluster") {
    return position;
  }

  // 多种点同时展示时按组件类型固定分区，并加入轻微的不规则偏移。
  // 固定使用 family 而不是勾选后的数组序号，避免切换筛选时其余点位跳动。
  const familyOffsets: Record<Exclude<MarkerPreviewFamily, "cumulative">, GoogleLatLngLiteral> = {
    normal: { lat: 0.009, lng: -0.014 },
    informated: { lat: 0.013, lng: 0.017 },
    custom: { lat: -0.014, lng: 0.012 },
  };
  const naturalOffsets: GoogleLatLngLiteral[] = [
    { lat: 0, lng: 0 },
    { lat: 0.0035, lng: -0.0025 },
    { lat: -0.0028, lng: 0.004 },
    { lat: 0.0018, lng: 0.0055 },
    { lat: -0.004, lng: -0.0015 },
    { lat: 0.0045, lng: 0.002 },
  ];
  const familyOffset = family === "cumulative" ? { lat: 0, lng: 0 } : familyOffsets[family];
  const naturalOffset = naturalOffsets[markerIndex % naturalOffsets.length];
  const lat = typeof position.lat === "function" ? position.lat() : position.lat;
  const lng = typeof position.lng === "function" ? position.lng() : position.lng;

  return {
    lat: lat + familyOffset.lat + naturalOffset.lat,
    lng: lng + familyOffset.lng + naturalOffset.lng,
  };
}

function splitCumulativeCluster(node: CumulativeClusterNode): CumulativeClusterNode[] {
  if (node.count <= 1) {
    return [node];
  }

  // 3:4 的拆分比例让 28 首次放大后稳定拆成 12 + 16，且所有层级数量守恒。
  const firstCount = Math.max(1, Math.round((node.count * 3) / 7));
  const secondCount = node.count - firstCount;
  const distance = 4.2 / 2 ** node.depth;
  const angle = (((node.seed * 47 + node.depth * 73) % 360) * Math.PI) / 180;
  const latOffset = Math.sin(angle) * distance * 0.62;
  const lngOffset = Math.cos(angle) * distance;

  return [
    {
      count: firstCount,
      depth: node.depth + 1,
      position: {
        lat: node.position.lat + latOffset,
        lng: node.position.lng + lngOffset,
      },
      seed: node.seed * 2 + 1,
    },
    {
      count: secondCount,
      depth: node.depth + 1,
      position: {
        lat: node.position.lat - latOffset,
        lng: node.position.lng - lngOffset,
      },
      seed: node.seed * 2 + 2,
    },
  ];
}

function resolveHierarchicalCumulativePreviewItems(
  zoom: number,
  previewMarkers: MarkerPreviewState[] | undefined,
): PreviewMarkerItem[] {
  const targetDepth = Math.max(0, Math.floor(zoom) - 4);
  let nodes: CumulativeClusterNode[] = (previewMarkers ?? []).map((marker, index) => {
    const position = chinaClusterPreviewPositions[index % chinaClusterPreviewPositions.length];
    return {
      count: marker.count ?? 1,
      depth: 0,
      position: {
        lat: typeof position.lat === "function" ? position.lat() : position.lat,
        lng: typeof position.lng === "function" ? position.lng() : position.lng,
      },
      seed: index + 1,
    };
  });

  for (let depth = 0; depth < targetDepth; depth += 1) {
    nodes = nodes.flatMap(splitCumulativeCluster);
  }

  const normalVariants: MarkerPreviewVariant[] = ["default", "completed", "muted", "emphasized"];
  return nodes.map((node, index) => ({
    family: node.count === 1 ? "normal" : "cumulative",
    marker:
      node.count === 1
        ? {
            id: normalVariants[index % normalVariants.length],
            label: previewMarkers?.[0]?.label ?? "Normal point",
          }
        : {
            count: node.count,
            id: "default",
            label: `Cluster ${node.count}`,
          },
    position: node.position,
  }));
}

function resolveCombinedCumulativePreviewItems(
  zoom: number,
  previewMarkers: MarkerPreviewState[] | undefined,
): PreviewMarkerItem[] {
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

function offsetRoutePath(points: Array<{ x: number; y: number }>, offsetPx: number) {
  if (!offsetPx || points.length < 2) {
    return points;
  }

  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.hypot(dx, dy) || 1;

    return {
      x: point.x + (-dy / length) * offsetPx,
      y: point.y + (dx / length) * offsetPx,
    };
  });
}

function splitPathAtRatio(points: Array<{ x: number; y: number }>, ratio: number) {
  const safeRatio = Math.min(1, Math.max(0, ratio));
  const fallback = points.length ? [points[0]] : [];

  if (points.length < 2) {
    return { completed: fallback, remaining: fallback };
  }

  const totalLength = points.slice(1).reduce((sum, point, index) => {
    const previous = points[index];
    return sum + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);

  if (!totalLength) {
    return { completed: fallback, remaining: fallback };
  }

  const targetLength = totalLength * safeRatio;
  const completed: Array<{ x: number; y: number }> = [points[0]];
  let travelled = 0;

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const segmentLength = Math.hypot(end.x - start.x, end.y - start.y);

    if (!segmentLength) {
      continue;
    }

    if (travelled + segmentLength >= targetLength) {
      const segmentProgress = (targetLength - travelled) / segmentLength;
      const splitPoint = {
        x: start.x + (end.x - start.x) * segmentProgress,
        y: start.y + (end.y - start.y) * segmentProgress,
      };
      completed.push(splitPoint);
      return {
        completed,
        remaining: [splitPoint, ...points.slice(index)],
      };
    }

    completed.push(end);
    travelled += segmentLength;
  }

  return {
    completed: points,
    remaining: [points[points.length - 1]],
  };
}

function splitPathAtPointIndex(points: Array<{ x: number; y: number }>, pointIndex: number) {
  if (!points.length) {
    return { completed: [], remaining: [] };
  }

  const safeIndex = Math.min(points.length - 1, Math.max(0, Math.round(pointIndex)));
  return {
    completed: points.slice(0, safeIndex + 1),
    remaining: points.slice(safeIndex),
  };
}

function createPathD(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
}

function createRouteWithNormalLocationOverlay(
  googleMaps: GoogleMapsGlobal,
  map: GoogleMap,
  path: GoogleLatLngLiteral[],
  onFocusChange: (focused: boolean) => void,
  arrowScaleConfig = routeWithNormalLocationArrowScale,
  showArrows = true,
  routeState: RoutePreviewVariant = "default",
  dynamicStyle?: DynamicRouteStyle,
  routeOffsetPx = 0,
  progressConfig?: RouteProgressOverlayConfig,
  interactionConfig?: RouteOverlayInteractionConfig,
): MapMarkerHandle {
  /**
   * 这里不用 Google Polyline 的 icons，而是自定义 OverlayView 画 SVG。
   * 原因：我们需要更精准控制路线宽度、白色描边、箭头间距和 hover 尺寸。
   * OverlayView 可以拿到地图投影，把经纬度转换成屏幕像素，再按像素精确摆放箭头。
   */
  class RouteOverlay extends googleMaps.maps.OverlayView {
    private container = document.createElement("div");
    private progressPin = document.createElement("span");
    private progressPopover: HTMLSpanElement | null = null;
    private progressTrigger = document.createElement("button");
    private svgLayer = document.createElement("div");
    private focused = Boolean(interactionConfig?.selected || interactionConfig?.hovered);
    private hovered = Boolean(interactionConfig?.hovered);
    private selected = Boolean(interactionConfig?.selected);

    constructor() {
      super();
      this.container.className = "MapRouteOverlay";
      this.container.style.position = "absolute";
      this.container.style.pointerEvents = "none";
      this.container.style.zIndex = progressConfig?.selected ? "220" : "10";
      this.svgLayer.className = "MapRouteOverlay__svgLayer";
      this.progressPin.className = "MapRouteOverlay__progressPin";
      const progressRing = document.createElement("span");
      progressRing.className = "MapRouteOverlay__progressRing";
      progressRing.setAttribute("aria-hidden", "true");

      const progressIcon = document.createElement("img");
      progressIcon.alt = "";
      progressIcon.className = "MapRouteOverlay__progressIcon";
      progressIcon.src = routeProgressLocationPin;

      this.progressTrigger.className = "MapRouteOverlay__progressTrigger";
      this.progressTrigger.type = "button";
      this.progressTrigger.append(progressIcon);
      this.progressTrigger.setAttribute("aria-expanded", String(Boolean(progressConfig?.selected)));
      this.progressTrigger.setAttribute("aria-label", progressConfig?.info?.title ?? "Progress location");
      this.progressTrigger.addEventListener("pointerdown", this.handleProgressPinPointerDown);
      this.progressTrigger.addEventListener("pointerup", this.handleProgressPinPointerUp);
      this.progressTrigger.addEventListener("click", this.handleProgressPinClick);
      googleMaps.maps.OverlayView.preventMapHitsAndGesturesFrom(this.progressTrigger);
      this.progressPin.classList.toggle("is-selected", Boolean(progressConfig?.selected));
      this.progressPin.append(progressRing, this.progressTrigger);

      if (progressConfig?.info) {
        const popover = document.createElement("span");
        popover.className = "MapRouteOverlay__progressPopover";
        popover.classList.toggle("is-selected", Boolean(progressConfig.selected));
        popover.setAttribute("role", "dialog");
        popover.setAttribute("aria-label", progressConfig.info.title);

        const title = document.createElement("strong");
        title.textContent = progressConfig.info.title;
        popover.append(title);

        progressConfig.info.metrics.forEach((metric) => {
          const row = document.createElement("span");
          row.className = "MapRouteOverlay__progressPopoverRow";

          const label = document.createElement("span");
          label.textContent = metric.label;
          const value = document.createElement("b");
          value.textContent = metric.value;
          row.append(label, value);
          popover.append(row);
        });

        this.progressPopover = popover;
      }
      this.container.append(this.svgLayer, this.progressPin);
    }

    private handleProgressPinPointerDown = (event: PointerEvent) => {
      event.stopPropagation();
    };

    private handleProgressPinPointerUp = (event: PointerEvent) => {
      event.stopPropagation();
      progressConfig?.onSelect?.();
    };

    private handleProgressPinClick = (event: MouseEvent) => {
      event.stopPropagation();
      if (event.detail === 0) {
        progressConfig?.onSelect?.();
      }
    };

    private positionProgressPopover = () => {
      if (!this.progressPopover || !progressConfig?.selected) {
        return;
      }

      const pinRect = this.progressPin.getBoundingClientRect();
      this.progressPopover.style.left = `${pinRect.left + pinRect.width / 2}px`;
      this.progressPopover.style.top = `${pinRect.top + pinRect.height / 2}px`;
    };

    private isRouteHit(event: PointerEvent | MouseEvent) {
      return document
        .elementsFromPoint(event.clientX, event.clientY)
        .some((element) => this.container.contains(element) && element.classList.contains("MapRouteOverlay__hitArea"));
    }

    private handlePointerMove = (event: PointerEvent) => {
      if (this.isRouteHit(event)) {
        if (!this.hovered) {
          this.hovered = true;
          interactionConfig?.onHoverChange?.(true);
        }
        if (!this.focused) {
          this.setFocused(true);
        }
        return;
      }

      if (this.hovered) {
        this.hovered = false;
        interactionConfig?.onHoverChange?.(false);
        if (!this.selected) {
          this.setFocused(false);
        }
      }
    };

    private handleClick = (event: MouseEvent) => {
      if (!this.isRouteHit(event)) {
        return;
      }

      if (interactionConfig?.onSelect) {
        interactionConfig.onSelect();
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

      // fromLatLngToDivPixel 把经纬度转换成当前缩放级别下的屏幕像素坐标。
      // 后面所有路线宽度、箭头间距都按屏幕像素计算，所以缩放时视觉尺寸稳定。
      const projectedPath = path.map((point) => projection.fromLatLngToDivPixel(point));

      // padding 给 SVG 容器留出路线描边和 hover 放大的空间，避免边缘被裁切。
      const padding = (this.focused ? 30 : 24) + Math.abs(routeOffsetPx);
      const minX = Math.min(...projectedPath.map((point) => point.x)) - padding;
      const minY = Math.min(...projectedPath.map((point) => point.y)) - padding;
      const maxX = Math.max(...projectedPath.map((point) => point.x)) + padding;
      const maxY = Math.max(...projectedPath.map((point) => point.y)) + padding;
      const width = Math.max(1, maxX - minX);
      const height = Math.max(1, maxY - minY);
      const localPath = offsetRoutePath(
        projectedPath.map((point) => ({ x: point.x - minX, y: point.y - minY })),
        routeOffsetPx,
      );
      const routeD = createPathD(localPath);
      const progressPaths = progressConfig
        ? progressConfig.pathIndex === undefined
          ? splitPathAtRatio(localPath, progressConfig.ratio)
          : splitPathAtPointIndex(localPath, progressConfig.pathIndex)
        : null;
      const completedRouteD = progressPaths ? createPathD(progressPaths.completed) : "";
      const remainingRouteD = progressPaths ? createPathD(progressPaths.remaining) : routeD;
      const progressPoint = progressPaths?.completed.at(-1);

      // 路线视觉参数：静态态 8px 蓝线 + 12px 白底；hover/selected 后 12px 蓝线 + 16px 白底。
      const routeStroke = this.focused ? 12 : 8;
      const outlineStroke = routeStroke + 4;
      const routeColor = dynamicStyle ? (this.focused ? dynamicStyle.focusedColor : dynamicStyle.color) : resolveRouteStateColor(routeState);
      const arrowColor = dynamicStyle
        ? this.focused
          ? dynamicStyle.arrowFocusedColor
          : dynamicStyle.arrowColor
        : resolveRouteArrowStateColor(routeState);
      const completedArrowColor = resolveRouteArrowStateColor("completed");
      const arrowScale = this.focused ? arrowScaleConfig.focused : arrowScaleConfig.default;
      const completedArrowMarkup =
        showArrows && progressPaths ? this.createArrowMarkup(progressPaths.completed, arrowScale, completedArrowColor) : "";
      const arrowMarkup = showArrows ? this.createArrowMarkup(progressPaths?.remaining ?? localPath, arrowScale, arrowColor) : "";
      const maskId = `routeWithNormalLocationMask-${Math.round(minX)}-${Math.round(minY)}-${this.focused ? "on" : "off"}`;
      const completedMarkup =
        progressConfig && completedRouteD
          ? `<path d="${completedRouteD}" fill="none" stroke="${progressConfig.completedColor}" stroke-width="${routeStroke}" stroke-linecap="round" stroke-linejoin="round" />`
          : "";
      this.container.style.left = `${minX}px`;
      this.container.style.top = `${minY}px`;
      this.container.style.width = `${width}px`;
      this.container.style.height = `${height}px`;
      this.container.style.zIndex = progressConfig?.selected ? "220" : this.focused || this.selected ? "12" : "10";
      this.container.classList.toggle("is-focused", this.focused);
      this.progressPin.style.display = progressConfig && progressPoint ? "grid" : "none";
      if (progressPoint) {
        this.progressPin.style.left = `${progressPoint.x}px`;
        this.progressPin.style.top = `${progressPoint.y}px`;
        if (this.progressPopover) {
          this.progressPopover.style.display = progressConfig?.selected ? "grid" : "none";
          this.progressPopover.classList.toggle("is-selected", Boolean(progressConfig?.selected));
          this.positionProgressPopover();
        }
      }
      this.svgLayer.innerHTML = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- mask 用来让箭头只显示在蓝色路线内部，避免箭头压到白色描边外面。 -->
            <mask id="${maskId}" maskUnits="userSpaceOnUse">
              <rect x="0" y="0" width="${width}" height="${height}" fill="black" />
              <path d="${routeD}" fill="none" stroke="white" stroke-width="${routeStroke}" stroke-linecap="round" stroke-linejoin="round" />
            </mask>
          </defs>
          <path d="${routeD}" fill="none" stroke="#ffffff" stroke-width="${outlineStroke}" stroke-linecap="round" stroke-linejoin="round" />
          ${completedMarkup}
          <path d="${remainingRouteD}" fill="none" stroke="${routeColor}" stroke-width="${routeStroke}" stroke-linecap="round" stroke-linejoin="round" />
          <g mask="url(#${maskId})">
            ${completedArrowMarkup}
            ${arrowMarkup}
          </g>
          <path class="MapRouteOverlay__hitArea" d="${routeD}" fill="none" stroke="transparent" stroke-width="${Math.max(outlineStroke, 24)}" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: stroke; cursor: pointer;" />
        </svg>
  `;
    }

    /**
     * 按屏幕像素生成箭头。
     * nextArrowDistance 从 22px 开始，之后每 28px 放一个箭头。
     * rotation 使用当前线段 dx/dy 算局部切线角度，所以转弯处箭头会跟随路线方向。
     */
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

    // hover / selected 切换后重新 render，路线宽度和箭头大小会立即更新。
    private setFocused(focused: boolean) {
      this.focused = focused;
      onFocusChange(focused);
      this.render();
    }

    onAdd() {
      const panes = this.getPanes();
      if (!panes) {
        return;
      }

      document.addEventListener("pointermove", this.handlePointerMove);
      document.addEventListener("click", this.handleClick);
      window.addEventListener("resize", this.positionProgressPopover);
      window.addEventListener("scroll", this.positionProgressPopover, true);
      panes.overlayMouseTarget.appendChild(this.container);
      if (this.progressPopover) {
        document.body.appendChild(this.progressPopover);
        this.positionProgressPopover();
      }
    }

    draw() {
      this.render();
    }

    onRemove() {
      document.removeEventListener("pointermove", this.handlePointerMove);
      document.removeEventListener("click", this.handleClick);
      window.removeEventListener("resize", this.positionProgressPopover);
      window.removeEventListener("scroll", this.positionProgressPopover, true);
      this.progressTrigger.removeEventListener("pointerdown", this.handleProgressPinPointerDown);
      this.progressTrigger.removeEventListener("pointerup", this.handleProgressPinPointerUp);
      this.progressTrigger.removeEventListener("click", this.handleProgressPinClick);
      this.progressPopover?.remove();
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
  anchor: MapMarkerAnchor = "bottom",
  zIndex?: number,
): MapMarkerHandle {
  /**
   * OverlayView 版本的 marker。
   * 当没有可用 Map ID 或 Advanced Marker 不适用时，用这个兜底。
   * 它通过投影把经纬度转换成像素，然后把普通 DOM 节点定位到地图上。
   */
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
      const anchorTransform =
        anchor === "center"
          ? "translate(-50%, -50%)"
          : anchor === "pin-tip"
            ? "translate(-50%, -51px)"
            : anchor === "tooltip-below"
              ? "translate(-50%, 12px)"
              : "translate(-50%, -100%)";
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

/**
 * Advanced Marker 版本的 marker。
 * 这是当前项目主要使用的点组件渲染方式，可以直接把自定义 DOM 放进 Google Maps。
 * anchor 决定经纬度落在元素的哪个位置：bottom 用于普通 pin，center 用于圆点/聚合点。
 */
async function createAdvancedMarker(
  googleMaps: GoogleMapsGlobal,
  map: GoogleMap,
  position: GoogleLatLng,
  element: HTMLElement,
  anchor: MapMarkerAnchor = "bottom",
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
      : anchor === "pin-tip"
        ? {
            anchorLeft: "-50%",
            anchorTop: "-51px",
          }
        : anchor === "tooltip-below"
          ? {
              anchorLeft: "-50%",
              anchorTop: "12px",
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

  if (element.classList.contains("MapMarker--interactive")) {
    (["mouseenter", "mouseleave", "focus", "blur"] as const).forEach((eventName) => {
      marker.addEventListener(eventName, () => {
        element.dispatchEvent(new Event(eventName));
      });
    });
  }

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
  hideDynamicRouteMarkers = false,
  mapTheme = "light",
  hidePreviewContent = false,
  previewDistribution = "local",
  previewFeature,
  previewDimmedRegionIds,
  previewFitRegionId,
  previewFlashRegionId,
  previewRegionInteraction = "single",
  previewRegionIds,
  previewRegionMetrics,
  previewRegionState = "default",
  previewMarkerFamily = "normal",
  previewMarkerGroups,
  previewMarkerTooltip,
  previewMarkers,
  previewProgressInfo,
  previewProgressSelected = false,
  previewRegionColors,
  previewRegionShapes,
  previewRegionStyles,
  previewRegionTooltip,
  previewHoveredRouteId,
  previewRouteFamily,
  previewRouteGroups,
  previewSelectedRouteId,
  onPreviewProgressClearSelection,
  onPreviewProgressSelect,
  onPreviewRouteClearSelection,
  onPreviewRouteHover,
  onPreviewRouteSelect,
  onPreviewMarkerHover,
  onPreviewRegionClick,
  onPreviewRegionHover,
  previewRouteState = "default",
  previewRoutes,
}: MapCanvasProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const mapConfigKeyRef = useRef("");
  const polylineRef = useRef<GooglePolyline | null>(null);
  const polygonRef = useRef<GooglePolygon | null>(null);
  const regionDataRef = useRef<GoogleDataLayer | null>(null);
  const regionOutlineDataRef = useRef<GoogleDataLayer | null>(null);
  const regionListenersRef = useRef<GoogleMapsListener[]>([]);
  const regionLabelRef = useRef<MapMarkerHandle | null>(null);
  const markerTooltipRef = useRef<MapMarkerHandle | null>(null);
  const previewMarkerTooltipCallbackRef = useRef(previewMarkerTooltip);
  const previewMarkerHoverCallbackRef = useRef(onPreviewMarkerHover);
  const lastRegionFitKeyRef = useRef("");
  const dynamicRouteRef = useRef<DynamicRouteLayer>(createEmptyDynamicRouteLayer());
  const manualRoutePreviewRef = useRef<DynamicRouteLayer>(createEmptyDynamicRouteLayer());
  const suppressNextPreviewMapClickRef = useRef(false);
  const markersRef = useRef<MapMarkerHandle[]>([]);
  const routePreviewsRef = useRef<MapMarkerHandle[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "missing-key" | "error">("idle");
  const [routeStatus, setRouteStatus] = useState<"idle" | "loading" | "error" | "api-blocked">("idle");
  const [previewZoom, setPreviewZoom] = useState(controls.zoom);
  const [debouncedRoutes, setDebouncedRoutes] = useState(controls.routes);
  const preset = mapPresets[mapCategory][lang];
  const activeMapId = preset.mapId;
  const mapConfigKey = `${lang}:${mapCategory}:${preset.mapTypeId}:${activeMapId}:${mapTheme}`;
  const routeColor = mapCategory === "visualization" ? "#475569" : "#2A3EF4";
  const markerLabels = useMemo(() => [t("map.warehouse"), t("map.hub"), t("map.destination")], [t]);
  const hasCumulativePreviewGroup =
    previewMarkerGroups?.some((group) => group.family === "cumulative" && group.distribution === "chinaCluster") ?? false;
  const hasRegionPreview = Boolean(previewRegionIds?.length || previewRegionShapes?.length);
  const isCumulativePreview =
    (previewMarkerFamily === "cumulative" && previewDistribution === "chinaCluster") || hasCumulativePreviewGroup;
  const renderPreviewZoom = isCumulativePreview ? previewZoom : undefined;
  const dynamicRoutes = useMemo(() => {
    const routes = debouncedRoutes?.length
      ? debouncedRoutes
      : [
          {
            colorId: "route1" as const,
            id: "route-1",
            name: "Route 1",
            nodes: controls.routeNodes,
            visible: true,
          },
        ];
    return routes.map((route) => ({
      ...route,
      nodes: route.nodes.map((node) => ({ ...node, value: normalizeRouteNodeValue(node.value) })),
    }));
  }, [controls.routeNodes, debouncedRoutes]);
  const canRenderDynamicRoute =
    Boolean(dynamicRouteFamily) &&
    dynamicRoutes.some(
      (route) =>
        route.visible &&
        Boolean(route.nodes.find((node) => node.id === "start")?.value) &&
        Boolean(route.nodes.find((node) => node.id === "end")?.value),
    );

  previewMarkerTooltipCallbackRef.current = previewMarkerTooltip;
  previewMarkerHoverCallbackRef.current = onPreviewMarkerHover;

  // 开发环境下输出当前实际使用的 Map ID，方便排查云端地图样式是否生效。
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

  // 路线输入做 450ms 防抖，避免用户每输入一个字就请求一次 Routes API。
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedRoutes(controls.routes);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [controls.routes]);

  /**
   * 初始化 Google Map。
   * 当语言、地图类型或 Map ID 改变时，会销毁旧地图并重新创建，避免 Google Maps 缓存旧配置。
   */
  useEffect(() => {
    let cancelled = false;

    setStatus("loading");
    loadGoogleMaps(lang)
      .then(async (googleMaps) => {
        if (cancelled || !rootRef.current) {
          return;
        }

        const { ColorScheme } = await googleMaps.maps.importLibrary("core");

        if (cancelled || !rootRef.current) {
          return;
        }

        if (mapRef.current && mapConfigKeyRef.current !== mapConfigKey) {
          polylineRef.current?.setMap(null);
          polygonRef.current?.setMap(null);
          regionDataRef.current?.setMap(null);
          regionListenersRef.current.forEach((listener) => listener?.remove?.());
          regionLabelRef.current?.remove();
          dynamicRouteRef.current.outline?.setMap(null);
          dynamicRouteRef.current.route?.setMap(null);
          dynamicRouteRef.current.listeners.forEach((listener) => listener?.remove?.());
          markersRef.current.forEach((marker) => marker.remove());
          routePreviewsRef.current.forEach((route) => route.remove());
          polylineRef.current = null;
          polygonRef.current = null;
          regionDataRef.current = null;
          regionListenersRef.current = [];
          regionLabelRef.current = null;
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
            colorScheme: mapTheme === "dark" ? ColorScheme.DARK : ColorScheme.LIGHT,
            disableDefaultUI: !controls.showMapUi,
            gestureHandling: compact ? "cooperative" : "greedy",
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
    mapTheme,
    preset.mapTypeId,
    previewDistribution,
  ]);

  // 监听地图缩放，用于 Cumulative location：缩小时显示聚合，放大后逐步拆成更小聚合或普通点。
  useEffect(() => {
    if (!mapRef.current || status !== "ready") {
      return;
    }

    setPreviewZoom(mapRef.current.getZoom() ?? controls.zoom);
    const listener = mapRef.current.addListener("zoom_changed", () => {
      setPreviewZoom(mapRef.current?.getZoom() ?? controls.zoom);
    });

    return () => listener?.remove?.();
  }, [controls.zoom, status]);

  // 当预览类型或 zoom 改变时，把地图中心和缩放恢复到当前组件需要的位置。
  useEffect(() => {
    if (!mapRef.current || status !== "ready") {
      return;
    }

    mapRef.current.setCenter(resolvePreviewCenter(previewDistribution));
    mapRef.current.setZoom(controls.zoom);
  }, [controls.zoom, previewDistribution, previewFeature, previewMarkerFamily, status]);

  /**
   * 主渲染流程：根据当前组件类型决定画什么。
   * - point/container：渲染 marker。
   * - line：渲染路线预览。
   * - area/container：渲染面 Polygon。
   * 每次重新渲染前都会清空旧 marker / route，避免地图上残留旧组件。
   */
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

    const hasPreviewMarkerGroups = Boolean(previewMarkerGroups?.length);
    const hasPreviewRouteGroups = Boolean(previewRouteGroups?.length);
    const shouldShowMarkers =
      !hidePreviewContent &&
      (!previewFeature || previewFeature === "point" || previewFeature === "container" || (previewFeature === "area" && hasPreviewMarkerGroups)) &&
      (hasPreviewMarkerGroups || previewMarkers !== undefined || !hasPreviewRouteGroups);
    const shouldShowRoutePreview =
      !canRenderDynamicRoute &&
      !hidePreviewContent &&
      (previewFeature === "line" || previewFeature === "container") &&
      (hasPreviewRouteGroups || Boolean(previewRouteFamily && previewRoutes?.length));
    const shouldShowLine =
      (!previewFeature || previewFeature === "container") &&
      !hidePreviewContent &&
      !shouldShowRoutePreview &&
      !canRenderDynamicRoute;
    const shouldShowArea = !hidePreviewContent && !hasRegionPreview && (previewFeature === "area" || previewFeature === "container");

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
      fillColor: mapCategory === "visualization" ? "#475569" : "#2A3EF4",
      fillOpacity: mapCategory === "visualization" ? 0.16 : 0.18,
      paths: areaPositions,
      strokeColor: mapCategory === "visualization" ? "#334155" : "#2A3EF4",
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
      if (!shouldShowRoutePreview) {
        return;
      }

      const routeGroups: PreviewRouteGroup[] = previewRouteGroups?.length
        ? previewRouteGroups
        : previewRouteFamily && previewRoutes?.length
          ? [{ family: previewRouteFamily, routes: previewRoutes, state: previewRouteState }]
          : [];

      if (!routeGroups.length) {
        return;
      }

      const layer = manualRoutePreviewRef.current;
      const overlayMarkerHandles: MapMarkerHandle[] = [];
      const routeHandles: MapMarkerHandle[] = [];

      for (const group of routeGroups) {
        const selectedRoute = group.routes.find((route) => route.id === (group.state ?? previewRouteState)) ?? group.routes[0];

        if (
          group.family === "normalNoArrow" ||
          group.family === "normalHasArrow" ||
          group.family === "routeWithNormalLocation" ||
          group.family === "routeWithInformatedLocation" ||
          group.family === "routeWithProgress"
        ) {
          const path = group.path ?? routeWithNormalLocationPreviewPath;
          const isSelectedPreviewRoute = Boolean(group.id && group.id === previewSelectedRouteId);
          const canHoverPreviewRoute = !previewSelectedRouteId || isSelectedPreviewRoute;
          const isHoveredPreviewRoute = Boolean(
            canHoverPreviewRoute && group.id && group.id === previewHoveredRouteId,
          );
          const isDimmedPreviewRoute = Boolean(
            group.id && previewSelectedRouteId && group.id !== previewSelectedRouteId,
          );
          const endpointVariant: MarkerPreviewVariant = isDimmedPreviewRoute ? "muted" : "default";
          const endpointMarkerElements =
            group.family === "routeWithNormalLocation"
              ? [
                  createPointMarkerElement({ family: "normal", label: markerLabels[0], style: "dot", variant: endpointVariant }),
                  createPointMarkerElement({ family: "normal", label: markerLabels[2], style: "dot", variant: endpointVariant }),
                ]
              : group.family === "routeWithInformatedLocation"
                ? [
                    createRouteLocationPinElement(markerLabels[0], isDimmedPreviewRoute),
                    createRouteLocationPinElement(markerLabels[2], isDimmedPreviewRoute),
                  ]
              : group.family === "routeWithProgress"
                ? [
                    createPointMarkerElement({ family: "normal", label: markerLabels[0], style: "dot", variant: "default" }),
                    createPointMarkerElement({ family: "normal", label: markerLabels[2], style: "dot", variant: "default" }),
                  ]
              : [];
          const stopMarkerPositions = isSelectedPreviewRoute
            ? (group.stopPositions ?? [])
                .map((position, index) => ({ index, position }))
                .slice(1, -1)
                .filter(({ index }) => group.family !== "routeWithProgress" || index !== group.progressPointIndex)
                .map(({ position }) => position)
            : [];
          const stopMarkerElements = stopMarkerPositions.map((_, index) =>
            createPointMarkerElement({
              family: "normal",
              label: `Stop ${index + 1}`,
              style: "dot",
              variant: "default",
            }),
          );
          const setMarkerVariant = (focused: boolean) => {
            if (isDimmedPreviewRoute) {
              return;
            }

            endpointMarkerElements.forEach((markerElement) => {
              if (markerElement.classList.contains("MapMarker--route-location-pin")) {
                markerElement.classList.toggle("is-selected", focused);
              } else {
                markerElement.classList.toggle("MapMarker--point-default", !focused);
                markerElement.classList.toggle("MapMarker--point-selected", focused);
              }
            });
          };
          setMarkerVariant(isSelectedPreviewRoute || isHoveredPreviewRoute);
          const routeOverlay = createRouteWithNormalLocationOverlay(
            googleMaps,
            map,
            path,
            setMarkerVariant,
            routeWithNormalLocationArrowScale,
            group.family !== "normalNoArrow",
            group.family === "routeWithProgress" ? "default" : group.state ?? previewRouteState,
            group.colorId
              ? isDimmedPreviewRoute
                ? disabledDynamicRouteStyles[group.colorId]
                : dynamicRouteStyles[group.colorId]
              : undefined,
            0,
            group.family === "routeWithProgress"
              ? {
                  completedColor: resolveRouteStateColor("completed"),
                  info: previewProgressInfo,
                  onSelect: onPreviewProgressSelect
                    ? () => {
                        suppressNextPreviewMapClickRef.current = true;
                        window.setTimeout(() => {
                          suppressNextPreviewMapClickRef.current = false;
                        }, 400);
                        onPreviewProgressSelect();
                      }
                    : undefined,
                  pathIndex: group.progressPointIndex,
                  ratio: routeWithProgressRatio,
                  selected: previewProgressSelected,
                }
              : undefined,
            group.id
              ? {
                  hovered: isHoveredPreviewRoute,
                  onHoverChange: onPreviewRouteHover && canHoverPreviewRoute
                    ? (hovered) => onPreviewRouteHover(hovered ? (group.id as string) : null)
                    : undefined,
                  onSelect: onPreviewRouteSelect
                    ? () => {
                        suppressNextPreviewMapClickRef.current = true;
                        window.setTimeout(() => {
                          suppressNextPreviewMapClickRef.current = false;
                        }, 50);
                        onPreviewRouteSelect(group.id as string);
                      }
                    : undefined,
                  selected: isSelectedPreviewRoute,
                }
              : undefined,
          );
          layer.overlays.push(routeOverlay);

          const routeMarkerPositions = [path[0], path[path.length - 1], ...stopMarkerPositions];
          const routeMarkerElements = [...endpointMarkerElements, ...stopMarkerElements];
          const markerHandles = await Promise.all(
            (group.family === "routeWithNormalLocation" ||
            group.family === "routeWithInformatedLocation" ||
            group.family === "routeWithProgress"
              ? routeMarkerPositions
              : []
            ).map((position, index) => {
              const anchor = group.family === "routeWithInformatedLocation" && index < 2 ? "pin-tip" : "center";
              const zIndex = group.family === "routeWithProgress" && index === 1 ? 130 : 100;
              return activeMapId
                ? createAdvancedMarker(googleMaps, map, position, routeMarkerElements[index], anchor, zIndex)
                : Promise.resolve(createOverlayMarker(googleMaps, map, position, routeMarkerElements[index], anchor, zIndex));
            }),
          );
          overlayMarkerHandles.push(...markerHandles);
          continue;
        }

        const routeElement = createRouteElement(group.family, selectedRoute.id, selectedRoute.label);
        routeHandles.push(
          await (activeMapId
            ? createAdvancedMarker(googleMaps, map, routePreviewPosition, routeElement, "center")
            : Promise.resolve(createOverlayMarker(googleMaps, map, routePreviewPosition, routeElement, "center"))),
        );
      }

      if (cancelled) {
        routeHandles.forEach((route) => route.remove());
        overlayMarkerHandles.forEach((marker) => marker.remove());
        clearDynamicRouteLayer(layer);
        return;
      }

      layer.markers = overlayMarkerHandles;
      routePreviewsRef.current = routeHandles;
      const configuredPaths = routeGroups.flatMap((group) => group.path ?? []);
      if (configuredPaths.length > 1) {
        map.fitBounds(getPathBounds(configuredPaths), 56);
      } else if (
        !previewRouteGroups?.length &&
        routeGroups.some(
          (group) =>
            group.family === "normalNoArrow" ||
            group.family === "normalHasArrow" ||
            group.family === "routeWithNormalLocation" ||
            group.family === "routeWithInformatedLocation" ||
            group.family === "routeWithProgress",
        )
      ) {
        map.fitBounds(getPathBounds(routeWithNormalLocationPreviewPath), 72);
      }
    };

    // 渲染点组件预览。组件手册传 previewMarkers，地图浏览模式则使用默认 routePositions。
    const renderMarkers = async () => {
      if (!shouldShowMarkers) {
        return;
      }

      const markerGroups: PreviewMarkerGroup[] = previewMarkerGroups?.length
        ? previewMarkerGroups
        : previewMarkers?.length
          ? [{ distribution: previewDistribution, family: previewMarkerFamily, markers: previewMarkers }]
          : [];

      if (markerGroups.length) {
        const markerItems: PreviewMarkerItem[] =
          markerGroups.flatMap((group) =>
            group.family === "cumulative" && group.distribution === "chinaCluster"
              ? markerGroups.length === 1
                ? resolveHierarchicalCumulativePreviewItems(renderPreviewZoom ?? controls.zoom, group.markers)
                : resolveCombinedCumulativePreviewItems(renderPreviewZoom ?? controls.zoom, group.markers)
              : group.markers.map((marker, index) => {
                  const groupDistribution = group.distribution ?? previewDistribution;
                  const previewPositions = resolvePreviewPositions(groupDistribution);
                  const basePosition = group.positions?.[index % group.positions.length] ?? previewPositions[index % previewPositions.length];
                  return {
                    family: group.family,
                    id: group.ids?.[index] ?? marker.label,
                    marker,
                    position: offsetGroupedPreviewPosition(
                      basePosition,
                      group.family,
                      index,
                      markerGroups.length,
                      groupDistribution,
                    ),
                  };
                }),
          );

        const markerHandles = await Promise.all(
          markerItems.map(async ({ family, id, marker, position }) => {
            const markerElement = createPointMarkerElement({
              count: marker.count,
              customContent: marker.customContent,
              family,
              label: marker.label,
              style: controls.markerStyle,
              variant: marker.id,
            });
            const markerId = id ?? marker.label;
            const removeMarkerTooltip = () => {
              markerTooltipRef.current?.remove();
              markerTooltipRef.current = null;
            };
            const showMarkerTooltip = async () => {
              if (!markerId || !previewMarkerTooltipCallbackRef.current) return;
              const tooltipData = previewMarkerTooltipCallbackRef.current(markerId);
              if (!tooltipData) return;
              removeMarkerTooltip();
              const tooltipElement = createPreviewTooltipElement(tooltipData);
              const tooltipMarker = await createAdvancedMarker(
                googleMaps,
                map,
                position,
                tooltipElement,
                tooltipData.placement === "below" ? "tooltip-below" : "tooltip-above",
                240,
              );
              if (cancelled) {
                tooltipMarker.remove();
                return;
              }
              clampPreviewTooltipToMap(map, tooltipElement);
              markerTooltipRef.current = tooltipMarker;
            };
            if (markerId && (onPreviewMarkerHover || previewMarkerTooltip)) {
              markerElement.addEventListener("mouseenter", () => {
                markerElement.classList.add("is-preview-hovered");
                previewMarkerHoverCallbackRef.current?.(markerId);
                void showMarkerTooltip();
              });
              markerElement.addEventListener("mouseleave", () => {
                markerElement.classList.remove("is-preview-hovered");
                previewMarkerHoverCallbackRef.current?.(null);
                removeMarkerTooltip();
              });
              markerElement.addEventListener("focus", () => {
                markerElement.classList.add("is-preview-hovered");
                previewMarkerHoverCallbackRef.current?.(markerId);
                void showMarkerTooltip();
              });
              markerElement.addEventListener("blur", () => {
                markerElement.classList.remove("is-preview-hovered");
                previewMarkerHoverCallbackRef.current?.(null);
                removeMarkerTooltip();
              });
            }
            if (family === "cumulative" && marker.count) {
              markerElement.addEventListener("click", () => {
                map.setZoom(Math.min((map.getZoom() ?? renderPreviewZoom ?? controls.zoom) + 1, 16));
              });
            }

            const anchor = family === "custom" && marker.customContent === "warehouse" ? "pin-tip" : "center";
            return activeMapId
              ? createAdvancedMarker(googleMaps, map, position, markerElement, anchor)
              : createOverlayMarker(googleMaps, map, position, markerElement, anchor);
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
          const markerElement = createPointMarkerElement({
            label: markerLabels[index],
            style: controls.markerStyle,
          });
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
      markerTooltipRef.current?.remove();
      markerTooltipRef.current = null;
      previewMarkerHoverCallbackRef.current?.(null);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      routePreviewsRef.current.forEach((route) => route.remove());
      routePreviewsRef.current = [];
      clearDynamicRouteLayer(manualRoutePreviewRef.current);
    };
  }, [
    controls.markerStyle,
    controls.showMapUi,
    hidePreviewContent,
    hasRegionPreview,
    canRenderDynamicRoute,
    mapCategory,
    markerLabels,
    activeMapId,
    preset.mapTypeId,
    previewDistribution,
    previewFeature,
    previewMarkerFamily,
    previewMarkerGroups,
    previewMarkers,
    previewProgressInfo,
    previewProgressSelected,
    previewHoveredRouteId,
    previewRouteFamily,
    previewRouteGroups,
    previewSelectedRouteId,
    onPreviewProgressSelect,
    onPreviewRouteHover,
    onPreviewRouteSelect,
    previewRouteState,
    previewRoutes,
    renderPreviewZoom,
    routeColor,
    status,
  ]);

  useEffect(() => {
    if (
      !mapRef.current ||
      status !== "ready" ||
      (!onPreviewRouteClearSelection && !onPreviewProgressClearSelection)
    ) {
      return;
    }

    const listener = mapRef.current.addListener("click", () => {
      if (suppressNextPreviewMapClickRef.current) {
        return;
      }
      onPreviewRouteClearSelection?.();
      onPreviewProgressClearSelection?.();
    });

    return () => listener?.remove?.();
  }, [onPreviewProgressClearSelection, onPreviewRouteClearSelection, status]);

  useEffect(() => {
    if (!window.google?.maps || !mapRef.current || status !== "ready") {
      return;
    }

    const googleMaps = window.google;
    const map = mapRef.current;
    let cancelled = false;
    let hoveredRegionId: string | null = null;
    let selectedRegionId: string | null = null;
    let labelRegionId: string | null = null;
    let suppressNextMapClick = false;
    let regionById = new Map<string, RegionManifestEntry>();

    const clearRegionLayer = () => {
      regionListenersRef.current.forEach((listener) => listener?.remove?.());
      regionListenersRef.current = [];
      regionLabelRef.current?.remove();
      regionLabelRef.current = null;

      if (regionDataRef.current) {
        const dataLayer = regionDataRef.current;
        const features: GoogleDataFeature[] = [];
        dataLayer.forEach((feature) => features.push(feature));
        features.forEach((feature) => dataLayer.remove(feature));
        dataLayer.setMap(null);
        regionDataRef.current = null;
      }
      if (regionOutlineDataRef.current) {
        const outlineLayer = regionOutlineDataRef.current;
        const outlineFeatures: GoogleDataFeature[] = [];
        outlineLayer.forEach((feature) => outlineFeatures.push(feature));
        outlineFeatures.forEach((feature) => outlineLayer.remove(feature));
        outlineLayer.setMap(null);
        regionOutlineDataRef.current = null;
      }
    };

    if (
      (!previewRegionIds?.length && !previewRegionShapes?.length) ||
      hidePreviewContent ||
      (previewFeature !== "area" && previewFeature !== "container")
    ) {
      clearRegionLayer();
      return;
    }

    const resolveFeatureRegionId = (feature: GoogleDataFeature) => String(feature.getProperty("mapLabId") ?? "");
    const inlineRegionColors = new Map(previewRegionShapes?.map((region) => [region.id, region.color]) ?? []);
    const dimmedRegionIds = new Set(previewDimmedRegionIds ?? []);
    const styleForFeature = (feature: GoogleDataFeature) => {
      const regionId = resolveFeatureRegionId(feature);
      const regionColor = previewRegionColors?.[regionId] ?? inlineRegionColors.get(regionId);
      const regionStyle = previewRegionStyles?.[regionId];
      const applyRegionColor = (style: {
        fillColor?: string;
        fillOpacity: number;
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight: number;
      }) =>
        regionStyle
          ? Object.fromEntries(
              Object.entries({ ...style, ...regionStyle }).filter(([, value]) => value !== undefined),
            )
          : regionColor
          ? {
              ...style,
              fillColor: regionColor,
              strokeColor: regionColor,
            }
          : style;
      const activeRegionId = selectedRegionId ?? hoveredRegionId;
      if (previewRegionTooltip) {
        const isEmphasized = regionId === hoveredRegionId || (dimmedRegionIds.size > 0 && !dimmedRegionIds.has(regionId));
        const componentStyle = dimmedRegionIds.has(regionId)
          ? regionDataStyles.disabled
          : isEmphasized || regionId === previewFlashRegionId
            ? regionDataStyles.selected
            : regionDataStyles.default;
        const tooltipData = previewRegionTooltip(regionId);
        return {
          ...applyRegionColor(componentStyle),
          cursor: tooltipData?.clickable ? "pointer" : "default",
          strokeOpacity: 1,
          zIndex: isEmphasized || regionId === previewFlashRegionId ? 3 : 2,
        };
      }
      if (previewRegionInteraction === "multi") {
        const isPressed = Boolean(activeRegionId && regionId !== activeRegionId);
        return applyRegionColor(isPressed ? multiRegionDataStyles.pressed : multiRegionDataStyles.default);
      }
      if (regionId && (previewRegionState === "selected" || regionId === activeRegionId)) {
        return applyRegionColor(regionDataStyles.selected);
      }
      return applyRegionColor(regionDataStyles.default);
    };
    const refreshStyles = () => {
      regionDataRef.current?.setStyle(styleForFeature);
    };
    const removeLabel = () => {
      labelRegionId = null;
      regionLabelRef.current?.remove();
      regionLabelRef.current = null;
    };
    const renderLabel = async (regionId: string | null, anchorPosition?: GoogleLatLng) => {
      removeLabel();
      if (!regionId) {
        return;
      }

      labelRegionId = regionId;

      const region = regionById.get(regionId);
      if (!region) {
        return;
      }

      const tooltipData = previewRegionTooltip?.(regionId);
      const resolvedTooltipData = tooltipData
        ? { ...tooltipData, title: tooltipData.title || (lang === "zh" ? region.nameZh : region.nameEn) }
        : null;
      const labelElement = resolvedTooltipData
        ? createPreviewTooltipElement(resolvedTooltipData)
        : createRegionLabelElement(region, previewRegionMetrics?.[regionId]);
      const labelMarker = await createAdvancedMarker(
        googleMaps,
        map,
        anchorPosition ?? region.center,
        labelElement,
        resolvedTooltipData?.placement === "below" ? "tooltip-below" : "tooltip-above",
        220,
      );
      if (cancelled || labelRegionId !== regionId) {
        labelMarker.remove();
        return;
      }
      clampPreviewTooltipToMap(map, labelElement);
      regionLabelRef.current = labelMarker;
    };
    const selectRegion = (regionId: string | null, anchorPosition?: GoogleLatLng) => {
      hoveredRegionId = null;
      selectedRegionId = regionId;
      refreshStyles();
      void renderLabel(regionId, anchorPosition);
    };

    clearRegionLayer();
    const dataLayer = new googleMaps.maps.Data({ map });
    regionDataRef.current = dataLayer;

    const inlineRegions: RegionManifestEntry[] = (previewRegionShapes ?? []).map((region) => {
      const latitudes = region.path.map((point) => point.lat);
      const longitudes = region.path.map((point) => point.lng);
      const bbox = {
        east: Math.max(...longitudes),
        north: Math.max(...latitudes),
        south: Math.min(...latitudes),
        west: Math.min(...longitudes),
      };
      return {
        bbox,
        center: {
          lat: (bbox.north + bbox.south) / 2,
          lng: (bbox.east + bbox.west) / 2,
        },
        countryCode: "CN",
        filePath: "",
        id: region.id,
        level: "operational-area",
        nameEn: region.name,
        nameZh: region.name,
        source: "Map Lab demo data",
      };
    });
    const regionSource = inlineRegions.length
      ? Promise.resolve({ generatedAt: "", regions: inlineRegions } satisfies RegionManifest)
      : loadRegionManifest();

    regionSource
      .then(async (manifest) => {
        if (cancelled) {
          return;
        }

        const regionIds = new Set(previewRegionIds ?? inlineRegions.map((region) => region.id));
        const regions = manifest.regions.filter((region) => regionIds.has(region.id));
        regionById = new Map(regions.map((region) => [region.id, region]));

        const geoJsonCollections = await Promise.all(
          regions.map(async (region) => {
            const inlineShape = previewRegionShapes?.find((shape) => shape.id === region.id);
            return inlineShape
              ? {
                  type: "FeatureCollection" as const,
                  features: [
                    {
                      type: "Feature",
                      properties: { mapLabId: region.id },
                      geometry: {
                        type: "Polygon",
                        coordinates: [[...inlineShape.path, inlineShape.path[0]].map((point) => [point.lng, point.lat])],
                      },
                    },
                  ],
                }
              : loadRegionGeoJson(region);
          }),
        );
        if (cancelled) return;
        geoJsonCollections.forEach((geoJson) => dataLayer.addGeoJson(geoJson));

        refreshStyles();
        if (previewRegionState === "selected" && regions[0]) {
          selectedRegionId = regions[0].id;
          void renderLabel(selectedRegionId);
        }

        regionListenersRef.current = previewRegionTooltip
          ? [
              dataLayer.addListener("mouseover", (event) => {
                hoveredRegionId = resolveFeatureRegionId(event.feature);
                onPreviewRegionHover?.(hoveredRegionId);
                refreshStyles();
                void renderLabel(hoveredRegionId, event.latLng);
              }),
              dataLayer.addListener("mouseout", () => {
                hoveredRegionId = null;
                onPreviewRegionHover?.(null);
                removeLabel();
                refreshStyles();
              }),
              dataLayer.addListener("click", (event) => {
                const regionId = resolveFeatureRegionId(event.feature);
                if (previewRegionTooltip(regionId)?.clickable) {
                  void renderLabel(regionId, event.latLng);
                  onPreviewRegionClick?.(regionId);
                }
              }),
            ]
          : [
              dataLayer.addListener("mouseover", (event) => {
                if (selectedRegionId) return;
                hoveredRegionId = resolveFeatureRegionId(event.feature);
                refreshStyles();
              }),
              dataLayer.addListener("mouseout", (event) => {
                const regionId = resolveFeatureRegionId(event.feature);
                if (regionId !== selectedRegionId) {
                  hoveredRegionId = null;
                  refreshStyles();
                }
              }),
              dataLayer.addListener("click", (event) => {
                suppressNextMapClick = true;
                selectRegion(resolveFeatureRegionId(event.feature), event.latLng);
                window.setTimeout(() => {
                  suppressNextMapClick = false;
                }, 50);
              }),
              map.addListener("click", () => {
                if (suppressNextMapClick) return;
                selectRegion(null);
              }),
            ];

        const fitRegion = previewFitRegionId
          ? manifest.regions.find((region) => region.id === previewFitRegionId)
          : undefined;
        if (previewRegionTooltip && fitRegion) {
          const outlineLayer = new googleMaps.maps.Data({ map });
          regionOutlineDataRef.current = outlineLayer;
          const outlineGeoJson = await loadRegionGeoJson(fitRegion);
          if (!cancelled) {
            outlineLayer.addGeoJson(outlineGeoJson);
            outlineLayer.setStyle(() => ({
              clickable: false,
              fillOpacity: 0,
              strokeColor: regionDataStyles.default.strokeColor,
              strokeOpacity: 1,
              strokeWeight: regionDataStyles.default.strokeWeight,
              zIndex: 4,
            }));
          }
        }

        const bounds = regions.reduce(
          (currentBounds, region) => ({
            east: Math.max(currentBounds.east, region.bbox.east),
            north: Math.max(currentBounds.north, region.bbox.north),
            south: Math.min(currentBounds.south, region.bbox.south),
            west: Math.min(currentBounds.west, region.bbox.west),
          }),
          { east: -Infinity, north: -Infinity, south: Infinity, west: Infinity },
        );
        const fitKey = previewFitRegionId ?? [...regionIds].sort().join("|");
        const targetBounds = fitRegion?.bbox ?? bounds;
        if (Number.isFinite(targetBounds.east) && lastRegionFitKeyRef.current !== fitKey) {
          lastRegionFitKeyRef.current = fitKey;
          map.fitBounds(targetBounds, 64);
        }
      })
      .catch((error) => {
        console.error("[Map Lab] Failed to render regions", error);
      });

    return () => {
      cancelled = true;
      onPreviewRegionHover?.(null);
      clearRegionLayer();
    };
  }, [
    hidePreviewContent,
    onPreviewRegionClick,
    onPreviewRegionHover,
    previewFeature,
    previewDimmedRegionIds,
    previewFitRegionId,
    previewFlashRegionId,
    previewRegionColors,
    previewRegionInteraction,
    previewRegionIds,
    previewRegionMetrics,
    previewRegionShapes,
    previewRegionState,
    previewRegionStyles,
    previewRegionTooltip,
    status,
  ]);

  /**
   * 地图浏览模式里的“输入起点/中途点/终点生成路线”。
   * canRenderDynamicRoute 为 true 时，会请求 Google Routes API 得到真实道路 path，
   * 然后复用和组件手册一致的路线 Overlay 样式画出来。
   */
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
    const shouldShowArrows = dynamicRouteFamily !== "normalNoArrow";
    const renderableRoutes = dynamicRoutes.filter(
      (route) =>
        route.visible &&
        Boolean(route.nodes.find((node) => node.id === "start")?.value) &&
        Boolean(route.nodes.find((node) => node.id === "end")?.value),
    );

    // 这些路线类型使用自定义 Overlay，才能得到设计稿要求的白描边、箭头尺寸和像素间距。
    const shouldUseRouteOverlay =
      dynamicRouteFamily === "normalNoArrow" ||
      dynamicRouteFamily === "normalHasArrow" ||
      dynamicRouteFamily === "routeWithNormalLocation" ||
      dynamicRouteFamily === "routeWithInformatedLocation" ||
      dynamicRouteFamily === "routeWithProgress";

    clearDynamicRouteLayer(dynamicRouteRef.current);
    setRouteStatus("loading");

    void (async () => {
      try {
        const layer = dynamicRouteRef.current;
        clearDynamicRouteLayer(layer);

        const renderedBounds: ComputedRoute["bounds"][] = [];

        for (const [routeIndex, route] of renderableRoutes.entries()) {
          const start = route.nodes.find((node) => node.id === "start")?.value ?? "";
          const middle = route.nodes.find((node) => node.id === "middle")?.value ?? "";
          const end = route.nodes.find((node) => node.id === "end")?.value ?? "";
          const computedRoute = await computeRouteWithRoutesApi(start, middle, end);
          if (cancelled) {
            return;
          }

          const path = computedRoute.path;
          const routeStyle = dynamicRouteStyles[route.colorId] ?? dynamicRouteStyles.route1;
          const shouldShowEndpointMarkers =
            !hideDynamicRouteMarkers &&
            (dynamicRouteFamily === "routeWithNormalLocation" ||
              dynamicRouteFamily === "routeWithInformatedLocation" ||
              dynamicRouteFamily === "routeWithProgress");
          const routeMarkerPositions = shouldShowEndpointMarkers ? [path[0], path[path.length - 1]] : [];
          const routeMarkerLabels = [route.nodes.find((node) => node.id === "start")?.value, route.nodes.find((node) => node.id === "end")?.value];
          const routeMarkerElements = routeMarkerPositions.map((_, index) => {
            const label = routeMarkerLabels[index] ?? markerLabels[index === 0 ? 0 : 2] ?? t("map.destination");

            if (dynamicRouteFamily === "routeWithInformatedLocation") {
              return createRouteLocationPinElement(label);
            }

            return createPointMarkerElement({
              family: "normal",
              label,
              style: "dot",
              variant: index === 0 ? "default" : "emphasized",
            });
          });

          if (shouldUseRouteOverlay) {
            const setMarkerVariant = (focused: boolean) => {
              routeMarkerElements.forEach((markerElement) => {
                if (markerElement.classList.contains("MapMarker--route-location-pin")) {
                  markerElement.classList.toggle("is-selected", focused);
                } else {
                  markerElement.classList.toggle("MapMarker--point-default", !focused);
                  markerElement.classList.toggle("MapMarker--point-selected", focused);
                }
              });
            };
            layer.overlays.push(
              createRouteWithNormalLocationOverlay(
                googleMaps,
                map,
                path,
                setMarkerVariant,
                routeWithNormalLocationArrowScale,
                shouldShowArrows,
                "default",
                routeStyle,
                routeIndex * 5,
                dynamicRouteFamily === "routeWithProgress"
                  ? {
                      completedColor: resolveRouteStateColor("completed"),
                      ratio: routeWithProgressRatio,
                    }
                  : undefined,
              ),
            );
          } else {
            // 兜底方案：普通 Google Polyline + icons。当前主要路线样式优先走上面的自定义 Overlay。
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
                        strokeColor: routeStyle.arrowColor,
                        strokeOpacity: 1,
                        strokeWeight: 3,
                      },
                      fixedRotation: false,
                      offset: "22px",
                      repeat: "45px",
                    },
                  ]
                : [];
            const outline = new googleMaps.maps.Polyline({
              clickable: false,
              geodesic: true,
              map,
              path,
              strokeColor: "#ffffff",
              strokeOpacity: 1,
              strokeWeight: 12,
              zIndex: 40,
            });
            const polyline = new googleMaps.maps.Polyline({
              clickable: true,
              geodesic: true,
              icons: routeIcons(),
              map,
              path,
              strokeColor: routeStyle.color,
              strokeOpacity: 0.98,
              strokeWeight: 8,
              zIndex: 41,
            });
            const setFocused = (focused: boolean) => {
              outline.setOptions({
                strokeWeight: focused ? 16 : 12,
              });
              polyline.setOptions({
                icons: routeIcons(),
                strokeColor: focused ? routeStyle.focusedColor : routeStyle.color,
                strokeWeight: focused ? 12 : 8,
                zIndex: focused ? 42 : 41,
              });
            };
            layer.listeners.push(
              polyline.addListener("mouseover", () => setFocused(true)),
              polyline.addListener("mouseout", () => {
                if (!selected) {
                  setFocused(false);
                }
              }),
              polyline.addListener("click", () => {
                selected = !selected;
                setFocused(selected);
              }),
            );
            layer.polylines.push(outline, polyline);
            layer.outline = outline;
            layer.route = polyline;
          }

          const markerHandles = await Promise.all(
            routeMarkerPositions.map((position, index) => {
              const markerElement = routeMarkerElements[index];
              const anchor = dynamicRouteFamily === "routeWithInformatedLocation" ? "pin-tip" : "center";
              return activeMapId
                ? createAdvancedMarker(googleMaps, map, position, markerElement, anchor, shouldUseRouteOverlay ? 100 : undefined)
                : Promise.resolve(createOverlayMarker(googleMaps, map, position, markerElement, anchor, shouldUseRouteOverlay ? 100 : undefined));
            }),
          );

          if (cancelled) {
            markerHandles.forEach((marker) => marker.remove());
            clearDynamicRouteLayer(layer);
            return;
          }

          layer.markers.push(...markerHandles);
          if (computedRoute.bounds) {
            renderedBounds.push(computedRoute.bounds);
          }
        }

        const unionBounds = renderedBounds.reduce<ComputedRoute["bounds"] | undefined>(
          (bounds, item) =>
            item
              ? {
                  east: Math.max(bounds?.east ?? item.east, item.east),
                  north: Math.max(bounds?.north ?? item.north, item.north),
                  south: Math.min(bounds?.south ?? item.south, item.south),
                  west: Math.min(bounds?.west ?? item.west, item.west),
                }
              : bounds,
          undefined,
        );
        if (unionBounds) {
          map.fitBounds(unionBounds, 72);
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
    hideDynamicRouteMarkers,
    dynamicRoutes,
    markerLabels,
    status,
    t,
  ]);

  // 组件卸载时统一清理地图对象，避免重新进入页面后出现重复点或重复路线。
  useEffect(() => {
    return () => {
      clearDynamicRouteLayer(dynamicRouteRef.current);
      clearDynamicRouteLayer(manualRoutePreviewRef.current);
      polylineRef.current?.setMap(null);
      polygonRef.current?.setMap(null);
      regionDataRef.current?.setMap(null);
      regionListenersRef.current.forEach((listener) => listener?.remove?.());
      regionLabelRef.current?.remove();
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
