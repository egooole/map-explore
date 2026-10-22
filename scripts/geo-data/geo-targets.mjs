export const geoBoundarySources = [
  {
    admLevel: "ADM1",
    countryIso3: "CHN",
    id: "geoboundaries-chn-adm1",
  },
  {
    admLevel: "ADM3",
    countryIso3: "CHN",
    id: "geoboundaries-chn-adm3",
  },
  {
    admLevel: "ADM2",
    countryIso3: "USA",
    id: "geoboundaries-usa-adm2",
  },
];

export const naturalEarthSources = [
  {
    fileName: "ne_50m_admin_0_countries.zip",
    id: "natural-earth-admin-0-countries-50m",
    url: "https://naturalearth.s3.amazonaws.com/50m_cultural/ne_50m_admin_0_countries.zip",
  },
];

export const boundaryTargets = {
  cities: [
    {
      countryIso2: "CN",
      countryIso3: "CHN",
      id: "yangpu",
      level: "district",
      match: {
        property: "shapeID",
        value: "62558664B19255580098954",
      },
      names: {
        en: "Yangpu District",
        zh: "杨浦区",
      },
      sourceId: "geoboundaries-chn-adm3",
    },
    {
      countryIso2: "CN",
      countryIso3: "CHN",
      id: "xuhui",
      level: "district",
      match: {
        property: "shapeID",
        value: "62558664B58068800824486",
      },
      names: {
        en: "Xuhui District",
        zh: "徐汇区",
      },
      sourceId: "geoboundaries-chn-adm3",
    },
    {
      countryIso2: "CN",
      countryIso3: "CHN",
      id: "baoshan",
      level: "district",
      match: {
        property: "shapeID",
        value: "62558664B30058220699094",
      },
      names: {
        en: "Baoshan District",
        zh: "宝山区",
      },
      sourceId: "geoboundaries-chn-adm3",
    },
    {
      countryIso2: "CN",
      countryIso3: "CHN",
      id: "huangpu",
      level: "district",
      match: {
        property: "shapeID",
        value: "62558664B15620574866891",
      },
      names: {
        en: "Huangpu District",
        zh: "黄浦区",
      },
      sourceId: "geoboundaries-chn-adm3",
    },
    {
      countryIso2: "CN",
      countryIso3: "CHN",
      id: "shanghai",
      level: "city",
      match: {
        property: "shapeName",
        value: "Shanghai Municipality",
      },
      names: {
        en: "Shanghai",
        zh: "上海",
      },
      sourceId: "geoboundaries-chn-adm1",
    },
    {
      countryIso2: "CN",
      countryIso3: "CHN",
      id: "beijing",
      level: "city",
      match: {
        property: "shapeName",
        value: "Beijing Municipality",
      },
      names: {
        en: "Beijing",
        zh: "北京",
      },
      sourceId: "geoboundaries-chn-adm1",
    },
    {
      countryIso2: "US",
      countryIso3: "USA",
      id: "los-angeles",
      level: "city",
      match: {
        property: "shapeID",
        value: "52423323B87301828944684",
      },
      names: {
        en: "Los Angeles",
        zh: "洛杉矶",
      },
      sourceId: "geoboundaries-usa-adm2",
    },
  ],
  countries: [
    {
      countryIso2: "CN",
      countryIso3: "CHN",
      id: "cn",
      level: "country",
      names: {
        en: "China",
        zh: "中国",
      },
      sourceId: "natural-earth-admin-0-countries-50m",
    },
    {
      countryIso2: "US",
      countryIso3: "USA",
      id: "us",
      level: "country",
      names: {
        en: "United States",
        zh: "美国",
      },
      sourceId: "natural-earth-admin-0-countries-50m",
    },
  ],
};
