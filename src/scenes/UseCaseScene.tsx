import { useMemo, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { ExpandableRouteRow, type RouteSummary } from "../components/ExpandableRouteRow";
import { WorkbenchPageHeader } from "../components/WorkbenchPageHeader";
import gtsTmsProduct from "../assets/use-case/gts-tms.svg";
import routePlanningProduct from "../assets/use-case/page.svg";
import { MapCanvas } from "../components/MapCanvas";
import { createDefaultControls } from "../components/ParamPanel";
import { mockRouteStopsByRouteId } from "../mocks/mockRouteStops";
import { useWorkbenchStore } from "../store/workbenchStore";
import type { RoutePreviewFamily } from "../types";

interface UseCaseMapFrame {
  height: number;
  left: number;
  top: number;
  width: number;
}

interface UseCaseConfig {
  componentKeys: string[];
  flowKeys: string[];
  id: string;
  mapFrame: UseCaseMapFrame;
  metricKeys: string[];
  productAlt: string;
  productImage: string;
  routeFamily?: RoutePreviewFamily;
  summaryKey: string;
  titleKey: string;
}

const defaultProductMapFrame: UseCaseMapFrame = {
  height: 772,
  left: 400,
  top: 128,
  width: 1024,
};

const useCaseConfigs: UseCaseConfig[] = [
  {
    componentKeys: ["useCase.cases.route.components.route", "useCase.cases.route.components.node"],
    flowKeys: ["useCase.cases.route.flow.input", "useCase.cases.route.flow.generate", "useCase.cases.route.flow.compare"],
    id: "route",
    mapFrame: {
      height: 748,
      left: 760,
      top: 124,
      width: 680,
    },
    metricKeys: ["useCase.cases.route.metrics.plan", "useCase.cases.route.metrics.compare"],
    productAlt: "Route planning product interface",
    productImage: routePlanningProduct,
    summaryKey: "useCase.cases.route.summary",
    titleKey: "useCase.cases.route.title",
  },
  {
    componentKeys: ["useCase.cases.progress.components.route", "useCase.cases.progress.components.pin"],
    flowKeys: ["useCase.cases.progress.flow.search", "useCase.cases.progress.flow.track", "useCase.cases.progress.flow.handle"],
    id: "progress",
    mapFrame: defaultProductMapFrame,
    metricKeys: ["useCase.cases.progress.metrics.status", "useCase.cases.progress.metrics.exception"],
    productAlt: "GTS TMS product interface",
    productImage: gtsTmsProduct,
    routeFamily: "routeWithProgress",
    summaryKey: "useCase.cases.progress.summary",
    titleKey: "useCase.cases.progress.title",
  },
  {
    componentKeys: ["useCase.cases.location.components.route", "useCase.cases.location.components.pin"],
    flowKeys: ["useCase.cases.location.flow.pick", "useCase.cases.location.flow.preview", "useCase.cases.location.flow.share"],
    id: "location",
    mapFrame: defaultProductMapFrame,
    metricKeys: ["useCase.cases.location.metrics.accuracy", "useCase.cases.location.metrics.handoff"],
    productAlt: "GTS TMS product interface",
    productImage: gtsTmsProduct,
    routeFamily: "routeWithInformatedLocation",
    summaryKey: "useCase.cases.location.summary",
    titleKey: "useCase.cases.location.title",
  },
];

const routePlanningCards: RouteSummary[] = [
  {
    distance: "12 mi",
    driver: "Rendy Zikri",
    duration: "1h 35m",
    id: "route-hongqiao-lingang",
    packages: "105 packages",
    pickupPoints: "6 pickup points",
    routeNo: "Hongqiao Route",
    vehicle: "Blind van",
    volume: "100 cbm",
    weight: "20 kg",
  },
  {
    distance: "12 mi",
    driver: "No driver yet",
    duration: "12h 35m",
    id: "route-putuo-waigaoqiao",
    packages: "105 packages",
    pickupPoints: "6 pickup points",
    routeNo: "Pudong Route",
    status: "alert",
    vehicle: "Blind van",
    volume: "100 cbm",
    weight: "20 kg",
  },
  {
    distance: "12 mi",
    driver: "No driver yet",
    duration: "12h 35m",
    id: "route-songjiang-xinjiangwan",
    packages: "105 packages",
    pickupPoints: "6 pickup points",
    routeNo: "Lingang Route",
    status: "alert",
    vehicle: "Blind van",
    volume: "100 cbm",
    weight: "20 kg",
  },
];

function createMapFrameStyle(frame: UseCaseMapFrame): CSSProperties {
  return {
    "--use-case-map-height": `${frame.height}`,
    "--use-case-map-left": `${frame.left}`,
    "--use-case-map-top": `${frame.top}`,
    "--use-case-map-width": `${frame.width}`,
  } as CSSProperties;
}

export function UseCaseScene() {
  const { t } = useTranslation();
  const { mapCategory, lang, mapTheme } = useWorkbenchStore();
  const [activeCaseId, setActiveCaseId] = useState(useCaseConfigs[0].id);
  const controls = useMemo(() => {
    const defaultControls = createDefaultControls();
    return {
      ...defaultControls,
      zoom: 12,
    };
  }, []);
  const activeCase = useCaseConfigs.find((item) => item.id === activeCaseId) ?? useCaseConfigs[0];

  return (
    <section className="UseCaseScene">
      <WorkbenchPageHeader description={t("useCase.description")} title={t("useCase.title")} />

      <nav className="UseCaseTabs" aria-label={t("useCase.caseTabs")}>
        {useCaseConfigs.map((item) => (
          <button
            aria-selected={item.id === activeCase.id}
            className={item.id === activeCase.id ? "is-active" : ""}
            key={item.id}
            onClick={() => setActiveCaseId(item.id)}
            role="tab"
            type="button"
          >
            <strong>{t(item.titleKey)}</strong>
          </button>
        ))}
      </nav>

      <div className="UseCaseScene__workspace">
        <div className="UseCaseScene__product">
          <div className="UseCaseProduct">
            <img alt={activeCase.productAlt} className="UseCaseProduct__image" src={activeCase.productImage} />
            {activeCase.id === "route" ? (
              <div className="UseCaseRouteOverlay" aria-label="Route detail">
                <header className="UseCaseRouteSummary">
                  <h2>Route detail</h2>
                  <p>
                    <span>Total routes:</span>
                    <strong>2</strong>
                    <span>Total jobs:</span>
                    <strong>12</strong>
                    <span>Total packages:</span>
                    <strong>210</strong>
                  </p>
                </header>
                <div className="UseCaseRouteTableHeader">
                  <span>Route</span>
                  <span>Overview</span>
                </div>
                <div className="UseCaseRouteRows">
                  {routePlanningCards.map((route) => (
                    <ExpandableRouteRow key={route.id} route={route} stops={mockRouteStopsByRouteId[route.id] ?? []} />
                  ))}
                </div>
              </div>
            ) : null}
            <div
              className="UseCaseProduct__map"
              aria-label={t("useCase.productMap")}
              style={createMapFrameStyle(activeCase.mapFrame)}
            >
              <MapCanvas
                compact
                controls={controls}
                dynamicRouteFamily={activeCase.routeFamily}
                hideDynamicRouteMarkers={activeCase.routeFamily === "normalHasArrow"}
                hidePreviewContent
                lang={lang}
                mapCategory={mapCategory}
                mapTheme={mapTheme}
              />
            </div>
          </div>
        </div>

        <aside className="UseCaseInfoPanel" aria-label={t("useCase.panelTitle")}>
          <header>
            <span>{t("useCase.panelTitle")}</span>
            <h2>{t(activeCase.titleKey)}</h2>
            <p>{t(activeCase.summaryKey)}</p>
          </header>

          <section className="UseCaseInfoPanel__section">
            <h3>{t("useCase.sections.components")}</h3>
            <div className="UseCaseChipList">
              {activeCase.componentKeys.map((key) => (
                <span key={key}>{t(key)}</span>
              ))}
            </div>
          </section>

          <section className="UseCaseInfoPanel__section">
            <h3>{t("useCase.sections.flow")}</h3>
            <ol className="UseCaseFlow">
              {activeCase.flowKeys.map((key, index) => (
                <li key={key}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{t(key)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="UseCaseInfoPanel__section">
            <h3>{t("useCase.sections.outcome")}</h3>
            <ul className="UseCaseMetricList">
              {activeCase.metricKeys.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </section>
  );
}
