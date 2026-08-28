export type MapLabRegionState = "default" | "disabled" | "hover" | "selected";

export const MAP_LAB_REGION_STYLES = {
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
  hover: {
    fillColor: "#2A3EF4",
    fillOpacity: 0.4,
    strokeColor: "#2A3EF4",
    strokeWeight: 2,
  },
  selected: {
    fillColor: "#2A3EF4",
    fillOpacity: 0.4,
    strokeColor: "#2A3EF4",
    strokeWeight: 2,
  },
} as const;

export function mapLabRegionStyle(state: MapLabRegionState) {
  return MAP_LAB_REGION_STYLES[state];
}
