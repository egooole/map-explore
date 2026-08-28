---
name: map-lab-components
description: Implement and reuse Map Lab map components in Google Maps projects. Use when a user asks to vibe-code Map Lab markers, AdvancedMarkerElement points, Normal or Informated locations, clusters, custom pins, directional routes, route-and-pin compositions, progress routes, or region highlighting in React, TypeScript, Vite, or browser JavaScript. Also use when adapting the Map Lab visual language to an existing product map without changing business data or the cloud map style.
---

# Map Lab Components

Build product-ready Google Maps components from the Map Lab visual contract. Reuse the supplied assets and tokens; do not reconstruct them approximately when an exact asset exists.

## Start Here

1. Inspect the target project's framework, Google Maps loader, map ownership, Map ID, existing overlays, and cleanup lifecycle.
2. Identify the requested component in [component-catalog.md](references/component-catalog.md).
3. Choose the correct Google Maps primitive:
   - Point or endpoint pin: `AdvancedMarkerElement` with HTML/CSS/SVG content.
   - Route body: `google.maps.Polyline`; use `OverlayView` when arrows must keep screen-pixel spacing or need exact custom geometry.
   - Region: `google.maps.Data`; use `AdvancedMarkerElement` only for its center label.
4. Read [style-contract.md](references/style-contract.md) before changing dimensions, colors, states, anchors, or motion.
5. Read the relevant implementation reference:
   - Points: [advanced-markers.md](references/advanced-markers.md)
   - Routes and composed routes: [routes.md](references/routes.md)
   - Regions: [regions.md](references/regions.md)
6. Copy only the required files from `assets/`; adapt import paths without altering the visual values.
7. Integrate with the existing map instance. Never create a second map merely to render a component.
8. Run the project's build and verify the result in a real browser at desktop and narrow widths.

## Required Implementation Contract

- Keep the Google Maps API key and Map ID in environment configuration. Never hardcode or expose a key in generated documentation.
- Advanced Markers require a cloud Map ID and the `marker` library. Preserve the project's existing Map ID and loader unless the user explicitly asks to change them.
- When a `mapId` exists, do not pass legacy local `styles` that compete with the cloud map style.
- Preserve the user's coordinates, route results, zoom, center, map controls, business data, and selection model unless the task explicitly changes them.
- Treat map geometry and component content separately. A route plus pins is a composition, not one oversized marker.
- Keep each component's hover and selected state independent unless the product behavior explicitly coordinates them.
- Use screen pixels for visual spacing requirements such as repeating route arrows. Geographic meters are not equivalent across zoom levels.
- Assign the correct anchor: center for circular points and clusters; bottom or pin-tip for pin-shaped assets.
- Clean up every marker, polyline, data feature, event listener, and overlay on rerender or unmount.
- Make interactive marker content keyboard reachable and give it an accessible name.
- Do not add automatic tooltips or labels unless requested.

## Reuse The Bundled Assets

- `assets/point-kit/` contains the current Vite-ready Advanced Marker DOM factory, types, CSS, and SVG assets.
- `assets/route-kit/` contains route tokens and the exact arrow/pin assets used by Map Lab.
- `assets/region-kit/` contains the Data-layer state values and a manifest example.

When the target stack is not Vite, preserve the SVG files but replace `?raw` imports with that stack's supported asset-loading mechanism.

## Deliverables

For an implementation request, provide:

1. Working source files, not only a screenshot or static demo.
2. Required asset files and imports.
3. A short integration example using the project's existing map instance.
4. Required environment variables without secret values.
5. Cleanup and state-handling code.
6. Build and browser verification results.

If only a design specification is requested, return the component name, supported states, exact tokens, anatomy, anchor, and recommended Google Maps primitive. Do not edit code unless asked.

## Guardrails

- Do not claim every component is an Advanced Marker. Points are; route bodies and polygons are not.
- Do not copy component-manual preview SVG/HTML as product geometry.
- Do not replace exact Map Lab SVGs with Lucide icons, emoji, or hand-drawn approximations.
- Do not rasterize SVGs unless the target platform cannot render them.
- Do not use `google.maps.Marker`; prefer `AdvancedMarkerElement` for new point work.
- Do not rewrite Routes API behavior while changing route appearance.
- Do not initialize multiple Google Maps instances for filtering or state changes.

## Example Requests

- `$map-lab-components 用 Normal 点在现有 Google Map 上展示配送位置。`
- `$map-lab-components 把 Route with informated location 接入这张物流地图。`
- `$map-lab-components 按 Map Lab 样式实现带 45px 箭头间距的路线。`
- `$map-lab-components 用黄浦区 GeoJSON 做区域 Default、Hover、Selected 状态。`
- `$map-lab-components 审查这个地图组件是否可以直接交给前端组包。`
