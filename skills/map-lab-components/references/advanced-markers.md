# Advanced Marker Implementation

## Prerequisites

- Google Maps JavaScript API is loaded once.
- The map is created with a cloud `mapId`.
- Import the marker library with `google.maps.importLibrary("marker")`.

## Basic Pattern

```ts
const { AdvancedMarkerElement } =
  (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

const content = createPointMarkerElement({
  family: "normal",
  label: "配送点",
  style: "default",
  variant: "default",
});

const marker = new AdvancedMarkerElement({
  anchorLeft: "-50%",
  anchorTop: "-50%",
  content,
  gmpClickable: true,
  map,
  position: { lat: 31.23, lng: 121.47 },
  title: "配送点",
});
```

Use `anchorTop: "-50%"` for centered circles/clusters, `"-100%"` for bottom-anchored pins, and a measured pixel value such as `"-51px"` only when the SVG tip is not at the viewBox bottom.

## Reusing The Point Kit

Copy `assets/point-kit/` into the target source tree. Import `map-lab-point-markers.css` once and use the factory in `MapLabPointMarkers.ts`.

The bundled implementation is Vite-ready. Its custom SVG imports use `?raw` so state colors can be replaced inside the SVG source. Adapt this import mechanism for other bundlers.

## Interaction

- Use the marker DOM as the state owner only for isolated demos.
- In product applications, prefer React/store state and reflect it with classes or regenerated content.
- `hover` is temporary; `selected` persists according to product rules.
- Do not let multiple independent marker groups clear each other's selection unless that behavior is requested.
- Set `role="button"`, `tabIndex=0`, and Enter/Space handling for clickable content.

## Lifecycle

```ts
return () => {
  marker.map = null;
  content.remove();
};
```

Track all generated markers. Filtering should toggle their `map` property or rebuild only the affected set; it must not create another map instance.

## Clustering

Cumulative Location is a visual cluster component, not a clustering algorithm. Connect it to the target project's clustering library or spatial grouping logic. Preserve the original point data and progressively split clusters as zoom increases.
