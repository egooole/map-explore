import {
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Crosshair,
  Download,
  MapPinned,
  Route,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import heroBasemap from "../assets/hero-basemap.jpg";
import homeHeroPlaceholder from "../assets/home-hero-placeholder.png";
import warehouseLocationAsset from "../assets/custom-location/warehouse.svg";
import informatedLocationAsset from "../assets/informated-location/default.svg";
import progressLocationAsset from "../assets/route/progress-location.svg";
import {
  MapCanvas,
  type MapCanvasProps,
  type PreviewMarkerGroup,
  type PreviewProgressInfo,
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
const caseIds: CaseId[] = ["network", "dispatch", "tracking", "operations"];
const aiDownloadOptions: ReadonlyArray<{
  href?: string;
  id: "agentbody" | "trea" | "zip";
}> = [
  { id: "zip" },
  { id: "agentbody" },
  { id: "trea" },
];
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
  variant = "mapLab",
}: {
  standalone?: boolean;
  variant?: NonNullable<HomeSceneProps["heroVisualVariant"]>;
}) {
  const instanceId = useId().replace(/:/g, "");
  const heroRouteRef = useRef<SVGPathElement | null>(null);
  const heroArrowRefs = useRef<Array<SVGPathElement | null>>([]);
  const heroVehicleRef = useRef<HTMLImageElement | null>(null);
  const [heroArrowCount, setHeroArrowCount] = useState(0);

  useEffect(() => {
    if (!standalone || variant !== "mapLab") {
      return;
    }

    const path = heroRouteRef.current;
    if (!path) {
      return;
    }

    setHeroArrowCount(Math.max(1, Math.floor(path.getTotalLength() / 40)));
  }, [standalone, variant]);

  useEffect(() => {
    if (!standalone || variant !== "mapLab" || heroArrowCount === 0) {
      return;
    }

    const path = heroRouteRef.current;
    const vehicle = heroVehicleRef.current;
    if (!path || !vehicle) {
      return;
    }

    const pathLength = path.getTotalLength();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;
    let arrowOffset = 0;
    let startTime: number | null = null;

    const updatePositions = (vehicleProgress: number) => {
      heroArrowRefs.current.forEach((arrow, index) => {
        if (!arrow) {
          return;
        }

        const distance = (20 + index * 40 + arrowOffset) % pathLength;
        const point = path.getPointAtLength(distance);
        const before = path.getPointAtLength(Math.max(0, distance - 0.75));
        const after = path.getPointAtLength(Math.min(pathLength, distance + 0.75));
        const angle = Math.atan2(after.y - before.y, after.x - before.x) * (180 / Math.PI);
        arrow.setAttribute("transform", `translate(${point.x} ${point.y}) rotate(${angle})`);
      });

      const vehiclePoint = path.getPointAtLength(pathLength * vehicleProgress);
      vehicle.style.left = `${(vehiclePoint.x / 1000) * 100}%`;
      vehicle.style.top = `${(vehiclePoint.y / 849) * 100}%`;
    };

    const animate = (time: number) => {
      if (startTime === null) {
        startTime = time;
      }

      arrowOffset = (arrowOffset + 0.6) % 40;
      const vehicleProgress = ((time - startTime) % 8000) / 8000;
      updatePositions(vehicleProgress);
      animationFrame = window.requestAnimationFrame(animate);
    };

    const syncMotionPreference = () => {
      window.cancelAnimationFrame(animationFrame);
      startTime = null;
      arrowOffset = 0;

      if (reducedMotion.matches) {
        updatePositions(0.5);
        return;
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    syncMotionPreference();
    reducedMotion.addEventListener("change", syncMotionPreference);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      reducedMotion.removeEventListener("change", syncMotionPreference);
    };
  }, [heroArrowCount, standalone, variant]);

  if (standalone) {
    const glowId = `hero-glow-${instanceId}`;
    const routeId = `hero-route-${instanceId}`;

    if (variant === "reference") {
      return (
        <div className="HeroBleedMap" aria-hidden="true">
          <img className="HeroBleedMap__image" src={heroBasemap} alt="" />
          <svg className="HeroBleedMap__overlay" viewBox="0 0 1000 849" preserveAspectRatio="none">
            <defs>
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>

            <polygon className="HeroAnim-breathe" points={heroAreaPoints} fill="#3FD0E8" fillOpacity={0.16} />
            <polygon points={heroAreaPoints} fill="none" stroke="#3FD0E8" strokeOpacity={0.5} strokeWidth={2} strokeLinejoin="round" />
            <polygon className="HeroAnim-march" points={heroAreaPoints} fill="none" stroke="#9CEFFB" strokeWidth={2} strokeLinejoin="round" strokeDasharray="20 8" />

            <polygon points={heroWarehousePoints} fill="#5EE6C8" fillOpacity={0.08} stroke="#5EE6C8" strokeOpacity={0.45} strokeWidth={2} strokeLinejoin="round" />
            <polygon className="HeroAnim-march" points={heroWarehousePoints} fill="none" stroke="#B5F7E8" strokeWidth={1.6} strokeDasharray="14 14" />

            <path d={heroRoutePath} fill="none" stroke="#5A6BFF" strokeWidth={10} strokeOpacity={0.45} strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowId})`} />
            <path id={routeId} className="HeroAnim-draw" d={heroRoutePath} fill="none" stroke="#7C89FF" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            <path className="HeroAnim-flow" d={heroRoutePath} fill="none" stroke="#E6E9FF" strokeWidth={3} strokeLinecap="round" strokeDasharray="36 1144" />

            <g className="HeroAnim-vehicle">
              <circle r={11} fill="#8FA0FF" fillOpacity={0.35} filter={`url(#${glowId})`} />
              <circle r={5} fill="#F2F4FF" />
              <animateMotion dur="7s" repeatCount="indefinite" calcMode="linear">
                <mpath href={`#${routeId}`} />
              </animateMotion>
            </g>

            <circle cx={157} cy={236} r={9} fill="#05070A" stroke="#5EE6C8" strokeWidth={3} />
            <circle cx={157} cy={236} r={3.5} fill="#5EE6C8" />
            <circle className="HeroAnim-ping" cx={157} cy={236} r={9} fill="none" stroke="#5EE6C8" strokeWidth={2} />

            <circle cx={678} cy={394} r={12} fill="#2A3270" stroke="#8FA0FF" strokeWidth={2.5} />
            <path d="M678 387 l6 3.5 v7 l-6 3.5 -6 -3.5 v-7z M672 390.5 l6 3.5 6 -3.5 M678 394 v7" fill="none" stroke="#DDE2FF" strokeWidth={1.4} strokeLinejoin="round" />
            <circle className="HeroAnim-ping" cx={678} cy={394} r={12} fill="none" stroke="#8FA0FF" strokeWidth={2} style={{ animationDelay: "0.8s" }} />

            <circle cx={868} cy={381} r={8} fill="#05070A" stroke="#7CF29A" strokeWidth={3} />
            <circle cx={868} cy={381} r={3.5} fill="#7CF29A" />
            <circle className="HeroAnim-ping" cx={868} cy={381} r={8} fill="none" stroke="#7CF29A" strokeWidth={2} style={{ animationDelay: "1.6s" }} />
          </svg>
        </div>
      );
    }

    return (
      <div className="HeroBleedMap" aria-hidden="true">
        <img className="HeroBleedMap__image" src={heroBasemap} alt="" />
        <svg className="HeroBleedMap__overlay" viewBox="0 0 1000 849">
          <polygon className="HeroBleedMap__areaUnderlay" points={heroAreaPoints} />
          <polygon className="HeroBleedMap__areaFill" points={heroAreaPoints} />
          <polygon className="HeroBleedMap__areaStroke" points={heroAreaPoints} />

          <path className="HeroBleedMap__routeOutline" d={heroRoutePath} />
          <path ref={heroRouteRef} className="HeroBleedMap__route" d={heroRoutePath} />
          <g className="HeroBleedMap__routeArrows">
            {Array.from({ length: heroArrowCount }, (_, index) => (
              <path
                key={index}
                ref={(node) => {
                  heroArrowRefs.current[index] = node;
                }}
                className="HeroBleedMap__routeArrow"
                d="M -3 -5 L 3 0 L -3 5"
              />
            ))}
          </g>
        </svg>

        <div className="HeroBleedMap__vehicleLayer">
          <img
            ref={heroVehicleRef}
            className="HeroBleedMap__vehicle"
            src={progressLocationAsset}
            alt=""
          />
        </div>

        <div className="HeroBleedMap__markerLayer">
          <span
            className="HeroBleedMap__marker HeroBleedMap__marker--warehouse"
            style={{ left: "15.7%", top: `${(236 / 849) * 100}%` }}
          >
            <span className="HeroBleedMap__markerPulse" />
            <img src={warehouseLocationAsset} alt="" />
          </span>
          <span
            className="HeroBleedMap__marker HeroBleedMap__marker--normal"
            style={{ left: "61.5%", top: `${(421 / 849) * 100}%` }}
          >
            <span className="HeroBleedMap__markerPulse" />
            <span className="HeroBleedMap__normalPoint" />
          </span>
          <span
            className="HeroBleedMap__marker HeroBleedMap__marker--informated"
            style={{ left: "86.8%", top: `${(381 / 849) * 100}%` }}
          >
            <span className="HeroBleedMap__markerPulse" />
            <img src={informatedLocationAsset} alt="" />
          </span>
        </div>
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
  const [showTrackingDriverInfo, setShowTrackingDriverInfo] = useState(false);
  const selectedDispatchRoute = dispatchRoutes.find((route) => route.id === selectedDispatchRouteId) ?? dispatchRoutes[0];
  const selectDispatchRoute = (routeId: string) => {
    setSelectedDispatchRouteId((currentRouteId) => currentRouteId === routeId ? null : routeId);
    setHoveredDispatchRouteId(null);
  };
  const networkAreaConfiguration: Pick<MapCanvasProps, "previewFeature" | "previewMarkerGroups" | "previewRegionColors" | "previewRegionInteraction" | "previewRegionIds" | "previewRegionMetrics" | "previewRegionShapes" | "previewRegionStyles" | "previewRouteGroups"> = {
    previewFeature: "area",
    previewRegionInteraction: "multi",
    previewRegionIds: ["yangpu", "xuhui", "baoshan"],
    previewRegionMetrics: {
      baoshan: [
        { label: "Coverage", value: "76%" },
        { label: "ADO", value: "8,360" },
        { label: "Density", value: "118" },
        { label: "Facility", value: "5" },
      ],
      xuhui: [
        { label: "Coverage", value: "88%" },
        { label: "ADO", value: "10,920" },
        { label: "Density", value: "172" },
        { label: "Facility", value: "7" },
      ],
      yangpu: [
        { label: "Coverage", value: "92%" },
        { label: "ADO", value: "12,480" },
        { label: "Density", value: "186" },
        { label: "Facility", value: "8" },
      ],
    },
    previewRegionStyles: {
      baoshan: { fillColor: "#9583FF", strokeColor: "#8575FF" },
      xuhui: { fillColor: "#02A5A0", strokeColor: "#02A5A0" },
      yangpu: { fillColor: "#1966FF", strokeColor: "#2A3EF4" },
    },
  };
  const configurations: Record<CaseId, Pick<MapCanvasProps, "previewFeature" | "previewMarkerGroups" | "previewRegionColors" | "previewRegionInteraction" | "previewRegionIds" | "previewRegionMetrics" | "previewRegionShapes" | "previewRegionStyles" | "previewRouteGroups">> = {
    operations: networkAreaConfiguration,
    dispatch: {
      previewFeature: "line",
      previewRouteGroups: dispatchRouteGroups,
    },
    tracking: {
      previewFeature: "line",
      previewRouteGroups: routePreview("routeWithProgress"),
    },
    network: networkAreaConfiguration,
  };
  const configuration = configurations[activeCase];
  const trackingDriverInfo: PreviewProgressInfo = {
    title: t("home.cases.tracking.driver.name"),
    metrics: [
      {
        label: t("home.cases.tracking.driver.completed"),
        value: t("home.cases.tracking.driver.completedValue"),
      },
      {
        label: t("home.cases.tracking.driver.status"),
        value: t("home.cases.tracking.driver.statusValue"),
      },
      {
        label: t("home.cases.tracking.driver.onTimeRate"),
        value: t("home.cases.tracking.driver.onTimeRateValue"),
      },
      {
        label: t("home.cases.tracking.driver.remaining"),
        value: t("home.cases.tracking.driver.remainingValue"),
      },
      {
        label: t("home.cases.tracking.driver.returnRisk"),
        value: t("home.cases.tracking.driver.returnRiskValue"),
      },
    ],
  };

  useEffect(() => {
    if (activeCase !== "tracking") {
      setShowTrackingDriverInfo(false);
    }
  }, [activeCase]);

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
            const canHover = !selectedDispatchRouteId || selected;
            const hovered = canHover && route.id === hoveredDispatchRouteId;
            const dimmed = Boolean(selectedDispatchRouteId && !selected);
            return (
              <button
                aria-selected={selected}
                className={[selected ? "is-selected" : "", hovered ? "is-hovered" : "", dimmed ? "is-dimmed" : ""]
                  .filter(Boolean)
                  .join(" ")}
                key={route.id}
                onBlur={() => setHoveredDispatchRouteId((currentRouteId) => currentRouteId === route.id ? null : currentRouteId)}
                onClick={() => selectDispatchRoute(route.id)}
                onFocus={() => {
                  if (canHover) setHoveredDispatchRouteId(route.id);
                }}
                onMouseEnter={() => {
                  if (canHover) setHoveredDispatchRouteId(route.id);
                }}
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
      <div className="HomeCaseMap__canvas">
        <HomeGoogleMap
          controls={homeCaseControls}
          lang={lang}
          mapCategory="entity"
          mapTheme={mapTheme}
          onPreviewProgressClearSelection={activeCase === "tracking" ? () => setShowTrackingDriverInfo(false) : undefined}
          onPreviewProgressSelect={activeCase === "tracking" ? () => setShowTrackingDriverInfo((selected) => !selected) : undefined}
          onPreviewRouteClearSelection={activeCase === "dispatch" ? () => setSelectedDispatchRouteId(null) : undefined}
          onPreviewRouteHover={activeCase === "dispatch" ? setHoveredDispatchRouteId : undefined}
          onPreviewRouteSelect={activeCase === "dispatch" ? selectDispatchRoute : undefined}
          previewHoveredRouteId={activeCase === "dispatch" ? hoveredDispatchRouteId ?? undefined : undefined}
          previewProgressInfo={activeCase === "tracking" ? trackingDriverInfo : undefined}
          previewProgressSelected={activeCase === "tracking" && showTrackingDriverInfo}
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

export function HomeScene({ heroVisualVariant = "mapLab", standalone = false }: HomeSceneProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang, mapTheme } = useWorkbenchStore();
  const [activeCategory, setActiveCategory] = useState<SpatialCategory>("location");
  const [activeComponentId, setActiveComponentId] = useState("normalLocation");
  const [activeCase, setActiveCase] = useState<CaseId>("network");
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
        {(["endToEnd", "model", "global"] as const).map((item) => (
          <article key={item}>
            <strong>{t(`home.summary.${item}.title`)}</strong>
            <small>{t(`home.summary.${item}.description`)}</small>
          </article>
        ))}
      </div>
    </section>
  );

  return (
    <div className={`HomeScene${standalone ? " HomeScene--standalone" : ""}`}>
      {standalone ? (
        <div className="HomeHeroStage">
          <HeroMapVisual standalone variant={heroVisualVariant} />
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
              <div className="HomeStartGuide__downloads" role="list">
                {aiDownloadOptions.map((option) => (
                  <article key={option.id} role="listitem">
                    <div>
                      <span>{t(`home.start.guide.downloads.${option.id}.type`)}</span>
                      <h4>{t(`home.start.guide.downloads.${option.id}.title`)}</h4>
                      <p>{t(`home.start.guide.downloads.${option.id}.description`)}</p>
                    </div>
                    {option.href ? (
                      <a href={option.href} rel="noopener noreferrer" target="_blank">
                        <Download aria-hidden="true" size={15} />
                        {t("home.start.guide.downloads.download")}
                      </a>
                    ) : (
                      <button disabled type="button">
                        <Download aria-hidden="true" size={15} />
                        {t("home.start.guide.downloads.pending")}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
