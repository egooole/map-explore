export type MarkerStyle = "default" | "pin" | "dot" | "custom";

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
