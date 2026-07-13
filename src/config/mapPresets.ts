import type { MapCategory, WorkbenchLanguage } from "../store/workbenchStore";

export interface MapPreset {
  id: string;
  labelLocale: WorkbenchLanguage;
  tileUrl: string;
  attribution: string;
  mapIdEnv?: string;
  styleUrlEnv?: string;
}

export const mapPresets: Record<MapCategory, Record<WorkbenchLanguage, MapPreset>> = {
  entity: {
    zh: {
      id: "entity-zh",
      labelLocale: "zh",
      tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
      mapIdEnv: "VITE_ENTITY_MAP_ID",
    },
    en: {
      id: "entity-en",
      labelLocale: "en",
      tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
      mapIdEnv: "VITE_ENTITY_MAP_ID",
    },
  },
  visualization: {
    zh: {
      id: "visualization-zh",
      labelLocale: "zh",
      tileUrl: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      styleUrlEnv: "VITE_VISUALIZATION_STYLE_URL",
    },
    en: {
      id: "visualization-en",
      labelLocale: "en",
      tileUrl: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      styleUrlEnv: "VITE_VISUALIZATION_STYLE_URL",
    },
  },
};

export const mapKey = import.meta.env.VITE_MAP_KEY;
