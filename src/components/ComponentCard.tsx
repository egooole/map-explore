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
  regionIds?: string[];
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

/**
 * 组件信息表里的 value 可以是直接写死的字符串，也可以是 i18n key。
 * 这个函数统一把它解析成最终展示文本。
 */
function resolveValue(row: ManualInfoRow, t: (key: string) => string) {
  return row.valueKey ? t(row.valueKey) : row.value ?? "";
}

/**
 * 颜色行的 Token Mapping。
 * key 是 componentSpecs / i18n 中的颜色说明字段，value 是当前组件涉及到的色值。
 * 后续你给 Code Token 后，可以在这里或数据配置里把占位内容换成真实 code token。
 */
const colorTokenValuesByKey: Record<string, string[]> = {
  "manual.pointMarker.style.color": ["#2A3EF4", "#C9D2FC", "#9C9EAD", "#2232C3"],
  "manual.informatedLocation.style.color": ["#2A3EF4", "#C9D2FC", "#9C9EAD", "#2232C3"],
  "manual.cumulativeLocation.style.color": ["#2450FF", "#FFFFFF"],
  "manual.customLocation.style.color": ["#2A3EF4", "#FFFFFF"],
  "manual.normalRoute.style.color": ["#2A3EF4", "#C9D2FC", "#9C9EAD", "#2232C3"],
  "manual.routeWithLocation.style.color": ["#2A3EF4", "#C9D2FC", "#9C9EAD", "#2232C3"],
  "manual.routeWithProgress.style.color": ["#9C9EAD", "#2A3EF4", "#C9D2FC"],
  "manual.areaSelection.style.color": ["#2A3EF4", "#C9D2FC"],
};

/**
 * 点/线组件共用的状态切换选项。
 * muted 在代码里表示 Disable；文案层展示为 Disable。
 */
const basePreviewStateOptions: Array<{ id: RoutePreviewVariant; labelKey: string }> = [
  { id: "default", labelKey: "manual.stateSwitcher.default" },
  { id: "muted", labelKey: "manual.stateSwitcher.disable" },
  { id: "completed", labelKey: "manual.stateSwitcher.completed" },
];

/**
 * 从信息行里提取颜色。
 * 优先读 colorTokenValuesByKey 的人工配置；没有配置时，从文本里自动提取 #HEX 色值。
 */
function resolveColorTokenValues(row: ManualInfoRow, value: string) {
  if (row.valueKey && colorTokenValuesByKey[row.valueKey]) {
    return colorTokenValuesByKey[row.valueKey];
  }

  const hexValues = value.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
  return [...new Set(hexValues.map((item) => item.toUpperCase()))];
}

/**
 * 线组件可能有额外状态，比如 selected / inProgress。
 * 这里先保证 Default / Disable / Completed 永远在前面，再拼接组件自己配置的扩展状态。
 */
function resolveLineStateOptions(spec: ManualComponentSpec) {
  const configuredStates = spec.routeVariants?.filter((variant) => variant.id !== "selected" && variant.id !== "inProgress") ?? [];
  const configuredExtraStates = configuredStates.filter(
    (variant) => !basePreviewStateOptions.some((option) => option.id === variant.id),
  );

  return [...basePreviewStateOptions, ...configuredExtraStates];
}

/**
 * 状态切换控件。
 * 点组件和线组件都复用这一套 UI，避免每个组件单独实现按钮逻辑。
 */
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

/**
 * 颜色信息的展示方式。
 * 每一个颜色都会展示 Design Token（当前先放具体色值）和 Code Token（先占位）。
 */
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

/**
 * 右侧“组件信息”的普通列表。
 * 如果当前行是颜色行，就切换成 ColorTokenPairs；其他行按普通 key/value 展示。
 */
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

/**
 * 前端代码默认折叠。
 * 这样代码不会抢组件预览的视觉层级，只有用户点击“查看代码”时才展开。
 */
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

/**
 * 使用场景列表项。
 * tone 用来区分主要场景、扩展场景、使用约束，视觉上保持同一模块但有不同语义。
 */
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

/**
 * 组件手册里每一个组件的详情卡片。
 * 左侧：标题、状态切换、地图预览、使用场景。
 * 右侧：组件信息、FakeMod/配置、代码折叠。
 */
export function ComponentCard({ spec, categoryId, mapCategory, lang, mapTheme }: ComponentCardProps) {
  const { t } = useTranslation();
  const lineStateOptions = useMemo(() => resolveLineStateOptions(spec), [spec]);
  const [activePreviewState, setActivePreviewState] = useState<RoutePreviewVariant>("default");

  // 线组件的路线状态来自 lineStateOptions；其他组件使用自身配置的 routeVariants。
  const previewRoutes =
    categoryId === "line"
      ? lineStateOptions.map((option) => ({ id: option.id, label: t(option.labelKey) }))
      : spec.routeVariants?.map((variant) => ({ id: variant.id, label: t(variant.labelKey) }));

  // 预览地图的控制参数。组件手册里不依赖右侧参数面板，因此这里给一组稳定的默认值。
  const previewControls = useMemo<MapControlsState>(
    () => {
      const routeNodes: MapControlsState["routeNodes"] = [
        { id: "start", value: "Placeholder start" },
        { id: "middle", value: "Placeholder middle" },
        { id: "end", value: "Placeholder end" },
      ];
      return {
        activeRouteId: "route-1",
        markerStyle: categoryId === "point" ? "pin" : "default",
        routeNodes,
        routes: [{ colorId: "route1", id: "route-1", name: "Route 1", nodes: routeNodes, visible: true }],
        showMapUi: spec.previewDistribution === "chinaCluster",
        zoom: getPreviewZoom(spec),
      };
    },
    [categoryId, spec],
  );

  // 点组件状态切换时，重新生成对应状态的 marker 数据；每个组件独立维护自己的 activePreviewState。
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
            previewRegionIds={spec.regionIds}
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
