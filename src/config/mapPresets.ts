import type { MapCategory, WorkbenchLanguage } from "../store/workbenchStore";
import { mapExploreLightStyles, mapExploreVisualizationStyles, type GoogleMapStyle } from "./googleMapStyles";

export interface MapPreset {
  id: string;
  labelLocale: WorkbenchLanguage;
  mapId?: string;
  mapTypeId: "roadmap" | "terrain";
  styles?: GoogleMapStyle[];
}

export const mapPresets: Record<MapCategory, Record<WorkbenchLanguage, MapPreset>> = {
  entity: {
    zh: {
      id: "google-entity-zh",
      labelLocale: "zh",
      mapId: import.meta.env.VITE_ENTITY_MAP_ID,
      mapTypeId: "roadmap",
      styles: mapExploreLightStyles,
    },
    en: {
      id: "google-entity-en",
      labelLocale: "en",
      mapId: import.meta.env.VITE_ENTITY_MAP_ID,
      mapTypeId: "roadmap",
      styles: mapExploreLightStyles,
    },
  },
  visualization: {
    zh: {
      id: "google-visualization-zh",
      labelLocale: "zh",
      mapId: import.meta.env.VITE_VISUALIZATION_MAP_ID,
      mapTypeId: "roadmap",
      styles: mapExploreVisualizationStyles,
    },
    en: {
      id: "google-visualization-en",
      labelLocale: "en",
      mapId: import.meta.env.VITE_VISUALIZATION_MAP_ID,
      mapTypeId: "roadmap",
      styles: mapExploreVisualizationStyles,
    },
  },
};

export const mapKey = import.meta.env.VITE_MAP_KEY;
