# Region Implementation

## Rendering

Load each GeoJSON file on demand and add its features to one `google.maps.Data` layer. Cache fetched GeoJSON promises by manifest ID. Do not preload a global boundary file into the initial bundle.

Use the exact four style properties in `assets/region-kit/map-lab-region-config.ts`: `fillColor`, `fillOpacity`, `strokeColor`, and `strokeWeight`.

## Component Demo State Model

The component manual uses one demo region and a single selected ID:

- Mouseover highlights only when no region is selected.
- Mouseout restores default unless the feature is selected.
- Clicking a feature selects it and clears previous hover.
- Clicking map background clears selection.
- Clicking another feature moves selection.

Only load the requested demo region in this surface. Do not constrain shared Data-layer utilities to a single feature.

## Product Search State Model

Map browsing uses `selectedRegionIds: Set<string>` driven by search results. Multiple regions may stay selected. Hover remains available on unselected regions. Do not reuse the demo's mutually exclusive selection reducer.

## Center Label

Use an Advanced Marker at the manifest center only while a region is selected. The current label contract is white at 95% opacity, 4px radius, 8px vertical/12px horizontal padding, and a 0 8px 20px black shadow at 12% opacity.

## Cleanup

Remove features from the Data layer, remove listeners, detach the center-label marker, and clear any component-owned cache references on unmount. A shared application cache may remain if its ownership is explicit.
