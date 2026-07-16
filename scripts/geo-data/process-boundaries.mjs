import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { boundaryTargets, geoBoundarySources, naturalEarthSources } from "./geo-targets.mjs";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const rawDir = path.join(currentDir, "raw");
const filteredDir = path.join(currentDir, "filtered");
const simplifiedDir = path.join(currentDir, "simplified");
const publicGeoDir = path.join(currentDir, "..", "..", "public", "geo");

const simplifyRatios = {
  cityConservative: "70%",
  cityMedium: "45%",
  country: "20%",
};

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

function getNaturalEarthSource(sourceId) {
  const source = naturalEarthSources.find((item) => item.id === sourceId);
  if (!source) {
    throw new Error(`Missing Natural Earth source config: ${sourceId}`);
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

function collectCoordinateCount(geometry) {
  let count = 0;
  const walk = (value) => {
    if (!Array.isArray(value)) {
      return;
    }

    if (typeof value[0] === "number" && typeof value[1] === "number") {
      count += 1;
      return;
    }

    for (const item of value) {
      walk(item);
    }
  };

  walk(geometry?.coordinates);
  return count;
}

function collectCoordinates(geometry) {
  const coordinates = [];
  const walk = (value) => {
    if (!Array.isArray(value)) {
      return;
    }

    if (typeof value[0] === "number" && typeof value[1] === "number") {
      coordinates.push(value);
      return;
    }

    for (const item of value) {
      walk(item);
    }
  };

  walk(geometry?.coordinates);
  return coordinates;
}

function getGeoJsonBounds(data) {
  const coordinates = data.features.flatMap((feature) => collectCoordinates(feature.geometry));
  const bbox = coordinates.reduce(
    (bounds, [lng, lat]) => ({
      east: Math.max(bounds.east, lng),
      north: Math.max(bounds.north, lat),
      south: Math.min(bounds.south, lat),
      west: Math.min(bounds.west, lng),
    }),
    { east: -Infinity, north: -Infinity, south: Infinity, west: Infinity },
  );

  return {
    bbox,
    center: {
      lat: (bbox.north + bbox.south) / 2,
      lng: (bbox.east + bbox.west) / 2,
    },
  };
}

async function getGeoJsonStats(filePath) {
  const data = await readJson(filePath);
  const fileStat = await stat(filePath);
  const vertices = data.features.reduce((total, feature) => total + collectCoordinateCount(feature.geometry), 0);

  return {
    bytes: fileStat.size,
    vertices,
  };
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function runMapshaper(args) {
  await runCommand("npx", ["--yes", "mapshaper", ...args]);
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

  return outputPath;
}

async function filterNaturalEarthCountry(target) {
  const source = getNaturalEarthSource(target.sourceId);
  const inputPath = path.join(rawDir, "natural-earth", source.fileName);
  const outputPath = path.join(filteredDir, "countries", `${target.id}.raw.geojson`);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await rm(outputPath, { force: true });
  await rm(outputPath.replace(".geojson", "1.geojson"), { force: true });
  await rm(outputPath.replace(".geojson", "2.geojson"), { force: true });

  await runMapshaper([
    inputPath,
    "-filter",
    `ISO_A3 == '${target.countryIso3}'`,
    "-o",
    "format=geojson",
    "force",
    outputPath,
  ]);

  const outputCandidates = [outputPath];
  const outputDir = path.dirname(outputPath);
  const outputBase = path.basename(outputPath, ".geojson");
  for (const fileName of await readdir(outputDir)) {
    if (fileName.startsWith(outputBase) && fileName.endsWith(".geojson")) {
      outputCandidates.push(path.join(outputDir, fileName));
    }
  }

  let sourceOutputPath = outputPath;
  let data;
  for (const candidate of [...new Set(outputCandidates)]) {
    try {
      const candidateData = await readJson(candidate);
      if (candidateData.type === "FeatureCollection" && candidateData.features.length > 0) {
        sourceOutputPath = candidate;
        data = candidateData;
        break;
      }
    } catch {
      // mapshaper may write numbered files when a zip contains multiple layers.
    }
  }

  if (!data) {
    throw new Error(`No feature output found for Natural Earth target ${target.id}`);
  }

  if (data.features.length !== 1) {
    throw new Error(`Expected one Natural Earth country match for ${target.id}, found ${data.features.length}`);
  }

  await writeJson(outputPath, buildFeatureCollection(data.features[0], target));
  for (const candidate of [...new Set(outputCandidates)]) {
    if (candidate !== outputPath) {
      await rm(candidate, { force: true });
    }
  }

  return outputPath;
}

function getSimplifyRatio(targetType, targetId) {
  if (targetType === "countries") {
    return simplifyRatios.country;
  }

  if (targetId === "huangpu") {
    return simplifyRatios.cityConservative;
  }

  return targetId === "los-angeles" ? simplifyRatios.cityMedium : simplifyRatios.cityConservative;
}

async function simplifyGeoJson(inputPath, targetType, targetId) {
  const ratio = getSimplifyRatio(targetType, targetId);
  const outputPath = path.join(simplifiedDir, targetType, `${targetId}.geojson`);
  await mkdir(path.dirname(outputPath), { recursive: true });

  await runMapshaper([
    inputPath,
    "-simplify",
    ratio,
    "keep-shapes",
    "-o",
    "format=geojson",
    "force",
    outputPath,
  ]);

  return {
    outputPath,
    ratio,
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function processTarget(targetType, target) {
  const rawPath =
    targetType === "cities" ? await filterGeoBoundariesCity(target) : await filterNaturalEarthCountry(target);
  const rawStats = await getGeoJsonStats(rawPath);
  const simplified = await simplifyGeoJson(rawPath, targetType, target.id);
  const simplifiedStats = await getGeoJsonStats(simplified.outputPath);

  return {
    id: target.id,
    name: target.names.zh,
    rawBytes: rawStats.bytes,
    rawFileSize: formatBytes(rawStats.bytes),
    rawPath: path.relative(process.cwd(), rawPath),
    rawVertices: rawStats.vertices,
    simplifiedBytes: simplifiedStats.bytes,
    simplifiedFileSize: formatBytes(simplifiedStats.bytes),
    simplifiedPath: path.relative(process.cwd(), simplified.outputPath),
    simplifiedRatio: simplified.ratio,
    simplifiedVertices: simplifiedStats.vertices,
    sizeCompression: `${((1 - simplifiedStats.bytes / rawStats.bytes) * 100).toFixed(1)}%`,
    vertexCompression: `${((1 - simplifiedStats.vertices / rawStats.vertices) * 100).toFixed(1)}%`,
  };
}

async function publishGeoJson(targetType, target, simplifiedPath) {
  const publicType = targetType === "countries" ? "countries" : "cities";
  const publicRelativePath = `geo/${publicType}/${target.id}.geojson`;
  const publicPath = path.join(publicGeoDir, publicType, `${target.id}.geojson`);
  await mkdir(path.dirname(publicPath), { recursive: true });
  await copyFile(simplifiedPath, publicPath);

  const data = await readJson(simplifiedPath);
  const { bbox, center } = getGeoJsonBounds(data);

  return {
    bbox,
    center,
    countryCode: target.countryIso2,
    filePath: publicRelativePath,
    id: target.id,
    level: target.level ?? (targetType === "countries" ? "country" : "city"),
    nameEn: target.names.en,
    nameZh: target.names.zh,
    source: target.sourceId.startsWith("natural-earth") ? "Natural Earth" : "geoBoundaries",
  };
}

async function main() {
  const cityResults = [];
  for (const target of boundaryTargets.cities) {
    cityResults.push(await processTarget("cities", target));
  }

  const countryResults = [];
  for (const target of boundaryTargets.countries) {
    countryResults.push(await processTarget("countries", target));
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    simplifyRatios,
    targets: [...cityResults, ...countryResults],
  };

  await writeJson(path.join(simplifiedDir, "process-summary.json"), summary);
  const manifestRegions = [];
  const allTargets = [
    ...boundaryTargets.cities.map((target) => ({ target, type: "cities" })),
    ...boundaryTargets.countries.map((target) => ({ target, type: "countries" })),
  ];

  for (const { target, type } of allTargets) {
    const simplifiedPath = path.join(simplifiedDir, type, `${target.id}.geojson`);
    manifestRegions.push(await publishGeoJson(type, target, simplifiedPath));
  }

  await writeJson(path.join(publicGeoDir, "manifest.json"), {
    generatedAt: new Date().toISOString(),
    regions: manifestRegions,
  });

  console.table(
    summary.targets.map((target) => ({
      id: target.id,
      rawVertices: target.rawVertices,
      rawSize: target.rawFileSize,
      simplifiedVertices: target.simplifiedVertices,
      simplifiedSize: target.simplifiedFileSize,
      simplify: target.simplifiedRatio,
      vertexCompression: target.vertexCompression,
      sizeCompression: target.sizeCompression,
    })),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
