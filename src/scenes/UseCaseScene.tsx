import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import gtsTmsProduct from "../assets/use-case/gts-tms.svg";
import { MapCanvas } from "../components/MapCanvas";
import { createDefaultControls } from "../components/ParamPanel";
import { useWorkbenchStore } from "../store/workbenchStore";
import type { RoutePreviewFamily } from "../types";

interface UseCaseConfig {
  componentKeys: string[];
  flowKeys: string[];
  id: string;
  metricKeys: string[];
  routeFamily: RoutePreviewFamily;
  summaryKey: string;
  titleKey: string;
}

const useCaseConfigs: UseCaseConfig[] = [
  {
    componentKeys: ["useCase.cases.route.components.route", "useCase.cases.route.components.node"],
    flowKeys: ["useCase.cases.route.flow.input", "useCase.cases.route.flow.generate", "useCase.cases.route.flow.compare"],
    id: "route",
    metricKeys: ["useCase.cases.route.metrics.plan", "useCase.cases.route.metrics.compare"],
    routeFamily: "normalHasArrow",
    summaryKey: "useCase.cases.route.summary",
    titleKey: "useCase.cases.route.title",
  },
  {
    componentKeys: ["useCase.cases.progress.components.route", "useCase.cases.progress.components.pin"],
    flowKeys: ["useCase.cases.progress.flow.search", "useCase.cases.progress.flow.track", "useCase.cases.progress.flow.handle"],
    id: "progress",
    metricKeys: ["useCase.cases.progress.metrics.status", "useCase.cases.progress.metrics.exception"],
    routeFamily: "routeWithProgress",
    summaryKey: "useCase.cases.progress.summary",
    titleKey: "useCase.cases.progress.title",
  },
  {
    componentKeys: ["useCase.cases.location.components.route", "useCase.cases.location.components.pin"],
    flowKeys: ["useCase.cases.location.flow.pick", "useCase.cases.location.flow.preview", "useCase.cases.location.flow.share"],
    id: "location",
    metricKeys: ["useCase.cases.location.metrics.accuracy", "useCase.cases.location.metrics.handoff"],
    routeFamily: "routeWithInformatedLocation",
    summaryKey: "useCase.cases.location.summary",
    titleKey: "useCase.cases.location.title",
  },
];

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
      <header className="UseCaseScene__header">
        <div>
          <h1>{t("useCase.title")}</h1>
          <p>{t("useCase.description")}</p>
        </div>
      </header>

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
            <img alt="GTS TMS product interface" className="UseCaseProduct__image" src={gtsTmsProduct} />
            <div className="UseCaseProduct__map" aria-label={t("useCase.productMap")}>
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
