/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CellData, TransportLink, BiomeType, WeatherType } from '../types/simulation';

export const REAL_ROWS = 24;
export const REAL_COLS = 48;

export interface RealWorldLocation {
  name: string;
  country: string;
  iata?: string;
  population: number;
  biome: BiomeType;
  temp: number; // average temp °C
  humidity: number; // %
  density: number; // people/km²
  altitude: number; // meters
  hasAirport: boolean;
  hasSeaport: boolean;
  hasRail: boolean;
}

/**
 * 24x48 Earth Landmass Grid Mask.
 * 1 represents land, 0 represents ocean.
 * Latitude spans +75°N (row 0) to -60°S (row 23).
 * Longitude spans -180°W (col 0) to +180°E (col 47).
 */
export const EARTH_LAND_MASK: number[][] = [
  // Row 0: +75°N to +69.4°N (Arctic, Greenland, Northern Siberia)
  [0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
  // Row 1: +69.4°N to +63.8°N (Alaska, Northern Canada, Greenland, Scandinavia, Siberia)
  [0,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
  // Row 2: +63.8°N to +58.1°N (Alaska, Canada, Iceland, Norway, Sweden, Russia)
  [0,1,1,1,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
  // Row 3: +58.1°N to +52.5°N (Canada, UK, Northern Europe, Russia, Kamchatka)
  [0,0,1,1,1,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  // Row 4: +52.5°N to +46.9°N (Southern Canada, Northern US, Western/Central Europe, Kazakhstan, Mongolia, East Russia)
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  // Row 5: +46.9°N to +41.3°N (USA North, Southern Europe, Black Sea, Central Asia, Northern China, Japan)
  [0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  // Row 6: +41.3°N to +35.6°N (USA Central, Mediterranean, Turkey, Iran, China Central, Korea, Japan)
  [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
  // Row 7: +35.6°N to +30.0°N (USA South, North Africa, Middle East, Pakistan, Northern India, Southern China)
  [0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
  // Row 8: +30.0°N to +24.4°N (Mexico North, Florida, Sahara, Egypt, Saudi Arabia, India Central, South China)
  [0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
  // Row 9: +24.4°N to +18.8°N (Mexico Central, Caribbean, Mauritania, Mali, Sudan, Arabian Sea, India South, SE Asia)
  [0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
  // Row 10: +18.8°N to +13.1°N (Central America, Senegal, Chad, Ethiopia, Bay of Bengal, Thailand, Philippines)
  [0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,1,1,0,1,1,1,1,1,0,0,0,0,0,0,0,0],
  // Row 11: +13.1°N to +7.5°N (Panama, Colombia, Nigeria, Cameroon, Horn of Africa, Sri Lanka, Malaysia)
  [0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,1,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
  // Row 12: +7.5°N to +1.9°N (Equator North: Colombia, Venezuela, Brazil North, Congo, Kenya, Indonesia)
  [0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
  // Row 13: +1.9°N to -3.8°S (Equator South: Ecuador, Peru, Amazon Brazil, Congo, Tanzania, Indonesia Sumatra/Borneo)
  [0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
  // Row 14: -3.8°S to -9.4°S (Peru, Brazil Central, Angola, Zambia, Mozambique, Indonesia Java, Papua)
  [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  // Row 15: -9.4°S to -15.0°S (Bolivia, Brazil East, Namibia, Zimbabwe, Mozambique, Madagascar)
  [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0],
  // Row 16: -15.0°S to -20.6°S (Bolivia, Paraguay, Brazil South, Botswana, South Africa North, Madagascar)
  [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,1,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0],
  // Row 17: -20.6°S to -26.3°S (Chile North, Argentina North, South Africa, Australia North)
  [0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0],
  // Row 18: -26.3°S to -31.9°S (Chile Central, Argentina Central, South Africa South, Australia Central)
  [0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0],
  // Row 19: -31.9°S to -37.5°S (Chile South, Argentina South, Australia South, New Zealand North)
  [0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,1,0,0],
  // Row 20: -37.5°S to -43.1°S (Patagonia, Tasmania, New Zealand South)
  [0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0],
  // Row 21: -43.1°S to -48.8°S (Southern Patagonia, Falkland Islands)
  [0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  // Row 22: -48.8°S to -54.4°S (Tierra del Fuego)
  [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  // Row 23: -54.4°S to -60.0°S (Southern Ocean boundary)
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

/**
 * Key real-world megacities and geopolitical regions with precise coordinates on the 24x48 grid.
 */
export const REAL_WORLD_HUBS: Record<string, RealWorldLocation> = {
  // North America
  'c_6_13': { name: 'New York & Tri-State Area', country: 'United States', iata: 'JFK', population: 19500000, biome: 'urban', temp: 13, humidity: 62, density: 4200, altitude: 10, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_6_6': { name: 'Los Angeles & Southern California', country: 'United States', iata: 'LAX', population: 13200000, biome: 'urban', temp: 19, humidity: 65, density: 3200, altitude: 70, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_5_11': { name: 'Chicago & Midwest Corridor', country: 'United States', iata: 'ORD', population: 9500000, biome: 'urban', temp: 10, humidity: 68, density: 2100, altitude: 180, hasAirport: true, hasSeaport: false, hasRail: true },
  'c_5_13': { name: 'Toronto & Great Lakes Basin', country: 'Canada', iata: 'YYZ', population: 6300000, biome: 'urban', temp: 9, humidity: 70, density: 1800, altitude: 120, hasAirport: true, hasSeaport: false, hasRail: true },
  'c_9_8': { name: 'Mexico City Valley', country: 'Mexico', iata: 'MEX', population: 21800000, biome: 'urban', temp: 17, humidity: 55, density: 6000, altitude: 2240, hasAirport: true, hasSeaport: false, hasRail: true },
  
  // Europe
  'c_3_23': { name: 'Greater London & Thames Estuary', country: 'United Kingdom', iata: 'LHR', population: 14200000, biome: 'urban', temp: 11, humidity: 76, density: 4800, altitude: 25, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_4_23': { name: 'Île-de-France & Paris Basin', country: 'France', iata: 'CDG', population: 12200000, biome: 'urban', temp: 12, humidity: 74, density: 4200, altitude: 35, hasAirport: true, hasSeaport: false, hasRail: true },
  'c_4_25': { name: 'Frankfurt & Rhine-Main Region', country: 'Germany', iata: 'FRA', population: 5800000, biome: 'urban', temp: 11, humidity: 72, density: 2400, altitude: 110, hasAirport: true, hasSeaport: false, hasRail: true },
  'c_5_22': { name: 'Madrid Central Plateau', country: 'Spain', iata: 'MAD', population: 6600000, biome: 'urban', temp: 15, humidity: 54, density: 2100, altitude: 650, hasAirport: true, hasSeaport: false, hasRail: true },
  'c_5_24': { name: 'Rome & Lazio Corridor', country: 'Italy', iata: 'FCO', population: 4300000, biome: 'urban', temp: 16, humidity: 66, density: 1900, altitude: 20, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_3_29': { name: 'Moscow Metropolitan Oblast', country: 'Russia', iata: 'SVO', population: 13000000, biome: 'urban', temp: 6, humidity: 75, density: 3100, altitude: 150, hasAirport: true, hasSeaport: false, hasRail: true },

  // Asia & Middle East
  'c_6_42': { name: 'Greater Tokyo & Kanto Plain', country: 'Japan', iata: 'HND', population: 37400000, biome: 'urban', temp: 16, humidity: 64, density: 6200, altitude: 40, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_5_38': { name: 'Beijing & Jingjinji Capital', country: 'China', iata: 'PEK', population: 21500000, biome: 'urban', temp: 13, humidity: 52, density: 4500, altitude: 45, hasAirport: true, hasSeaport: false, hasRail: true },
  'c_6_38': { name: 'Shanghai & Yangtze River Delta', country: 'China', iata: 'PVG', population: 26300000, biome: 'urban', temp: 17, humidity: 75, density: 5500, altitude: 10, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_8_38': { name: 'Guangzhou & Pearl River Delta', country: 'China', iata: 'CAN', population: 18700000, biome: 'urban', temp: 22, humidity: 78, density: 4800, altitude: 15, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_7_34': { name: 'National Capital Region Delhi', country: 'India', iata: 'DEL', population: 31200000, biome: 'urban', temp: 25, humidity: 50, density: 9500, altitude: 215, hasAirport: true, hasSeaport: false, hasRail: true },
  'c_8_33': { name: 'Mumbai Metropolitan Region', country: 'India', iata: 'BOM', population: 21000000, biome: 'urban', temp: 27, humidity: 75, density: 11000, altitude: 14, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_7_30': { name: 'Dubai & Arabian Gulf Hub', country: 'United Arab Emirates', iata: 'DXB', population: 3500000, biome: 'arid_plateau', temp: 29, humidity: 58, density: 2800, altitude: 5, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_12_36': { name: 'Singapore Strait Metropolis', country: 'Singapore', iata: 'SIN', population: 5900000, biome: 'urban', temp: 28, humidity: 82, density: 7800, altitude: 15, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_10_36': { name: 'Bangkok Metropolitan Region', country: 'Thailand', iata: 'BKK', population: 10700000, biome: 'urban', temp: 29, humidity: 76, density: 4100, altitude: 12, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_13_38': { name: 'Jakarta & Java Megalopolis', country: 'Indonesia', iata: 'CGK', population: 10600000, biome: 'urban', temp: 28, humidity: 80, density: 8500, altitude: 10, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_6_41': { name: 'Seoul Capital Area', country: 'South Korea', iata: 'ICN', population: 25600000, biome: 'urban', temp: 13, humidity: 62, density: 6400, altitude: 38, hasAirport: true, hasSeaport: true, hasRail: true },

  // Africa
  'c_7_26': { name: 'Cairo & Nile Delta Basin', country: 'Egypt', iata: 'CAI', population: 21300000, biome: 'arid_plateau', temp: 23, humidity: 52, density: 7500, altitude: 23, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_11_23': { name: 'Lagos & Gulf of Guinea Hub', country: 'Nigeria', iata: 'LOS', population: 15400000, biome: 'coastal_basin', temp: 27, humidity: 84, density: 6800, altitude: 35, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_12_28': { name: 'Nairobi & Great Rift Valley', country: 'Kenya', iata: 'NBO', population: 4900000, biome: 'temperate_plain', temp: 20, humidity: 65, density: 2200, altitude: 1795, hasAirport: true, hasSeaport: false, hasRail: true },
  'c_17_26': { name: 'Johannesburg & Gauteng Conurbation', country: 'South Africa', iata: 'JNB', population: 5800000, biome: 'highland_mountain', temp: 16, humidity: 55, density: 2900, altitude: 1750, hasAirport: true, hasSeaport: false, hasRail: true },

  // South America
  'c_16_14': { name: 'São Paulo Megacity Corridor', country: 'Brazil', iata: 'GRU', population: 22400000, biome: 'urban', temp: 20, humidity: 78, density: 5200, altitude: 760, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_18_13': { name: 'Buenos Aires & Rio de la Plata', country: 'Argentina', iata: 'EZE', population: 15300000, biome: 'coastal_basin', temp: 18, humidity: 72, density: 3400, altitude: 25, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_11_10': { name: 'Bogotá Savanna Basin', country: 'Colombia', iata: 'BOG', population: 11300000, biome: 'highland_mountain', temp: 14, humidity: 75, density: 4400, altitude: 2640, hasAirport: true, hasSeaport: false, hasRail: true },
  'c_13_9': { name: 'Lima Coastal Oasis', country: 'Peru', iata: 'LIM', population: 10000000, biome: 'arid_plateau', temp: 20, humidity: 82, density: 3800, altitude: 150, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_18_11': { name: 'Santiago Andean Basin', country: 'Chile', iata: 'SCL', population: 7100000, biome: 'temperate_plain', temp: 15, humidity: 60, density: 2600, altitude: 570, hasAirport: true, hasSeaport: true, hasRail: true },

  // Oceania
  'c_19_43': { name: 'Sydney & New South Wales Coast', country: 'Australia', iata: 'SYD', population: 5300000, biome: 'coastal_basin', temp: 18, humidity: 65, density: 1900, altitude: 30, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_19_42': { name: 'Melbourne & Port Phillip Bay', country: 'Australia', iata: 'MEL', population: 5100000, biome: 'coastal_basin', temp: 16, humidity: 62, density: 1800, altitude: 35, hasAirport: true, hasSeaport: true, hasRail: true },
  'c_19_46': { name: 'Auckland Isthmus', country: 'New Zealand', iata: 'AKL', population: 1700000, biome: 'coastal_basin', temp: 15, humidity: 80, density: 1100, altitude: 45, hasAirport: true, hasSeaport: true, hasRail: true },
};

/**
 * Computes exact global human population at any given date.
 * Benchmark: UN World Population reached 8.000 billion on November 15, 2022.
 * Mean net increase: ~71.5 million/year (~195,756/day, ~2.2657/second).
 * On testing date (October 13, 2026), global population is ~8,279,836,000.
 */
export function getWorldPopulationAtDate(targetDate: Date = new Date()): number {
  const benchmarkTime = Date.UTC(2022, 10, 15, 0, 0, 0); // Nov 15, 2022
  const elapsedSeconds = Math.max(0, (targetDate.getTime() - benchmarkTime) / 1000);
  const growthRatePerSecond = 2.2657; // ~71.5 million per year
  const calculated = Math.round(8000000000 + elapsedSeconds * growthRatePerSecond);
  return calculated;
}

/**
 * Returns formatted testing date string.
 */
export function getFormattedTestingDate(targetDate: Date = new Date()): string {
  return targetDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generates the full Real-World Earth Simulation Grid.
 * Normalizes all cell populations so the total living population exactly matches
 * the official Earth population at the date of testing.
 */
export function generateRealEarthWorld(testingDate: Date = new Date()): {
  cells: CellData[];
  transitLinks: TransportLink[];
  targetPopulation: number;
} {
  const cells: CellData[] = [];
  const transitLinks: TransportLink[] = [];
  const targetWorldPopulation = getWorldPopulationAtDate(testingDate);

  // Temporary container for initial unscaled cells
  const tempCells: {
    cellId: string;
    name: string;
    r: number;
    c: number;
    isLand: boolean;
    biome: BiomeType;
    latitude: number;
    longitude: number;
    altitude: number;
    temp: number;
    humidity: number;
    weather: WeatherType;
    density: number;
    rawWeight: number;
    hasAirport: boolean;
    hasSeaport: boolean;
    hasRailStation: boolean;
    roadDensity: number;
  }[] = [];

  let totalLandWeight = 0;

  for (let r = 0; r < REAL_ROWS; r++) {
    for (let c = 0; c < REAL_COLS; c++) {
      const cellId = `c_${r}_${c}`;
      const isLand = EARTH_LAND_MASK[r]?.[c] === 1;

      // Real latitude and longitude mapping
      // Row 0 = +75°N, Row 23 = -60°S
      const latitude = Math.round(75 - (r / (REAL_ROWS - 1)) * 135);
      // Col 0 = -180°W, Col 47 = +180°E
      const longitude = Math.round(-180 + (c / (REAL_COLS - 1)) * 360);

      const hubData = REAL_WORLD_HUBS[cellId];

      let name = `Ocean [${latitude}°N, ${longitude}°E]`;
      let biome: BiomeType = 'water';
      let altitude = 0;
      let temp = 15;
      let humidity = 60;
      let density = 0;
      let rawWeight = 0;
      let hasAirport = false;
      let hasSeaport = false;
      let hasRailStation = false;
      let roadDensity = 0;

      if (isLand) {
        if (hubData) {
          name = `${hubData.name} (${hubData.country})`;
          biome = hubData.biome;
          altitude = hubData.altitude;
          temp = hubData.temp;
          humidity = hubData.humidity;
          density = hubData.density;
          rawWeight = hubData.population;
          hasAirport = hubData.hasAirport;
          hasSeaport = hubData.hasSeaport;
          hasRailStation = hubData.hasRail;
          roadDensity = 0.95;
        } else {
          // Standard real-world land cell
          let country = 'Territory';
          let weightMultiplier = 1.0;

          if (latitude > 45 && longitude > -140 && longitude < -60) {
            country = 'Canada / Northern US';
            weightMultiplier = 0.4;
          } else if (latitude > 25 && latitude <= 45 && longitude > -125 && longitude < -70) {
            country = 'United States';
            weightMultiplier = 3.2;
          } else if (latitude > 10 && latitude <= 25 && longitude > -110 && longitude < -75) {
            country = 'Mexico / Central America';
            weightMultiplier = 2.4;
          } else if (latitude <= 10 && latitude > -55 && longitude > -85 && longitude < -35) {
            country = 'South America';
            weightMultiplier = 2.6;
          } else if (latitude > 35 && latitude < 70 && longitude >= -10 && longitude < 40) {
            country = 'Europe';
            weightMultiplier = 3.8;
          } else if (latitude > -35 && latitude <= 35 && longitude >= -18 && longitude < 52) {
            country = 'Africa';
            weightMultiplier = 3.5;
          } else if (latitude > 10 && latitude < 75 && longitude >= 40 && longitude < 150) {
            country = 'Asia';
            // Asia carries high density (South & East Asia)
            if (longitude >= 70 && longitude <= 125 && latitude <= 42) {
              weightMultiplier = 12.0; // Dense India / China / Pakistan / Bangladesh corridor
            } else {
              weightMultiplier = 1.5;
            }
          } else if (latitude <= 10 && longitude > 95 && longitude < 160) {
            country = 'Southeast Asia / Indonesia';
            weightMultiplier = 4.2;
          } else if (latitude < -10 && longitude > 110 && longitude < 178) {
            country = 'Australia / Oceania';
            weightMultiplier = 0.5;
          }

          name = `Region ${country} [${latitude > 0 ? `${latitude}°N` : `${Math.abs(latitude)}°S`}, ${longitude > 0 ? `${longitude}°E` : `${Math.abs(longitude)}°W`}]`;

          const absLat = Math.abs(latitude);
          if (absLat > 60) {
            biome = 'highland_mountain';
            rawWeight = 180000 * weightMultiplier;
            density = 15;
            temp = Math.round(-15 + (70 - absLat) * 1.5);
            humidity = 55;
            altitude = 450;
          } else if (absLat >= 20 && absLat <= 35 && ((longitude > -15 && longitude < 50) || (longitude > 60 && longitude < 75))) {
            biome = 'arid_plateau'; // Sahara / Arabian / Thar
            rawWeight = 450000 * weightMultiplier;
            density = 45;
            temp = 32;
            humidity = 28;
            altitude = 350;
          } else if (absLat < 15) {
            biome = 'coastal_basin'; // Tropical
            rawWeight = 1600000 * weightMultiplier;
            density = 420;
            temp = 27;
            humidity = 82;
            altitude = 120;
          } else {
            biome = 'temperate_plain'; // Temperate zone
            rawWeight = 2200000 * weightMultiplier;
            density = 350;
            temp = Math.round(18 - (absLat - 20) * 0.5);
            humidity = 64;
            altitude = 180;
          }

          roadDensity = 0.65;
          hasRailStation = (r + c) % 3 === 0;
          hasAirport = (r * 7 + c * 5) % 11 === 0;
          hasSeaport = (r + c) % 5 === 0;
        }

        totalLandWeight += rawWeight;
      }

      const weather: WeatherType = !isLand ? 'overcast' : humidity > 75 ? 'rain' : humidity < 35 ? 'arid' : 'clear';

      tempCells.push({
        cellId,
        name,
        r,
        c,
        isLand,
        biome,
        latitude,
        longitude,
        altitude,
        temp,
        humidity,
        weather,
        density,
        rawWeight,
        hasAirport,
        hasSeaport,
        hasRailStation,
        roadDensity,
      });
    }
  }

  // Scale all land cell populations so their exact sum matches targetWorldPopulation
  let distributedPopulation = 0;
  const landCellsCount = tempCells.filter((c) => c.isLand).length;
  let landIndex = 0;

  for (const item of tempCells) {
    let finalPop = 0;
    if (item.isLand && totalLandWeight > 0) {
      landIndex++;
      if (landIndex === landCellsCount) {
        // Last cell absorbs rounding so sum is 100% exact to the single digit!
        finalPop = Math.max(1, targetWorldPopulation - distributedPopulation);
      } else {
        const share = item.rawWeight / totalLandWeight;
        finalPop = Math.round(share * targetWorldPopulation);
        distributedPopulation += finalPop;
      }
    }

    const healthcareCapacity = Math.round(finalPop * 0.025);

    cells.push({
      id: item.cellId,
      name: item.name,
      row: item.r,
      col: item.c,
      isLand: item.isLand,
      biome: item.biome,
      state: {
        totalPopulation: finalPop,
        susceptible: finalPop,
        infected: 0,
        recovered: 0,
        vaccinated: 0,
        deceased: 0,
        newInfectionsToday: 0,
        newDeathsToday: 0,
      },
      environmental: {
        latitude: item.latitude,
        longitude: item.longitude,
        altitude: item.altitude,
        temperature: item.temp,
        humidity: item.humidity,
        weather: item.weather,
        populationDensity: item.isLand ? Math.round(finalPop / 1500) : 0,
        transmissionModifier: 1.0,
      },
      infrastructure: {
        hasAirport: item.hasAirport,
        hasSeaport: item.hasSeaport,
        hasRailStation: item.hasRailStation,
        roadDensity: item.roadDensity,
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
    });
  }

  // Generate Real-World Major International Flight Routes
  const realRoutes: [string, string, number][] = [
    // Transatlantic Corridors
    ['c_6_13', 'c_3_23', 18500], // JFK <-> LHR
    ['c_6_13', 'c_4_23', 14200], // JFK <-> CDG
    ['c_5_11', 'c_4_25', 11000], // ORD <-> FRA
    ['c_6_13', 'c_4_25', 12500], // JFK <-> FRA
    ['c_5_13', 'c_3_23', 9500],  // YYZ <-> LHR

    // Transpacific Corridors
    ['c_6_6', 'c_6_42', 17000],  // LAX <-> HND
    ['c_6_6', 'c_6_41', 12000],  // LAX <-> ICN
    ['c_6_6', 'c_19_43', 8500],  // LAX <-> SYD
    ['c_6_6', 'c_6_38', 13000],  // LAX <-> PVG
    ['c_5_11', 'c_6_42', 9000],  // ORD <-> HND

    // Europe - Middle East - Asia Super-Hubs
    ['c_3_23', 'c_7_30', 21000], // LHR <-> DXB
    ['c_4_23', 'c_7_30', 16000], // CDG <-> DXB
    ['c_4_25', 'c_7_30', 15500], // FRA <-> DXB
    ['c_7_30', 'c_8_33', 19000], // DXB <-> BOM
    ['c_7_30', 'c_7_34', 18000], // DXB <-> DEL
    ['c_7_30', 'c_12_36', 17500], // DXB <-> SIN
    ['c_7_30', 'c_10_36', 12000], // DXB <-> BKK

    // Intra-Asia Trunk Lines
    ['c_6_42', 'c_6_41', 19500], // HND <-> ICN
    ['c_6_42', 'c_6_38', 16000], // HND <-> PVG
    ['c_5_38', 'c_6_38', 24000], // PEK <-> PVG
    ['c_6_38', 'c_8_38', 21000], // PVG <-> CAN
    ['c_8_38', 'c_12_36', 14000], // CAN <-> SIN
    ['c_12_36', 'c_10_36', 16500], // SIN <-> BKK
    ['c_12_36', 'c_13_38', 18000], // SIN <-> CGK
    ['c_12_36', 'c_19_43', 11500], // SIN <-> SYD
    ['c_7_34', 'c_8_33', 26000],  // DEL <-> BOM

    // Africa Hubs
    ['c_3_23', 'c_17_26', 7500], // LHR <-> JNB
    ['c_7_30', 'c_17_26', 9000], // DXB <-> JNB
    ['c_7_26', 'c_7_30', 13000], // CAI <-> DXB
    ['c_4_23', 'c_11_23', 6500], // CDG <-> LOS
    ['c_7_30', 'c_12_28', 7000], // DXB <-> NBO

    // South America Hubs
    ['c_6_13', 'c_16_14', 10500], // JFK <-> GRU
    ['c_5_22', 'c_16_14', 9200],  // MAD <-> GRU
    ['c_5_22', 'c_18_13', 8800],  // MAD <-> EZE
    ['c_16_14', 'c_18_13', 14000], // GRU <-> EZE
    ['c_9_8', 'c_11_10', 8000],   // MEX <-> BOG
    ['c_11_10', 'c_13_9', 9500],  // BOG <-> LIM
    ['c_18_11', 'c_18_13', 11000], // SCL <-> EZE

    // Oceania
    ['c_19_43', 'c_19_42', 28000], // SYD <-> MEL
    ['c_19_43', 'c_19_46', 9500],  // SYD <-> AKL
  ];

  let linkCount = 1;
  const cellMap = new Map<string, CellData>();
  for (const c of cells) cellMap.set(c.id, c);

  for (const [fromId, toId, pax] of realRoutes) {
    const from = cellMap.get(fromId);
    const to = cellMap.get(toId);
    if (from && to) {
      const linkId = `flight_real_${linkCount++}`;
      const link: TransportLink = {
        id: linkId,
        fromCellId: fromId,
        toCellId: toId,
        mode: 'flight',
        dailyPassengerVolume: pax,
        active: true,
        restrictionLevel: 0.0,
      };
      transitLinks.push(link);
      from.infrastructure.transitLinkIds.push(linkId);
      to.infrastructure.transitLinkIds.push(linkId);
    }
  }

  return { cells, transitLinks, targetPopulation: targetWorldPopulation };
}
