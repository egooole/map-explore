import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ManualCategoryId, ManualComponentSpec } from "../components/ComponentCard";
import { MapCanvas } from "../components/MapCanvas";
import { createDefaultControls, ParamPanel } from "../components/ParamPanel";
import componentSpecs from "../config/componentSpecs.json";
import { createPreviewMarkers, getPreviewZoom } from "../config/manualPreview";
import { useWorkbenchStore } from "../store/workbenchStore";
import type { MapCategory } from "../store/workbenchStore";

interface BrowseCategory {
  id: ManualCategoryId;
  labelKey: string;
  components: ManualComponentSpec[];
}

interface BrowseMapType {
  id: MapCategory;
  categories: BrowseCategory[];
}

interface BrowseSpecDocument {
  mapTypes: BrowseMapType[];
}

const browseSpecDocument = componentSpecs as unknown as BrowseSpecDocument;

export function MapBrowseScene() {
  const { t } = useTranslation();
  const { mapCategory, lang, mapTheme } = useWorkbenchStore();
  const [controls, setControls] = useState(createDefaultControls);
  const activeMapType = browseSpecDocument.mapTypes.find((item) => item.id === mapCategory) ?? browseSpecDocument.mapTypes[0];
  const [activeCategoryId, setActiveCategoryId] = useState<ManualCategoryId>(activeMapType.categories[0]?.id ?? "point");
  const activeCategory = activeMapType.categories.find((category) => category.id === activeCategoryId) ?? activeMapType.categories[0];
  const [activeComponentId, setActiveComponentId] = useState(activeCategory?.components[0]?.id ?? "");
  const activeComponent = activeCategory?.components.find((component) => component.id === activeComponentId) ?? activeCategory?.components[0];
  const previewMarkers = useMemo(
    () => (activeComponent ? createPreviewMarkers(activeComponent, t) : undefined),
    [activeComponent, t],
  );

  useEffect(() => {
    if (!activeMapType.categories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(activeMapType.categories[0]?.id ?? "point");
    }
  }, [activeCategoryId, activeMapType]);

  useEffect(() => {
    if (!activeCategory?.components.some((component) => component.id === activeComponentId)) {
      setActiveComponentId(activeCategory?.components[0]?.id ?? "");
    }
  }, [activeCategory, activeComponentId]);

  useEffect(() => {
    if (!activeComponent) {
      return;
    }

    setControls((currentControls) => ({
      ...currentControls,
      markerStyle: activeComponent.previewType === "point" ? "pin" : "default",
      showMapUi: activeComponent.previewDistribution === "chinaCluster" ? true : currentControls.showMapUi,
      zoom: getPreviewZoom(activeComponent),
    }));
  }, [activeComponent]);

  return (
    <section className="MapBrowseScene">
      <MapCanvas
        controls={controls}
        lang={lang}
        mapCategory={mapCategory}
        mapTheme={mapTheme}
        previewDistribution={activeComponent?.previewDistribution}
        previewFeature={activeComponent?.previewType}
        previewMarkerFamily={activeComponent?.markerFamily}
        previewMarkers={previewMarkers}
      />
      <aside className="BrowseInspector">
        <section className="BrowseComponentPicker" aria-label={t("browse.components.aria")}>
          <header>
            <p>{t("browse.components.kicker")}</p>
            <h2>{t("browse.components.title")}</h2>
            <span>{t("browse.components.description")}</span>
          </header>

          <div className="BrowseComponentPicker__tabs" role="tablist" aria-label={t("manual.layers.componentCategory")}>
            {activeMapType.categories.map((category) => (
              <button
                aria-selected={category.id === activeCategory?.id}
                className={category.id === activeCategory?.id ? "is-active" : ""}
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
                role="tab"
                type="button"
              >
                {t(category.labelKey)}
              </button>
            ))}
          </div>

          <div className="BrowseComponentPicker__list">
            {activeCategory?.components.map((component) => (
              <button
                className={component.id === activeComponent?.id ? "is-active" : ""}
                key={component.id}
                onClick={() => setActiveComponentId(component.id)}
                type="button"
              >
                <strong>{t(component.nameKey)}</strong>
                <span>{t(component.descriptionKey)}</span>
              </button>
            ))}
          </div>
        </section>

        <ParamPanel controls={controls} onChange={setControls} />
      </aside>
    </section>
  );
}
