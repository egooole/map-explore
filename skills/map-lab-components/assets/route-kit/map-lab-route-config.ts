export type MapLabRouteState = "default" | "hover" | "selected" | "disabled" | "completed";
export type MapLabRouteColorId = "route1" | "route2" | "route3";

export const MAP_LAB_ROUTE_WIDTH = {
  default: { body: 8, outline: 12 },
  focused: { body: 12, outline: 16 },
} as const;

export const MAP_LAB_ROUTE_COLORS = {
  route1: { default: "#2A3EF4", focused: "#2232C3" },
  route2: { default: "#009995", focused: "#017B77" },
  route3: { default: "#9583FF", focused: "#8575FF" },
} as const;

export const MAP_LAB_ROUTE_STATE_COLORS = {
  completed: "#9C9EAD",
  default: "#2A3EF4",
  disabled: "#C9D2FC",
} as const;

export const MAP_LAB_ARROW_STATE_COLORS = {
  completed: "#C4C5CE",
  default: "#768BFF",
  disabled: "#D9E0FD",
} as const;

export const MAP_LAB_ROUTE_ARROW = {
  anchor: { x: 9.79846, y: 2.12132 },
  path: "M1.06065 10.8591L9.79846 2.12132L18.5363 10.8591",
} as const;

export function resolveMapLabRouteVisual(colorId: MapLabRouteColorId, state: MapLabRouteState) {
  const focused = state === "hover" || state === "selected";
  const widths = focused ? MAP_LAB_ROUTE_WIDTH.focused : MAP_LAB_ROUTE_WIDTH.default;
  const configured = MAP_LAB_ROUTE_COLORS[colorId];
  const stateColor =
    state === "disabled"
      ? MAP_LAB_ROUTE_STATE_COLORS.disabled
      : state === "completed"
        ? MAP_LAB_ROUTE_STATE_COLORS.completed
        : focused
          ? configured.focused
          : configured.default;

  return {
    bodyColor: stateColor,
    bodyWeight: widths.body,
    outlineColor: "#FFFFFF",
    outlineWeight: widths.outline,
  };
}
