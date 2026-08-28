import customShopMarker from "./assets/custom-location/shop.svg?raw";
import customUserMarker from "./assets/custom-location/user.svg?raw";
import customWarehouseMarker from "./assets/custom-location/warehouse.svg?raw";
import informatedCompletedMarker from "./assets/informated-location/completed.svg";
import informatedDefaultMarker from "./assets/informated-location/default.svg";
import informatedDisableMarker from "./assets/informated-location/disable.svg";
import informatedEmphasizedMarker from "./assets/informated-location/emphasized.svg";
import informatedSelectedMarker from "./assets/informated-location/selected.svg";

export type MapLabMarkerStyle = "default" | "pin" | "dot" | "custom";
export type MapLabPointVariant = "default" | "muted" | "completed" | "emphasized" | "selected";
export type MapLabPointFamily = "normal" | "informated" | "cumulative" | "custom";
export type MapLabCustomContent = "letter" | "number" | "warehouse" | "shop" | "user";
export type MapLabMarkerAnchor = "center" | "bottom" | "pin-tip";

export interface MapLabPointOptions {
  count?: number;
  customContent?: MapLabCustomContent;
  family?: MapLabPointFamily;
  label: string;
  style?: MapLabMarkerStyle;
  variant?: MapLabPointVariant;
}

export interface CreateMapLabAdvancedMarkerOptions extends MapLabPointOptions {
  anchor?: MapLabMarkerAnchor;
  map: google.maps.Map;
  position: google.maps.LatLng | google.maps.LatLngLiteral;
  zIndex?: number;
}

const interactiveVariants: MapLabPointVariant[] = ["default", "completed", "emphasized"];

const informatedAssets: Record<MapLabPointVariant, string> = {
  completed: informatedCompletedMarker,
  default: informatedDefaultMarker,
  emphasized: informatedEmphasizedMarker,
  muted: informatedDisableMarker,
  selected: informatedSelectedMarker,
};

const customAssets: Partial<Record<MapLabCustomContent, string>> = {
  shop: customShopMarker,
  user: customUserMarker,
  warehouse: customWarehouseMarker,
};

const customStateColors: Partial<Record<MapLabPointVariant, string>> = {
  completed: "#9C9EAD",
  default: "#2A3EF4",
  muted: "#C9D2FC",
};

function colorCustomSvg(asset: string, variant: MapLabPointVariant) {
  const color = customStateColors[variant] ?? customStateColors.default ?? "#2A3EF4";
  return asset.replace(/var\(--fill-0,\s*#2A3EF4\)/gi, color);
}

function markerMarkup(options: Required<Pick<MapLabPointOptions, "family" | "style" | "variant">> & MapLabPointOptions) {
  const { count, customContent, family, style, variant } = options;

  if (family === "informated") {
    return `<span class="MapLabMarker__asset"><img alt="" class="MapLabMarker__assetBase" src="${informatedAssets[variant]}" /><img alt="" class="MapLabMarker__assetSelected" src="${informatedSelectedMarker}" /></span>`;
  }

  if (family === "cumulative") {
    return `<span class="MapLabMarker__cluster"><b>${count ?? ""}</b></span>`;
  }

  if (family === "custom" && customContent) {
    const asset = customAssets[customContent];
    if (asset) {
      return `<span class="MapLabMarker__customAsset">${colorCustomSvg(asset, variant)}</span>`;
    }
    return `<span class="MapLabMarker__customTextPin"><b>${customContent === "number" ? "2" : "O"}</b></span>`;
  }

  if (style === "dot" && !variant) {
    return "<span></span>";
  }

  return "<span><i></i></span>";
}

export function createMapLabPointElement(options: MapLabPointOptions) {
  const family = options.family ?? "normal";
  const style = options.style ?? "default";
  const variant = options.variant ?? "default";
  const element = document.createElement("div");

  element.className = `MapLabMarker MapLabMarker--${family}-${variant}`;
  element.innerHTML = markerMarkup({ ...options, family, style, variant });
  element.setAttribute("aria-label", options.label);

  if (interactiveVariants.includes(variant)) {
    element.classList.add("MapLabMarker--interactive");
    element.tabIndex = 0;
    element.setAttribute("role", "button");
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        element.click();
      }
    });
  } else {
    element.setAttribute("role", "img");
  }

  return element;
}

export async function createMapLabAdvancedMarker({
  anchor = "center",
  map,
  position,
  zIndex,
  ...pointOptions
}: CreateMapLabAdvancedMarkerOptions) {
  const { AdvancedMarkerElement } =
    (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;
  const content = createMapLabPointElement(pointOptions);
  const anchorOptions =
    anchor === "center"
      ? { anchorLeft: "-50%", anchorTop: "-50%" }
      : anchor === "pin-tip"
        ? { anchorLeft: "-50%", anchorTop: "-51px" }
        : { anchorLeft: "-50%", anchorTop: "-100%" };

  const marker = new AdvancedMarkerElement({
    ...anchorOptions,
    content,
    gmpClickable: content.classList.contains("MapLabMarker--interactive"),
    map,
    position,
    title: pointOptions.label,
    zIndex,
  });

  return {
    content,
    marker,
    remove() {
      marker.map = null;
      content.remove();
    },
  };
}
