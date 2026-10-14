/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CellData, TransportLink } from '../types/simulation';
import {
  ShieldAlert,
  Plane,
  Train,
  Anchor,
  Activity,
  HeartPulse,
  Thermometer,
  Droplets,
  Mountain,
  Users,
} from 'lucide-react';

interface SelectedCellInspectorProps {
  selectedCell: CellData | null;
  transitLinks: TransportLink[];
  onUpdateCellInterventions: (cellId: string, updates: Partial<CellData['interventions']>) => void;
  onClose: () => void;
}

export const SelectedCellInspector: React.FC<SelectedCellInspectorProps> = ({
  selectedCell,
  transitLinks,
  onUpdateCellInterventions,
  onClose,
}) => {
  if (!selectedCell || !selectedCell.isLand) {
    return (
      <div className="p-4 text-xs text-slate-500 italic text-center">
        Click any land region on the map to inspect its epidemiological status, environmental factors, transit links, and deploy targeted local interventions.
      </div>
    );
  }

  const { state, environmental, infrastructure, interventions, healthcareCapacity } = selectedCell;
  const N = Math.max(1, state.totalPopulation);
  const percentInfected = ((state.infected / N) * 100).toFixed(2);
  const percentVaccinated = ((state.vaccinated / N) * 100).toFixed(2);
  const percentRecovered = ((state.recovered / N) * 100).toFixed(2);
  const percentDeaths = ((state.deceased / N) * 100).toFixed(2);

  // Relevant transit links for this cell
  const cellLinks = transitLinks.filter(
    (l) => l.fromCellId === selectedCell.id || l.toCellId === selectedCell.id
  );

  const isOverCapacity = state.infected > healthcareCapacity * interventions.healthcareCapacityMultiplier;

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 text-xs overflow-y-auto select-none">
      {/* Region Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-mono text-cyan-400">
              Region ID: {selectedCell.id} · [{selectedCell.row}, {selectedCell.col}]
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">{selectedCell.name}</h2>
            <div className="text-[11px] text-slate-400 capitalize mt-0.5">
              {selectedCell.biome.replace('_', ' ')} · {state.totalPopulation.toLocaleString()} residents
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Epidemiological Compartment Grid */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center gap-1.5 font-semibold text-slate-100">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>SIRVD Regional Compartments</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Susceptible */}
          <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded">
            <div className="text-[10px] text-sky-400 font-medium">Susceptible (S)</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              {state.susceptible.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {((state.susceptible / N) * 100).toFixed(1)}% of total
            </div>
          </div>

          {/* Infected */}
          <div className={`p-2 bg-slate-950/60 border rounded ${
            state.infected > 0 ? 'border-rose-900/60 bg-rose-950/20' : 'border-slate-800/80'
          }`}>
            <div className="text-[10px] text-rose-400 font-medium">Active Infected (I)</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              {state.infected.toLocaleString()}
            </div>
            <div className="text-[10px] text-rose-300 font-mono">
              {percentInfected}% (+{state.newInfectionsToday} new)
            </div>
          </div>

          {/* Recovered */}
          <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded">
            <div className="text-[10px] text-emerald-400 font-medium">Recovered (R)</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              {state.recovered.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{percentRecovered}% immune</div>
          </div>

          {/* Vaccinated */}
          <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded">
            <div className="text-[10px] text-indigo-400 font-medium">Vaccinated (V)</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              {state.vaccinated.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{percentVaccinated}% coverage</div>
          </div>

          {/* Fatalities */}
          <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded col-span-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-red-400 font-medium">Cumulative Fatalities (D)</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                {state.deceased.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-mono">{percentDeaths}% of Pop</div>
              <div className="text-[10px] text-red-400 font-mono">+{state.newDeathsToday} today</div>
            </div>
          </div>
        </div>

        {/* Healthcare Capacity Status */}
        <div className={`p-2.5 rounded border ${
          isOverCapacity
            ? 'bg-red-950/40 border-red-800 text-red-200'
            : 'bg-slate-950/60 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 font-medium">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              <span>ICU Capacity: {healthcareCapacity.toLocaleString()} beds</span>
            </span>
            <span className="font-mono">
              {((state.infected / Math.max(1, healthcareCapacity)) * 100).toFixed(0)}% load
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full ${isOverCapacity ? 'bg-red-500' : 'bg-cyan-400'}`}
              style={{
                width: `${Math.min(100, (state.infected / Math.max(1, healthcareCapacity)) * 100)}%`,
              }}
            />
          </div>
          {isOverCapacity && (
            <div className="text-[10px] text-red-400 mt-1 font-mono">
              Critical Overcapacity: +{state.infected - healthcareCapacity} patients in excess triage
            </div>
          )}
        </div>
      </div>

      {/* Environmental & Geographic Variables */}
      <div className="p-4 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-slate-100">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>Environmental State</span>
          </div>
          <div className="text-[11px] font-mono text-amber-400">
            Mod Eᵢ = {environmental.transmissionModifier.toFixed(3)}x
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/40 rounded border border-slate-800">
            <Thermometer className="w-3 h-3 text-amber-400" />
            <span>Temp: {environmental.temperature}°C</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/40 rounded border border-slate-800">
            <Droplets className="w-3 h-3 text-cyan-400" />
            <span>Humidity: {environmental.humidity}%</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/40 rounded border border-slate-800">
            <Mountain className="w-3 h-3 text-slate-400" />
            <span>Alt: {environmental.altitude}m</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/40 rounded border border-slate-800">
            <Users className="w-3 h-3 text-indigo-400" />
            <span>{environmental.populationDensity}/km²</span>
          </div>
        </div>
      </div>

      {/* Transportation Connections */}
      <div className="p-4 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-100">Transit Links ({cellLinks.length})</span>
          <div className="flex items-center gap-2">
            {infrastructure.hasAirport && (
              <span className="flex items-center gap-0.5 text-[10px] text-sky-400 font-mono">
                <Plane className="w-3 h-3" /> Airport
              </span>
            )}
            {infrastructure.hasRailStation && (
              <span className="flex items-center gap-0.5 text-[10px] text-indigo-400 font-mono">
                <Train className="w-3 h-3" /> Rail
              </span>
            )}
            {infrastructure.hasSeaport && (
              <span className="flex items-center gap-0.5 text-[10px] text-teal-400 font-mono">
                <Anchor className="w-3 h-3" /> Port
              </span>
            )}
          </div>
        </div>

        {cellLinks.length > 0 ? (
          <div className="max-h-28 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
            {cellLinks.slice(0, 6).map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-1 bg-slate-950/50 rounded border border-slate-800"
              >
                <div className="flex items-center gap-1.5">
                  {link.mode === 'flight' && <Plane className="w-3 h-3 text-sky-400" />}
                  {link.mode === 'rail' && <Train className="w-3 h-3 text-indigo-400" />}
                  {link.mode === 'sea' && <Anchor className="w-3 h-3 text-teal-400" />}
                  <span>{link.fromCellId === selectedCell.id ? `→ ${link.toCellId}` : `← ${link.fromCellId}`}</span>
                </div>
                <div className="text-slate-400">
                  {link.dailyPassengerVolume.toLocaleString()} pax/d
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 italic">No long-distance transit links (local road only).</div>
        )}
      </div>

      {/* Targeted Regional Public Health Overrides */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-1.5 font-semibold text-slate-100">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>Targeted Local Interventions</span>
        </div>

        {/* Local Mask Mandate */}
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Local Mask Order</span>
          <input
            type="checkbox"
            checked={interventions.maskMandate}
            onChange={(e) =>
              onUpdateCellInterventions(selectedCell.id, { maskMandate: e.target.checked })
            }
            className="w-3.5 h-3.5 accent-cyan-400 rounded cursor-pointer"
          />
        </div>

        {/* Local Lockdown Slider */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Local Lockdown Stringency</span>
            <span className="font-mono text-cyan-300">
              {(interventions.lockdownLevel * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.9"
            step="0.05"
            value={interventions.lockdownLevel}
            onChange={(e) =>
              onUpdateCellInterventions(selectedCell.id, {
                lockdownLevel: parseFloat(e.target.value),
              })
            }
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Local Border Travel Restriction */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Regional Border Travel Ban</span>
            <span className="font-mono text-cyan-300">
              {(interventions.travelRestrictionFactor * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.1"
            value={interventions.travelRestrictionFactor}
            onChange={(e) =>
              onUpdateCellInterventions(selectedCell.id, {
                travelRestrictionFactor: parseFloat(e.target.value),
              })
            }
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Local Vaccination Blitz */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Ring Vaccination Blitz</span>
            <span className="font-mono text-indigo-300">
              {(interventions.dailyVaccinationRate * 100).toFixed(2)}% /day
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.03"
            step="0.002"
            value={interventions.dailyVaccinationRate}
            onChange={(e) =>
              onUpdateCellInterventions(selectedCell.id, {
                dailyVaccinationRate: parseFloat(e.target.value),
              })
            }
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-400"
          />
        </div>
      </div>
    </div>
  );
};
