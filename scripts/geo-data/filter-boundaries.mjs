import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { boundaryTargets, geoBoundarySources } from "./geo-targets.mjs";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const rawDir = path.join(currentDir, "raw");
const filteredDir = path.join(currentDir, "filtered");

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data)}\n`);
}

function getGeoBoundariesSource(sourceId) {
  const source = geoBoundarySources.find((item) => item.id === sourceId);
  if (!source) {
    throw new Error(`Missing geoBoundaries source config: ${sourceId}`);
  }
  return source;
}

function buildFeatureCollection(feature, target) {
  return {
    type: "FeatureCollection",
    name: target.id,
    features: [
      {
        ...feature,
        properties: {
          ...feature.properties,
          mapLabId: target.id,
          mapLabNameEn: target.names.en,
          mapLabNameZh: target.names.zh,
        },
      },
    ],
  };
}

async function filterGeoBoundariesCity(target) {
  if (!target.match) {
    throw new Error(`Target ${target.id} is missing a match rule`);
  }

  const source = getGeoBoundariesSource(target.sourceId);
  const inputPath = path.join(rawDir, "geoboundaries", source.countryIso3, source.admLevel, "boundary.geojson");
  const data = await readJson(inputPath);
  const matches = data.features.filter((feature) => feature.properties?.[target.match.property] === target.match.value);

  if (matches.length !== 1) {
    throw new Error(
      `Expected one match for ${target.id} with ${target.match.property}=${target.match.value}, found ${matches.length}`,
    );
  }

  const outputPath = path.join(filteredDir, "cities", `${target.id}.raw.geojson`);
  await writeJson(outputPath, buildFeatureCollection(matches[0], target));

  return {
    id: target.id,
    match: target.match,
    outputPath: path.relative(process.cwd(), outputPath),
    properties: matches[0].properties,
  };
}

async function main() {
  const requestedIds = process.argv.slice(2);
  const targets = boundaryTargets.cities.filter((target) => requestedIds.length === 0 || requestedIds.includes(target.id));
  const results = [];

  for (const target of targets) {
    results.push(await filterGeoBoundariesCity(target));
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
