/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CellData, TransportLink, BiomeType, WeatherType } from '../types/simulation';

export const GRID_ROWS = 20;
export const GRID_COLS = 30;

// Region naming lexicons for synthetic geography
const PREFIXES = [
  'North', 'South', 'East', 'West', 'Upper', 'Lower', 'Central', 'Port', 'Cape',
  'Grand', 'New', 'Fort', 'Mount', 'San', 'Verdant', 'Isle', 'Lake', 'Valley'
];
const ROOTS = [
  'Aethel', 'Bayside', 'Corvus', 'Dunhaven', 'Eldoria', 'Fallow', 'Greycliff',
  'Helios', 'Illyria', 'Junction', 'Kestrel', 'Lysander', 'Mirador', 'Navarre',
  'Oakhaven', 'Pelican', 'Ravenna', 'Solaria', 'Tarragon', 'Urbana', 'Vanguard',
  'Westeros', 'Xanadu', 'Yarrow', 'Zephyr'
];
const SUFFIXES = [
  'Metropolis', 'District', 'Harbor', 'Highlands', 'Basin', 'Territory', 'Plains',
  'Reach', 'Coast', 'Valley', 'Ridge', 'Point', 'Sanctuary', 'Corridor'
];

/**
 * Procedurally generates a geographically coherent demonstration world.
 * Generates two major continental landmasses, an archipelago, mountain ranges,
 * coastal estuaries, realistic climate bands, and transportation corridors.
 */
export function generateSyntheticWorld(): {
  cells: CellData[];
  transitLinks: TransportLink[];
} {
  const cells: CellData[] = [];
  const transitLinks: TransportLink[] = [];

  // Generate elevation and land/water map using multi-octave harmonic noise
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cellId = `c_${r}_${c}`;

      // Normalized coordinates
      const nx = c / GRID_COLS;
      const ny = r / GRID_ROWS;

      // Latitude and Longitude (-60 to +60 lat, -150 to +150 lon)
      const latitude = Math.round((0.5 - ny) * 120);
      const longitude = Math.round((nx - 0.5) * 300);

      // Continent shape generator: 2 primary continental centres + island chain
      // Continent 1 (West): Center at (0.28, 0.45)
      const distCont1 = Math.hypot(nx - 0.28, (ny - 0.45) * 1.3);
      // Continent 2 (East): Center at (0.74, 0.52)
      const distCont2 = Math.hypot(nx - 0.74, (ny - 0.52) * 1.2);
      // Central archipelago / strait at (0.50, 0.60)
      const distIslands = Math.hypot(nx - 0.50, ny - 0.65);

      // Harmonic land elevation formula
      const noise =
        Math.sin(nx * 8.5) * 0.18 +
        Math.cos(ny * 9.2) * 0.16 +
        Math.sin((nx + ny) * 12.0) * 0.12;

      const landScore1 = 0.42 - distCont1 + noise;
      const landScore2 = 0.38 - distCont2 + noise * 0.8;
      const landScore3 = 0.18 - distIslands + Math.sin(nx * 20.0) * 0.15;

      const maxLandScore = Math.max(landScore1, landScore2, landScore3);
      const isLand = maxLandScore > 0.05;

      // Biome, altitude, and climate calculations
      let biome: BiomeType = 'water';
      let altitude = 0; // meters
      let populationDensity = 0; // people / km²
      let totalPop = 0;

      if (isLand) {
        // Altitude: inland ridges are higher
        const inlandProminence = maxLandScore * 2.5;
        const mountainRidge = Math.sin(nx * 14.0 + ny * 6.0);
        if (mountainRidge > 0.45 && inlandProminence > 0.4) {
          biome = 'highland_mountain';
          altitude = Math.round(1400 + mountainRidge * 1600);
        } else if (Math.abs(latitude) < 20 && nx > 0.6) {
          biome = 'arid_plateau';
          altitude = Math.round(300 + noise * 500);
        } else if (distCont1 < 0.15 || distCont2 < 0.14) {
          biome = 'urban';
          altitude = Math.round(40 + Math.abs(noise) * 120);
        } else if (maxLandScore < 0.18) {
          biome = 'coastal_basin';
          altitude = Math.round(15 + Math.abs(noise) * 80);
        } else {
          biome = 'temperate_plain';
          altitude = Math.round(120 + Math.abs(noise) * 350);
        }

        // Populations based on biomes
        switch (biome) {
          case 'urban':
            populationDensity = Math.round(3500 + Math.abs(noise) * 5000);
            totalPop = Math.round(600000 + Math.abs(noise) * 900000);
            break;
          case 'coastal_basin':
            populationDensity = Math.round(800 + Math.abs(noise) * 1400);
            totalPop = Math.round(250000 + Math.abs(noise) * 350000);
            break;
          case 'temperate_plain':
            populationDensity = Math.round(350 + Math.abs(noise) * 600);
            totalPop = Math.round(140000 + Math.abs(noise) * 180000);
            break;
          case 'highland_mountain':
            populationDensity = Math.round(45 + Math.abs(noise) * 90);
            totalPop = Math.round(35000 + Math.abs(noise) * 45000);
            break;
          case 'arid_plateau':
            populationDensity = Math.round(60 + Math.abs(noise) * 110);
            totalPop = Math.round(40000 + Math.abs(noise) * 50000);
            break;
          default:
            totalPop = 50000;
        }
      }

      // Climate: Temperature depends on latitude & altitude lapse rate (-6.5°C per 1000m)
      const baseEquatorTemp = 30.0;
      const latCooling = Math.pow(Math.abs(latitude) / 60, 1.4) * 36.0;
      const lapseCooling = (altitude / 1000) * 6.5;
      const temperature = Math.round((baseEquatorTemp - latCooling - lapseCooling + noise * 3) * 10) / 10;

      // Humidity
      let humidity = Math.round(55 + (isLand ? (biome === 'coastal_basin' ? 25 : biome === 'arid_plateau' ? -30 : 0) : 35) + noise * 10);
      humidity = Math.max(15, Math.min(95, humidity));

      // Weather condition
      let weather: WeatherType = 'clear';
      if (!isLand) {
        weather = 'overcast';
      } else if (biome === 'arid_plateau') {
        weather = 'arid';
      } else if (humidity > 75) {
        weather = 'rain';
      } else if (humidity > 58) {
        weather = 'overcast';
      }

      // Infrastructure
      const hasAirport = isLand && (biome === 'urban' || (totalPop > 220000 && (r + c) % 4 === 0));
      const hasSeaport = isLand && biome === 'coastal_basin' && (r + c) % 3 === 0;
      const hasRailStation = isLand && (biome === 'urban' || biome === 'temperate_plain');
      const roadDensity = isLand ? (biome === 'urban' ? 0.95 : biome === 'highland_mountain' ? 0.25 : 0.65) : 0;

      // Regional name
      const prefix = PREFIXES[(r * 7 + c * 3) % PREFIXES.length];
      const root = ROOTS[(r * 5 + c * 11) % ROOTS.length];
      const suffix = SUFFIXES[(r * 13 + c) % SUFFIXES.length];
      const name = isLand ? `${prefix} ${root} ${suffix}` : `Ocean Zone ${r}-${c}`;

      // Baseline healthcare capacity (default ~2.5% of population can be treated at peak)
      const healthcareCapacity = Math.round(totalPop * 0.025);

      cells.push({
        id: cellId,
        name,
        row: r,
        col: c,
        isLand,
        biome,
        state: {
          totalPopulation: totalPop,
          susceptible: totalPop,
          infected: 0,
          recovered: 0,
          vaccinated: 0,
          deceased: 0,
          newInfectionsToday: 0,
          newDeathsToday: 0,
        },
        environmental: {
          latitude,
          longitude,
          altitude,
          temperature,
          humidity,
          weather,
          populationDensity,
          transmissionModifier: 1.0,
        },
        infrastructure: {
          hasAirport,
          hasSeaport,
          hasRailStation,
          roadDensity,
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
  }

  // Create Transit Links (Long-distance transportation graph)
  // 1. Air routes connecting all airport hubs
  const airportCells = cells.filter((c) => c.isLand && c.infrastructure.hasAirport);
  let linkCounter = 1;

  for (let i = 0; i < airportCells.length; i++) {
    for (let j = i + 1; j < airportCells.length; j++) {
      const a = airportCells[i];
      const b = airportCells[j];
      const dist = Math.hypot(a.row - b.row, a.col - b.col);

      // Create long-range flight routes for hubs
      if (dist >= 6 && dist <= 22) {
        // Probability check to avoid an overdense complete mesh
        if ((a.row * 17 + b.col * 23 + dist) % 3 === 0) {
          const linkId = `transit_flight_${linkCounter++}`;
          const dailyPax = Math.round(800 + (a.state.totalPopulation + b.state.totalPopulation) / 1200);

          const link: TransportLink = {
            id: linkId,
            fromCellId: a.id,
            toCellId: b.id,
            mode: 'flight',
            dailyPassengerVolume: dailyPax,
            active: true,
            restrictionLevel: 0.0,
          };

          transitLinks.push(link);
          a.infrastructure.transitLinkIds.push(linkId);
          b.infrastructure.transitLinkIds.push(linkId);
        }
      }
    }
  }

  // 2. High-speed rail corridors connecting neighboring and near-neighbor urban/plain land cells
  const railCells = cells.filter((c) => c.isLand && c.infrastructure.hasRailStation);
  for (let i = 0; i < railCells.length; i++) {
    for (let j = i + 1; j < railCells.length; j++) {
      const a = railCells[i];
      const b = railCells[j];
      const dist = Math.hypot(a.row - b.row, a.col - b.col);

      if (dist >= 1.5 && dist <= 3.8) {
        if ((a.row * 5 + b.col * 9) % 2 === 0) {
          const linkId = `transit_rail_${linkCounter++}`;
          const dailyPax = Math.round(1500 + (a.state.totalPopulation + b.state.totalPopulation) / 800);

          const link: TransportLink = {
            id: linkId,
            fromCellId: a.id,
            toCellId: b.id,
            mode: 'rail',
            dailyPassengerVolume: dailyPax,
            active: true,
            restrictionLevel: 0.0,
          };

          transitLinks.push(link);
          a.infrastructure.transitLinkIds.push(linkId);
          b.infrastructure.transitLinkIds.push(linkId);
        }
      }
    }
  }

  // 3. Maritime shipping links between seaports across straits/coasts
  const portCells = cells.filter((c) => c.isLand && c.infrastructure.hasSeaport);
  for (let i = 0; i < portCells.length; i++) {
    for (let j = i + 1; j < portCells.length; j++) {
      const a = portCells[i];
      const b = portCells[j];
      const dist = Math.hypot(a.row - b.row, a.col - b.col);

      if (dist >= 3 && dist <= 14) {
        if ((a.row * 11 + b.col * 7) % 3 === 0) {
          const linkId = `transit_sea_${linkCounter++}`;
          const dailyPax = Math.round(400 + (a.state.totalPopulation + b.state.totalPopulation) / 2500);

          const link: TransportLink = {
            id: linkId,
            fromCellId: a.id,
            toCellId: b.id,
            mode: 'sea',
            dailyPassengerVolume: dailyPax,
            active: true,
            restrictionLevel: 0.0,
          };

          transitLinks.push(link);
          a.infrastructure.transitLinkIds.push(linkId);
          b.infrastructure.transitLinkIds.push(linkId);
        }
      }
    }
  }

  return { cells, transitLinks };
}

/**
 * Finds a suitable initial outbreak seed cell (e.g. an international urban transport hub).
 */
export function getRecommendedOutbreakCell(cells: CellData[]): CellData {
  const urbanHubs = cells.filter(
    (c) => c.isLand && c.biome === 'urban' && c.infrastructure.hasAirport
  );
  if (urbanHubs.length > 0) {
    // Pick the most populous metropolitan transport hub
    return urbanHubs.reduce((prev, curr) =>
      curr.state.totalPopulation > prev.state.totalPopulation ? curr : prev
    );
  }
  return cells.find((c) => c.isLand) || cells[0];
}
