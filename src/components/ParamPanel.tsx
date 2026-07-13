import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { MapControlsState, MarkerStyle, RouteNode } from "../types";

interface ParamPanelProps {
  controls: MapControlsState;
  onChange: (controls: MapControlsState) => void;
}

function ParamRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="ParamRow">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function createDefaultControls(): MapControlsState {
  return {
    zoom: 12,
    markerStyle: "default",
    showMapUi: true,
    routeNodes: [
      { id: "start", value: "Shanghai Hongqiao" },
      { id: "middle", value: "Jing'an Temple" },
      { id: "end", value: "Lujiazui" },
    ],
  };
}

export function ParamPanel({ controls, onChange }: ParamPanelProps) {
  const { t } = useTranslation();

  const update = (patch: Partial<MapControlsState>) => {
    onChange({ ...controls, ...patch });
  };

  const updateRouteNode = (node: RouteNode) => {
    update({
      routeNodes: controls.routeNodes.map((item) => (item.id === node.id ? node : item)),
    });
  };

  return (
    <aside className="ParamPanel">
      <h2>{t("params.title")}</h2>

      <ParamRow label={t("params.zoom")}>
        <div className="ParamRow__inline">
          <input
            max={22}
            min={1}
            onChange={(event) => update({ zoom: Number(event.target.value) })}
            type="number"
            value={controls.zoom}
          />
          <button onClick={() => update({ zoom: Math.min(22, Math.max(1, controls.zoom)) })} type="button">
            {t("params.apply")}
          </button>
        </div>
      </ParamRow>

      <ParamRow label={t("params.markerStyle")}>
        <select
          onChange={(event) => update({ markerStyle: event.target.value as MarkerStyle })}
          value={controls.markerStyle}
        >
          {(["default", "pin", "dot", "custom"] as MarkerStyle[]).map((style) => (
            <option key={style} value={style}>
              {t(`params.styles.${style}`)}
            </option>
          ))}
        </select>
      </ParamRow>

      <ParamRow label={t("params.layerVisibility")}>
        <button
          aria-pressed={controls.showMapUi}
          className={`Switch ${controls.showMapUi ? "is-on" : ""}`}
          onClick={() => update({ showMapUi: !controls.showMapUi })}
          type="button"
        >
          <span />
          <b>{t("params.showMapUi")}</b>
        </button>
      </ParamRow>

      <section className="ParamPanel__route" aria-label={t("params.routeNodes")}>
        <h3>{t("params.routeNodes")}</h3>
        {controls.routeNodes.map((node) => (
          <ParamRow key={node.id} label={t(`params.${node.id}`)}>
            <div className="ParamRow__inline">
              <input
                onChange={(event) => updateRouteNode({ ...node, value: event.target.value })}
                placeholder={t("params.addressPlaceholder")}
                type="text"
                value={node.value}
              />
              <button onClick={() => updateRouteNode(node)} type="button">
                {t("params.apply")}
              </button>
            </div>
          </ParamRow>
        ))}
      </section>
    </aside>
  );
}
