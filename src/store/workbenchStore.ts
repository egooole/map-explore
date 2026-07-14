import { create } from "zustand";

export type WorkbenchView = "browse" | "use-case" | "manual";
export type MapCategory = "entity" | "visualization";
export type WorkbenchLanguage = "zh" | "en";
export type MapTheme = "light" | "dark";

interface WorkbenchState {
  view: WorkbenchView;
  mapCategory: MapCategory;
  lang: WorkbenchLanguage;
  mapTheme: MapTheme;
  setView: (view: WorkbenchView) => void;
  setMapCategory: (mapCategory: MapCategory) => void;
  setLang: (lang: WorkbenchLanguage) => void;
  setMapTheme: (mapTheme: MapTheme) => void;
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  view: "browse",
  mapCategory: "entity",
  lang: "zh",
  mapTheme: "light",
  setView: (view) => set({ view }),
  setMapCategory: (mapCategory) => set({ mapCategory }),
  setLang: (lang) => set({ lang }),
  setMapTheme: (mapTheme) => set({ mapTheme }),
}));
