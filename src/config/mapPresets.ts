import type { MapCategory, WorkbenchLanguage } from "../store/workbenchStore";

/**
 * 当前项目统一使用的 Google Cloud Map ID。
 * 这个 ID 在 Google Cloud Console 里绑定云端地图样式；
 * 前端只传 mapId，不在代码里写本地 styles，这样以后改底图样式只需要在云端发布。
 */
export const mapLabCloudMapId = "fbd5ec7c7943b2849a51c824";
export const mapLabCloudMapIdSource = "src/config/mapPresets.ts";

export interface MapPreset {
  id: string;
  labelLocale: WorkbenchLanguage;
  mapId: string;
  mapTypeId: "roadmap" | "terrain";
}

/**
 * 地图预设按“地图类型 + 语言”分组。
 * 目前实体地图和可视化地图都共用同一个 Map ID；
 * 如果未来浅色/暗色或不同业务地图要拆 Map ID，可以从这里扩展。
 */
export const mapPresets: Record<MapCategory, Record<WorkbenchLanguage, MapPreset>> = {
  entity: {
    zh: {
      id: "google-entity-zh",
      labelLocale: "zh",
      mapId: mapLabCloudMapId,
      mapTypeId: "roadmap",
    },
    en: {
      id: "google-entity-en",
      labelLocale: "en",
      mapId: mapLabCloudMapId,
      mapTypeId: "roadmap",
    },
  },
  visualization: {
    zh: {
      id: "google-visualization-zh",
      labelLocale: "zh",
      mapId: mapLabCloudMapId,
      mapTypeId: "roadmap",
    },
    en: {
      id: "google-visualization-en",
      labelLocale: "en",
      mapId: mapLabCloudMapId,
      mapTypeId: "roadmap",
    },
  },
};

// Google Maps API Key 来自 .env.local / GitHub Secrets，不要直接写进代码。
export const mapKey = import.meta.env.VITE_MAP_KEY;

// loader 的 map_ids 参数使用同一个 Map ID，确保 Advanced Marker 和云端样式都走正确配置。
export const cloudMapIds = [mapLabCloudMapId];
