export type MarkerStyle = "default" | "pin" | "dot" | "custom";
export type MarkerPreviewVariant = "default" | "muted" | "completed" | "emphasized" | "selected";

export interface MarkerPreviewState {
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
