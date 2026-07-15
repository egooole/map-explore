import type { MapCategory, WorkbenchLanguage } from "../store/workbenchStore";

export const mapLabCloudMapId = "fbd5ec7c7943b2849a51c824";
export const mapLabCloudMapIdSource = "src/config/mapPresets.ts";

export interface MapPreset {
  id: string;
  labelLocale: WorkbenchLanguage;
  mapId: string;
  mapTypeId: "roadmap" | "terrain";
}

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

export const mapKey = import.meta.env.VITE_MAP_KEY;
export const cloudMapIds = [mapLabCloudMapId];
