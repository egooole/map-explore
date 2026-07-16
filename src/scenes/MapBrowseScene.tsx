import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ManualCategoryId, ManualComponentSpec } from "../components/ComponentCard";
import { MapCanvas, type PreviewMarkerGroup, type PreviewRouteGroup } from "../components/MapCanvas";
import { createDefaultControls, ParamPanel } from "../components/ParamPanel";
import componentSpecs from "../config/componentSpecs.json";
import { createPreviewMarkers, createPreviewRoutes, getPreviewZoom } from "../config/manualPreview";
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

type SelectionState = Record<string, string[]>;

function selectionKey(mapTypeId: MapCategory, categoryId: ManualCategoryId) {
  return `${mapTypeId}:${categoryId}`;
}

function getSelectionMode(categoryId?: ManualCategoryId) {
  return categoryId === "line" ? "single" : "multiple";
}

function getDefaultSelectedIds(category?: BrowseCategory) {
  if (!category) {
    return [];
  }

  if (getSelectionMode(category.id) === "single") {
    return category.components[0] ? [category.components[0].id] : [];
  }

  return category.components.map((component) => component.id);
}

interface CompactCheckboxListProps {
  items: Array<{
    description: string;
    id: string;
    label: string;
  }>;
  onToggle: (id: string) => void;
  selectionMode: "multiple" | "single";
  selectedIds: string[];
}

function CompactCheckboxList({ items, onToggle, selectedIds, selectionMode }: CompactCheckboxListProps) {
  const selectedSet = new Set(selectedIds);
  const inputType = selectionMode === "single" ? "radio" : "checkbox";

  return (
    <div className="BrowseCheckboxList">
      {items.map((item) => (
        <label className="BrowseCheckboxItem" key={item.id} title={item.description}>
          <input checked={selectedSet.has(item.id)} name="browse-component-filter" onChange={() => onToggle(item.id)} type={inputType} />
          <span className="BrowseCheckboxItem__box" aria-hidden="true" />
          <span className="BrowseCheckboxItem__copy">
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </span>
        </label>
      ))}
    </div>
  );
}

export function MapBrowseScene() {
  const { t } = useTranslation();
  const { mapCategory, lang, mapTheme } = useWorkbenchStore();
  const [controls, setControls] = useState(createDefaultControls);
  const activeMapType = browseSpecDocument.mapTypes.find((item) => item.id === mapCategory) ?? browseSpecDocument.mapTypes[0];
  const [activeCategoryId, setActiveCategoryId] = useState<ManualCategoryId>(activeMapType.categories[0]?.id ?? "point");
  const activeCategory = activeMapType.categories.find((category) => category.id === activeCategoryId) ?? activeMapType.categories[0];
  const [selectedByCategory, setSelectedByCategory] = useState<SelectionState>({});
  const currentSelectionKey = selectionKey(mapCategory, activeCategoryId);
  const selectedComponentIds = selectedByCategory[currentSelectionKey] ?? getDefaultSelectedIds(activeCategory);
  const selectedComponentIdSet = useMemo(() => new Set(selectedComponentIds), [selectedComponentIds]);
  const selectedComponents = useMemo(
    () => activeCategory?.components.filter((component) => selectedComponentIdSet.has(component.id)) ?? [],
    [activeCategory, selectedComponentIdSet],
  );
  const selectedLineComponents = selectedComponents.filter((component) => component.previewType === "line");
  const selectionMode = getSelectionMode(activeCategoryId);
  const dynamicRouteFamily = selectedLineComponents.length === 1 ? selectedLineComponents[0].routeFamily : undefined;
  const previewMarkerGroups = useMemo<PreviewMarkerGroup[] | undefined>(() => {
    if (activeCategoryId !== "point") {
      return undefined;
    }

    const groups = selectedComponents.reduce<PreviewMarkerGroup[]>((items, component) => {
      const markers = createPreviewMarkers(component, t);
      if (component.markerFamily && markers?.length) {
        items.push({
          distribution: component.previewDistribution,
          family: component.markerFamily,
          markers,
        });
      }
      return items;
    }, []);

    return groups.length ? groups : undefined;
  }, [activeCategoryId, selectedComponents, t]);
  const previewRouteGroups = useMemo<PreviewRouteGroup[] | undefined>(() => {
    if (activeCategoryId !== "line" || dynamicRouteFamily) {
      return undefined;
    }

    const groups = selectedComponents.reduce<PreviewRouteGroup[]>((items, component) => {
      const routes = createPreviewRoutes(component, t);
      if (component.routeFamily && routes?.length) {
        items.push({
          family: component.routeFamily,
          routes,
        });
      }
      return items;
    }, []);

    return groups.length ? groups : undefined;
  }, [activeCategoryId, dynamicRouteFamily, selectedComponents, t]);
  const previewRegionIds = useMemo(() => {
    if (activeCategoryId !== "area" && activeCategoryId !== "container") {
      return undefined;
    }

    const ids = selectedComponents.flatMap((component) => component.regionIds ?? []);
    return ids.length ? [...new Set(ids)] : undefined;
  }, [activeCategoryId, selectedComponents]);
  // 筛选只控制元素显隐，不参与决定地图视角，避免勾选/取消时重置地图中心或缩放。
  const previewDistribution = activeCategory?.components[0]?.previewDistribution;

  useEffect(() => {
    if (!activeMapType.categories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(activeMapType.categories[0]?.id ?? "point");
    }
  }, [activeCategoryId, activeMapType]);

  useEffect(() => {
    setSelectedByCategory((current) => {
      const next = { ...current };
      for (const category of activeMapType.categories) {
        const key = selectionKey(activeMapType.id, category.id);
        if (!next[key]) {
          next[key] = getDefaultSelectedIds(category);
        }
      }
      return next;
    });
  }, [activeMapType]);

  useEffect(() => {
    const firstComponent = activeCategory?.components[0];
    if (!firstComponent) {
      return;
    }

    setControls((currentControls) => ({
      ...currentControls,
      markerStyle: activeCategoryId === "point" ? "pin" : "default",
      showMapUi: activeCategory?.components.some((component) => component.previewDistribution === "chinaCluster") ? true : currentControls.showMapUi,
      zoom: getPreviewZoom(firstComponent),
    }));
  }, [activeCategory, activeCategoryId]);

  const toggleComponent = (componentId: string) => {
    setSelectedByCategory((current) => {
      if (selectionMode === "single") {
        return {
          ...current,
          [currentSelectionKey]: [componentId],
        };
      }

      const currentIds = current[currentSelectionKey] ?? getDefaultSelectedIds(activeCategory);
      const selectedSet = new Set(currentIds);
      if (selectedSet.has(componentId)) {
        selectedSet.delete(componentId);
      } else {
        selectedSet.add(componentId);
      }

      return {
        ...current,
        [currentSelectionKey]: activeCategory?.components
          .map((component) => component.id)
          .filter((id) => selectedSet.has(id)) ?? [],
      };
    });
  };

  const filterItems =
    activeCategory?.components.map((component) => ({
      description: t(component.descriptionKey),
      id: component.id,
      label: t(component.nameKey),
    })) ?? [];

  return (
    <section className="MapBrowseScene">
      <MapCanvas
        controls={controls}
        dynamicRouteFamily={dynamicRouteFamily}
        hidePreviewContent={selectedComponents.length === 0}
        lang={lang}
        mapCategory={mapCategory}
        mapTheme={mapTheme}
        previewDistribution={previewDistribution}
        previewFeature={activeCategoryId}
        previewMarkerGroups={previewMarkerGroups}
        previewRegionIds={previewRegionIds}
        previewRouteGroups={previewRouteGroups}
        previewRouteFamily={dynamicRouteFamily}
        previewRoutes={
          dynamicRouteFamily && selectedLineComponents[0] ? createPreviewRoutes(selectedLineComponents[0], t) : undefined
        }
      />
      <aside className="BrowseInspector">
        <section className="BrowseComponentPicker" aria-label={t("browse.components.aria")}>
          <header>
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

          <CompactCheckboxList
            items={filterItems}
            selectedIds={selectedComponentIds}
            selectionMode={selectionMode}
            onToggle={toggleComponent}
          />
        </section>

        <ParamPanel controls={controls} onChange={setControls} showMarkerStyle={activeCategoryId === "point"} />
      </aside>
    </section>
  );
}
