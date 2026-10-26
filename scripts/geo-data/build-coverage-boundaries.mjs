import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "../..");
const provinceSource = process.argv[2] ?? "/tmp/china-provinces.json";
const districtSource = process.argv[3] ?? "/tmp/shanghai-districts.json";
const manifestPath = path.join(rootDir, "public/geo/manifest.json");

const provinceNames = {
  110000: ["beijing", "Beijing"],
  120000: ["tianjin", "Tianjin"],
  130000: ["hebei", "Hebei"],
  140000: ["shanxi", "Shanxi"],
  150000: ["inner-mongolia", "Inner Mongolia"],
  210000: ["liaoning", "Liaoning"],
  220000: ["jilin", "Jilin"],
  230000: ["heilongjiang", "Heilongjiang"],
  310000: ["shanghai", "Shanghai"],
  320000: ["jiangsu", "Jiangsu"],
  330000: ["zhejiang", "Zhejiang"],
  340000: ["anhui", "Anhui"],
  350000: ["fujian", "Fujian"],
  360000: ["jiangxi", "Jiangxi"],
  370000: ["shandong", "Shandong"],
  410000: ["henan", "Henan"],
  420000: ["hubei", "Hubei"],
  430000: ["hunan", "Hunan"],
  440000: ["guangdong", "Guangdong"],
  450000: ["guangxi", "Guangxi"],
  460000: ["hainan", "Hainan"],
  500000: ["chongqing", "Chongqing"],
  510000: ["sichuan", "Sichuan"],
  520000: ["guizhou", "Guizhou"],
  530000: ["yunnan", "Yunnan"],
  540000: ["tibet", "Tibet"],
  610000: ["shaanxi", "Shaanxi"],
  620000: ["gansu", "Gansu"],
  630000: ["qinghai", "Qinghai"],
  640000: ["ningxia", "Ningxia"],
  650000: ["xinjiang", "Xinjiang"],
  710000: ["taiwan", "Taiwan"],
  810000: ["hong-kong", "Hong Kong"],
  820000: ["macao", "Macao"],
};

const districtNames = {
  310101: ["huangpu", "Huangpu District"],
  310104: ["xuhui", "Xuhui District"],
  310105: ["changning", "Changning District"],
  310106: ["jing-an", "Jing'an District"],
  310107: ["putuo", "Putuo District"],
  310109: ["hongkou", "Hongkou District"],
  310110: ["yangpu", "Yangpu District"],
  310112: ["minhang", "Minhang District"],
  310113: ["baoshan", "Baoshan District"],
  310114: ["jiading", "Jiading District"],
  310115: ["pudong", "Pudong New Area"],
  310116: ["jinshan", "Jinshan District"],
  310117: ["songjiang", "Songjiang District"],
  310118: ["qingpu", "Qingpu District"],
  310120: ["fengxian", "Fengxian District"],
  310151: ["chongming", "Chongming District"],
};

function visitCoordinates(value, visitor) {
  if (Array.isArray(value) && typeof value[0] === "number" && typeof value[1] === "number") {
    visitor(value[0], value[1]);
    return;
  }
  if (Array.isArray(value)) value.forEach((item) => visitCoordinates(item, visitor));
}

function getBounds(geometry) {
  const bbox = { east: -Infinity, north: -Infinity, south: Infinity, west: Infinity };
  visitCoordinates(geometry.coordinates, (lng, lat) => {
    bbox.east = Math.max(bbox.east, lng);
    bbox.north = Math.max(bbox.north, lat);
    bbox.south = Math.min(bbox.south, lat);
    bbox.west = Math.min(bbox.west, lng);
  });
  return bbox;
}

async function buildEntries(sourcePath, names, level, parentId, directory) {
  const source = JSON.parse(await readFile(sourcePath, "utf8"));
  const outputDir = path.join(rootDir, `public/geo/${directory}`);
  await mkdir(outputDir, { recursive: true });
  const entries = [];

  for (const feature of source.features) {
    const adcode = Number(feature.properties?.adcode);
    const definition = names[adcode];
    if (!definition) continue;
    const [id, nameEn] = definition;
    const bbox = getBounds(feature.geometry);
    const sourceCenter = feature.properties?.centroid ?? feature.properties?.center;
    const center = sourceCenter
      ? { lat: sourceCenter[1], lng: sourceCenter[0] }
      : { lat: (bbox.north + bbox.south) / 2, lng: (bbox.east + bbox.west) / 2 };
    const filePath = `geo/${directory}/${id}.geojson`;
    const collection = {
      type: "FeatureCollection",
      features: [{ ...feature, properties: { ...feature.properties, mapLabId: id } }],
    };
    await writeFile(path.join(rootDir, `public/${filePath}`), JSON.stringify(collection));
    entries.push({
      bbox,
      center,
      countryCode: "CN",
      filePath,
      id,
      level,
      nameEn,
      nameZh: feature.properties.name,
      parentId,
      source: "Alibaba DataV GeoAtlas",
    });
  }

  return entries;
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const provinces = await buildEntries(provinceSource, provinceNames, "province", "cn", "provinces");
const districts = await buildEntries(districtSource, districtNames, "district", "shanghai", "districts");
const generatedIds = new Set([...provinces, ...districts].map((region) => region.id));
const retainedRegions = manifest.regions.filter((region) => !generatedIds.has(region.id));
const nextManifest = {
  generatedAt: new Date().toISOString(),
  regions: [...provinces, ...districts, ...retainedRegions],
};

await writeFile(manifestPath, JSON.stringify(nextManifest));
console.log(`Generated ${provinces.length} provinces and ${districts.length} Shanghai districts.`);
