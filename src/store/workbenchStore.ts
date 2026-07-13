import { create } from "zustand";

export type WorkbenchView = "browse" | "use-case" | "manual";
export type MapCategory = "entity" | "visualization";
export type WorkbenchLanguage = "zh" | "en";

interface WorkbenchState {
  view: WorkbenchView;
  mapCategory: MapCategory;
  lang: WorkbenchLanguage;
  setView: (view: WorkbenchView) => void;
  setMapCategory: (mapCategory: MapCategory) => void;
  setLang: (lang: WorkbenchLanguage) => void;
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  view: "browse",
  mapCategory: "entity",
  lang: "zh",
  setView: (view) => set({ view }),
  setMapCategory: (mapCategory) => set({ mapCategory }),
  setLang: (lang) => set({ lang }),
}));
