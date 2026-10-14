/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  GlobalDiseaseParameters,
  NeighborAdjacencyMode,
  CellData,
} from '../types/simulation';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  Sliders,
  Compass,
  ThermometerSun,
  Dices,
} from 'lucide-react';

interface ControlSidebarProps {
  currentDay: number;
  isRunning: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  diseaseParams: GlobalDiseaseParameters;
  setDiseaseParams: React.Dispatch<React.SetStateAction<GlobalDiseaseParameters>>;
  adjacencyMode: NeighborAdjacencyMode;
  setAdjacencyMode: (mode: NeighborAdjacencyMode) => void;
  envModifierEnabled: boolean;
  setEnvModifierEnabled: (enabled: boolean) => void;
  randomSeed: number;
  setRandomSeed: (seed: number) => void;
  onRandomizeSeed: () => void;
  cells: CellData[];
  selectedSeedCellId: string;
  setSelectedSeedCellId: (id: string) => void;
  initialInfectedCount: number;
  setInitialInfectedCount: (count: number) => void;
}

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
  currentDay,
  isRunning,
  onTogglePlay,
  onStepForward,
  onReset,
  playbackSpeed,
  setPlaybackSpeed,
  diseaseParams,
  setDiseaseParams,
  adjacencyMode,
  setAdjacencyMode,
  envModifierEnabled,
  setEnvModifierEnabled,
  randomSeed,
  setRandomSeed,
  onRandomizeSeed,
  cells,
  selectedSeedCellId,
  setSelectedSeedCellId,
  initialInfectedCount,
  setInitialInfectedCount,
}) => {
  // Theoretical basic reproduction number R_0 = beta / gamma
  const calculatedR0 =
    diseaseParams.recoveryRateGamma > 0
      ? (diseaseParams.baseTransmissionRateBeta / diseaseParams.recoveryRateGamma).toFixed(2)
      : '0.00';

  const avgInfectiousDays =
    diseaseParams.recoveryRateGamma > 0
      ? (1.0 / diseaseParams.recoveryRateGamma).toFixed(1)
      : '0.0';

  const landCells = cells.filter((c) => c.isLand);

  return (
    <aside className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto text-slate-200 text-xs shrink-0 select-none">
      {/* Simulation Execution Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
              Simulation Timeline
            </div>
            <div className="text-xl font-bold font-mono text-white">
              Day {currentDay}
            </div>
          </div>
          <div className="flex items-center gap-1 p-0.5 bg-slate-800 border border-slate-700 rounded text-[11px]">
            {[1, 2, 5, 10].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded font-medium text-xs transition-colors shadow-sm ${
              isRunning
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run</span>
              </>
            )}
          </button>

          <button
            onClick={onStepForward}
            disabled={isRunning}
            title="Advance exactly 1 Day"
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded font-medium text-xs transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>+1 Day</span>
          </button>

          <button
            onClick={onReset}
            title="Reset to Day 0"
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-medium text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Disease Parameters Section */}
      <div className="p-4 border-b border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>SIRVD Pathogen Dynamics</span>
          </div>
          <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/80">
            R₀ = {calculatedR0}
          </div>
        </div>

        {/* Transmission Beta */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Base Transmission (β)</span>
            <span className="font-mono text-cyan-300">{diseaseParams.baseTransmissionRateBeta.toFixed(2)} /day</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.20"
            step="0.01"
            value={diseaseParams.baseTransmissionRateBeta}
            onChange={(e) =>
              setDiseaseParams((p) => ({
                ...p,
                baseTransmissionRateBeta: parseFloat(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Recovery Rate Gamma */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Recovery Rate (γ)</span>
            <span className="font-mono text-emerald-300">
              {diseaseParams.recoveryRateGamma.toFixed(2)} ({avgInfectiousDays} d)
            </span>
          </div>
          <input
            type="range"
            min="0.04"
            max="0.40"
            step="0.01"
            value={diseaseParams.recoveryRateGamma}
            onChange={(e) =>
              setDiseaseParams((p) => ({
                ...p,
                recoveryRateGamma: parseFloat(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>

        {/* Mortality Rate Mu */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Disease Fatality Rate (μ)</span>
            <span className="font-mono text-rose-300">
              {(diseaseParams.mortalityRateMu * 100).toFixed(1)}% CFR
            </span>
          </div>
          <input
            type="range"
            min="0.001"
            max="0.15"
            step="0.002"
            value={diseaseParams.mortalityRateMu}
            onChange={(e) =>
              setDiseaseParams((p) => ({
                ...p,
                mortalityRateMu: parseFloat(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
          />
        </div>

        {/* Vaccine Effectiveness Eta */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Vaccine Effectiveness (η)</span>
            <span className="font-mono text-indigo-300">
              {(diseaseParams.vaccineEffectivenessEta * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.40"
            max="1.00"
            step="0.02"
            value={diseaseParams.vaccineEffectivenessEta}
            onChange={(e) =>
              setDiseaseParams((p) => ({
                ...p,
                vaccineEffectivenessEta: parseFloat(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />
        </div>

        {/* Healthcare Capacity & Excess Multiplier */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">ICU Bed Capacity</span>
            <span className="font-mono text-amber-300">
              {diseaseParams.healthcareCapacityPerThousand} / 1k pop
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={diseaseParams.healthcareCapacityPerThousand}
            onChange={(e) =>
              setDiseaseParams((p) => ({
                ...p,
                healthcareCapacityPerThousand: parseInt(e.target.value, 10),
              }))
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Overcapacity Excess Mortality</span>
            <span className="font-mono text-red-300">
              {diseaseParams.excessMortalityMultiplier.toFixed(1)}x penalty
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.2"
            value={diseaseParams.excessMortalityMultiplier}
            onChange={(e) =>
              setDiseaseParams((p) => ({
                ...p,
                excessMortalityMultiplier: parseFloat(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-400"
          />
        </div>
      </div>

      {/* Cellular Automata & Spatial Interaction */}
      <div className="p-4 border-b border-slate-800 space-y-3.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Spatial Cellular Automata</span>
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">
            Neighborhood Adjacency Mode
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded border border-slate-800 text-[11px]">
            <button
              onClick={() => setAdjacencyMode('four')}
              className={`py-1 px-1 rounded transition-colors text-center ${
                adjacencyMode === 'four'
                  ? 'bg-slate-700 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              4-Neighbour
            </button>
            <button
              onClick={() => setAdjacencyMode('eight')}
              className={`py-1 px-1 rounded transition-colors text-center ${
                adjacencyMode === 'eight'
                  ? 'bg-slate-700 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              8-Neighbour
            </button>
            <button
              onClick={() => setAdjacencyMode('distance_weighted')}
              className={`py-1 px-1 rounded transition-colors text-center ${
                adjacencyMode === 'distance_weighted'
                  ? 'bg-slate-700 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Weighted
            </button>
          </div>
        </div>

        {/* Environmental Modifiers */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1 text-[11px] text-slate-300">
              <ThermometerSun className="w-3 h-3 text-amber-400" />
              <span>Climate & Environmental Influence</span>
            </span>
            <input
              type="checkbox"
              checked={envModifierEnabled}
              onChange={(e) => setEnvModifierEnabled(e.target.checked)}
              className="w-3.5 h-3.5 accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          {envModifierEnabled && (
            <div className="space-y-2 pl-2 border-l border-slate-800">
              <div>
                <div className="flex justify-between items-center mb-1 text-[10px]">
                  <span className="text-slate-400">Climate Sensitivity Factor</span>
                  <span className="font-mono text-cyan-300">
                    {diseaseParams.environmentalSensitivity.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={diseaseParams.environmentalSensitivity}
                  onChange={(e) =>
                    setDiseaseParams((p) => ({
                      ...p,
                      environmentalSensitivity: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-[10px]">
                  <span className="text-slate-400">Optimal Pathogen Temp</span>
                  <span className="font-mono text-amber-300">
                    {diseaseParams.optimalTransmissionTemp}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={diseaseParams.optimalTransmissionTemp}
                  onChange={(e) =>
                    setDiseaseParams((p) => ({
                      ...p,
                      optimalTransmissionTemp: parseInt(e.target.value, 10),
                    }))
                  }
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Outbreak Initialization & Reproducibility */}
      <div className="p-4 space-y-3.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Outbreak Origin & Seed</span>
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">
            Initial Outbreak Epicenter
          </label>
          <select
            value={selectedSeedCellId}
            onChange={(e) => setSelectedSeedCellId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            {landCells
              .slice()
              .sort((a, b) => b.state.totalPopulation - a.state.totalPopulation)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · Pop: {(c.state.totalPopulation / 1000000).toFixed(1)}M
                </option>
              ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Initial Infected Index Cases</span>
            <span className="font-mono text-rose-300">{initialInfectedCount} patients</span>
          </div>
          <input
            type="range"
            min="50"
            max="3000"
            step="50"
            value={initialInfectedCount}
            onChange={(e) => setInitialInfectedCount(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-rose-400"
          />
        </div>

        {/* Stochastic PRNG Seed */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1 text-[11px] text-slate-300">
              <Dices className="w-3 h-3 text-cyan-400" />
              <span>Stochastic Transmission</span>
            </span>
            <input
              type="checkbox"
              checked={diseaseParams.stochasticTransmission}
              onChange={(e) =>
                setDiseaseParams((p) => ({
                  ...p,
                  stochasticTransmission: e.target.checked,
                }))
              }
              className="w-3.5 h-3.5 accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => setRandomSeed(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-xs text-slate-200"
              placeholder="Seed (e.g. 42)"
            />
            <button
              onClick={onRandomizeSeed}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 hover:text-white transition-colors"
            >
              Shuffle
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
