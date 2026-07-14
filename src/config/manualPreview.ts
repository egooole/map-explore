import type { ManualComponentSpec, ManualMarkerVariant } from "../components/ComponentCard";
import type { MarkerPreviewState, MarkerPreviewVariant, RoutePreviewState } from "../types";

const pointPreviewPattern: MarkerPreviewVariant[] = [
  "default",
  "completed",
  "muted",
  "default",
  "emphasized",
  "completed",
  "default",
  "muted",
  "completed",
  "default",
  "emphasized",
  "default",
];

const chinaPointPreviewPattern: MarkerPreviewVariant[] = [
  "default",
  "completed",
  "muted",
  "default",
  "emphasized",
  "completed",
  "default",
  "muted",
  "completed",
  "default",
  "emphasized",
  "default",
  "default",
  "completed",
  "muted",
  "emphasized",
  "default",
  "completed",
  "muted",
  "default",
  "completed",
  "default",
  "emphasized",
  "muted",
  "completed",
  "default",
  "muted",
  "completed",
  "default",
  "emphasized",
];

const chinaClusterPreviewCounts = [18, 42, 12, 126, 86, 64, 38, 52, 220, 148, 34, 76, 28, 15];

export function createPreviewMarkers(spec: ManualComponentSpec, translate: (key: string) => string): MarkerPreviewState[] | undefined {
  if (!spec.markerVariants?.length) {
    return undefined;
  }

  if (spec.markerFamily === "custom") {
    return pointPreviewPattern.map((_, index) => {
      const marker = spec.markerVariants?.[index % spec.markerVariants.length];
      return {
        customContent: marker?.customContent,
        id: marker?.id ?? "default",
        label: marker ? translate(marker.labelKey) : translate("manual.customLocation.name"),
      };
    });
  }

  if (spec.previewDistribution === "chinaCluster") {
    const baseMarker = spec.markerVariants.find((marker) => marker.id === "default") ?? spec.markerVariants[0];
    return chinaClusterPreviewCounts.map((count) => ({
      count,
      id: baseMarker.id,
      label: `${translate(baseMarker.labelKey)} ${count}`,
    }));
  }

  const markersById = new Map(spec.markerVariants.map((marker) => [marker.id, marker]));
  const previewPattern = spec.previewDistribution === "china" ? chinaPointPreviewPattern : pointPreviewPattern;
  return previewPattern
    .map((variant) => markersById.get(variant))
    .filter((marker): marker is ManualMarkerVariant => Boolean(marker))
    .map((marker) => ({ id: marker.id, label: translate(marker.labelKey) }));
}

export function createPreviewRoutes(spec: ManualComponentSpec, translate: (key: string) => string): RoutePreviewState[] | undefined {
  return spec.routeVariants?.map((variant) => ({
    id: variant.id,
    label: translate(variant.labelKey),
  }));
}

export function getPreviewZoom(spec: ManualComponentSpec) {
  if (spec.previewDistribution === "china" || spec.previewDistribution === "chinaCluster") {
    return 4;
  }

  if (spec.previewType === "line" || spec.previewType === "area" || spec.previewType === "container") {
    return 12;
  }

  return 13;
}
