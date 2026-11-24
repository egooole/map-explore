import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { ComponentCard, ManualCategoryId, ManualComponentSpec } from "../components/ComponentCard";
import { WorkbenchPageHeader } from "../components/WorkbenchPageHeader";
import componentSpecs from "../config/componentSpecs.json";
import { MapCategory, useWorkbenchStore, WorkbenchLanguage } from "../store/workbenchStore";

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
  manualCategories?: ManualCategory[];
}

interface ManualSpecDocument {
  mapTypes: ManualMapType[];
}

const manualSpecDocument = componentSpecs as unknown as ManualSpecDocument;

function isManualCategoryId(value: string | null): value is ManualCategoryId {
  return value === "point" || value === "line" || value === "area" || value === "container";
}

function isWorkbenchLanguage(value: string | null): value is WorkbenchLanguage {
  return value === "zh" || value === "en";
}

export function ManualScene() {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const { mapCategory, lang, mapTheme, setLang, setMapCategory } = useWorkbenchStore();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const requestedCategoryId = isManualCategoryId(searchParams.get("category"))
    ? searchParams.get("category") as ManualCategoryId
    : null;
  const requestedComponentId = searchParams.get("component");
  const requestedLanguage = isWorkbenchLanguage(searchParams.get("lang"))
    ? searchParams.get("lang") as WorkbenchLanguage
    : null;
  const isFromShowcase = searchParams.get("from") === "showcase";
  const mapTypes = useMemo(
    () => isFromShowcase
      ? manualSpecDocument.mapTypes.filter((mapType) => mapType.id === "entity")
      : manualSpecDocument.mapTypes,
    [isFromShowcase],
  );
  const activeMapType = useMemo(() => {
    const selectedMapType = mapTypes.find((item) => item.id === mapCategory) ?? mapTypes[0];
    const selectedCategories = selectedMapType.manualCategories ?? selectedMapType.categories;

    return {
      ...selectedMapType,
      categories: isFromShowcase
        ? selectedCategories.filter((category) => category.id !== "container")
        : selectedCategories,
    };
  }, [isFromShowcase, mapCategory, mapTypes]);
  const [activeCategoryId, setActiveCategoryId] = useState<ManualCategoryId>(
    requestedCategoryId ?? activeMapType.categories[0]?.id ?? "point",
  );
  const activeCategory = activeMapType.categories.find((category) => category.id === activeCategoryId) ?? activeMapType.categories[0];

  useEffect(() => {
    if (!requestedLanguage || requestedLanguage === lang) {
      return;
    }

    setLang(requestedLanguage);
    void i18n.changeLanguage(requestedLanguage);
    document.documentElement.lang = requestedLanguage === "zh" ? "zh-CN" : "en";
  }, [i18n, lang, requestedLanguage, setLang]);

  useEffect(() => {
    if (isFromShowcase && mapCategory !== "entity") {
      setMapCategory("entity");
    }
  }, [isFromShowcase, mapCategory, setMapCategory]);

  useEffect(() => {
    if (requestedCategoryId && activeMapType.categories.some((category) => category.id === requestedCategoryId)) {
      setActiveCategoryId(requestedCategoryId);
    }
  }, [activeMapType.categories, requestedCategoryId]);

  useEffect(() => {
    if (!activeMapType.categories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(activeMapType.categories[0]?.id ?? "point");
    }
  }, [activeCategoryId, activeMapType]);

  useEffect(() => {
    const firstComponentId = activeCategory.components[0]?.id;

    if (
      !requestedComponentId
      || requestedComponentId === firstComponentId
      || (requestedCategoryId && activeCategory.id !== requestedCategoryId)
    ) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`manual-component-${requestedComponentId}`)?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeCategory.id, requestedCategoryId, requestedComponentId]);

  const returnToShowcaseHref = `${import.meta.env.BASE_URL}showcase/?lang=${lang}#components`;

  return (
    <section className={`ManualScene${isFromShowcase ? " ManualScene--from-showcase" : ""}`}>
      {isFromShowcase ? (
        <a className="ManualReturnLink" href={returnToShowcaseHref}>
          <ArrowLeft aria-hidden="true" size={16} />
          <span>{t("manual.returnToShowcase")}</span>
        </a>
      ) : null}
      {isFromShowcase ? <span className="ManualShowcaseEyebrow">{t("manual.eyebrow")}</span> : null}
      <WorkbenchPageHeader description={t("manual.intro")} title={t("manual.title")} />

      <nav className="ManualHierarchy" aria-label={t("manual.hierarchy")}>
        {isFromShowcase ? (
          <section className="ManualHierarchy__layer ManualHierarchy__layer--map">
            <h2>{t("manual.layers.mapType")}</h2>
            <div className="ManualHierarchy__fixedMapType">
              <strong>{t(activeMapType.labelKey)}</strong>
              <span>{t(activeMapType.descriptionKey)}</span>
            </div>
          </section>
        ) : (
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
        )}

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
