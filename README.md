# Map Style Workbench

Map Style Workbench is a single-page React application for experimenting with map styles, previewing maps inside a business use case, and browsing a component token manual.

## Start

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Environment Variables

Create a `.env.local` file when your map provider requires keys or hosted styles:

```bash
VITE_MAP_KEY=your-provider-key
VITE_ENTITY_MAP_ID=your-entity-map-id
VITE_VISUALIZATION_STYLE_URL=your-visualization-style-url
```

The default implementation uses public Leaflet tile presets in `src/config/mapPresets.ts`. The provider details are isolated in `MapCanvas`, so you can swap to Google Maps, Mapbox, or another vendor without changing the scene and panel APIs.

## Directory Structure

```text
src/
  components/    Sidebar, ParamPanel, PhoneFrame, BusinessCard, ComponentCard, TokenTable, MapCanvas
  scenes/        MapBrowseScene, UseCaseScene, ManualScene
  store/         workbenchStore.ts
  i18n/          zh.json, en.json, index.ts
  config/        mapPresets.ts, componentSpecs.json
  styles/        tokens.css and global CSS
  App.tsx
  main.tsx
```

## Add a Component Manual Item

Add a new object to `src/config/componentSpecs.json`:

```json
{
  "id": "area-layer",
  "nameKey": "manual.specs.areaLayer.name",
  "descriptionKey": "manual.specs.areaLayer.description",
  "previewType": "route",
  "tokens": {
    "fillColor": "#2563eb",
    "fillOpacity": "0.16"
  }
}
```

Then add the matching translation keys to both `src/i18n/zh.json` and `src/i18n/en.json`. `ManualScene` renders the JSON array automatically, so no UI code changes are required.
