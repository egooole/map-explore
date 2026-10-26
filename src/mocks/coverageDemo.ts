export type CoverageType = "delivery" | "pickup" | "return";
export type ServiceType = "all" | "regular" | "ndd";
export type CoverageStatus = "fully" | "partial" | "none";

export interface CoverageMetric {
  ado: number;
  coverage: number;
  density: number;
  facilityCount: number;
}

export interface CoverageFacility {
  ado: number;
  coveredDistrictIds: string[];
  density: number;
  id: string;
  km2: number;
  name: string;
  position: { lat: number; lng: number };
}

export const provinceRegionIds = [
  "beijing", "tianjin", "hebei", "shanxi", "inner-mongolia", "liaoning", "jilin", "heilongjiang",
  "shanghai", "jiangsu", "zhejiang", "anhui", "fujian", "jiangxi", "shandong", "henan", "hubei",
  "hunan", "guangdong", "guangxi", "hainan", "chongqing", "sichuan", "guizhou", "yunnan", "tibet",
  "shaanxi", "gansu", "qinghai", "ningxia", "xinjiang", "taiwan", "hong-kong", "macao",
] as const;

export const shanghaiDistrictIds = [
  "huangpu", "xuhui", "changning", "jing-an", "putuo", "hongkou", "yangpu", "minhang", "baoshan",
  "jiading", "pudong", "jinshan", "songjiang", "qingpu", "fengxian", "chongming",
] as const;

const coverageFactors: Record<CoverageType, number> = {
  delivery: 1,
  pickup: 0.82,
  return: 0.64,
};

const serviceFactors: Record<ServiceType, number> = {
  all: 1,
  regular: 0.92,
  ndd: 0.7,
};

function seededNumber(id: string, salt: number) {
  let value = salt;
  for (let index = 0; index < id.length; index += 1) {
    value = (value * 31 + id.charCodeAt(index)) % 9973;
  }
  return value / 9973;
}

function baseMetric(regionId: string): CoverageMetric {
  const coverageSeed = seededNumber(regionId, 17);
  const facilitySeed = seededNumber(regionId, 29);
  return {
    ado: Math.round(2400 + seededNumber(regionId, 43) * 18200),
    coverage: coverageSeed > 0.86 ? 1 : coverageSeed < 0.12 ? 0 : 0.32 + coverageSeed * 0.64,
    density: Math.round(38 + seededNumber(regionId, 71) * 210),
    facilityCount: Math.max(0, Math.round(facilitySeed * 11)),
  };
}

export function getCoverageMetric(
  regionId: string,
  coverageType: CoverageType,
  serviceType: ServiceType,
): CoverageMetric {
  const metric = baseMetric(regionId);
  const adjusted = metric.coverage * coverageFactors[coverageType] * serviceFactors[serviceType];
  const coverage = adjusted >= 0.88 ? 1 : adjusted <= 0.16 ? 0 : Math.min(0.99, adjusted);
  return {
    ...metric,
    ado: Math.round(metric.ado * coverageFactors[coverageType]),
    coverage,
    facilityCount: coverage === 0 ? 0 : metric.facilityCount,
  };
}

export function getCoverageStatus(coverage: number): CoverageStatus {
  if (coverage === 1) return "fully";
  if (coverage === 0) return "none";
  return "partial";
}

export function getCoverageSummary(
  regionIds: readonly string[],
  coverageType: CoverageType,
  serviceType: ServiceType,
) {
  const total = regionIds.reduce(
    (sum, regionId) => sum + getCoverageMetric(regionId, coverageType, serviceType).coverage,
    0,
  );
  return regionIds.length ? total / regionIds.length : 0;
}

export const coverageFacilities: CoverageFacility[] = [
  {
    ado: 12680,
    coveredDistrictIds: ["yangpu", "hongkou", "pudong", "baoshan"],
    density: 188,
    id: "facility-yangpu-01",
    km2: 214,
    name: "GTL Yangpu Hub 01",
    position: { lat: 31.286, lng: 121.538 },
  },
  {
    ado: 10840,
    coveredDistrictIds: ["xuhui", "huangpu", "changning", "jing-an", "minhang"],
    density: 172,
    id: "facility-xuhui-02",
    km2: 186,
    name: "GTL Xuhui Hub 02",
    position: { lat: 31.17, lng: 121.435 },
  },
  {
    ado: 7920,
    coveredDistrictIds: ["baoshan", "jiading", "putuo"],
    density: 126,
    id: "facility-baoshan-03",
    km2: 278,
    name: "GTL Baoshan Hub 03",
    position: { lat: 31.387, lng: 121.413 },
  },
  {
    ado: 6240,
    coveredDistrictIds: ["songjiang", "qingpu", "jinshan", "fengxian"],
    density: 92,
    id: "facility-songjiang-04",
    km2: 342,
    name: "GTL Songjiang Hub 04",
    position: { lat: 31.035, lng: 121.218 },
  },
];
