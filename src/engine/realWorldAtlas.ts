/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import worldData from 'world-atlas/countries-110m.json';
import * as topojson from 'topojson-client';
import { geoCentroid } from 'd3-geo';
import { CellData, TransportLink, BiomeType, WeatherType } from '../types/simulation';
import { getWorldPopulationAtDate } from './realWorldData';

export interface WorldCountryGeoFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

// Convert TopoJSON to GeoJSON FeatureCollection
export const WORLD_COUNTRIES_FEATURE_COLLECTION = topojson.feature(
  worldData as any,
  (worldData as any).objects.countries
) as unknown as {
  type: 'FeatureCollection';
  features: WorldCountryGeoFeature[];
};

export const WORLD_LAND_FEATURE = topojson.feature(
  worldData as any,
  (worldData as any).objects.land
) as unknown as any;

/**
 * Authentic sovereign country demographic profiles reflecting 2026 UN population shares,
 * climate zones, and biomes.
 */
interface CountryProfile {
  popShare: number; // fraction of world population
  biome: BiomeType;
  temp: number; // °C
  humidity: number; // %
  density: number; // people/km²
  hasAirport: boolean;
  hasSeaport: boolean;
}

const REAL_COUNTRY_PROFILES: Record<string, CountryProfile> = {
  // Asia
  India: { popShare: 0.1742, biome: 'temperate_plain', temp: 25, humidity: 62, density: 435, hasAirport: true, hasSeaport: true },
  China: { popShare: 0.1702, biome: 'temperate_plain', temp: 14, humidity: 58, density: 150, hasAirport: true, hasSeaport: true },
  Indonesia: { popShare: 0.0338, biome: 'coastal_basin', temp: 27, humidity: 80, density: 148, hasAirport: true, hasSeaport: true },
  Pakistan: { popShare: 0.0296, biome: 'arid_plateau', temp: 24, humidity: 45, density: 285, hasAirport: true, hasSeaport: true },
  Bangladesh: { popShare: 0.0210, biome: 'coastal_basin', temp: 26, humidity: 78, density: 1200, hasAirport: true, hasSeaport: true },
  Japan: { popShare: 0.0148, biome: 'urban', temp: 15, humidity: 68, density: 335, hasAirport: true, hasSeaport: true },
  Philippines: { popShare: 0.0142, biome: 'coastal_basin', temp: 27, humidity: 82, density: 380, hasAirport: true, hasSeaport: true },
  Vietnam: { popShare: 0.0121, biome: 'coastal_basin', temp: 25, humidity: 82, density: 310, hasAirport: true, hasSeaport: true },
  Iran: { popShare: 0.0107, biome: 'arid_plateau', temp: 18, humidity: 40, density: 54, hasAirport: true, hasSeaport: true },
  Turkey: { popShare: 0.0104, biome: 'temperate_plain', temp: 14, humidity: 60, density: 110, hasAirport: true, hasSeaport: true },
  Thailand: { popShare: 0.0087, biome: 'coastal_basin', temp: 28, humidity: 75, density: 140, hasAirport: true, hasSeaport: true },
  Myanmar: { popShare: 0.0066, biome: 'coastal_basin', temp: 27, humidity: 77, density: 83, hasAirport: true, hasSeaport: true },
  'South Korea': { popShare: 0.0062, biome: 'urban', temp: 13, humidity: 64, density: 515, hasAirport: true, hasSeaport: true },
  Iraq: { popShare: 0.0054, biome: 'arid_plateau', temp: 24, humidity: 38, density: 102, hasAirport: true, hasSeaport: true },
  Afghanistan: { popShare: 0.0051, biome: 'highland_mountain', temp: 13, humidity: 40, density: 64, hasAirport: true, hasSeaport: false },
  'Saudi Arabia': { popShare: 0.0045, biome: 'arid_plateau', temp: 28, humidity: 32, density: 17, hasAirport: true, hasSeaport: true },
  Uzbekistan: { popShare: 0.0043, biome: 'arid_plateau', temp: 14, humidity: 48, density: 80, hasAirport: true, hasSeaport: false },
  Malaysia: { popShare: 0.0041, biome: 'coastal_basin', temp: 28, humidity: 80, density: 104, hasAirport: true, hasSeaport: true },
  Yemen: { popShare: 0.0041, biome: 'arid_plateau', temp: 25, humidity: 42, density: 64, hasAirport: true, hasSeaport: true },
  Nepal: { popShare: 0.0037, biome: 'highland_mountain', temp: 15, humidity: 65, density: 215, hasAirport: true, hasSeaport: false },
  'United Arab Emirates': { popShare: 0.0012, biome: 'arid_plateau', temp: 29, humidity: 55, density: 120, hasAirport: true, hasSeaport: true },
  Singapore: { popShare: 0.0007, biome: 'urban', temp: 28, humidity: 84, density: 8300, hasAirport: true, hasSeaport: true },

  // Americas
  'United States of America': { popShare: 0.0413, biome: 'urban', temp: 13, humidity: 60, density: 37, hasAirport: true, hasSeaport: true },
  Brazil: { popShare: 0.0263, biome: 'coastal_basin', temp: 24, humidity: 75, density: 26, hasAirport: true, hasSeaport: true },
  Mexico: { popShare: 0.0157, biome: 'temperate_plain', temp: 21, humidity: 55, density: 66, hasAirport: true, hasSeaport: true },
  Colombia: { popShare: 0.0063, biome: 'coastal_basin', temp: 20, humidity: 76, density: 46, hasAirport: true, hasSeaport: true },
  Argentina: { popShare: 0.0056, biome: 'temperate_plain', temp: 16, humidity: 68, density: 17, hasAirport: true, hasSeaport: true },
  Canada: { popShare: 0.0047, biome: 'highland_mountain', temp: 3, humidity: 65, density: 4, hasAirport: true, hasSeaport: true },
  Peru: { popShare: 0.0041, biome: 'arid_plateau', temp: 20, humidity: 78, density: 26, hasAirport: true, hasSeaport: true },
  Venezuela: { popShare: 0.0035, biome: 'coastal_basin', temp: 26, humidity: 74, density: 32, hasAirport: true, hasSeaport: true },
  Chile: { popShare: 0.0024, biome: 'temperate_plain', temp: 15, humidity: 62, density: 26, hasAirport: true, hasSeaport: true },
  Ecuador: { popShare: 0.0022, biome: 'coastal_basin', temp: 21, humidity: 78, density: 71, hasAirport: true, hasSeaport: true },
  Guatemala: { popShare: 0.0022, biome: 'highland_mountain', temp: 20, humidity: 70, density: 165, hasAirport: true, hasSeaport: true },
  Cuba: { popShare: 0.0014, biome: 'coastal_basin', temp: 26, humidity: 76, density: 102, hasAirport: true, hasSeaport: true },
  Bolivia: { popShare: 0.0015, biome: 'highland_mountain', temp: 12, humidity: 58, density: 11, hasAirport: true, hasSeaport: false },

  // Europe
  Russia: { popShare: 0.0174, biome: 'highland_mountain', temp: -2, humidity: 70, density: 9, hasAirport: true, hasSeaport: true },
  Germany: { popShare: 0.0101, biome: 'urban', temp: 10, humidity: 75, density: 240, hasAirport: true, hasSeaport: true },
  'United Kingdom': { popShare: 0.0082, biome: 'urban', temp: 10, humidity: 78, density: 280, hasAirport: true, hasSeaport: true },
  France: { popShare: 0.0078, biome: 'urban', temp: 12, humidity: 74, density: 120, hasAirport: true, hasSeaport: true },
  Italy: { popShare: 0.0071, biome: 'urban', temp: 16, humidity: 66, density: 200, hasAirport: true, hasSeaport: true },
  Spain: { popShare: 0.0058, biome: 'temperate_plain', temp: 16, humidity: 55, density: 94, hasAirport: true, hasSeaport: true },
  Ukraine: { popShare: 0.0045, biome: 'temperate_plain', temp: 8, humidity: 72, density: 68, hasAirport: true, hasSeaport: true },
  Poland: { popShare: 0.0046, biome: 'temperate_plain', temp: 9, humidity: 76, density: 122, hasAirport: true, hasSeaport: true },
  Netherlands: { popShare: 0.0022, biome: 'urban', temp: 10, humidity: 82, density: 520, hasAirport: true, hasSeaport: true },
  Belgium: { popShare: 0.0014, biome: 'urban', temp: 11, humidity: 80, density: 380, hasAirport: true, hasSeaport: true },
  Greece: { popShare: 0.0013, biome: 'coastal_basin', temp: 18, humidity: 62, density: 80, hasAirport: true, hasSeaport: true },
  Portugal: { popShare: 0.0012, biome: 'coastal_basin', temp: 16, humidity: 72, density: 112, hasAirport: true, hasSeaport: true },
  Sweden: { popShare: 0.0013, biome: 'highland_mountain', temp: 7, humidity: 75, density: 25, hasAirport: true, hasSeaport: true },
  Switzerland: { popShare: 0.0011, biome: 'highland_mountain', temp: 9, humidity: 74, density: 215, hasAirport: true, hasSeaport: false },

  // Africa
  Nigeria: { popShare: 0.0275, biome: 'coastal_basin', temp: 27, humidity: 80, density: 245, hasAirport: true, hasSeaport: true },
  Ethiopia: { popShare: 0.0155, biome: 'highland_mountain', temp: 19, humidity: 60, density: 115, hasAirport: true, hasSeaport: false },
  Egypt: { popShare: 0.0138, biome: 'arid_plateau', temp: 23, humidity: 48, density: 105, hasAirport: true, hasSeaport: true },
  'Dem. Rep. Congo': { popShare: 0.0127, biome: 'coastal_basin', temp: 25, humidity: 85, density: 45, hasAirport: true, hasSeaport: false },
  Tanzania: { popShare: 0.0082, biome: 'temperate_plain', temp: 24, humidity: 68, density: 70, hasAirport: true, hasSeaport: true },
  'South Africa': { popShare: 0.0074, biome: 'temperate_plain', temp: 18, humidity: 55, density: 50, hasAirport: true, hasSeaport: true },
  Kenya: { popShare: 0.0068, biome: 'temperate_plain', temp: 21, humidity: 65, density: 95, hasAirport: true, hasSeaport: true },
  Uganda: { popShare: 0.0059, biome: 'temperate_plain', temp: 23, humidity: 72, density: 210, hasAirport: true, hasSeaport: false },
  Sudan: { popShare: 0.0059, biome: 'arid_plateau', temp: 29, humidity: 35, density: 26, hasAirport: true, hasSeaport: true },
  Algeria: { popShare: 0.0056, biome: 'arid_plateau', temp: 22, humidity: 45, density: 19, hasAirport: true, hasSeaport: true },
  Morocco: { popShare: 0.0046, biome: 'temperate_plain', temp: 19, humidity: 62, density: 85, hasAirport: true, hasSeaport: true },
  Angola: { popShare: 0.0045, biome: 'temperate_plain', temp: 24, humidity: 70, density: 30, hasAirport: true, hasSeaport: true },
  Ghana: { popShare: 0.0041, biome: 'coastal_basin', temp: 27, humidity: 80, density: 140, hasAirport: true, hasSeaport: true },
  Mozambique: { popShare: 0.0041, biome: 'coastal_basin', temp: 25, humidity: 75, density: 42, hasAirport: true, hasSeaport: true },
  Madagascar: { popShare: 0.0036, biome: 'coastal_basin', temp: 24, humidity: 78, density: 50, hasAirport: true, hasSeaport: true },
  "Côte d'Ivoire": { popShare: 0.0035, biome: 'coastal_basin', temp: 27, humidity: 82, density: 90, hasAirport: true, hasSeaport: true },
  Cameroon: { popShare: 0.0035, biome: 'coastal_basin', temp: 26, humidity: 82, density: 60, hasAirport: true, hasSeaport: true },

  // Oceania
  Australia: { popShare: 0.0033, biome: 'coastal_basin', temp: 21, humidity: 58, density: 3.5, hasAirport: true, hasSeaport: true },
  'New Zealand': { popShare: 0.0006, biome: 'coastal_basin', temp: 14, humidity: 78, density: 19, hasAirport: true, hasSeaport: true },
  'Papua New Guinea': { popShare: 0.0012, biome: 'coastal_basin', temp: 26, humidity: 84, density: 22, hasAirport: true, hasSeaport: true },
};

/**
 * Calculates great circle spherical distance in kilometers between two lat/lon coordinates.
 */
export function haversineDistanceKm(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generates the authentic Real-World Country Map Simulation Dataset using the 177 sovereign nation vector polygons.
 * Guarantees that total population precisely matches the official world population at the testing date.
 */
export function generateRealCountrySimulationWorld(testingDate: Date = new Date()): {
  cells: CellData[];
  countryFeatures: WorldCountryGeoFeature[];
  transitLinks: TransportLink[];
} {
  const targetWorldPop = getWorldPopulationAtDate(testingDate);
  const countryFeatures = WORLD_COUNTRIES_FEATURE_COLLECTION.features;
  const cells: CellData[] = [];
  const transitLinks: TransportLink[] = [];

  // Calculate weights for all features
  let totalCalculatedWeight = 0;
  const countryWeightMap = new Map<string, number>();

  for (const feat of countryFeatures) {
    const name = feat.properties.name || 'Territory';
    const profile = REAL_COUNTRY_PROFILES[name];

    let weight = 0.0008; // default share for smaller territories
    if (profile) {
      weight = profile.popShare;
    }
    countryWeightMap.set(feat.id, weight);
    totalCalculatedWeight += weight;
  }

  let distributedPop = 0;

  for (let idx = 0; idx < countryFeatures.length; idx++) {
    const feat = countryFeatures[idx];
    const name = feat.properties.name || `Territory ${feat.id}`;
    const profile = REAL_COUNTRY_PROFILES[name];

    // Compute accurate spherical centroid
    const [lon, lat] = geoCentroid(feat as any);

    // Compute exact population allocation
    const weight = countryWeightMap.get(feat.id) || 0.0008;
    let pop = Math.round((weight / totalCalculatedWeight) * targetWorldPop);

    if (idx === countryFeatures.length - 1) {
      // Last country absorbs rounding differences to guarantee 100% exact population
      pop = Math.max(1, targetWorldPop - distributedPop);
    } else {
      distributedPop += pop;
    }

    const biome: BiomeType =
      profile?.biome ||
      (Math.abs(lat) > 55
        ? 'highland_mountain'
        : Math.abs(lat) < 20
        ? 'coastal_basin'
        : 'temperate_plain');

    const temp = profile?.temp ?? Math.round(26 - (Math.abs(lat) / 60) * 32);
    const humidity = profile?.humidity ?? Math.max(30, Math.min(85, Math.round(75 - Math.abs(lat) * 0.4)));
    const weather: WeatherType = humidity > 70 ? 'rain' : humidity < 40 ? 'arid' : 'clear';
    const density = profile?.density ?? Math.max(10, Math.round(pop / 15000));

    const cellId = `country_${feat.id}`;
    const healthcareCapacity = Math.round(pop * 0.025);

    // Approximate row & col indices for matrix interoperability
    const row = Math.max(0, Math.min(23, Math.round(((75 - Math.max(-60, Math.min(75, lat))) / 135) * 23)));
    const col = Math.max(0, Math.min(47, Math.round(((Math.max(-180, Math.min(180, lon)) + 180) / 360) * 47)));

    cells.push({
      id: cellId,
      name,
      row,
      col,
      isLand: true,
      biome,
      state: {
        totalPopulation: pop,
        susceptible: pop,
        infected: 0,
        recovered: 0,
        vaccinated: 0,
        deceased: 0,
        newInfectionsToday: 0,
        newDeathsToday: 0,
      },
      environmental: {
        latitude: lat,
        longitude: lon,
        altitude: 120,
        temperature: temp,
        humidity,
        weather,
        populationDensity: density,
        transmissionModifier: 1.0,
      },
      infrastructure: {
        hasAirport: profile?.hasAirport ?? pop > 5000000,
        hasSeaport: profile?.hasSeaport ?? true,
        hasRailStation: pop > 10000000,
        roadDensity: 0.8,
        transitLinkIds: [],
      },
      healthcareCapacity,
      interventions: {
        lockdownLevel: 0,
        maskMandate: false,
        isolationEffectiveness: 0,
        travelRestrictionFactor: 0,
        dailyVaccinationRate: 0,
        healthcareCapacityMultiplier: 1.0,
      },
      neighborCellIds: [],
    });
  }

  // Pre-calculate geographic neighbors for cellular automata cross-border diffusion
  for (let i = 0; i < cells.length; i++) {
    const c1 = cells[i];
    const neighbors: string[] = [];

    for (let j = 0; j < cells.length; j++) {
      if (i === j) continue;
      const c2 = cells[j];
      const distKm = haversineDistanceKm(
        c1.environmental.longitude,
        c1.environmental.latitude,
        c2.environmental.longitude,
        c2.environmental.latitude
      );

      // Countries within ~1600 km (or ~2500 km for large nations) are spatial neighbors
      const threshold = (c1.state.totalPopulation > 50000000 || c2.state.totalPopulation > 50000000) ? 2400 : 1600;
      if (distKm < threshold) {
        neighbors.push(c2.id);
      }
    }
    // Limit to closest 8 neighbors to preserve balanced cellular automata coupling
    c1.neighborCellIds = neighbors.slice(0, 8);
  }

  // Global Flight & Intercontinental Transit Network
  // ISO 3166-1 numeric IDs in world-atlas:
  // USA: 840, CAN: 124, GBR: 826, FRA: 250, DEU: 276, JPN: 392, CHN: 156, IND: 356, BRA: 076,
  // ZAF: 710, AUS: 036, ARE: 784, SGP: 702, EGY: 818, NGA: 566, MEX: 484, ARG: 032, RUS: 643,
  // ESP: 724, ITA: 380, KOR: 410, THA: 764, IDN: 360, SAU: 682, TUR: 792, NZL: 554
  const airlineRoutes: [string, string, number][] = [
    // Trans-Atlantic & North America
    ['840', '826', 28000], // USA <-> UK
    ['840', '250', 20000], // USA <-> France
    ['840', '276', 18000], // USA <-> Germany
    ['840', '124', 42000], // USA <-> Canada
    ['840', '484', 38000], // USA <-> Mexico
    ['840', '076', 15000], // USA <-> Brazil
    // Trans-Pacific
    ['840', '392', 24000], // USA <-> Japan
    ['840', '156', 22000], // USA <-> China
    ['840', '410', 16000], // USA <-> South Korea
    ['840', '036', 11000], // USA <-> Australia
    // Europe
    ['826', '250', 32000], // UK <-> France
    ['826', '276', 30000], // UK <-> Germany
    ['826', '724', 28000], // UK <-> Spain
    ['826', '380', 22000], // UK <-> Italy
    ['826', '356', 19000], // UK <-> India
    ['826', '710', 10000], // UK <-> South Africa
    ['250', '276', 26000], // France <-> Germany
    ['250', '724', 24000], // France <-> Spain
    ['250', '380', 25000], // France <-> Italy
    ['250', '566', 9000],  // France <-> Nigeria
    ['276', '643', 14000], // Germany <-> Russia
    ['276', '792', 17000], // Germany <-> Turkey
    // Asia-Pacific & Middle East
    ['156', '392', 32000], // China <-> Japan
    ['156', '410', 26000], // China <-> South Korea
    ['156', '702', 24000], // China <-> Singapore
    ['156', '764', 22000], // China <-> Thailand
    ['156', '643', 16000], // China <-> Russia
    ['156', '356', 19000], // China <-> India
    ['356', '784', 31000], // India <-> UAE
    ['356', '682', 18000], // India <-> Saudi Arabia
    ['356', '702', 19000], // India <-> Singapore
    ['392', '036', 14000], // Japan <-> Australia
    ['036', '554', 22000], // Australia <-> New Zealand
    ['702', '360', 27000], // Singapore <-> Indonesia
    ['784', '826', 26000], // UAE <-> UK
    ['784', '818', 19000], // UAE <-> Egypt
    ['784', '710', 12000], // UAE <-> South Africa
    // South America & Africa
    ['076', '032', 24000], // Brazil <-> Argentina
    ['076', '724', 12000], // Brazil <-> Spain
    ['818', '566', 8000],  // Egypt <-> Nigeria
    ['566', '710', 9500],  // Nigeria <-> South Africa
  ];

  let linkIndex = 1;
  const cellIdMap = new Map<string, CellData>();
  for (const c of cells) {
    cellIdMap.set(c.id, c);
  }

  for (const [codeA, codeB, pax] of airlineRoutes) {
    const fromCell = cellIdMap.get(`country_${codeA}`);
    const toCell = cellIdMap.get(`country_${codeB}`);

    if (fromCell && toCell) {
      const linkId = `flight_country_${linkIndex++}`;
      const link: TransportLink = {
        id: linkId,
        fromCellId: fromCell.id,
        toCellId: toCell.id,
        mode: 'flight',
        dailyPassengerVolume: pax,
        active: true,
        restrictionLevel: 0.0,
      };
      transitLinks.push(link);
      fromCell.infrastructure.transitLinkIds.push(linkId);
      toCell.infrastructure.transitLinkIds.push(linkId);
    }
  }

  return { cells, countryFeatures, transitLinks };
}
