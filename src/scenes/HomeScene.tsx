import {
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Crosshair,
  MapPinned,
  Route,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import homeHeroPlaceholder from "../assets/home-hero-placeholder.png";
import {
  MapCanvas,
  type MapCanvasProps,
  type PreviewMarkerGroup,
  type PreviewRouteGroup,
} from "../components/MapCanvas";
import { useWorkbenchStore } from "../store/workbenchStore";
import type {
  CustomMarkerContent,
  MapControlsState,
  MarkerPreviewFamily,
  MarkerPreviewState,
  MarkerPreviewVariant,
  RoutePreviewFamily,
  RoutePreviewVariant,
} from "../types";

type SpatialCategory = "location" | "route" | "area";
type PreviewState = "default" | "hover" | "selected";
type CaseId = "operations" | "dispatch" | "tracking" | "network";

interface ComponentOption {
  id: string;
  category: SpatialCategory;
}

const componentOptions: ComponentOption[] = [
  { category: "location", id: "normalLocation" },
  { category: "location", id: "informatedLocation" },
  { category: "location", id: "cumulativeLocation" },
  { category: "location", id: "customLocation" },
  { category: "route", id: "normalRoute" },
  { category: "route", id: "directionalRoute" },
  { category: "route", id: "routeWithEndpoints" },
  { category: "route", id: "progressRoute" },
  { category: "area", id: "areaSelection" },
  { category: "area", id: "multipleAreas" },
  { category: "area", id: "regionLabel" },
];

const categoryIds: SpatialCategory[] = ["location", "route", "area"];
const previewStates: PreviewState[] = ["default", "hover", "selected"];
const caseIds: CaseId[] = ["operations", "dispatch", "tracking", "network"];

const createHomeControls = (zoom: number): MapControlsState => ({
  activeRouteId: "home-route",
  markerStyle: "dot",
  routeNodes: [
    { id: "start", value: "" },
    { id: "middle", value: "" },
    { id: "end", value: "" },
  ],
  routes: [],
  showMapUi: false,
  zoom,
});

const homeComponentControls = createHomeControls(12);
const homeCaseControls = createHomeControls(11);

const routePreview = (family: RoutePreviewFamily, state: RoutePreviewVariant = "default"): PreviewRouteGroup[] => [
  { family, routes: [{ id: state, label: state }], state },
];

const markerVariantForState = (state: PreviewState): MarkerPreviewVariant =>
  state === "hover" ? "emphasized" : state === "selected" ? "selected" : "default";

const routeVariantForState = (state: PreviewState): RoutePreviewVariant =>
  state === "default" ? "default" : "selected";

const markerGroup = (
  family: MarkerPreviewFamily,
  variants: MarkerPreviewVariant[],
  customContents?: CustomMarkerContent[],
): PreviewMarkerGroup => ({
  family,
  markers: variants.map((id, index) => ({
    count: family === "cumulative" ? [28, 12, 42, 18][index % 4] : undefined,
    customContent: customContents?.[index % customContents.length],
    id,
    label: `${family} ${index + 1}`,
  })),
});

function HomeGoogleMap(props: MapCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || shouldMount) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setShouldMount(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      { rootMargin: "280px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [shouldMount]);

  return <div className="HomeGoogleMap" ref={hostRef}>{shouldMount ? <MapCanvas {...props} compact /> : null}</div>;
}

function HeroMapVisual() {
  return (
    <div className="HomeMap HomeMap--hero" aria-label="物流地图主视觉">
      <img className="HomeMap__placeholder" src={homeHeroPlaceholder} alt="物流地图组件组合占位视觉" />
    </div>
  );
}

function ComponentMapVisual({
  category,
  componentId,
  lang,
  mapTheme,
  state,
}: {
  category: SpatialCategory;
  componentId: string;
  lang: MapCanvasProps["lang"];
  mapTheme: MapCanvasProps["mapTheme"];
  state: PreviewState;
}) {
  const markerVariant = markerVariantForState(state);
  const routeVariant = routeVariantForState(state);
  const markerFamilyById: Partial<Record<string, MarkerPreviewFamily>> = {
    cumulativeLocation: "cumulative",
    customLocation: "custom",
    informatedLocation: "informated",
    normalLocation: "normal",
  };
  const routeFamilyById: Partial<Record<string, RoutePreviewFamily>> = {
    directionalRoute: "normalHasArrow",
    normalRoute: "normalNoArrow",
    progressRoute: "routeWithProgress",
    routeWithEndpoints: "routeWithInformatedLocation",
  };
  const markerFamily = markerFamilyById[componentId];
  const routeFamily = routeFamilyById[componentId];
  const customContents: CustomMarkerContent[] = ["warehouse", "shop", "user", "letter", "number"];
  const markers: MarkerPreviewState[] | undefined = markerFamily
    ? Array.from({ length: markerFamily === "cumulative" ? 4 : 8 }, (_, index) => ({
        count: markerFamily === "cumulative" ? [28, 12, 42, 18][index % 4] : undefined,
        customContent: markerFamily === "custom" ? customContents[index % customContents.length] : undefined,
        id: markerVariant,
        label: `${componentId} ${index + 1}`,
      }))
    : undefined;
  const regionIds = componentId === "multipleAreas" ? ["shanghai", "beijing"] : ["huangpu"];

  return (
    <div className={`HomeMap HomeMap--component is-${category} is-${state}`} aria-label="组件状态预览">
      <HomeGoogleMap
        controls={homeComponentControls}
        lang={lang}
        mapCategory="entity"
        mapTheme={mapTheme}
        previewDistribution={markerFamily === "cumulative" ? "chinaCluster" : "local"}
        previewFeature={category === "location" ? "point" : category === "route" ? "line" : "area"}
        previewMarkerFamily={markerFamily}
        previewMarkers={markers}
        previewRegionIds={category === "area" ? regionIds : undefined}
        previewRegionState={state === "default" ? "default" : "selected"}
        previewRouteFamily={routeFamily}
        previewRouteState={routeVariant}
        previewRoutes={routeFamily ? [{ id: routeVariant, label: routeVariant }] : undefined}
      />
    </div>
  );
}

function CaseStage({
  activeCase,
  lang,
  mapTheme,
}: {
  activeCase: CaseId;
  lang: MapCanvasProps["lang"];
  mapTheme: MapCanvasProps["mapTheme"];
}) {
  const configurations: Record<CaseId, Pick<MapCanvasProps, "previewFeature" | "previewMarkerGroups" | "previewRegionIds" | "previewRouteGroups">> = {
    operations: {
      previewFeature: "container",
      previewMarkerGroups: [markerGroup("informated", ["default", "completed"]), markerGroup("normal", ["default", "emphasized"])],
      previewRouteGroups: routePreview("routeWithProgress"),
    },
    dispatch: {
      previewFeature: "container",
      previewMarkerGroups: [markerGroup("normal", ["default", "default"]), markerGroup("custom", ["default"], ["warehouse"])],
      previewRouteGroups: routePreview("routeWithInformatedLocation"),
    },
    tracking: {
      previewFeature: "line",
      previewRouteGroups: routePreview("routeWithProgress"),
    },
    network: {
      previewFeature: "container",
      previewMarkerGroups: [markerGroup("cumulative", ["default", "default", "default"])],
      previewRegionIds: ["shanghai", "huangpu"],
      previewRouteGroups: routePreview("normalHasArrow"),
    },
  };
  const configuration = configurations[activeCase];

  return (
    <div className={`HomeCaseMap is-${activeCase}`} aria-hidden="true">
      <HomeGoogleMap controls={homeCaseControls} lang={lang} mapCategory="entity" mapTheme={mapTheme} {...configuration} />
      <div className="HomeCaseMap__metric">
        <span>ON-TIME RATE</span>
        <strong>{activeCase === "tracking" ? "94.8%" : activeCase === "dispatch" ? "18 min" : "97.2%"}</strong>
      </div>
    </div>
  );
}

export function HomeScene() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang, mapTheme } = useWorkbenchStore();
  const [activeCategory, setActiveCategory] = useState<SpatialCategory>("location");
  const [activeComponentId, setActiveComponentId] = useState("normalLocation");
  const [activeState, setActiveState] = useState<PreviewState>("default");
  const [activeCase, setActiveCase] = useState<CaseId>("operations");
  const visibleComponents = useMemo(
    () => componentOptions.filter((component) => component.category === activeCategory),
    [activeCategory],
  );

  const selectCategory = (category: SpatialCategory) => {
    setActiveCategory(category);
    setActiveComponentId(componentOptions.find((component) => component.category === category)?.id ?? "normalLocation");
    setActiveState("default");
  };

  return (
    <div className="HomeScene">
      <section className="HomeHero">
        <div className="HomeHero__content">
          <span className="HomeEyebrow">MAP LAB · LOGISTICS SPATIAL SYSTEM</span>
          <h1>{t("home.hero.title")}</h1>
          <p>{t("home.hero.description")}</p>
          <div className="HomeHero__actions">
            <button className="HomeButton HomeButton--primary" onClick={() => navigate("/browse")} type="button">
              {t("home.hero.explore")}<ArrowRight size={16} />
            </button>
            <button className="HomeButton HomeButton--secondary" onClick={() => navigate("/manual")} type="button">
              {t("home.hero.components")}
            </button>
          </div>
        </div>
        <HeroMapVisual />
        <div className="HomeHeroSummary">
          {(["endToEnd", "model", "global"] as const).map((item, index) => (
            <article key={item}>
              <span>0{index + 1}</span>
              <div><strong>{t(`home.summary.${item}.title`)}</strong><small>{t(`home.summary.${item}.description`)}</small></div>
            </article>
          ))}
        </div>
      </section>

      <main className="HomeContent">
        <section className="HomeSection HomeContext">
          <header className="HomeSectionHeader">
            <span>{t("home.sections.context.eyebrow")}</span>
            <h2>{t("home.sections.context.title")}</h2>
            <p>{t("home.sections.context.description")}</p>
          </header>
          <div className="HomeContextGrid">
            {(["global", "scenario", "complex"] as const).map((item, index) => (
              <article key={item}>
                <span>0{index + 1}</span><strong>{t(`home.context.${item}.title`)}</strong><p>{t(`home.context.${item}.description`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="HomeSection HomeCapabilities">
          <header className="HomeSectionHeader HomeSectionHeader--center">
            <span>{t("home.sections.capabilities.eyebrow")}</span>
            <h2>{t("home.sections.capabilities.title")}</h2>
            <p>{t("home.sections.capabilities.description")}</p>
          </header>
          <div className="HomeCapabilityGrid">
            {categoryIds.map((category, index) => (
              <article className={`is-${category}`} key={category}>
                <div className="HomeCapabilityGrid__top">
                  <span>0{index + 1}</span>
                  {category === "location" ? <MapPinned size={22} /> : category === "route" ? <Route size={22} /> : <Crosshair size={22} />}
                </div>
                <h3>{t(`home.capabilities.${category}.title`)}</h3>
                <strong>{t(`home.capabilities.${category}.question`)}</strong>
                <p>{t(`home.capabilities.${category}.definition`)}</p>
                <dl>
                  <div><dt>{t("home.capabilities.objects")}</dt><dd>{t(`home.capabilities.${category}.objects`)}</dd></div>
                  <div><dt>{t("home.capabilities.value")}</dt><dd>{t(`home.capabilities.${category}.value`)}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="HomeSection HomeComponents">
          <header className="HomeSectionHeader">
            <span>{t("home.sections.components.eyebrow")}</span>
            <h2>{t("home.sections.components.title")}</h2>
            <p>{t("home.sections.components.description")}</p>
          </header>
          <div className="HomeComponentExplorer">
            <div className="HomeComponentTabs" role="tablist" aria-label={t("home.components.categoryAria")}>
              {categoryIds.map((category) => (
                <button aria-selected={activeCategory === category} className={activeCategory === category ? "is-active" : ""} key={category} onClick={() => selectCategory(category)} role="tab" type="button">
                  {t(`home.capabilities.${category}.title`)}
                </button>
              ))}
            </div>
            <div className="HomeComponentExplorer__body">
              <ComponentMapVisual
                category={activeCategory}
                componentId={activeComponentId}
                lang={lang}
                mapTheme={mapTheme}
                state={activeState}
              />
              <aside className="HomeComponentPanel">
                <span className="HomeComponentPanel__category">{t(`home.capabilities.${activeCategory}.title`)}</span>
                <h3>{t(`home.components.items.${activeComponentId}.title`)}</h3>
                <p>{t(`home.components.items.${activeComponentId}.description`)}</p>
                <div className="HomeComponentState" role="group" aria-label={t("home.components.stateAria")}>
                  {previewStates.map((state) => (
                    <button aria-pressed={activeState === state} className={activeState === state ? "is-active" : ""} key={state} onClick={() => setActiveState(state)} type="button">
                      {t(`home.components.states.${state}`)}
                    </button>
                  ))}
                </div>
                <div className="HomeComponentList" role="listbox" aria-label={t("home.components.listAria")}>
                  {visibleComponents.map((component) => (
                    <button aria-selected={activeComponentId === component.id} className={activeComponentId === component.id ? "is-active" : ""} key={component.id} onClick={() => setActiveComponentId(component.id)} role="option" type="button">
                      <span>{t(`home.components.items.${component.id}.title`)}</span>{activeComponentId === component.id ? <Check size={15} /> : null}
                    </button>
                  ))}
                </div>
                <button className="HomeTextLink" onClick={() => navigate("/manual")} type="button">
                  {t("home.components.openManual")}<ArrowRight size={15} />
                </button>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <section className="HomeCases">
        <div className="HomeCases__inner">
          <header className="HomeSectionHeader">
            <span>{t("home.sections.cases.eyebrow")}</span>
            <h2>{t("home.sections.cases.title")}</h2>
            <p>{t("home.sections.cases.description")}</p>
          </header>
          <div className="HomeCaseStage">
            <div className="HomeCaseTabs" role="tablist" aria-label={t("home.cases.aria")}>
              {caseIds.map((caseId) => (
                <button aria-selected={activeCase === caseId} className={activeCase === caseId ? "is-active" : ""} key={caseId} onClick={() => setActiveCase(caseId)} role="tab" type="button">
                  {t(`home.cases.${caseId}.title`)}
                </button>
              ))}
            </div>
            <CaseStage activeCase={activeCase} lang={lang} mapTheme={mapTheme} />
            <aside className="HomeCaseDetail">
              <span>{t(`home.cases.${activeCase}.index`)}</span>
              <h3>{t(`home.cases.${activeCase}.title`)}</h3>
              {(["problem", "components", "outcome"] as const).map((field) => (
                <div key={field}><small>{t(`home.cases.labels.${field}`)}</small><p>{t(`home.cases.${activeCase}.${field}`)}</p></div>
              ))}
              <button className="HomeTextLink" onClick={() => navigate("/use-case")} type="button">
                {t("home.cases.open")}<ArrowRight size={15} />
              </button>
            </aside>
          </div>
        </div>
      </section>

      <section className="HomeSection HomeStart">
        <header className="HomeSectionHeader HomeSectionHeader--center">
          <span>{t("home.sections.start.eyebrow")}</span>
          <h2>{t("home.sections.start.title")}</h2>
          <p>{t("home.sections.start.description")}</p>
        </header>
        <div className="HomeStartGrid">
          {(["designer", "engineer"] as const).map((role) => (
            <article key={role}>
              <div className="HomeStartGrid__heading">
                {role === "designer" ? <BookOpen size={22} /> : <Code2 size={22} />}
                <div><span>{t(`home.start.${role}.role`)}</span><h3>{t(`home.start.${role}.title`)}</h3></div>
              </div>
              <ul>
                {(["item1", "item2", "item3"] as const).map((item) => (
                  <li key={item}><Check size={14} />{t(`home.start.${role}.${item}`)}</li>
                ))}
              </ul>
              <button className="HomeButton HomeButton--secondary" onClick={() => navigate(role === "designer" ? "/manual" : "/guide")} type="button">
                {t(`home.start.${role}.cta`)}<ArrowRight size={15} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
