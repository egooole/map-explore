import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ComponentCard, ManualCategoryId, ManualComponentSpec } from "../components/ComponentCard";
import componentSpecs from "../config/componentSpecs.json";
import { MapCategory, useWorkbenchStore } from "../store/workbenchStore";

interface ManualCategory {
  id: ManualCategoryId;
  labelKey: string;
  components: ManualComponentSpec[];
}

interface ManualMapType {
  id: MapCategory;
  labelKey: string;
  descriptionKey: string;
  categories: ManualCategory[];
}

interface ManualSpecDocument {
  mapTypes: ManualMapType[];
}

const manualSpecDocument = componentSpecs as unknown as ManualSpecDocument;

export function ManualScene() {
  const { t } = useTranslation();
  const { mapCategory, lang, mapTheme, setMapCategory } = useWorkbenchStore();
  const mapTypes = manualSpecDocument.mapTypes;
  const activeMapType = mapTypes.find((item) => item.id === mapCategory) ?? mapTypes[0];
  const [activeCategoryId, setActiveCategoryId] = useState<ManualCategoryId>(activeMapType.categories[0]?.id ?? "point");
  const activeCategory = activeMapType.categories.find((category) => category.id === activeCategoryId) ?? activeMapType.categories[0];

  useEffect(() => {
    if (!activeMapType.categories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(activeMapType.categories[0]?.id ?? "point");
    }
  }, [activeCategoryId, activeMapType]);

  const breadcrumb = useMemo(
    () => (activeMapType && activeCategory ? `${t(activeMapType.labelKey)} / ${t(activeCategory.labelKey)}` : ""),
    [activeCategory, activeMapType, t],
  );

  return (
    <section className="ManualScene">
      <header className="ManualScene__header">
        <p className="ManualScene__breadcrumb">{breadcrumb}</p>
        <h1>{t("manual.title")}</h1>
        <p>{t("manual.intro")}</p>
      </header>

      <nav className="ManualHierarchy" aria-label={t("manual.hierarchy")}>
        <section className="ManualHierarchy__layer ManualHierarchy__layer--map">
          <h2>{t("manual.layers.mapType")}</h2>
          <div>
            {mapTypes.map((mapType) => (
              <button
                className={mapType.id === activeMapType.id ? "is-active" : ""}
                key={mapType.id}
                onClick={() => setMapCategory(mapType.id)}
                type="button"
              >
                <strong>{t(mapType.labelKey)}</strong>
                <span>{t(mapType.descriptionKey)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="ManualHierarchy__layer ManualHierarchy__layer--category">
          <h2>{t("manual.layers.componentCategory")}</h2>
          <div role="tablist" aria-label={t("manual.layers.componentCategory")}>
            {activeMapType.categories.map((category) => (
              <button
                aria-selected={category.id === activeCategory.id}
                className={category.id === activeCategory.id ? "is-active" : ""}
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
                role="tab"
                type="button"
              >
                {t(category.labelKey)}
              </button>
            ))}
          </div>
        </section>

      </nav>

      <div className="ManualComponentList" aria-label={t("manual.layers.component")}>
        {activeCategory.components.map((component) => (
          <ComponentCard
            categoryId={activeCategory.id}
            key={component.id}
            lang={lang}
            mapCategory={activeMapType.id}
            mapTheme={mapTheme}
            spec={component}
          />
        ))}
      </div>
    </section>
  );
}
