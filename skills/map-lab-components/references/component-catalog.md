# Component Catalog

Use this catalog to map a user's design term to the correct implementation family.

## Point Components

| Component | Purpose | Primitive | Anchor |
| --- | --- | --- | --- |
| Normal | Generic location, POI, waypoint | Advanced Marker + circular DOM | center |
| Informated Location | Business entity such as warehouse or site | Advanced Marker + exact SVG | bottom or pin-tip |
| Cumulative Location | Cluster count that expands into leaf points | Advanced Marker + cluster DOM | center |
| Custom | Letter, number, warehouse, shop, or user content | Advanced Marker + SVG/DOM slot | bottom |

Point states are `default`, `muted` (Disable), `completed`, `emphasized`, and `selected`. Product UIs may expose only Default, Disable, and Completed in their state switcher.

## Line Components

| Component | Composition |
| --- | --- |
| Normal route / No arrow | White outline polyline + colored body polyline |
| Normal route / Has arrow | Normal route + repeating directional arrow overlay |
| Route with normal location | Has-arrow route + Normal points at both ends |
| Route with informated location | Has-arrow route + Informated Location pins at both ends |
| Route with progress | Remaining default route + completed route segment + progress pin |

The route body is never an Advanced Marker. Only its point-like endpoints and progress pin use Advanced Markers.

## Area Components

| Component | Composition |
| --- | --- |
| Area selection | `google.maps.Data` polygon + optional Advanced Marker center label |

Use real GeoJSON geometry. Do not represent an administrative region with a rounded rectangle or bounding box.

## Container And Visualization Components

The current Map Lab catalog does not yet define production-ready container or visualization-map components. Do not invent component names or styles. Ask for the missing design source, or clearly mark a placeholder as provisional.

## Composition Rule

Build combined components from existing primitives. For example, Route with informated location reuses the route family and swaps only the endpoint component. Keep route state, pin state, and business interaction as separate inputs so one can change without corrupting the other.
