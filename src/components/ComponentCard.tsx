import { ChevronDown, Code2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { MapCategory, WorkbenchLanguage } from "../store/workbenchStore";
import type { MapControlsState, MarkerPreviewState, MarkerPreviewVariant } from "../types";
import { MapCanvas } from "./MapCanvas";

export type ManualCategoryId = "point" | "line" | "area" | "container";

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
  id: MarkerPreviewVariant;
  labelKey: string;
}

export interface ManualComponentSpec {
  id: string;
  nameKey: string;
  descriptionKey: string;
  previewType: ManualCategoryId;
  markerVariants?: ManualMarkerVariant[];
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
}

const pointPreviewPattern: MarkerPreviewVariant[] = [
  "default",
  "completed",
  "muted",
  "default",
  "emphasized",
  "completed",
  "default",
  "muted",
  "completed",
  "default",
  "emphasized",
  "default",
];

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

export function ComponentCard({ spec, categoryId, mapCategory, lang }: ComponentCardProps) {
  const { t } = useTranslation();
  const previewControls = useMemo<MapControlsState>(
    () => ({
      markerStyle: categoryId === "point" ? "pin" : "default",
      routeNodes: [
        { id: "start", value: "Placeholder start" },
        { id: "middle", value: "Placeholder middle" },
        { id: "end", value: "Placeholder end" },
      ],
      showMapUi: false,
      zoom: 13,
    }),
    [categoryId],
  );
  const previewMarkers = useMemo<MarkerPreviewState[] | undefined>(
    () => {
      if (!spec.markerVariants?.length) {
        return undefined;
      }

      const markersById = new Map(spec.markerVariants.map((marker) => [marker.id, marker]));
      return pointPreviewPattern
        .map((variant) => markersById.get(variant))
        .filter((marker): marker is ManualMarkerVariant => Boolean(marker))
        .map((marker) => ({ id: marker.id, label: t(marker.labelKey) }));
    },
    [spec.markerVariants, t],
  );

  return (
    <article className="ManualDetail" id={`manual-component-${spec.id}`}>
      <section className="ManualDetail__left" aria-label={t("manual.panels.content")}>
        <header className="ManualPanelHeader">
          <p>{t("manual.panels.content")}</p>
          <h2>{t(spec.nameKey)}</h2>
          <span>{t(spec.descriptionKey)}</span>
        </header>

        <div className="ManualMapRegion">
          <MapCanvas
            compact
            controls={previewControls}
            lang={lang}
            mapCategory={mapCategory}
            previewFeature={spec.previewType}
            previewMarkers={previewMarkers}
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
