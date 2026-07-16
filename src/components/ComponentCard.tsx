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

const colorTokenValuesByKey: Record<string, string[]> = {
  "manual.pointMarker.style.color": ["#2A3EF4", "#C9D2FC", "#9C9EAD", "#2232C3"],
  "manual.informatedLocation.style.color": ["#2A3EF4", "#C9D2FC", "#9C9EAD", "#2232C3"],
  "manual.cumulativeLocation.style.color": ["#2450FF", "#FFFFFF"],
  "manual.customLocation.style.color": ["#2A3EF4", "#FFFFFF"],
  "manual.normalRoute.style.color": ["#2A3EF4", "#C9D2FC", "#9C9EAD", "#2232C3"],
  "manual.routeWithLocation.style.color": ["#2A3EF4", "#C9D2FC", "#9C9EAD", "#2232C3"],
  "manual.routeWithProgress.style.color": ["#9C9EAD", "#2A3EF4", "#C9D2FC"],
};

const basePreviewStateOptions: Array<{ id: RoutePreviewVariant; labelKey: string }> = [
  { id: "default", labelKey: "manual.stateSwitcher.default" },
  { id: "muted", labelKey: "manual.stateSwitcher.disable" },
  { id: "completed", labelKey: "manual.stateSwitcher.completed" },
];

function resolveColorTokenValues(row: ManualInfoRow, value: string) {
  if (row.valueKey && colorTokenValuesByKey[row.valueKey]) {
    return colorTokenValuesByKey[row.valueKey];
  }

  const hexValues = value.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
  return [...new Set(hexValues.map((item) => item.toUpperCase()))];
}

function resolveLineStateOptions(spec: ManualComponentSpec) {
  const configuredStates = spec.routeVariants?.filter((variant) => variant.id !== "selected" && variant.id !== "inProgress") ?? [];
  const configuredExtraStates = configuredStates.filter(
    (variant) => !basePreviewStateOptions.some((option) => option.id === variant.id),
  );

  return [...basePreviewStateOptions, ...configuredExtraStates];
}

function ManualStateSwitcher({
  ariaLabelKey,
  onChange,
  options,
  value,
}: {
  ariaLabelKey: string;
  onChange: (value: RoutePreviewVariant) => void;
  options: Array<{ id: RoutePreviewVariant; labelKey: string }>;
  value: RoutePreviewVariant;
}) {
  const { t } = useTranslation();

  if (!options.length) {
    return null;
  }

  return (
    <div className="ManualStateSwitcher" role="group" aria-label={t(ariaLabelKey)}>
      {options.map((option) => (
        <button
          aria-pressed={value === option.id}
          className={value === option.id ? "is-active" : ""}
          key={option.id}
          onClick={() => onChange(option.id)}
          type="button"
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  );
}

function ColorTokenPairs({ row, value }: { row: ManualInfoRow; value: string }) {
  const { t } = useTranslation();
  const tokenValues = resolveColorTokenValues(row, value);

  return (
    <div className="ManualColorTokens">
      <dl>
        {tokenValues.map((tokenValue) => (
          <div className="ManualColorTokens__pair" key={tokenValue}>
            <div>
              <dt>{t("manual.tokenMapping.designToken")}</dt>
              <dd>{tokenValue}</dd>
            </div>
            <div>
              <dt>{t("manual.tokenMapping.codeToken")}</dt>
              <dd>{t("manual.tokenMapping.codeTokenPlaceholder")}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}

function InfoRows({ rows }: { rows: ManualInfoRow[] }) {
  const { t } = useTranslation();

  return (
    <dl className="ManualInfoRows">
      {rows.map((row) => {
        const value = resolveValue(row, t);
        const isColorRow = row.labelKey === "manual.rows.color";

        return (
          <div className="ManualInfoRows__row" key={`${row.labelKey}-${row.valueKey ?? row.value}`}>
            <dt>{t(row.labelKey)}</dt>
            <dd>{isColorRow ? <ColorTokenPairs row={row} value={value} /> : value}</dd>
          </div>
        );
      })}
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
    <div className={`ManualUsageItem ManualUsageItem--${tone}`}>
      <dt>
        <span>{t(group.tagKey)}</span>
      </dt>
      <dd>
        <ul>
          {group.bulletKeys.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </dd>
    </div>
  );
}

export function ComponentCard({ spec, categoryId, mapCategory, lang, mapTheme }: ComponentCardProps) {
  const { t } = useTranslation();
  const lineStateOptions = useMemo(() => resolveLineStateOptions(spec), [spec]);
  const [activePreviewState, setActivePreviewState] = useState<RoutePreviewVariant>("default");
  const previewRoutes =
    categoryId === "line"
      ? lineStateOptions.map((option) => ({ id: option.id, label: t(option.labelKey) }))
      : spec.routeVariants?.map((variant) => ({ id: variant.id, label: t(variant.labelKey) }));
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
  const previewMarkers = useMemo(
    () =>
      createPreviewMarkers(
        spec,
        t,
        categoryId === "point" && activePreviewState !== "inProgress" ? activePreviewState : undefined,
      ),
    [activePreviewState, categoryId, spec, t],
  );

  return (
    <article className="ManualDetail" id={`manual-component-${spec.id}`}>
      <section className="ManualDetail__left" aria-label={t("manual.panels.content")}>
        <header className="ManualPanelHeader">
          <h2>{t(spec.nameKey)}</h2>
          <span>{t(spec.descriptionKey)}</span>
          {categoryId === "point" || categoryId === "line" ? (
            <ManualStateSwitcher
              ariaLabelKey={categoryId === "point" ? "manual.stateSwitcher.pointAria" : "manual.stateSwitcher.lineAria"}
              options={categoryId === "line" ? lineStateOptions : basePreviewStateOptions}
              value={activePreviewState}
              onChange={setActivePreviewState}
            />
          ) : null}
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
            previewRouteState={activePreviewState}
            previewRoutes={previewRoutes}
          />
        </div>

        <section className="ManualUsagePanel">
          <header className="ManualPanelHeader ManualPanelHeader--compact">
            <p>{t("manual.panels.usage")}</p>
            <span>{t("manual.usageIntro")}</span>
          </header>
          <dl className="ManualUsageList">
            <UsageGroup group={spec.usage.primary} tone="primary" />
            <UsageGroup group={spec.usage.extended} tone="extended" />
            <UsageGroup group={spec.usage.constraints} tone="constraints" />
          </dl>
        </section>
      </section>

      <section className="ManualDetail__right" aria-label={t("manual.content.componentInformation")}>
        <section className="ManualInfoPanel">
          <h3>{t("manual.content.componentInformation")}</h3>
          <InfoRows rows={[...spec.styleRows, ...spec.fakeModRows]} />
        </section>
        <CodeDisclosure code={spec.code} />
      </section>
    </article>
  );
}
