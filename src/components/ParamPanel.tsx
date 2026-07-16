import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ManagedRoute, MapControlsState, MarkerStyle, RouteNode } from "../types";

interface ParamPanelProps {
  controls: MapControlsState;
  onChange: (controls: MapControlsState) => void;
  showMarkerStyle?: boolean;
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
  const routeNodes: RouteNode[] = [
    { id: "start", value: "Shanghai Hongqiao" },
    { id: "middle", value: "Jing'an Temple" },
    { id: "end", value: "Lujiazui" },
  ];

  return {
    activeRouteId: "route-1",
    zoom: 12,
    markerStyle: "default",
    routes: [
      {
        colorId: "route1",
        id: "route-1",
        name: "Route 1",
        nodes: routeNodes,
        visible: true,
      },
    ],
    showMapUi: true,
    routeNodes,
  };
}

function createRoute(routeIndex: number): ManagedRoute {
  return {
    colorId: routeIndex % 3 === 1 ? "route1" : routeIndex % 3 === 2 ? "route2" : "route3",
    id: `route-${Date.now()}-${routeIndex}`,
    name: `Route ${routeIndex}`,
    nodes: [
      { id: "start", value: "Shanghai Hongqiao" },
      { id: "middle", value: "" },
      { id: "end", value: "Lujiazui" },
    ],
    visible: true,
  };
}

export function ParamPanel({ controls, onChange, showMarkerStyle = true }: ParamPanelProps) {
  const { t } = useTranslation();
  const routes = controls.routes?.length
    ? controls.routes
    : [
        {
          colorId: "route1" as const,
          id: "route-1",
          name: "Route 1",
          nodes: controls.routeNodes,
          visible: true,
        },
      ];
  const activeRoute = routes.find((route) => route.id === controls.activeRouteId) ?? routes[0];

  const update = (patch: Partial<MapControlsState>) => {
    onChange({ ...controls, ...patch });
  };

  const updateRouteNode = (node: RouteNode) => {
    if (!activeRoute) {
      update({
        routeNodes: controls.routeNodes.map((item) => (item.id === node.id ? node : item)),
      });
      return;
    }

    const nextRoutes = routes.map((route) =>
      route.id === activeRoute.id
        ? {
            ...route,
            nodes: route.nodes.map((item) => (item.id === node.id ? node : item)),
          }
        : route,
    );
    const nextActiveRoute = nextRoutes.find((route) => route.id === activeRoute.id) ?? nextRoutes[0];
    update({
      routeNodes: nextActiveRoute.nodes,
      routes: nextRoutes,
    });
  };

  const addRoute = () => {
    const route = createRoute(routes.length + 1);
    update({
      activeRouteId: route.id,
      routeNodes: route.nodes,
      routes: [...routes, route],
    });
  };

  const removeRoute = (routeId: string) => {
    const nextRoutes = routes.filter((route) => route.id !== routeId);
    const fallbackRoute = nextRoutes[0];
    update({
      activeRouteId: fallbackRoute?.id ?? "",
      routeNodes: fallbackRoute?.nodes ?? controls.routeNodes,
      routes: nextRoutes,
    });
  };

  const setActiveRoute = (route: ManagedRoute) => {
    update({
      activeRouteId: route.id,
      routeNodes: route.nodes,
    });
  };

  const toggleRouteVisibility = (routeId: string) => {
    update({
      routes: routes.map((route) => (route.id === routeId ? { ...route, visible: !route.visible } : route)),
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

      {showMarkerStyle ? (
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
      ) : null}

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
        <div className="ParamPanel__routeHeader">
          <h3>{t("params.routeNodes")}</h3>
          <button onClick={addRoute} type="button">
            {t("params.addRoute")}
          </button>
        </div>

        <div className="RouteList" aria-label={t("params.routeList")}>
          {routes.map((route) => (
            <div className={`BrowseCheckboxItem RouteList__item ${route.id === activeRoute?.id ? "is-active" : ""}`} key={route.id}>
              <button
                className="BrowseCheckboxItem__box RouteList__visibility"
                onClick={() => toggleRouteVisibility(route.id)}
                type="button"
                aria-pressed={route.visible}
              />
              <button className="BrowseCheckboxItem__copy RouteList__name" onClick={() => setActiveRoute(route)} type="button">
                <strong>
                  <i className={`RouteList__swatch RouteList__swatch--${route.colorId}`} />
                  {route.name}
                </strong>
                <small>{route.visible ? t("params.routeVisible") : t("params.routeHidden")}</small>
              </button>
              {routes.length > 1 ? (
                <button className="RouteList__delete" onClick={() => removeRoute(route.id)} type="button" aria-label={t("params.deleteRoute")}>
                  ×
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {(activeRoute?.nodes ?? controls.routeNodes).map((node) => (
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
