/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CellData,
  TransportLink,
  GlobalDiseaseParameters,
  GlobalInterventions,
  NeighborAdjacencyMode,
  SimulationStepRecord,
} from '../types/simulation';
import { SeededPRNG } from './prng';
import { GRID_ROWS, GRID_COLS } from './worldGenerator';

export interface NeighborCoord {
  row: number;
  col: number;
  weight: number;
}

/**
 * Returns neighbor coordinates and weights according to the selected adjacency mode.
 */
export function getNeighborCoordinates(
  r: number,
  c: number,
  mode: NeighborAdjacencyMode,
  maxRows: number = GRID_ROWS,
  maxCols: number = GRID_COLS
): NeighborCoord[] {
  const neighbors: NeighborCoord[] = [];

  // Orthogonal offsets: North, South, East, West
  const orthogonal = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const [dr, dc] of orthogonal) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < maxRows && nc >= 0 && nc < maxCols) {
      neighbors.push({ row: nr, col: nc, weight: 1.0 });
    }
  }

  // Diagonal offsets: NW, NE, SW, SE
  if (mode === 'eight' || mode === 'distance_weighted') {
    const diagonals = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    // Distance-weighted gives 1 / sqrt(2) ≈ 0.7071
    const diagWeight = mode === 'distance_weighted' ? 0.7071 : 1.0;

    for (const [dr, dc] of diagonals) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < maxRows && nc >= 0 && nc < maxCols) {
        neighbors.push({ row: nr, col: nc, weight: diagWeight });
      }
    }
  }

  return neighbors;
}

/**
 * Calculates the environmental transmission modifier E_i for a region.
 * Returns 1.0 if disabled.
 */
export function computeEnvironmentalModifier(
  cell: CellData,
  params: GlobalDiseaseParameters,
  enabled: boolean
): number {
  if (!enabled || params.environmentalSensitivity <= 0) {
    return 1.0;
  }

  const k = params.environmentalSensitivity;
  const env = cell.environmental;

  // Temperature effect: Pathogens often thrive at cooler ambient temperatures
  // Relative to optimalTransmissionTemp (default ~18°C)
  const tempDiff = params.optimalTransmissionTemp - env.temperature;
  const tempEffect = (tempDiff / 30.0) * 0.35;

  // Humidity effect: Low-to-moderate humidity prolongs airborne droplet lifetime
  // Relative to 50% benchmark
  const humidityDiff = 50.0 - env.humidity;
  const humidityEffect = (humidityDiff / 100.0) * 0.25;

  // Population density effect: Higher density leads to increased indoor contact frequency
  // Benchmark density: 250 people / km²
  const densityRatio = Math.max(10, env.populationDensity) / 250.0;
  const densityEffect = Math.min(0.5, Math.max(-0.2, (Math.log10(densityRatio) * 0.2)));

  // Weather modifier: rain/overcast drives people indoors slightly
  let weatherEffect = 0;
  if (env.weather === 'rain') weatherEffect = 0.08;
  if (env.weather === 'overcast') weatherEffect = 0.03;

  const rawModifier = 1.0 + k * (tempEffect + humidityEffect + densityEffect + weatherEffect);

  // Clamp modifier to physically bounded reasonable limits [0.45, 2.2]
  return Math.max(0.45, Math.min(2.2, Math.round(rawModifier * 1000) / 1000));
}

/**
 * Executes a single discrete-time simulation step across the entire cellular automata grid.
 * Guarantees synchronous updates, population conservation (S+I+R+V+D = N),
 * and non-negativity of all compartments.
 */
export function executeSimulationStep(
  currentCells: CellData[],
  transitLinks: TransportLink[],
  diseaseParams: GlobalDiseaseParameters,
  globalInterventions: GlobalInterventions,
  adjacencyMode: NeighborAdjacencyMode,
  envModifierEnabled: boolean,
  currentDay: number,
  prng: SeededPRNG
): {
  nextCells: CellData[];
  record: SimulationStepRecord;
} {
  // Map cells by ID for quick O(1) lookup
  const cellMap = new Map<string, CellData>();
  for (const c of currentCells) {
    cellMap.set(c.id, c);
  }

  // Pre-calculate active status of global interventions for the current day
  const isInterventionActive =
    currentDay >= globalInterventions.startDay &&
    currentDay <= globalInterventions.endDay;

  const globalMaskActive = isInterventionActive && globalInterventions.universalMaskMandate;
  const globalLockdown = isInterventionActive ? globalInterventions.lockdownStringency : 0;
  const globalTravelRestr = isInterventionActive ? globalInterventions.travelRestrictionFactor : 0;
  const globalVaccineRollout = isInterventionActive ? globalInterventions.vaccineRolloutSpeed : 0;
  const globalIsolation = isInterventionActive ? globalInterventions.quarantineIsolationRate : 0;
  const globalHealthcareSurge = isInterventionActive ? globalInterventions.healthcareExpansionFactor : 1.0;
  const airportClosed = isInterventionActive && globalInterventions.airportClosure;
  const railRoadClosed = isInterventionActive && globalInterventions.railRoadClosure;

  // Track passenger transport influx of infectious travelers into each cell
  const transitInfectiousExposureMap = new Map<string, number>();
  for (const c of currentCells) {
    transitInfectiousExposureMap.set(c.id, 0);
  }

  // Evaluate transport flows along links
  for (const link of transitLinks) {
    if (!link.active) continue;

    // Check mode closures
    if (link.mode === 'flight' && airportClosed) continue;
    if ((link.mode === 'rail' || link.mode === 'road') && railRoadClosed) continue;

    const fromCell = cellMap.get(link.fromCellId);
    const toCell = cellMap.get(link.toCellId);
    if (!fromCell || !toCell || !fromCell.isLand || !toCell.isLand) continue;

    const fromLiving = Math.max(1, fromCell.state.susceptible + fromCell.state.infected + fromCell.state.recovered + fromCell.state.vaccinated);
    const toLiving = Math.max(1, toCell.state.susceptible + toCell.state.infected + toCell.state.recovered + toCell.state.vaccinated);

    // Combine link restriction, global travel restriction, and regional travel policies
    const linkPolicyRestr = Math.max(
      link.restrictionLevel,
      globalTravelRestr,
      fromCell.interventions.travelRestrictionFactor,
      toCell.interventions.travelRestrictionFactor
    );
    const effectiveTravelFlow = Math.max(0, link.dailyPassengerVolume * (1 - linkPolicyRestr));

    if (effectiveTravelFlow <= 0) continue;

    // Infectious prevalence in origin
    const prevFrom = fromCell.state.infected / fromLiving;
    const prevTo = toCell.state.infected / toLiving;

    // Symmetric bidirectional travel exposure
    // Infectious arrivals into toCell from fromCell
    const infArrivalsTo = effectiveTravelFlow * prevFrom;
    // Infectious arrivals into fromCell from toCell
    const infArrivalsFrom = effectiveTravelFlow * prevTo;

    transitInfectiousExposureMap.set(
      toCell.id,
      (transitInfectiousExposureMap.get(toCell.id) || 0) + infArrivalsTo
    );
    transitInfectiousExposureMap.set(
      fromCell.id,
      (transitInfectiousExposureMap.get(fromCell.id) || 0) + infArrivalsFrom
    );
  }

  // Prepare next state array
  const nextCells: CellData[] = [];

  let sumPopulation = 0;
  let sumS = 0;
  let sumI = 0;
  let sumR = 0;
  let sumV = 0;
  let sumD = 0;
  let totalNewInfections = 0;
  let totalNewDeaths = 0;
  let activeRegionsCount = 0;
  let healthcareOverloadedCount = 0;
  let totalHealthcareCapacity = 0;
  let totalHealthcareDemand = 0;

  // Compute dynamic grid bounds
  let maxGridRows = GRID_ROWS;
  let maxGridCols = GRID_COLS;
  for (const c of currentCells) {
    if (c.row >= maxGridRows) maxGridRows = c.row + 1;
    if (c.col >= maxGridCols) maxGridCols = c.col + 1;
  }

  // Process transitions synchronously for every cell
  for (const cell of currentCells) {
    if (!cell.isLand) {
      // Ocean / water cell: unchanging state
      nextCells.push(cell);
      continue;
    }

    const S = cell.state.susceptible;
    const I = cell.state.infected;
    const R = cell.state.recovered;
    const V = cell.state.vaccinated;
    const D = cell.state.deceased;
    const N = cell.state.totalPopulation;
    const N_living = Math.max(1, S + I + R + V);

    // 1. Environmental modifier
    const envMod = computeEnvironmentalModifier(cell, diseaseParams, envModifierEnabled);
    cell.environmental.transmissionModifier = envMod;

    // 2. Interventions combining regional and global policies
    const activeMask = globalMaskActive || cell.interventions.maskMandate;
    const maskReduction = activeMask ? 0.35 : 0.0; // 35% contact transmission reduction

    const lockdown = Math.max(globalLockdown, cell.interventions.lockdownLevel);
    const isolation = Math.max(globalIsolation, cell.interventions.isolationEffectiveness);
    const quarantineReduction = isolation * 0.70; // 70% reduction in transmission for quarantined cases

    // Effective local beta
    const betaEffective =
      diseaseParams.baseTransmissionRateBeta *
      envMod *
      (1.0 - lockdown) *
      (1.0 - maskReduction) *
      (1.0 - quarantineReduction);

    // 3. Local cellular automata neighbour interaction
    let neighborInfectionPressure = 0;
    let totalWeight = 0;

    if (cell.neighborCellIds && cell.neighborCellIds.length > 0) {
      // Vector country or graph-based topology neighbors
      for (const nId of cell.neighborCellIds) {
        const neighborCell = cellMap.get(nId);
        if (neighborCell && neighborCell.isLand) {
          const neighborLiving = Math.max(
            1,
            neighborCell.state.susceptible +
              neighborCell.state.infected +
              neighborCell.state.recovered +
              neighborCell.state.vaccinated
          );
          const neighborPrev = neighborCell.state.infected / neighborLiving;
          const neighborLockdown = Math.max(globalLockdown, neighborCell.interventions.lockdownLevel);
          const mobilityFactor =
            (cell.infrastructure.roadDensity * 0.5 + 0.5) *
            (1.0 - Math.max(lockdown, neighborLockdown));

          neighborInfectionPressure += 1.0 * neighborPrev * mobilityFactor;
          totalWeight += 1.0;
        }
      }
    } else {
      // Regular 2D cellular automata grid coordinates
      const neighborCoords = getNeighborCoordinates(cell.row, cell.col, adjacencyMode, maxGridRows, maxGridCols);
      for (const nc of neighborCoords) {
        const neighborId = `c_${nc.row}_${nc.col}`;
        const neighborCell = cellMap.get(neighborId);
        if (neighborCell && neighborCell.isLand) {
          const neighborLiving = Math.max(
            1,
            neighborCell.state.susceptible +
              neighborCell.state.infected +
              neighborCell.state.recovered +
              neighborCell.state.vaccinated
          );
          const neighborPrev = neighborCell.state.infected / neighborLiving;
          const neighborLockdown = Math.max(globalLockdown, neighborCell.interventions.lockdownLevel);
          const mobilityFactor =
            (cell.infrastructure.roadDensity * 0.5 + 0.5) *
            (1.0 - Math.max(lockdown, neighborLockdown));

          neighborInfectionPressure += nc.weight * neighborPrev * mobilityFactor;
          totalWeight += nc.weight;
        }
      }
    }

    const avgNeighborPressure = totalWeight > 0 ? neighborInfectionPressure / totalWeight : 0;
    // Spatial coupling coefficient: 0.18 baseline local border interaction
    const spatialCoupling = 0.18;

    // 4. Long-distance transit imported exposure
    const incomingInfectiousTravelers = transitInfectiousExposureMap.get(cell.id) || 0;
    // Force of infection from transit arrivals
    const transitForce = incomingInfectiousTravelers / N_living;

    // Total force of infection lambda_i
    const localInfectiousFraction = I / N_living;
    const totalExposurePotential =
      betaEffective *
      (localInfectiousFraction + spatialCoupling * avgNeighborPressure + transitForce);

    // Convert continuous force into discrete daily attack probability: 1 - exp(-lambda)
    const infectionProb = 1.0 - Math.exp(-Math.max(0, totalExposurePotential));

    // 5. New Infections from S -> I
    let deltaS_to_I = 0;
    if (S > 0 && infectionProb > 0) {
      if (diseaseParams.stochasticTransmission) {
        deltaS_to_I = prng.binomial(S, infectionProb);
      } else {
        deltaS_to_I = Math.min(S, Math.round(S * infectionProb));
      }
    }

    // 6. Breakthrough Infections from V -> I (based on vaccine efficacy eta)
    const vaccineEfficacy = Math.max(
      diseaseParams.vaccineEffectivenessEta,
      globalInterventions.vaccineEffectiveness
    );
    const breakthroughProb = infectionProb * (1.0 - vaccineEfficacy);
    let deltaV_to_I = 0;
    if (V > 0 && breakthroughProb > 0) {
      if (diseaseParams.stochasticTransmission) {
        deltaV_to_I = prng.binomial(V, breakthroughProb);
      } else {
        deltaV_to_I = Math.min(V, Math.round(V * breakthroughProb));
      }
    }

    // 7. Vaccinations: S -> V
    // Doses available today from daily rollout
    const vaccineRolloutRate = Math.max(
      globalVaccineRollout,
      cell.interventions.dailyVaccinationRate
    );
    const remainingS = Math.max(0, S - deltaS_to_I);
    let deltaS_to_V = 0;
    if (remainingS > 0 && vaccineRolloutRate > 0) {
      const maxDailyDoses = Math.round(N_living * vaccineRolloutRate);
      deltaS_to_V = Math.min(remainingS, maxDailyDoses);
    }

    // 8. Healthcare Capacity and Recoveries / Deaths: I -> R and I -> D
    const cellCapacityMultiplier = cell.interventions.healthcareCapacityMultiplier;
    const effectiveHealthcareCapacity = Math.round(
      cell.healthcareCapacity * cellCapacityMultiplier * globalHealthcareSurge
    );

    totalHealthcareCapacity += effectiveHealthcareCapacity;
    totalHealthcareDemand += I;

    const isOverloaded = I > effectiveHealthcareCapacity;
    if (isOverloaded) {
      healthcareOverloadedCount++;
    }

    // Baseline recovery rate gamma
    const gamma = diseaseParams.recoveryRateGamma;

    // Disease mortality rate mu (amplified for excess patients exceeding capacity)
    const baselineMu = diseaseParams.mortalityRateMu;
    let effectiveMu = baselineMu;
    if (isOverloaded && I > 0) {
      const excessCount = I - effectiveHealthcareCapacity;
      const normalCount = effectiveHealthcareCapacity;
      effectiveMu =
        (normalCount * baselineMu +
          excessCount * baselineMu * diseaseParams.excessMortalityMultiplier) /
        I;
    }

    // Calculate recoveries and deaths
    let deltaI_to_R = 0;
    let deltaI_to_D = 0;

    if (I > 0) {
      if (diseaseParams.stochasticTransmission) {
        deltaI_to_R = prng.binomial(I, gamma);
        // From remaining infected, draw deaths
        const remainingAfterRecovery = Math.max(0, I - deltaI_to_R);
        deltaI_to_D = prng.binomial(remainingAfterRecovery, effectiveMu);
      } else {
        deltaI_to_R = Math.min(I, Math.round(I * gamma));
        deltaI_to_D = Math.min(I - deltaI_to_R, Math.round(I * effectiveMu));
      }

      // Strict sanity constraint: total departures cannot exceed I
      if (deltaI_to_R + deltaI_to_D > I) {
        const totalDepartures = deltaI_to_R + deltaI_to_D;
        deltaI_to_R = Math.floor((deltaI_to_R / totalDepartures) * I);
        deltaI_to_D = I - deltaI_to_R;
      }
    }

    // 9. Optional Waning Immunity: R -> S
    let deltaR_to_S = 0;
    if (R > 0 && diseaseParams.waningImmunityRateOmega > 0) {
      deltaR_to_S = Math.min(
        R,
        Math.round(R * diseaseParams.waningImmunityRateOmega)
      );
    }

    // 10. Synchronously Apply State Transitions
    const nextS = S - deltaS_to_I - deltaS_to_V + deltaR_to_S;
    const nextI = I + deltaS_to_I + deltaV_to_I - deltaI_to_R - deltaI_to_D;
    const nextR = R + deltaI_to_R - deltaR_to_S;
    const nextV = V + deltaS_to_V - deltaV_to_I;
    const nextD = D + deltaI_to_D;

    // Invariant Verification: N = S + I + R + V + D
    const sumNext = nextS + nextI + nextR + nextV + nextD;
    let correctedS = nextS;
    if (sumNext !== N) {
      // Numerical rounding balance correction absorbed into S to guarantee 100% strict conservation
      correctedS = N - (nextI + nextR + nextV + nextD);
    }

    const nextCell: CellData = {
      ...cell,
      state: {
        totalPopulation: N,
        susceptible: Math.max(0, correctedS),
        infected: Math.max(0, nextI),
        recovered: Math.max(0, nextR),
        vaccinated: Math.max(0, nextV),
        deceased: Math.max(0, nextD),
        newInfectionsToday: deltaS_to_I + deltaV_to_I,
        newDeathsToday: deltaI_to_D,
      },
    };

    nextCells.push(nextCell);

    // Global step aggregations
    sumPopulation += N;
    sumS += nextCell.state.susceptible;
    sumI += nextCell.state.infected;
    sumR += nextCell.state.recovered;
    sumV += nextCell.state.vaccinated;
    sumD += nextCell.state.deceased;
    totalNewInfections += deltaS_to_I + deltaV_to_I;
    totalNewDeaths += deltaI_to_D;
    if (nextCell.state.infected > 0) {
      activeRegionsCount++;
    }
  }

  // Calculate empirical effective reproduction number R_t
  // R_t ≈ (New infections / Current active infections) * Infectious Duration (1 / gamma)
  const avgInfectiousDuration = 1.0 / Math.max(0.01, diseaseParams.recoveryRateGamma);
  const effectiveRt =
    sumI > 0
      ? Math.round(((totalNewInfections / sumI) * avgInfectiousDuration) * 100) / 100
      : 0;

  const record: SimulationStepRecord = {
    day: currentDay,
    totalPopulation: sumPopulation,
    totalS: sumS,
    totalI: sumI,
    totalR: sumR,
    totalV: sumV,
    totalD: sumD,
    newInfections: totalNewInfections,
    newDeaths: totalNewDeaths,
    effectiveRt,
    activeRegionsCount,
    healthcareOverloadedCellsCount: healthcareOverloadedCount,
    totalHealthcareCapacity,
    totalHealthcareDemand,
  };

  return { nextCells, record };
}
