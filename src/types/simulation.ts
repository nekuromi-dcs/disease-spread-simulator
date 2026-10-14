/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NeighborAdjacencyMode = 'four' | 'eight' | 'distance_weighted';

export type BiomeType =
  | 'urban'
  | 'temperate_plain'
  | 'highland_mountain'
  | 'coastal_basin'
  | 'arid_plateau'
  | 'water';

export type WeatherType = 'clear' | 'overcast' | 'rain' | 'arid';

export type TransportMode = 'flight' | 'rail' | 'road' | 'sea';

export interface TransportLink {
  id: string;
  fromCellId: string;
  toCellId: string;
  mode: TransportMode;
  dailyPassengerVolume: number;
  active: boolean;
  restrictionLevel: number; // 0.0 = unrestricted, 1.0 = completely halted
}

export interface CellEpidemiologicalState {
  totalPopulation: number; // N
  susceptible: number;     // S
  infected: number;        // I
  recovered: number;       // R
  vaccinated: number;      // V
  deceased: number;        // D
  newInfectionsToday: number;
  newDeathsToday: number;
}

export interface CellEnvironmentalState {
  latitude: number;
  longitude: number;
  altitude: number; // in meters (e.g. 50 - 3200m)
  temperature: number; // in °C (e.g. -5 to 38°C)
  humidity: number; // relative humidity 0-100%
  weather: WeatherType;
  populationDensity: number; // people / km²
  transmissionModifier: number; // computed modifier E_i
}

export interface CellInfrastructure {
  hasAirport: boolean;
  hasSeaport: boolean;
  hasRailStation: boolean;
  roadDensity: number; // 0 to 1
  transitLinkIds: string[];
}

export interface RegionalInterventionSettings {
  lockdownLevel: number; // 0.0 (none) to 0.9 (complete stay-at-home)
  maskMandate: boolean; // reduces beta by ~30-40%
  isolationEffectiveness: number; // 0.0 to 0.9 (quarantine of detected cases)
  travelRestrictionFactor: number; // 0.0 (normal) to 1.0 (borders sealed)
  dailyVaccinationRate: number; // fraction of susceptible vaccinated per day
  healthcareCapacityMultiplier: number; // surge capacity multiplier (1.0 to 2.5)
}

export interface CellData {
  id: string;
  name: string;
  row: number;
  col: number;
  isLand: boolean;
  biome: BiomeType;
  state: CellEpidemiologicalState;
  environmental: CellEnvironmentalState;
  infrastructure: CellInfrastructure;
  healthcareCapacity: number; // max severe patients manageable before excess mortality
  interventions: RegionalInterventionSettings;
  neighborCellIds?: string[]; // geographic or border neighbors for cellular automata
}

export interface GlobalDiseaseParameters {
  diseaseName: string;
  baseTransmissionRateBeta: number; // contact transmission rate
  recoveryRateGamma: number;        // 1 / infectious period (e.g. 1/10 = 0.1)
  mortalityRateMu: number;          // baseline case fatality rate
  vaccineEffectivenessEta: number;  // 0.0 to 1.0 protection against infection
  waningImmunityRateOmega: number;  // R -> S rate per day (e.g. 0.002 or 0)
  healthcareCapacityPerThousand: number; // default beds/ICU capacity per 1,000 people
  excessMortalityMultiplier: number; // multiplier for mortality when I > capacity
  environmentalSensitivity: number; // 0.0 (disabled) to 1.0 (full effect)
  optimalTransmissionTemp: number; // temperature at which disease spreads fastest (°C)
  stochasticTransmission: boolean; // stochastic draws vs continuous numerical rounding
}

export interface GlobalInterventions {
  startDay: number;
  endDay: number;
  universalMaskMandate: boolean;
  lockdownStringency: number; // 0.0 to 0.9
  travelRestrictionFactor: number; // 0.0 to 1.0
  vaccineRolloutSpeed: number; // fraction of population vaccinated daily
  vaccineEffectiveness: number;
  quarantineIsolationRate: number; // fraction of cases effectively isolated
  healthcareExpansionFactor: number; // e.g. 1.0 to 2.0 surge
  airportClosure: boolean;
  railRoadClosure: boolean;
}

export interface SimulationStepRecord {
  day: number;
  totalPopulation: number;
  totalS: number;
  totalI: number;
  totalR: number;
  totalV: number;
  totalD: number;
  newInfections: number;
  newDeaths: number;
  effectiveRt: number;
  activeRegionsCount: number;
  healthcareOverloadedCellsCount: number;
  totalHealthcareCapacity: number;
  totalHealthcareDemand: number;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  diseaseParameters: GlobalDiseaseParameters;
  globalInterventions: GlobalInterventions;
  randomSeed: number;
  adjacencyMode: NeighborAdjacencyMode;
  envModifierEnabled: boolean;
  initialInfectedRegionId: string;
  initialInfectedCount: number;
}

export interface ScenarioRunResult {
  scenarioId: string;
  scenarioName: string;
  history: SimulationStepRecord[];
  peakInfected: number;
  dayOfPeak: number;
  totalCumulativeInfections: number;
  totalCumulativeDeaths: number;
  outbreakDurationDays: number;
  maxHealthcareOverloadRatio: number;
  attackRatePercent: number; // total infections / initial population
  caseFatalityRatePercent: number;
}

export type MapViewMode =
  | 'infection_intensity'
  | 'susceptible'
  | 'recovered'
  | 'vaccinated'
  | 'deaths'
  | 'density'
  | 'environment'
  | 'transport';
