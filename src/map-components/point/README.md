# Point Map Components

This folder contains the reusable point-marker foundation used by Map Lab.

## Exports

- `createPointMarkerElement(options)`: creates the DOM content for Normal, Informated Location, Cumulative Location, and Custom point markers.
- `interactivePointVariants`: variants that support hover and selected interaction.
- `PointMarkerElementOptions`: shared options for point marker creation.

## Runtime Contract

Point markers are rendered with Google Maps `AdvancedMarkerElement`.

The exported function only creates the marker content element. Product code should pass that element to `AdvancedMarkerElement`, then remove the marker when the owning view unmounts.

```ts
import { createPointMarkerElement } from "./map-components/point";

const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
const content = createPointMarkerElement({
  family: "normal",
  label: "Destination",
  style: "dot",
  variant: "default",
});

const marker = new AdvancedMarkerElement({
  anchorLeft: "-50%",
  anchorTop: "-50%",
  content,
  map,
  position,
});

marker.map = null;
content.remove();
```

## Required Styles and Assets

These components depend on the shared marker styles in `src/styles/map.css` and SVG assets in:

- `src/assets/informated-location/`
- `src/assets/custom-location/`

Do not copy the TypeScript without the related CSS and assets.
