export type MarkerStyle = "default" | "pin" | "dot" | "custom";
export type MarkerPreviewVariant = "default" | "muted" | "completed" | "emphasized" | "selected";
export type MarkerPreviewFamily = "normal" | "informated" | "cumulative" | "custom";
export type CustomMarkerContent = "letter" | "number" | "warehouse" | "shop" | "user";

export interface MarkerPreviewState {
  count?: number;
  customContent?: CustomMarkerContent;
  id: MarkerPreviewVariant;
  label: string;
}

export interface RouteNode {
  id: "start" | "middle" | "end";
  value: string;
}

export interface MapControlsState {
  zoom: number;
  markerStyle: MarkerStyle;
  showMapUi: boolean;
  routeNodes: RouteNode[];
}
