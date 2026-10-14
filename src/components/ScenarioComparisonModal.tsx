/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SimulationScenario,
  ScenarioRunResult,
  SimulationStepRecord,
} from '../types/simulation';
import { PRESET_SCENARIOS } from '../engine/scenarioPresets';
import { generateSyntheticWorld } from '../engine/worldGenerator';
import { executeSimulationStep } from '../engine/sirvdEngine';
import { SeededPRNG } from '../engine/prng';
import {
  GitCompare,
  TrendingDown,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Clock,
  Skull,
  Activity,
  HeartPulse,
} from 'lucide-react';

interface ScenarioComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadScenarioToSimulator: (scenario: SimulationScenario) => void;
}

export const ScenarioComparisonModal: React.FC<ScenarioComparisonModalProps> = ({
  isOpen,
  onClose,
  onLoadScenarioToSimulator,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'sensitivity'>('presets');
  const [isRunningSimulations, setIsRunningSimulations] = useState<boolean>(false);
  const [comparisonResults, setComparisonResults] = useState<ScenarioRunResult[]>([]);
  const [simulationDays, setSimulationDays] = useState<number>(90);

  // Sensitivity Analysis State
  const [sensitivityParam, setSensitivityParam] = useState<'beta' | 'vaccine' | 'travel'>('beta');
  const [sensitivityResults, setSensitivityResults] = useState<
    { paramValue: number; label: string; peakI: number; totalD: number; dayOfPeak: number }[]
  >([]);

  if (!isOpen) return null;

  // Run full multi-scenario comparative batch
  const runBatchComparison = () => {
    setIsRunningSimulations(true);
    // Use setTimeout to allow React to render loading spinner
    setTimeout(() => {
      const results: ScenarioRunResult[] = [];

      for (const scenario of PRESET_SCENARIOS) {
        // Generate pristine baseline world
        const { cells: initialCells, transitLinks } = generateSyntheticWorld();
        // Seed initial outbreak
        const seedCell = initialCells.find((c) => c.isLand && c.state.totalPopulation > 500000) || initialCells[10];
        seedCell.state.infected = 400;
        seedCell.state.susceptible -= 400;

        let curCells = initialCells;
        const prng = new SeededPRNG(scenario.randomSeed);
        const history: SimulationStepRecord[] = [];

        let peakI = 0;
        let dayOfPeak = 0;
        let maxHealthcareOverload = 0;

        for (let day = 1; day <= simulationDays; day++) {
          const step = executeSimulationStep(
            curCells,
            transitLinks,
            scenario.diseaseParameters,
            scenario.globalInterventions,
            scenario.adjacencyMode,
            scenario.envModifierEnabled,
            day,
            prng
          );
          curCells = step.nextCells;
          history.push(step.record);

          if (step.record.totalI > peakI) {
            peakI = step.record.totalI;
            dayOfPeak = day;
          }

          const capRatio =
            step.record.totalHealthcareCapacity > 0
              ? step.record.totalHealthcareDemand / step.record.totalHealthcareCapacity
              : 0;
          if (capRatio > maxHealthcareOverload) {
            maxHealthcareOverload = capRatio;
          }
        }

        const latest = history[history.length - 1];
        const cumulativeInfections = latest.totalR + latest.totalI + latest.totalD;
        const cumulativeDeaths = latest.totalD;

        // Stopping criterion: active cases drop below 0.5% of peak
        let outbreakDuration = simulationDays;
        for (let i = dayOfPeak; i < history.length; i++) {
          if (history[i].totalI <= Math.max(50, peakI * 0.02)) {
            outbreakDuration = history[i].day;
            break;
          }
        }

        const initialPop = history[0]?.totalPopulation || 1;

        results.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          history,
          peakInfected: peakI,
          dayOfPeak,
          totalCumulativeInfections: cumulativeInfections,
          totalCumulativeDeaths: cumulativeDeaths,
          outbreakDurationDays: outbreakDuration,
          maxHealthcareOverloadRatio: Math.round(maxHealthcareOverload * 100) / 100,
          attackRatePercent: Math.round((cumulativeInfections / initialPop) * 1000) / 10,
          caseFatalityRatePercent:
            cumulativeInfections > 0
              ? Math.round((cumulativeDeaths / cumulativeInfections) * 1000) / 10
              : 0,
        });
      }

      setComparisonResults(results);
      setIsRunningSimulations(false);
    }, 50);
  };

  // Run Sensitivity Analysis Sweep
  const runSensitivitySweep = () => {
    setIsRunningSimulations(true);
    setTimeout(() => {
      const sweepValues =
        sensitivityParam === 'beta'
          ? [0.20, 0.30, 0.40, 0.50, 0.60]
          : sensitivityParam === 'vaccine'
          ? [0.0, 0.002, 0.005, 0.008, 0.012]
          : [0.0, 0.25, 0.50, 0.75, 0.95];

      const baselineScenario = PRESET_SCENARIOS[0];
      const sweepOutputs = [];

      for (const val of sweepValues) {
        const { cells: initialCells, transitLinks } = generateSyntheticWorld();
        const seedCell = initialCells.find((c) => c.isLand && c.state.totalPopulation > 500000) || initialCells[10];
        seedCell.state.infected = 400;
        seedCell.state.susceptible -= 400;

        const diseaseParams = { ...baselineScenario.diseaseParameters };
        const interventions = { ...baselineScenario.globalInterventions };

        let label = '';
        if (sensitivityParam === 'beta') {
          diseaseParams.baseTransmissionRateBeta = val;
          label = `β = ${val.toFixed(2)}`;
        } else if (sensitivityParam === 'vaccine') {
          interventions.vaccineRolloutSpeed = val;
          label = `${(val * 100).toFixed(1)}% pop/d`;
        } else {
          interventions.travelRestrictionFactor = val;
          label = `${(val * 100).toFixed(0)}% transit ban`;
        }

        let cur = initialCells;
        const prng = new SeededPRNG(42);
        let peakI = 0;
        let dayOfPeak = 0;
        let lastD = 0;

        for (let day = 1; day <= 70; day++) {
          const step = executeSimulationStep(
            cur,
            transitLinks,
            diseaseParams,
            interventions,
            'eight',
            true,
            day,
            prng
          );
          cur = step.nextCells;
          if (step.record.totalI > peakI) {
            peakI = step.record.totalI;
            dayOfPeak = day;
          }
          lastD = step.record.totalD;
        }

        sweepOutputs.push({
          paramValue: val,
          label,
          peakI,
          totalD: lastD,
          dayOfPeak,
        });
      }

      setSensitivityResults(sweepOutputs);
      setIsRunningSimulations(false);
    }, 50);
  };

  const baselineResult = comparisonResults[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col text-slate-200 text-xs overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <GitCompare className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Scenario Comparison & Intervention Analysis
              </h2>
              <div className="text-slate-400 text-[11px]">
                Rigorous empirical comparison of 6 public-health intervention strategies using identical starting conditions
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap font-medium ${
                activeTab === 'presets'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Multi-Scenario Strategy Matrix
            </button>
            <button
              onClick={() => setActiveTab('sensitivity')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap font-medium ${
                activeTab === 'sensitivity'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Parameter Sensitivity Analysis
            </button>
          </div>

          {activeTab === 'presets' ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Duration:</span>
                <select
                  value={simulationDays}
                  onChange={(e) => setSimulationDays(parseInt(e.target.value, 10))}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-[11px]"
                >
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={120}>120 Days</option>
                  <option value={150}>150 Days</option>
                </select>
              </div>
              <button
                onClick={runBatchComparison}
                disabled={isRunningSimulations}
                className="px-4 py-1.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-semibold rounded shadow transition-colors"
              >
                {isRunningSimulations ? 'Computing 6 Runs...' : 'Execute Comparative Suite'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Sweep Variable:</span>
                <select
                  value={sensitivityParam}
                  onChange={(e) => setSensitivityParam(e.target.value as 'beta' | 'vaccine' | 'travel')}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-[11px]"
                >
                  <option value="beta">Transmission Rate (β)</option>
                  <option value="vaccine">Vaccination Rollout Speed</option>
                  <option value="travel">Inter-Regional Travel Reduction</option>
                </select>
              </div>
              <button
                onClick={runSensitivitySweep}
                disabled={isRunningSimulations}
                className="px-4 py-1.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-semibold rounded shadow transition-colors"
              >
                {isRunningSimulations ? 'Sweeping...' : 'Run Sensitivity Sweep'}
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'presets' && (
            <>
              {comparisonResults.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <GitCompare className="w-12 h-12 text-slate-600 mx-auto" />
                  <div className="text-slate-300 font-medium text-sm">
                    Ready to evaluate 6 distinct intervention scenarios
                  </div>
                  <p className="text-slate-500 max-w-md mx-auto text-xs">
                    Runs each policy package through the cellular automata engine under identical geographic and demographic conditions to quantify averted cases and deaths.
                  </p>
                  <button
                    onClick={runBatchComparison}
                    className="mt-2 px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold rounded shadow transition-colors"
                  >
                    Execute Comparative Suite ({simulationDays} Days)
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Comparative Metrics Table */}
                  <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/80">
                    <table className="w-full text-left font-mono tabular-nums text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="py-3 px-4 font-semibold text-slate-300">Scenario Policy</th>
                          <th className="py-3 px-3 font-semibold text-rose-400">Peak Infected (I)</th>
                          <th className="py-3 px-3 font-semibold text-slate-300">Peak Day</th>
                          <th className="py-3 px-3 font-semibold text-slate-300">Total Cases</th>
                          <th className="py-3 px-3 font-semibold text-red-400">Total Deaths (D)</th>
                          <th className="py-3 px-3 font-semibold text-amber-400">ICU Overload</th>
                          <th className="py-3 px-3 font-semibold text-emerald-400">Deaths Averted vs Base</th>
                          <th className="py-3 px-3 font-semibold text-slate-400 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {comparisonResults.map((res, idx) => {
                          const isBaseline = idx === 0;
                          const deathsDiff = baselineResult
                            ? baselineResult.totalCumulativeDeaths - res.totalCumulativeDeaths
                            : 0;
                          const deathsPctDiff =
                            baselineResult && baselineResult.totalCumulativeDeaths > 0
                              ? ((deathsDiff / baselineResult.totalCumulativeDeaths) * 100).toFixed(1)
                              : '0.0';

                          return (
                            <tr
                              key={res.scenarioId}
                              className={`hover:bg-slate-800/40 transition-colors ${
                                isBaseline ? 'bg-slate-900/40' : ''
                              }`}
                            >
                              <td className="py-3 px-4 font-sans font-medium text-slate-200">
                                <div>{res.scenarioName}</div>
                                {isBaseline && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    [Empirical Reference Baseline]
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-rose-300">
                                {res.peakInfected.toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-slate-300">
                                Day {res.dayOfPeak}
                              </td>
                              <td className="py-3 px-3 text-slate-300">
                                {res.totalCumulativeInfections.toLocaleString()} ({res.attackRatePercent}%)
                              </td>
                              <td className="py-3 px-3 text-red-300 font-bold">
                                {res.totalCumulativeDeaths.toLocaleString()}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                                    res.maxHealthcareOverloadRatio > 1.0
                                      ? 'bg-red-950 text-red-300 border border-red-800'
                                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  }`}
                                >
                                  {res.maxHealthcareOverloadRatio}x peak load
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                {isBaseline ? (
                                  <span className="text-slate-500">—</span>
                                ) : deathsDiff > 0 ? (
                                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                                    <TrendingDown className="w-3.5 h-3.5" />
                                    <span>-{deathsDiff.toLocaleString()} ({deathsPctDiff}%)</span>
                                  </span>
                                ) : (
                                  <span className="text-rose-400 font-medium flex items-center gap-1">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span>+{Math.abs(deathsDiff).toLocaleString()}</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => {
                                    const matched = PRESET_SCENARIOS.find((s) => s.id === res.scenarioId);
                                    if (matched) {
                                      onLoadScenarioToSimulator(matched);
                                      onClose();
                                    }
                                  }}
                                  className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded transition-colors whitespace-nowrap"
                                >
                                  Load to Map
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Scientific Analytical Discussion */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-slate-300">
                    <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      <span>Empirical Trade-off & Feasibility Synthesis</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      <strong>Transit bans vs Community NPIs:</strong> Closing airports and borders alone substantially delays transmission to distant hubs, buying critical preparation time, but does not prevent eventual local spread if the pathogen has already seeded. In contrast, early community masking and contact reduction flatten the healthcare surge curve directly.
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      <strong>Synergistic multi-modal impact:</strong> Combining mass vaccination rollout with temporary non-pharmaceutical interventions yields non-linear benefits: suppressing transmission keeps hospital occupancy below ICU collapse thresholds, which prevents excess mortality amplification.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'sensitivity' && (
            <>
              {sensitivityResults.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Sliders className="w-12 h-12 text-slate-600 mx-auto" />
                  <div className="text-slate-300 font-medium text-sm">
                    Parameter Sensitivity Analysis Ready
                  </div>
                  <p className="text-slate-500 max-w-md mx-auto text-xs">
                    Sweeps across 5 increments of the selected parameter to quantify output elasticity and threshold transitions.
                  </p>
                  <button
                    onClick={runSensitivitySweep}
                    className="mt-2 px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold rounded shadow transition-colors"
                  >
                    Run Sensitivity Sweep for {sensitivityParam.toUpperCase()}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/80">
                    <table className="w-full text-left font-mono tabular-nums text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="py-3 px-4 font-semibold text-slate-300">Parameter Value</th>
                          <th className="py-3 px-3 font-semibold text-rose-400">Peak Infected (I)</th>
                          <th className="py-3 px-3 font-semibold text-slate-300">Day of Peak</th>
                          <th className="py-3 px-3 font-semibold text-red-400">Total Fatalities (D)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {sensitivityResults.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-medium text-white">{row.label}</td>
                            <td className="py-3 px-3 text-rose-300">{row.peakI.toLocaleString()}</td>
                            <td className="py-3 px-3 text-slate-300">Day {row.dayOfPeak}</td>
                            <td className="py-3 px-3 text-red-300 font-bold">{row.totalD.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bar Visualizer */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                    <div className="font-semibold text-slate-200 text-xs">
                      Sensitivity Impact on Cumulative Fatalities
                    </div>
                    {sensitivityResults.map((r, i) => {
                      const maxD = Math.max(...sensitivityResults.map((s) => s.totalD), 1);
                      const barPct = (r.totalD / maxD) * 100;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-300">{r.label}</span>
                            <span className="text-red-300 font-bold">{r.totalD.toLocaleString()} deaths</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-red-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
