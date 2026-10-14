/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimulationScenario, GlobalDiseaseParameters, GlobalInterventions } from '../types/simulation';

export const BASELINE_DISEASE_PARAMS: GlobalDiseaseParameters = {
  diseaseName: 'Novel Aerosol Pathogen (SARS-Like)',
  baseTransmissionRateBeta: 0.38,
  recoveryRateGamma: 0.10, // ~10 days average duration
  mortalityRateMu: 0.018, // 1.8% baseline mortality
  vaccineEffectivenessEta: 0.88, // 88% protection against infection
  waningImmunityRateOmega: 0.001, // slow waning immunity
  healthcareCapacityPerThousand: 25, // 25 per 1,000 (2.5% of population)
  excessMortalityMultiplier: 2.8, // 2.8x mortality when ICU capacity is overrun
  environmentalSensitivity: 0.65, // moderate-high climate sensitivity
  optimalTransmissionTemp: 16.0, // cooler temperate climates
  stochasticTransmission: false,
};

export const PRESET_SCENARIOS: SimulationScenario[] = [
  {
    id: 'scen_unmitigated',
    name: 'Unmitigated Baseline Outbreak',
    description:
      'Natural progression of the epidemic without public-health interventions, border closures, or vaccination. Serves as empirical baseline.',
    diseaseParameters: { ...BASELINE_DISEASE_PARAMS },
    globalInterventions: {
      startDay: 0,
      endDay: 180,
      universalMaskMandate: false,
      lockdownStringency: 0.0,
      travelRestrictionFactor: 0.0,
      vaccineRolloutSpeed: 0.0,
      vaccineEffectiveness: 0.88,
      quarantineIsolationRate: 0.0,
      healthcareExpansionFactor: 1.0,
      airportClosure: false,
      railRoadClosure: false,
    },
    randomSeed: 42,
    adjacencyMode: 'eight',
    envModifierEnabled: true,
    initialInfectedRegionId: '',
    initialInfectedCount: 400,
  },
  {
    id: 'scen_travel_bans',
    name: 'Air Travel & Transit Restrictions Only',
    description:
      'Immediate airport closures and 85% regional travel restrictions deployed on Day 8 to suppress inter-regional seeding and delay spatial spread.',
    diseaseParameters: { ...BASELINE_DISEASE_PARAMS },
    globalInterventions: {
      startDay: 8,
      endDay: 180,
      universalMaskMandate: false,
      lockdownStringency: 0.1,
      travelRestrictionFactor: 0.85,
      vaccineRolloutSpeed: 0.0,
      vaccineEffectiveness: 0.88,
      quarantineIsolationRate: 0.2,
      healthcareExpansionFactor: 1.0,
      airportClosure: true,
      railRoadClosure: true,
    },
    randomSeed: 42,
    adjacencyMode: 'eight',
    envModifierEnabled: true,
    initialInfectedRegionId: '',
    initialInfectedCount: 400,
  },
  {
    id: 'scen_vaccine_blitz',
    name: 'Rapid Mass Vaccination Rollout',
    description:
      'Mass vaccination campaign starting on Day 12 administering doses to 0.75% of the total living population per day with 90% vaccine efficacy.',
    diseaseParameters: { ...BASELINE_DISEASE_PARAMS },
    globalInterventions: {
      startDay: 12,
      endDay: 180,
      universalMaskMandate: false,
      lockdownStringency: 0.15,
      travelRestrictionFactor: 0.2,
      vaccineRolloutSpeed: 0.0075,
      vaccineEffectiveness: 0.90,
      quarantineIsolationRate: 0.3,
      healthcareExpansionFactor: 1.1,
      airportClosure: false,
      railRoadClosure: false,
    },
    randomSeed: 42,
    adjacencyMode: 'eight',
    envModifierEnabled: true,
    initialInfectedRegionId: '',
    initialInfectedCount: 400,
  },
  {
    id: 'scen_early_lockdown',
    name: 'Early Suppression Lockdown & Masks',
    description:
      'Stringent non-pharmaceutical interventions: universal high-filtration mask mandate and 60% contact reduction lockdown starting on Day 10.',
    diseaseParameters: { ...BASELINE_DISEASE_PARAMS },
    globalInterventions: {
      startDay: 10,
      endDay: 65,
      universalMaskMandate: true,
      lockdownStringency: 0.60,
      travelRestrictionFactor: 0.70,
      vaccineRolloutSpeed: 0.002,
      vaccineEffectiveness: 0.88,
      quarantineIsolationRate: 0.65,
      healthcareExpansionFactor: 1.2,
      airportClosure: true,
      railRoadClosure: false,
    },
    randomSeed: 42,
    adjacencyMode: 'eight',
    envModifierEnabled: true,
    initialInfectedRegionId: '',
    initialInfectedCount: 400,
  },
  {
    id: 'scen_comprehensive',
    name: 'Comprehensive Multi-Modal Strategy',
    description:
      'Integrated strategy combining mask mandates, targeted contact reduction, transit controls, rapid vaccination, case isolation, and 1.8x healthcare surge capacity.',
    diseaseParameters: { ...BASELINE_DISEASE_PARAMS },
    globalInterventions: {
      startDay: 8,
      endDay: 120,
      universalMaskMandate: true,
      lockdownStringency: 0.45,
      travelRestrictionFactor: 0.75,
      vaccineRolloutSpeed: 0.006,
      vaccineEffectiveness: 0.92,
      quarantineIsolationRate: 0.70,
      healthcareExpansionFactor: 1.8,
      airportClosure: true,
      railRoadClosure: false,
    },
    randomSeed: 42,
    adjacencyMode: 'eight',
    envModifierEnabled: true,
    initialInfectedRegionId: '',
    initialInfectedCount: 400,
  },
  {
    id: 'scen_healthcare_surge',
    name: 'Healthcare Capacity Doubling Only',
    description:
      'Surge response scaling hospital beds and ICU ventilators by 2.2x to prevent healthcare collapse and avert excess mortality, without community lockdowns.',
    diseaseParameters: { ...BASELINE_DISEASE_PARAMS },
    globalInterventions: {
      startDay: 5,
      endDay: 180,
      universalMaskMandate: false,
      lockdownStringency: 0.0,
      travelRestrictionFactor: 0.1,
      vaccineRolloutSpeed: 0.0,
      vaccineEffectiveness: 0.88,
      quarantineIsolationRate: 0.25,
      healthcareExpansionFactor: 2.2,
      airportClosure: false,
      railRoadClosure: false,
    },
    randomSeed: 42,
    adjacencyMode: 'eight',
    envModifierEnabled: true,
    initialInfectedRegionId: '',
    initialInfectedCount: 400,
  },
];
