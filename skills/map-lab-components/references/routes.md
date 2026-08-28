# Route Implementation

## Primitive Choice

Use two polylines for the route body:

1. White outline beneath the route.
2. Colored body above it.

Use `OverlayView` for exact custom arrows when spacing must remain constant in screen pixels. Project route coordinates with `fromLatLngToDivPixel`, densify the screen-space path, sample by pixel distance, and calculate each arrow angle from the local tangent.

## Route State

Keep route geometry stable while switching visual state. Default is 8px body over 12px outline. Hover/selected is 12px body over 16px outline.

Bind pointer enter/leave to a route hit target. On leave, restore default unless the route remains selected. Keep the endpoint pins above the route and synchronize their hover class only for composed components that require it.

## Directional Arrows

- The bundled `narrow.svg` points upward by default.
- Rotate each arrow to the local screen-space tangent.
- Keep each segment's path order from business start to business end.
- Do not reverse route coordinates to compensate for a wrongly oriented SVG.
- Measure spacing head-to-head in pixels.
- Recompute after stable map projection changes, usually on `idle`; clean up previous overlay DOM before drawing again.

Google Polyline `icons` can be a simpler fallback, but custom SVG geometry and exact pixel spacing are more reliable with `OverlayView`.

## Composed Routes

- Route with normal location = Has-arrow route + Normal endpoint points.
- Route with informated location = Has-arrow route + Informated endpoint pins.
- Route with progress = completed segment + remaining default segment + progress pin.

Compute the progress position from the same route path and ratio used to split the completed/remaining geometry. Do not maintain a second independently interpolated position for the pin.

## Routes API Boundary

Let the existing Routes API return geometry. Apply Map Lab styling after decoding the polyline. Do not change request endpoints, waypoints, travel mode, billing setup, or caching merely to change visual appearance.

## Cleanup

Call `setMap(null)` on every polyline and overlay. Remove Google Maps listeners. Set endpoint Advanced Markers' `map` to `null` and remove their DOM nodes.
