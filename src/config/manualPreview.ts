import type { ManualComponentSpec, ManualMarkerVariant } from "../components/ComponentCard";
import type { MarkerPreviewState, MarkerPreviewVariant, RoutePreviewState } from "../types";

/**
 * 局部点组件预览的状态分布。
 * 数组里的顺序会映射到地图上的点位顺序，用来做“有疏有密、状态随机”的视觉效果。
 */
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

/**
 * 全国点位预览的状态分布。
 * 比局部预览更长，因为全国地图上会展示更多点。
 */
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

/**
 * Cumulative location 的聚合数字。
 * 这些数字会显示在聚合气泡里，模拟“当前气泡聚合了多少个点”。
 */
const chinaClusterPreviewCounts = [18, 42, 12, 126, 86, 64, 38, 52, 220, 148, 34, 76, 28, 15];

/**
 * 根据组件配置生成地图上的点预览数据。
 * previewState 来自状态切换按钮；传入后会强制所有点展示同一状态。
 * 不传 previewState 时，会按 pointPreviewPattern 做混合状态分布。
 */
export function createPreviewMarkers(
  spec: ManualComponentSpec,
  translate: (key: string) => string,
  previewState?: MarkerPreviewVariant,
): MarkerPreviewState[] | undefined {
  if (!spec.markerVariants?.length) {
    return undefined;
  }

  if (spec.markerFamily === "custom") {
    // Custom 组件要保留每个点自己的内容类型：字母、数字、仓库、商家、用户。
    // 状态切换只改变颜色，不改变 customContent。
    return pointPreviewPattern.map((_, index) => {
      const marker = spec.markerVariants?.[index % spec.markerVariants.length];
      return {
        customContent: marker?.customContent,
        id: previewState ?? marker?.id ?? "default",
        label: marker ? translate(marker.labelKey) : translate("manual.customLocation.name"),
      };
    });
  }

  if (spec.previewDistribution === "chinaCluster") {
    // 聚合组件保留 count 数字；状态切换只改变聚合点颜色。
    const baseMarker = spec.markerVariants.find((marker) => marker.id === "default") ?? spec.markerVariants[0];
    return chinaClusterPreviewCounts.map((count) => ({
      count,
      id: previewState ?? baseMarker.id,
      label: `${translate(baseMarker.labelKey)} ${count}`,
    }));
  }

  if (previewState) {
    // 普通点 / 信息点在状态切换时，地图上所有点统一展示被选中的状态。
    const fallbackMarker = spec.markerVariants.find((marker) => marker.id === previewState) ?? spec.markerVariants[0];
    const previewPattern = spec.previewDistribution === "china" ? chinaPointPreviewPattern : pointPreviewPattern;

    return previewPattern.map(() => ({
      id: previewState,
      label: fallbackMarker ? translate(fallbackMarker.labelKey) : translate(spec.nameKey),
    }));
  }

  // 默认预览：按 pattern 混合展示默认、完成、弱化、强化等状态。
  const markersById = new Map(spec.markerVariants.map((marker) => [marker.id, marker]));
  const previewPattern = spec.previewDistribution === "china" ? chinaPointPreviewPattern : pointPreviewPattern;
  return previewPattern
    .map((variant) => markersById.get(variant))
    .filter((marker): marker is ManualMarkerVariant => Boolean(marker))
    .map((marker) => ({ id: marker.id, label: translate(marker.labelKey) }));
}

/**
 * 根据组件配置生成路线预览数据。
 * 当前主要用于静态路线组件；状态切换后的 route state 会继续传给 MapCanvas。
 */
export function createPreviewRoutes(spec: ManualComponentSpec, translate: (key: string) => string): RoutePreviewState[] | undefined {
  return spec.routeVariants?.map((variant) => ({
    id: variant.id,
    label: translate(variant.labelKey),
  }));
}

/**
 * 每种组件的默认预览 zoom。
 * 全国点/聚合点 zoom 更小；线/面/容器需要看到局部结构；普通点默认更近一些。
 */
export function getPreviewZoom(spec: ManualComponentSpec) {
  if (spec.previewDistribution === "china" || spec.previewDistribution === "chinaCluster") {
    return 4;
  }

  if (spec.previewType === "line" || spec.previewType === "area" || spec.previewType === "container") {
    return 12;
  }

  return 13;
}
