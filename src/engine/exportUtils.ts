/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CellData, SimulationScenario, SimulationStepRecord } from '../types/simulation';

/**
 * Downloads a string as a file in the browser without external libraries.
 */
export function downloadFile(content: string, fileName: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports simulation time-series records to standard CSV.
 */
export function exportTimeSeriesToCSV(
  history: SimulationStepRecord[],
  scenarioName: string = 'Simulation'
): void {
  const headers = [
    'Day',
    'TotalPopulation',
    'Susceptible',
    'Infected',
    'Recovered',
    'Vaccinated',
    'Deceased',
    'NewInfections',
    'NewDeaths',
    'EffectiveRt',
    'ActiveRegions',
    'HealthcareOverloadedCount',
    'HealthcareDemand',
    'HealthcareCapacity',
  ];

  const rows = history.map((r) => [
    r.day,
    r.totalPopulation,
    r.totalS,
    r.totalI,
    r.totalR,
    r.totalV,
    r.totalD,
    r.newInfections,
    r.newDeaths,
    r.effectiveRt.toFixed(2),
    r.activeRegionsCount,
    r.healthcareOverloadedCellsCount,
    r.totalHealthcareDemand,
    r.totalHealthcareCapacity,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const safeName = scenarioName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  downloadFile(csvContent, `sirvd_timeseries_${safeName}_day${history.length}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Exports current regional cell state to standard CSV.
 */
export function exportRegionalSummaryToCSV(cells: CellData[], currentDay: number): void {
  const headers = [
    'CellID',
    'RegionName',
    'Row',
    'Col',
    'IsLand',
    'Biome',
    'TotalPopulation',
    'Susceptible',
    'Infected',
    'Recovered',
    'Vaccinated',
    'Deceased',
    'NewInfectionsToday',
    'NewDeathsToday',
    'Latitude',
    'Longitude',
    'AltitudeMeters',
    'TemperatureC',
    'HumidityPercent',
    'Weather',
    'PopulationDensityKm2',
    'TransmissionModifier',
    'HasAirport',
    'HasRailStation',
    'HasSeaport',
    'TransitLinksCount',
    'HealthcareCapacity',
    'LockdownLevel',
    'MaskMandate',
    'IsolationEffectiveness',
    'TravelRestrictionFactor',
    'DailyVaccinationRate',
  ];

  const rows = cells
    .filter((c) => c.isLand)
    .map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.row,
      c.col,
      c.isLand ? 1 : 0,
      c.biome,
      c.state.totalPopulation,
      c.state.susceptible,
      c.state.infected,
      c.state.recovered,
      c.state.vaccinated,
      c.state.deceased,
      c.state.newInfectionsToday,
      c.state.newDeathsToday,
      c.environmental.latitude,
      c.environmental.longitude,
      c.environmental.altitude,
      c.environmental.temperature,
      c.environmental.humidity,
      c.environmental.weather,
      c.environmental.populationDensity,
      c.environmental.transmissionModifier.toFixed(3),
      c.infrastructure.hasAirport ? 1 : 0,
      c.infrastructure.hasRailStation ? 1 : 0,
      c.infrastructure.hasSeaport ? 1 : 0,
      c.infrastructure.transitLinkIds.length,
      c.healthcareCapacity,
      c.interventions.lockdownLevel.toFixed(2),
      c.interventions.maskMandate ? 1 : 0,
      c.interventions.isolationEffectiveness.toFixed(2),
      c.interventions.travelRestrictionFactor.toFixed(2),
      c.interventions.dailyVaccinationRate.toFixed(4),
    ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  downloadFile(csvContent, `sirvd_regional_state_day${currentDay}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Validates and parses an uploaded scenario JSON file.
 */
export function validateAndParseScenarioJSON(jsonString: string): {
  valid: boolean;
  scenario?: SimulationScenario;
  error?: string;
} {
  try {
    const obj = JSON.parse(jsonString);
    if (!obj || typeof obj !== 'object') {
      return { valid: false, error: 'File is not a valid JSON object.' };
    }
    if (!obj.id || !obj.name || !obj.diseaseParameters || !obj.globalInterventions) {
      return {
        valid: false,
        error: 'Missing required scenario fields (id, name, diseaseParameters, globalInterventions).',
      };
    }
    const dp = obj.diseaseParameters;
    if (
      typeof dp.baseTransmissionRateBeta !== 'number' ||
      typeof dp.recoveryRateGamma !== 'number' ||
      typeof dp.mortalityRateMu !== 'number'
    ) {
      return { valid: false, error: 'Invalid or missing numeric disease parameters.' };
    }
    return { valid: true, scenario: obj as SimulationScenario };
  } catch (err) {
    return { valid: false, error: `JSON Parse error: ${String(err)}` };
  }
}
