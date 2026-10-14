/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CellData, TransportLink } from '../types/simulation';

export interface GeoJSONFeature {
  type: string;
  id?: string | number;
  properties?: Record<string, any>;
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Computes polygon or multipolygon centroid [longitude, latitude].
 */
function computePolygonCentroid(coordinates: any, type: string): [number, number] {
  let totalLon = 0;
  let totalLat = 0;
  let pointCount = 0;

  function traverseRings(coords: any) {
    if (typeof coords[0] === 'number') {
      totalLon += coords[0];
      totalLat += coords[1];
      pointCount++;
      return;
    }
    for (const sub of coords) {
      traverseRings(sub);
    }
  }

  traverseRings(coordinates);

  if (pointCount === 0) return [0, 0];
  return [totalLon / pointCount, totalLat / pointCount];
}

/**
 * Converts a GeoJSON FeatureCollection (e.g. World Countries from Natural Earth or GeoJSON datasets)
 * into a discrete cellular simulation representation.
 */
export function convertGeoJSONToSimulationWorld(
  geoJSON: GeoJSONFeatureCollection,
  targetRows: number = 24,
  targetCols: number = 48
): {
  cells: CellData[];
  transitLinks: TransportLink[];
} {
  const cells: CellData[] = [];
  const transitLinks: TransportLink[] = [];

  // Create base ocean grid
  for (let r = 0; r < targetRows; r++) {
    for (let c = 0; c < targetCols; c++) {
      const latitude = Math.round(75 - (r / (targetRows - 1)) * 135);
      const longitude = Math.round(-180 + (c / (targetCols - 1)) * 360);

      cells.push({
        id: `c_${r}_${c}`,
        name: `Ocean Area [${latitude}°N, ${longitude}°E]`,
        row: r,
        col: c,
        isLand: false,
        biome: 'water',
        state: {
          totalPopulation: 0,
          susceptible: 0,
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
          altitude: 0,
          temperature: 16,
          humidity: 80,
          weather: 'clear',
          populationDensity: 0,
          transmissionModifier: 1.0,
        },
        infrastructure: {
          hasAirport: false,
          hasSeaport: false,
          hasRailStation: false,
          roadDensity: 0,
          transitLinkIds: [],
        },
        healthcareCapacity: 0,
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

  const cellMap = new Map<string, CellData>();
  for (const c of cells) {
    cellMap.set(`${c.row}_${c.col}`, c);
  }

  // Map each GeoJSON feature to its matching grid cell based on centroid coordinates
  for (const feature of geoJSON.features) {
    if (!feature.geometry) continue;

    const [lon, lat] = computePolygonCentroid(feature.geometry.coordinates, feature.geometry.type);
    const countryName =
      feature.properties?.name ||
      feature.properties?.NAME ||
      feature.properties?.admin ||
      feature.properties?.ADMIN ||
      feature.properties?.country ||
      'Geographic Region';

    const popEstimate =
      feature.properties?.pop_est ||
      feature.properties?.POP_EST ||
      feature.properties?.population ||
      1500000;

    // Convert (lat, lon) to grid cell (row, col)
    // Row 0 = +75°, Row targetRows-1 = -60°
    const clampedLat = Math.max(-60, Math.min(75, lat));
    const r = Math.round(((75 - clampedLat) / 135) * (targetRows - 1));

    // Col 0 = -180°, Col targetCols-1 = +180°
    const clampedLon = Math.max(-180, Math.min(180, lon));
    const c = Math.round(((clampedLon + 180) / 360) * (targetCols - 1));

    const cell = cellMap.get(`${r}_${c}`);
    if (cell) {
      cell.isLand = true;
      cell.name = `${countryName}`;
      cell.biome = Math.abs(lat) < 20 ? 'coastal_basin' : Math.abs(lat) > 55 ? 'highland_mountain' : 'temperate_plain';
      cell.state.totalPopulation += Math.round(popEstimate);
      cell.state.susceptible += Math.round(popEstimate);
      cell.healthcareCapacity = Math.round(cell.state.totalPopulation * 0.025);
      cell.infrastructure.hasAirport = true;
      cell.infrastructure.hasRailStation = true;
      cell.infrastructure.roadDensity = 0.8;
      cell.environmental.populationDensity = Math.round(cell.state.totalPopulation / 1500);
      cell.environmental.temperature = Math.round(25 - (Math.abs(lat) / 60) * 30);
    }
  }

  return { cells, transitLinks };
}
