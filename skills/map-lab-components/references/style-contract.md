# Style Contract

## Shared Colors

| Meaning | Value |
| --- | --- |
| Primary / Default | `#2A3EF4` |
| Primary focused | `#2232C3` |
| Disable | `#C9D2FC` |
| Completed | `#9C9EAD` |
| White outline | `#FFFFFF` |

Keep raw values until Map Lab Code Tokens are supplied. When the target product has an approved token mapping, replace values centrally rather than per component.

## Point Dimensions

- Normal: 24px overall in default/muted/completed; 40px overall in emphasized/hover/selected.
- Informated Location: preserve the supplied SVG frame, 59x62 default and 95x99 emphasized/hover/selected.
- Cumulative Location: 40px default; 64px hover/selected.
- Custom image pin: preserve its SVG viewBox and visual frame.

The stated dimension is the full component box, including its white border where applicable, not only the colored center.

## Route Dimensions

- Static route: white outline 12px, colored body 8px.
- Hover/selected route: white outline 16px, colored body 12px.
- Outline remains 2px visible on each side.
- Directional arrow spacing is measured head-to-head in screen pixels.
- Map Lab arrow spacing: use the component requirement supplied by the user; current implementations commonly use 28px or 45px depending on the route family. Do not silently substitute one for the other.

Dynamic route palette:

| Route | Default | Hover/Selected |
| --- | --- | --- |
| 1 | `#2A3EF4` | `#2232C3` |
| 2 | `#009995` | `#017B77` |
| 3 | `#9583FF` | `#8575FF` |

Directional arrow state colors for the primary route:

| State | Arrow |
| --- | --- |
| Default | `#768BFF` |
| Disable | `#D9E0FD` |
| Completed | `#C4C5CE` |

## Region Styles

| State | Fill | Opacity | Stroke | Weight |
| --- | --- | --- | --- | --- |
| Default | `#2A3EF4` | 0.10 | `#2A3EF4` | 2px |
| Disable | `#2A3EF4` | 0.06 | `#C9D2FC` | 2px |
| Hover/Selected | `#2A3EF4` | 0.40 | `#2A3EF4` | 2px |

Ignore rounded-corner values from Figma state swatches. Geographic polygons have no corner radius.

## Motion

- Point size transitions: 120-200ms ease.
- Progress pin body hover scale: CSS variable `--pin-hover-scale: 1.6`.
- Progress pulse: 1.5s ease-out infinite, opacity 0.3 to 0.1, transform-only scale animation.
- Keep pulse animation independent from hover so hover does not restart it.

## Layering

Place route endpoint pins and progress pins above route bodies and arrows. Keep white outlines under colored route bodies. Ensure overlays use `pointer-events` intentionally so the route remains hoverable without the pins stealing input.
