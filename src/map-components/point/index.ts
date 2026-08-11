import customShopMarker from "../../assets/custom-location/shop.svg?raw";
import customUserMarker from "../../assets/custom-location/user.svg?raw";
import customWarehouseMarker from "../../assets/custom-location/warehouse.svg?raw";
import informatedCompletedMarker from "../../assets/informated-location/completed.svg";
import informatedDefaultMarker from "../../assets/informated-location/default.svg";
import informatedDisableMarker from "../../assets/informated-location/disable.svg";
import informatedEmphasizedMarker from "../../assets/informated-location/emphasized.svg";
import informatedSelectedMarker from "../../assets/informated-location/selected.svg";
import type { CustomMarkerContent, MarkerPreviewFamily, MarkerPreviewVariant, MarkerStyle } from "../../types";

export interface PointMarkerElementOptions {
  count?: number;
  customContent?: CustomMarkerContent;
  family?: MarkerPreviewFamily;
  label: string;
  style: MarkerStyle;
  variant?: MarkerPreviewVariant;
}

export const interactivePointVariants: MarkerPreviewVariant[] = ["default", "completed", "emphasized"];

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

function createCustomMarkerAsset(asset: string, variant?: MarkerPreviewVariant) {
  const stateColor = customMarkerStateColors[variant ?? "default"] ?? customMarkerStateColors.default;
  return asset.replace(/var\(--fill-0,\s*#2A3EF4\)/gi, stateColor ?? "#2A3EF4");
}

function createMarkerContent({
  count,
  customContent,
  family,
  style,
  variant,
}: Omit<PointMarkerElementOptions, "label">) {
  if (variant && family === "informated") {
    return `<span class="MapMarker__asset"><img alt="" class="MapMarker__assetBase" src="${informatedMarkerAssets[variant]}" /><img alt="" class="MapMarker__assetSelected" src="${informatedSelectedMarker}" /></span>`;
  }

  if (variant && family === "cumulative") {
    return `<span class="MapMarker__cluster"><b>${count ?? ""}</b></span>`;
  }

  if (variant && family === "custom" && customContent) {
    if (customMarkerAssets[customContent]) {
      return `<span class="MapMarker__customAsset">${createCustomMarkerAsset(customMarkerAssets[customContent], variant)}</span>`;
    }

    return `<span class="MapMarker__customTextPin"><b>${customContent === "number" ? "2" : "O"}</b></span>`;
  }

  if (style === "dot" && !variant) {
    return "<span></span>";
  }

  return "<span><i></i></span>";
}

export function createPointMarkerElement({
  count,
  customContent,
  family = "normal",
  label,
  style,
  variant,
}: PointMarkerElementOptions) {
  const marker = document.createElement("div");
  const previewClass = family === "normal" ? "point" : family;
  marker.className = variant ? `MapMarker MapMarker--${previewClass}-${variant}` : `MapMarker MapMarker--${style}`;
  marker.innerHTML = createMarkerContent({ count, customContent, family, style, variant });

  if (variant && interactivePointVariants.includes(variant)) {
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

  return marker;
}
