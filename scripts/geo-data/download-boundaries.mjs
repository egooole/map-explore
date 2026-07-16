import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoBoundarySources, naturalEarthSources } from "./geo-targets.mjs";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const rawDir = path.join(currentDir, "raw");

async function downloadJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download JSON ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function downloadBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file ${url}: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function writeJson(filePath, data) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function geoBoundariesMetadataUrl(source) {
  return `https://www.geoboundaries.org/api/current/gbOpen/${source.countryIso3}/${source.admLevel}/`;
}

async function downloadGeoBoundariesSource(source) {
  const sourceDir = path.join(rawDir, "geoboundaries", source.countryIso3, source.admLevel);
  await mkdir(sourceDir, { recursive: true });

  const metadataUrl = geoBoundariesMetadataUrl(source);
  console.log(`geoBoundaries metadata: ${metadataUrl}`);
  const metadata = await downloadJson(metadataUrl);
  const geoJsonUrl = metadata.gjDownloadURL;
  if (!geoJsonUrl) {
    throw new Error(`geoBoundaries metadata missing gjDownloadURL for ${source.countryIso3} ${source.admLevel}`);
  }

  console.log(`geoBoundaries GeoJSON: ${geoJsonUrl}`);
  const geoJson = await downloadJson(geoJsonUrl);

  await writeJson(path.join(sourceDir, "metadata.json"), metadata);
  await writeJson(path.join(sourceDir, "boundary.geojson"), geoJson);

  return {
    admLevel: source.admLevel,
    countryIso3: source.countryIso3,
    featureCount: Array.isArray(geoJson.features) ? geoJson.features.length : 0,
    geoJsonPath: path.relative(process.cwd(), path.join(sourceDir, "boundary.geojson")),
    metadataPath: path.relative(process.cwd(), path.join(sourceDir, "metadata.json")),
  };
}

async function downloadNaturalEarthSource(source) {
  const sourceDir = path.join(rawDir, "natural-earth");
  await mkdir(sourceDir, { recursive: true });

  console.log(`Natural Earth file: ${source.url}`);
  const file = await downloadBuffer(source.url);
  const filePath = path.join(sourceDir, source.fileName);
  await writeFile(filePath, file);

  return {
    byteSize: file.byteLength,
    filePath: path.relative(process.cwd(), filePath),
    id: source.id,
  };
}

async function main() {
  await mkdir(rawDir, { recursive: true });

  const geoBoundaryResults = [];
  for (const source of geoBoundarySources) {
    geoBoundaryResults.push(await downloadGeoBoundariesSource(source));
  }

  const naturalEarthResults = [];
  for (const source of naturalEarthSources) {
    naturalEarthResults.push(await downloadNaturalEarthSource(source));
  }

  const summary = {
    downloadedAt: new Date().toISOString(),
    geoBoundaries: geoBoundaryResults,
    naturalEarth: naturalEarthResults,
  };

  await writeJson(path.join(rawDir, "download-summary.json"), summary);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
