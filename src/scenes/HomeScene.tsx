import {
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Crosshair,
  MapPinned,
  Route,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import heroBasemap from "../assets/hero-basemap.jpg";
import homeHeroPlaceholder from "../assets/home-hero-placeholder.png";
import informatedLocationPin from "../assets/route/location-pin.svg";
import progressLocationPin from "../assets/route/progress-location.svg";
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
type CaseId = "operations" | "dispatch" | "tracking" | "network";

interface ComponentOption {
  id: string;
  category: SpatialCategory;
}

interface HomeSceneProps {
  heroVisualVariant?: "mapLab" | "reference";
  standalone?: boolean;
}

interface DispatchRoute {
  colorId: NonNullable<PreviewRouteGroup["colorId"]>;
  duration: string;
  id: string;
  path: NonNullable<PreviewRouteGroup["path"]>;
  status: "completed" | "inProgress" | "notStarted";
  stopPositions: NonNullable<PreviewRouteGroup["stopPositions"]>;
  stopsCompleted: number;
  stopsTotal: number;
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
const caseIds: CaseId[] = ["operations", "dispatch", "tracking", "network"];
const designerComponentLibraryUrl =
  "https://www.figma.com/design/GVhj9D0029ntbz47c0o4TY/%F0%9F%8E%AD-Logisitics-UI-Model-Room?node-id=2196-33757&t=kAfC0aYjY475MbsJ-1";

const heroRoutePath =
  "M157 236 L180 245 L240 287 C260 296 280 300 300 300 L375 310 C400 318 418 334 435 348 L480 374 L570 428 C590 437 605 430 615 421 C625 405 632 395 650 394 L705 398 L730 402 C760 410 785 428 810 430 C830 428 850 402 868 381";
const heroAreaPoints = "790,262 912,226 976,287 988,440 912,528 745,456 728,402 746,330";
const heroWarehousePoints = "12,212 98,124 206,198 130,290";

const dispatchRoutes: DispatchRoute[] = [
  {
    colorId: "route1",
    duration: "18 min",
    id: "dispatch-route-1",
    path: [
      { lat: 31.188, lng: 121.337 },
      { lat: 31.199, lng: 121.372 },
      { lat: 31.214, lng: 121.411 },
      { lat: 31.228, lng: 121.449 },
      { lat: 31.249, lng: 121.477 },
      { lat: 31.283, lng: 121.499 },
      { lat: 31.318, lng: 121.513 },
    ],
    status: "notStarted",
    stopPositions: [
      { lat: 31.188, lng: 121.337 },
      { lat: 31.199, lng: 121.372 },
      { lat: 31.214, lng: 121.411 },
      { lat: 31.249, lng: 121.477 },
      { lat: 31.283, lng: 121.499 },
      { lat: 31.318, lng: 121.513 },
    ],
    stopsCompleted: 0,
    stopsTotal: 6,
  },
  {
    colorId: "route2",
    duration: "26 min",
    id: "dispatch-route-2",
    path: [
      { lat: 31.326, lng: 121.384 },
      { lat: 31.304, lng: 121.407 },
      { lat: 31.278, lng: 121.439 },
      { lat: 31.251, lng: 121.468 },
      { lat: 31.226, lng: 121.501 },
      { lat: 31.207, lng: 121.544 },
      { lat: 31.19, lng: 121.58 },
    ],
    status: "inProgress",
    stopPositions: [
      { lat: 31.326, lng: 121.384 },
      { lat: 31.304, lng: 121.407 },
      { lat: 31.278, lng: 121.439 },
      { lat: 31.251, lng: 121.468 },
      { lat: 31.226, lng: 121.501 },
      { lat: 31.207, lng: 121.544 },
      { lat: 31.198, lng: 121.562 },
      { lat: 31.19, lng: 121.58 },
    ],
    stopsCompleted: 3,
    stopsTotal: 8,
  },
  {
    colorId: "route3",
    duration: "32 min",
    id: "dispatch-route-3",
    path: [
      { lat: 31.162, lng: 121.43 },
      { lat: 31.181, lng: 121.449 },
      { lat: 31.207, lng: 121.467 },
      { lat: 31.237, lng: 121.484 },
      { lat: 31.269, lng: 121.458 },
      { lat: 31.299, lng: 121.438 },
      { lat: 31.337, lng: 121.451 },
    ],
    status: "completed",
    stopPositions: [
      { lat: 31.162, lng: 121.43 },
      { lat: 31.207, lng: 121.467 },
      { lat: 31.269, lng: 121.458 },
      { lat: 31.337, lng: 121.451 },
    ],
    stopsCompleted: 4,
    stopsTotal: 4,
  },
];

const dispatchRouteGroups: PreviewRouteGroup[] = dispatchRoutes.map((route) => ({
  colorId: route.colorId,
  family: route.status === "inProgress" ? "routeWithProgress" : "routeWithInformatedLocation",
  id: route.id,
  path: route.path,
  progressPointIndex: route.status === "inProgress" ? route.stopsCompleted - 1 : undefined,
  routes: [{ id: "default", label: route.id }],
  state: "default",
  stopPositions: route.stopPositions,
}));

const networkRegionShapes: NonNullable<MapCanvasProps["previewRegionShapes"]> = [
  {
    color: "#2A3EF4",
    id: "network-west",
    name: "West service area",
    path: [
      { lat: 31.31, lng: 121.28 },
      { lat: 31.36, lng: 121.34 },
      { lat: 31.33, lng: 121.41 },
      { lat: 31.27, lng: 121.43 },
      { lat: 31.23, lng: 121.36 },
      { lat: 31.26, lng: 121.29 },
    ],
  },
  {
    color: "#009995",
    id: "network-central",
    name: "Central service area",
    path: [
      { lat: 31.28, lng: 121.44 },
      { lat: 31.32, lng: 121.5 },
      { lat: 31.28, lng: 121.57 },
      { lat: 31.21, lng: 121.56 },
      { lat: 31.18, lng: 121.49 },
      { lat: 31.22, lng: 121.43 },
    ],
  },
  {
    color: "#9583FF",
    id: "network-east",
    name: "East service area",
    path: [
      { lat: 31.25, lng: 121.59 },
      { lat: 31.3, lng: 121.66 },
      { lat: 31.26, lng: 121.73 },
      { lat: 31.18, lng: 121.72 },
      { lat: 31.14, lng: 121.64 },
      { lat: 31.19, lng: 121.58 },
    ],
  },
];

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
const homeCumulativeControls = createHomeControls(4);
const homeCaseControls = createHomeControls(11);

const routePreview = (family: RoutePreviewFamily, state: RoutePreviewVariant = "default"): PreviewRouteGroup[] => [
  { family, routes: [{ id: state, label: state }], state },
];

const markerGroup = (
  family: MarkerPreviewFamily,
  variants: MarkerPreviewVariant[],
  customContents?: CustomMarkerContent[],
  positions?: PreviewMarkerGroup["positions"],
): PreviewMarkerGroup => ({
  family,
  markers: variants.map((id, index) => ({
    count: family === "cumulative" ? [28, 12, 42, 18][index % 4] : undefined,
    customContent: customContents?.[index % customContents.length],
    id,
    label: `${family} ${index + 1}`,
  })),
  positions,
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

function HeroMapVisual({
  standalone = false,
}: {
  standalone?: boolean;
}) {
  const instanceId = useId().replace(/:/g, "");

  if (standalone) {
    const glowId = `hero-glow-${instanceId}`;
    const routeId = `hero-route-${instanceId}`;

    return (
      <div className="HeroBleedMap" aria-hidden="true">
        <img className="HeroBleedMap__image" src={heroBasemap} alt="" />
        <svg className="HeroBleedMap__overlay" viewBox="0 0 1000 849">
          <defs>
            <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>

          <polygon className="HeroBleedMap__areaFill" points={heroAreaPoints} />
          <polygon className="HeroBleedMap__areaStroke" points={heroAreaPoints} />
          <polygon className="HeroBleedMap__warehouseFill" points={heroWarehousePoints} />
          <polygon className="HeroBleedMap__warehouseStroke" points={heroWarehousePoints} />

          <path className="HeroBleedMap__routeGlow" d={heroRoutePath} filter={`url(#${glowId})`} />
          <path className="HeroBleedMap__routeOutline" d={heroRoutePath} />
          <path className="HeroBleedMap__route" d={heroRoutePath} id={routeId} />
          <path className="HeroBleedMap__routeFlow" d={heroRoutePath} />

          {["0s", "-1.4s", "-2.8s", "-4.2s", "-5.6s"].map((begin) => (
            <g className="HeroBleedMap__routeArrow" key={begin}>
              <path d="M-7 -4 L0 0 L-7 4" />
              <animateMotion begin={begin} dur="7s" repeatCount="indefinite" rotate="auto">
                <mpath href={`#${routeId}`} />
              </animateMotion>
            </g>
          ))}

          <image className="HeroBleedMap__pin" href={informatedLocationPin} height="63" width="60" x="127" y="173" />
          <image className="HeroBleedMap__pin" href={informatedLocationPin} height="63" width="60" x="838" y="318" />
          <circle className="HeroBleedMap__progressPulse" cx="615" cy="421" r="18" />
          <image className="HeroBleedMap__progressPin" href={progressLocationPin} height="40" width="40" x="595" y="401" />
        </svg>
      </div>
    );
  }

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
}: {
  category: SpatialCategory;
  componentId: string;
  lang: MapCanvasProps["lang"];
  mapTheme: MapCanvasProps["mapTheme"];
}) {
  const markerVariant: MarkerPreviewVariant = "default";
  const routeVariant: RoutePreviewVariant = "default";
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
  const componentControls = markerFamily === "cumulative" ? homeCumulativeControls : homeComponentControls;
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
    <div className={`HomeMap HomeMap--component is-${category}`} aria-label="组件交互预览">
      <HomeGoogleMap
        controls={componentControls}
        lang={lang}
        mapCategory="entity"
        mapTheme={mapTheme}
        previewDistribution={markerFamily === "cumulative" ? "chinaCluster" : "local"}
        previewFeature={category === "location" ? "point" : category === "route" ? "line" : "area"}
        previewMarkerFamily={markerFamily}
        previewMarkers={markers}
        previewRegionIds={category === "area" ? regionIds : undefined}
        previewRegionState="default"
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
  const { t } = useTranslation();
  const [selectedDispatchRouteId, setSelectedDispatchRouteId] = useState<string | null>(null);
  const [hoveredDispatchRouteId, setHoveredDispatchRouteId] = useState<string | null>(null);
  const selectedDispatchRoute = dispatchRoutes.find((route) => route.id === selectedDispatchRouteId) ?? dispatchRoutes[0];
  const selectDispatchRoute = (routeId: string) => {
    setSelectedDispatchRouteId((currentRouteId) => currentRouteId === routeId ? null : routeId);
    setHoveredDispatchRouteId(null);
  };
  const configurations: Record<CaseId, Pick<MapCanvasProps, "previewFeature" | "previewMarkerGroups" | "previewRegionColors" | "previewRegionIds" | "previewRegionShapes" | "previewRouteGroups">> = {
    operations: {
      previewFeature: "point",
      previewMarkerGroups: [
        markerGroup(
          "custom",
          ["default", "default", "default", "default", "default", "default", "default", "default"],
          ["warehouse", "shop", "user", "letter", "number"],
        ),
      ],
    },
    dispatch: {
      previewFeature: "line",
      previewRouteGroups: dispatchRouteGroups,
    },
    tracking: {
      previewFeature: "line",
      previewRouteGroups: routePreview("routeWithProgress"),
    },
    network: {
      previewFeature: "area",
      previewRegionShapes: networkRegionShapes,
    },
  };
  const configuration = configurations[activeCase];

  return (
    <div className={`HomeCaseMap is-${activeCase}`}>
      {activeCase === "dispatch" ? (
        <div className="HomeDispatchRoutes" role="listbox" aria-label={t("home.cases.dispatch.routeListAria")}>
          <header className="HomeDispatchRoutes__header">
            <span>{t("home.cases.dispatch.routeListTitle")}</span>
            <strong>{dispatchRoutes.length}</strong>
          </header>
          {dispatchRoutes.map((route, index) => {
            const selected = route.id === selectedDispatchRouteId;
            const hovered = route.id === hoveredDispatchRouteId;
            const dimmed = Boolean(selectedDispatchRouteId && !selected && !hovered);
            return (
              <button
                aria-selected={selected}
                className={[selected ? "is-selected" : "", hovered ? "is-hovered" : "", dimmed ? "is-dimmed" : ""]
                  .filter(Boolean)
                  .join(" ")}
                key={route.id}
                onBlur={() => setHoveredDispatchRouteId((currentRouteId) => currentRouteId === route.id ? null : currentRouteId)}
                onClick={() => selectDispatchRoute(route.id)}
                onFocus={() => setHoveredDispatchRouteId(route.id)}
                onMouseEnter={() => setHoveredDispatchRouteId(route.id)}
                onMouseLeave={() => setHoveredDispatchRouteId((currentRouteId) => currentRouteId === route.id ? null : currentRouteId)}
                role="option"
                type="button"
              >
                <span className={`HomeDispatchRoutes__swatch is-${route.colorId}`} aria-hidden="true" />
                <span className="HomeDispatchRoutes__content">
                  <strong>{t(`home.cases.dispatch.routes.${index + 1}.name`)}</strong>
                  <span>{route.stopsCompleted > 0 ? `${route.stopsCompleted}/` : ""}{route.stopsTotal} stops</span>
                  <small className={`is-${route.status}`}>{t(`home.cases.dispatch.status.${route.status}`)}</small>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="HomeCaseMap__canvas" aria-hidden="true">
        <HomeGoogleMap
          controls={homeCaseControls}
          lang={lang}
          mapCategory="entity"
          mapTheme={mapTheme}
          onPreviewRouteClearSelection={activeCase === "dispatch" ? () => setSelectedDispatchRouteId(null) : undefined}
          onPreviewRouteHover={activeCase === "dispatch" ? setHoveredDispatchRouteId : undefined}
          onPreviewRouteSelect={activeCase === "dispatch" ? selectDispatchRoute : undefined}
          previewHoveredRouteId={activeCase === "dispatch" ? hoveredDispatchRouteId ?? undefined : undefined}
          previewSelectedRouteId={activeCase === "dispatch" ? selectedDispatchRouteId ?? undefined : undefined}
          {...configuration}
        />
      </div>
      <div className="HomeCaseMap__metric">
        <span>ON-TIME RATE</span>
        <strong>{activeCase === "tracking" ? "94.8%" : activeCase === "dispatch" ? selectedDispatchRoute.duration : "97.2%"}</strong>
      </div>
    </div>
  );
}

export function HomeScene({ standalone = false }: HomeSceneProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang, mapTheme } = useWorkbenchStore();
  const [activeCategory, setActiveCategory] = useState<SpatialCategory>("location");
  const [activeComponentId, setActiveComponentId] = useState("normalLocation");
  const [activeCase, setActiveCase] = useState<CaseId>("operations");
  const [showStartGuide, setShowStartGuide] = useState(false);
  const visibleComponents = useMemo(
    () => componentOptions.filter((component) => component.category === activeCategory),
    [activeCategory],
  );

  const selectCategory = (category: SpatialCategory) => {
    setActiveCategory(category);
    setActiveComponentId(componentOptions.find((component) => component.category === category)?.id ?? "normalLocation");
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  const openWorkbenchRoute = (route: string, sectionId: string) => {
    if (standalone) {
      scrollToSection(sectionId);
      return;
    }
    navigate(route);
  };

  const heroSection = (
    <section className="HomeHero" id="home">
      <div className="HomeHero__content">
        <span className="HomeEyebrow">MAP LAB · LOGISTICS SPATIAL SYSTEM</span>
        <h1>{t("home.hero.title")}</h1>
        <p>{t("home.hero.description")}</p>
        <div className="HomeHero__actions">
          <button className="HomeButton HomeButton--primary" onClick={() => openWorkbenchRoute("/browse", "capabilities")} type="button">
            {t("home.hero.explore")}<ArrowRight size={16} />
          </button>
          <button className="HomeButton HomeButton--secondary" onClick={() => openWorkbenchRoute("/manual", "components")} type="button">
            {t("home.hero.components")}
          </button>
        </div>
      </div>
      {!standalone ? <HeroMapVisual /> : null}
      <div className="HomeHeroSummary">
        {(["endToEnd", "model", "global"] as const).map((item, index) => (
          <article key={item}>
            <span>0{index + 1}</span>
            <div><strong>{t(`home.summary.${item}.title`)}</strong><small>{t(`home.summary.${item}.description`)}</small></div>
          </article>
        ))}
      </div>
    </section>
  );

  return (
    <div className={`HomeScene${standalone ? " HomeScene--standalone" : ""}`}>
      {standalone ? (
        <div className="HomeHeroStage">
          <HeroMapVisual standalone />
          <div className="HomeHeroStage__scrim" aria-hidden="true" />
          {heroSection}
        </div>
      ) : heroSection}

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

        <section className="HomeSection HomeCapabilities" id="capabilities">
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

        <section className="HomeSection HomeComponents" id="components">
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
              />
              <aside className="HomeComponentPanel">
                <span className="HomeComponentPanel__category">{t(`home.capabilities.${activeCategory}.title`)}</span>
                <h3>{t(`home.components.items.${activeComponentId}.title`)}</h3>
                <p>{t(`home.components.items.${activeComponentId}.description`)}</p>
                <div className="HomeComponentList" role="listbox" aria-label={t("home.components.listAria")}>
                  {visibleComponents.map((component) => (
                    <button aria-selected={activeComponentId === component.id} className={activeComponentId === component.id ? "is-active" : ""} key={component.id} onClick={() => setActiveComponentId(component.id)} role="option" type="button">
                      <span>{t(`home.components.items.${component.id}.title`)}</span>{activeComponentId === component.id ? <Check size={15} /> : null}
                    </button>
                  ))}
                </div>
                {standalone ? (
                  <a className="HomeTextLink" href={designerComponentLibraryUrl} rel="noopener noreferrer" target="_blank">
                    {t("home.components.openManual")}<ArrowRight size={15} />
                  </a>
                ) : (
                  <button className="HomeTextLink" onClick={() => navigate("/manual")} type="button">
                    {t("home.components.openManual")}<ArrowRight size={15} />
                  </button>
                )}
              </aside>
            </div>
          </div>
        </section>
      </main>

      <section className="HomeCases" id="use-cases">
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
              {!standalone ? (
                <button className="HomeTextLink" onClick={() => navigate("/use-case")} type="button">
                  {t("home.cases.open")}<ArrowRight size={15} />
                </button>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      <section className="HomeSection HomeStart" id="get-started">
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
              {role === "designer" ? (
                <a
                  className="HomeButton HomeButton--secondary"
                  href={designerComponentLibraryUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t(`home.start.${role}.cta`)}<ArrowRight size={15} />
                </a>
              ) : standalone ? (
                <button
                  aria-controls="showcase-start-guide"
                  aria-expanded={showStartGuide}
                  className={`HomeButton HomeButton--secondary${showStartGuide ? " is-expanded" : ""}`}
                  onClick={() => setShowStartGuide((current) => !current)}
                  type="button"
                >
                  {t(`home.start.${role}.cta`)}<ArrowRight size={15} />
                </button>
              ) : (
                <button className="HomeButton HomeButton--secondary" onClick={() => navigate("/guide")} type="button">
                  {t(`home.start.${role}.cta`)}<ArrowRight size={15} />
                </button>
              )}
            </article>
          ))}
          {standalone && showStartGuide ? (
            <section className="HomeStartGuide" id="showcase-start-guide">
              <header>
                <span>{t("home.start.guide.eyebrow")}</span>
                <h3>{t("home.start.guide.title")}</h3>
                <p>{t("home.start.guide.description")}</p>
              </header>
              <div className="HomeStartGuide__paths">
                <article>
                  <span>{t("home.start.guide.rd.role")}</span>
                  <h4>{t("home.start.guide.rd.title")}</h4>
                  <ol>
                    {(["item1", "item2", "item3"] as const).map((item) => (
                      <li key={item}>{t(`home.start.guide.rd.${item}`)}</li>
                    ))}
                  </ol>
                </article>
                <article>
                  <span>{t("home.start.guide.vibe.role")}</span>
                  <h4>{t("home.start.guide.vibe.title")}</h4>
                  <ol>
                    {(["item1", "item2", "item3"] as const).map((item) => (
                      <li key={item}>{t(`home.start.guide.vibe.${item}`)}</li>
                    ))}
                  </ol>
                </article>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
