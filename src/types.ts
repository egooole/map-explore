export type MarkerStyle = "default" | "pin" | "dot" | "custom";
export type MarkerPreviewVariant = "default" | "muted" | "completed" | "emphasized" | "selected";
export type MarkerPreviewFamily = "normal" | "informated" | "cumulative" | "custom";
export type CustomMarkerContent = "letter" | "number" | "warehouse" | "shop" | "user";
export type RoutePreviewVariant = "default" | "muted" | "completed" | "selected" | "inProgress";
export type RoutePreviewFamily =
  | "normalNoArrow"
  | "normalHasArrow"
  | "routeWithNormalLocation"
  | "routeWithInformatedLocation"
  | "routeWithProgress";

export interface MarkerPreviewState {
  count?: number;
  customContent?: CustomMarkerContent;
  id: MarkerPreviewVariant;
  label: string;
}

export interface RoutePreviewState {
  id: RoutePreviewVariant;
  label: string;
}

export interface RouteNode {
  id: "start" | "middle" | "end";
  value: string;
}

export interface ManagedRoute {
  colorId: "route1" | "route2" | "route3";
  id: string;
  name: string;
  nodes: RouteNode[];
  visible: boolean;
}

export interface MapControlsState {
  activeRouteId: string;
  zoom: number;
  markerStyle: MarkerStyle;
  routes: ManagedRoute[];
  showMapUi: boolean;
  routeNodes: RouteNode[];
}
