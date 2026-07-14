import { ChevronDown, Code2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPreviewMarkers, getPreviewZoom } from "../config/manualPreview";
import type { MapCategory, MapTheme, WorkbenchLanguage } from "../store/workbenchStore";
import type {
  CustomMarkerContent,
  MapControlsState,
  MarkerPreviewFamily,
  MarkerPreviewVariant,
  RoutePreviewFamily,
  RoutePreviewVariant,
} from "../types";
import { MapCanvas } from "./MapCanvas";

export type ManualCategoryId = "point" | "line" | "area" | "container";
type ManualPreviewDistribution = "local" | "china" | "chinaCluster";

export interface ManualInfoRow {
  labelKey: string;
  value?: string;
  valueKey?: string;
}

export interface ManualUsageGroup {
  tagKey: string;
  bulletKeys: string[];
}

export interface ManualMarkerVariant {
  customContent?: CustomMarkerContent;
  id: MarkerPreviewVariant;
  labelKey: string;
}

export interface ManualRouteVariant {
  id: RoutePreviewVariant;
  labelKey: string;
}

export interface ManualComponentSpec {
  id: string;
  nameKey: string;
  descriptionKey: string;
  previewType: ManualCategoryId;
  previewDistribution?: ManualPreviewDistribution;
  markerFamily?: MarkerPreviewFamily;
  markerVariants?: ManualMarkerVariant[];
  routeFamily?: RoutePreviewFamily;
  routeVariants?: ManualRouteVariant[];
  styleRows: ManualInfoRow[];
  fakeModRows: ManualInfoRow[];
  code: {
    language: string;
    value?: string;
    valueKey?: string;
  };
  usage: {
    primary: ManualUsageGroup;
    extended: ManualUsageGroup;
    constraints: ManualUsageGroup;
  };
}

interface ComponentCardProps {
  spec: ManualComponentSpec;
  categoryId: ManualCategoryId;
  mapCategory: MapCategory;
  lang: WorkbenchLanguage;
  mapTheme: MapTheme;
}

function resolveValue(row: ManualInfoRow, t: (key: string) => string) {
  return row.valueKey ? t(row.valueKey) : row.value ?? "";
}

function InfoRows({ rows }: { rows: ManualInfoRow[] }) {
  const { t } = useTranslation();

  return (
    <dl className="ManualInfoRows">
      {rows.map((row) => (
        <div className="ManualInfoRows__row" key={`${row.labelKey}-${row.valueKey ?? row.value}`}>
          <dt>{t(row.labelKey)}</dt>
          <dd>{resolveValue(row, t)}</dd>
        </div>
      ))}
    </dl>
  );
}

function CodeDisclosure({ code }: { code: ManualComponentSpec["code"] }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const codeValue = code.valueKey ? t(code.valueKey) : code.value ?? "";

  return (
    <section className="ManualCodeBlock">
      <button aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} type="button">
        <Code2 size={15} />
        <span>{expanded ? t("manual.content.hideCode") : t("manual.content.showCode")}</span>
        <ChevronDown className={expanded ? "is-open" : ""} size={16} />
      </button>
      {expanded ? (
        <pre aria-label={t("manual.content.frontendCode")}>
          <code>{codeValue}</code>
        </pre>
      ) : null}
    </section>
  );
}

function UsageGroup({ group, tone }: { group: ManualUsageGroup; tone: "primary" | "extended" | "constraints" }) {
  const { t } = useTranslation();

  return (
    <section className={`ManualUsageCard ManualUsageCard--${tone}`}>
      <span>{t(group.tagKey)}</span>
      <ul>
        {group.bulletKeys.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
    </section>
  );
}

export function ComponentCard({ spec, categoryId, mapCategory, lang, mapTheme }: ComponentCardProps) {
  const { t } = useTranslation();
  const previewControls = useMemo<MapControlsState>(
    () => ({
      markerStyle: categoryId === "point" ? "pin" : "default",
      routeNodes: [
        { id: "start", value: "Placeholder start" },
        { id: "middle", value: "Placeholder middle" },
        { id: "end", value: "Placeholder end" },
      ],
      showMapUi: spec.previewDistribution === "chinaCluster",
      zoom: getPreviewZoom(spec),
    }),
    [categoryId, spec],
  );
  const previewMarkers = useMemo(() => createPreviewMarkers(spec, t), [spec, t]);

  return (
    <article className="ManualDetail" id={`manual-component-${spec.id}`}>
      <section className="ManualDetail__left" aria-label={t("manual.panels.content")}>
        <header className="ManualPanelHeader">
          <h2>{t(spec.nameKey)}</h2>
          <span>{t(spec.descriptionKey)}</span>
        </header>

        <div className="ManualMapRegion">
          <MapCanvas
            compact
            controls={previewControls}
            lang={lang}
            mapCategory={mapCategory}
            mapTheme={mapTheme}
            previewFeature={spec.previewType}
            previewDistribution={spec.previewDistribution}
            previewMarkerFamily={spec.markerFamily}
            previewMarkers={previewMarkers}
            previewRouteFamily={spec.routeFamily}
            previewRoutes={spec.routeVariants?.map((variant) => ({ id: variant.id, label: t(variant.labelKey) }))}
          />
        </div>

        <section className="ManualSpecSection">
          <h3>{t("manual.content.styleDisplay")}</h3>
          <InfoRows rows={spec.styleRows} />
        </section>
      </section>

      <section className="ManualDetail__right" aria-label={t("manual.panels.usage")}>
        <section className="ManualSpecSection">
          <h3>{t("manual.content.baseData")}</h3>
          <InfoRows rows={spec.fakeModRows} />
        </section>

        <CodeDisclosure code={spec.code} />

        <section className="ManualUsagePanel">
          <header className="ManualPanelHeader ManualPanelHeader--compact">
            <p>{t("manual.panels.usage")}</p>
            <span>{t("manual.usageIntro")}</span>
          </header>
          <div className="ManualUsageGrid">
            <UsageGroup group={spec.usage.primary} tone="primary" />
            <UsageGroup group={spec.usage.extended} tone="extended" />
            <UsageGroup group={spec.usage.constraints} tone="constraints" />
          </div>
        </section>
      </section>
    </article>
  );
}
