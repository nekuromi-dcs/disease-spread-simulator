/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GlobalInterventions } from '../types/simulation';
import {
  ShieldAlert,
  Plane,
  Train,
  Syringe,
  Hospital,
  Calendar,
  Lock,
} from 'lucide-react';

interface InterventionPanelProps {
  interventions: GlobalInterventions;
  setInterventions: React.Dispatch<React.SetStateAction<GlobalInterventions>>;
  currentDay: number;
}

export const InterventionPanel: React.FC<InterventionPanelProps> = ({
  interventions,
  setInterventions,
  currentDay,
}) => {
  const isCurrentlyActive =
    currentDay >= interventions.startDay && currentDay <= interventions.endDay;

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 text-xs overflow-y-auto select-none p-4 space-y-4">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-100 text-sm">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>Public Health Interventions</span>
          </div>
          <div className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            isCurrentlyActive
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            {isCurrentlyActive ? 'POLICY ACTIVE' : 'SCHEDULED / INACTIVE'}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Simulate non-pharmaceutical interventions (NPIs), vaccination campaigns, transit closures, and hospital surges.
        </p>
      </div>

      {/* Deployment Window Schedule */}
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded space-y-2.5">
        <div className="flex items-center gap-1.5 font-semibold text-slate-100 text-[11px]">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Intervention Deployment Window</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div>
            <label className="text-slate-400 block mb-1">Start Day (tₛ)</label>
            <input
              type="number"
              min="0"
              max="200"
              value={interventions.startDay}
              onChange={(e) =>
                setInterventions((prev) => ({
                  ...prev,
                  startDay: Math.max(0, parseInt(e.target.value, 10) || 0),
                }))
              }
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">End Day (tₑ)</label>
            <input
              type="number"
              min="1"
              max="365"
              value={interventions.endDay}
              onChange={(e) =>
                setInterventions((prev) => ({
                  ...prev,
                  endDay: Math.max(1, parseInt(e.target.value, 10) || 1),
                }))
              }
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs"
            />
          </div>
        </div>
      </div>

      {/* Non-Pharmaceutical Interventions (NPIs) */}
      <div className="space-y-3 pt-1">
        <div className="font-semibold text-slate-100 text-xs">Community Contact Reduction</div>

        {/* Universal Mask Mandate */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-800 rounded">
          <div>
            <div className="font-medium text-slate-200">Universal Mask Mandate</div>
            <div className="text-[10px] text-slate-400">Reduces transmission β by ~35%</div>
          </div>
          <input
            type="checkbox"
            checked={interventions.universalMaskMandate}
            onChange={(e) =>
              setInterventions((p) => ({ ...p, universalMaskMandate: e.target.checked }))
            }
            className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
          />
        </div>

        {/* Community Lockdown Stringency */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Lockdown Stringency</span>
            <span className="font-mono text-cyan-300">
              {(interventions.lockdownStringency * 100).toFixed(0)}% contact reduction
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.85"
            step="0.05"
            value={interventions.lockdownStringency}
            onChange={(e) =>
              setInterventions((p) => ({
                ...p,
                lockdownStringency: parseFloat(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Quarantine & Isolation Effectiveness */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Quarantine & Case Isolation</span>
            <span className="font-mono text-cyan-300">
              {(interventions.quarantineIsolationRate * 100).toFixed(0)}% isolated
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.9"
            step="0.05"
            value={interventions.quarantineIsolationRate}
            onChange={(e) =>
              setInterventions((p) => ({
                ...p,
                quarantineIsolationRate: parseFloat(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>

      {/* Transit Restrictions & Border Closures */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1.5 font-semibold text-slate-100 text-xs">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Transportation Network Restrictions</span>
        </div>

        {/* Travel Restriction Factor */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Inter-Regional Travel Reduction</span>
            <span className="font-mono text-cyan-300">
              {(interventions.travelRestrictionFactor * 100).toFixed(0)}% suppression
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            value={interventions.travelRestrictionFactor}
            onChange={(e) =>
              setInterventions((p) => ({
                ...p,
                travelRestrictionFactor: parseFloat(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-800 rounded">
            <span className="flex items-center gap-1.5 text-slate-300 text-[11px]">
              <Plane className="w-3.5 h-3.5 text-sky-400" />
              <span>Close Airports</span>
            </span>
            <input
              type="checkbox"
              checked={interventions.airportClosure}
              onChange={(e) =>
                setInterventions((p) => ({ ...p, airportClosure: e.target.checked }))
              }
              className="w-3.5 h-3.5 accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-800 rounded">
            <span className="flex items-center gap-1.5 text-slate-300 text-[11px]">
              <Train className="w-3.5 h-3.5 text-indigo-400" />
              <span>Close Rail Corridors</span>
            </span>
            <input
              type="checkbox"
              checked={interventions.railRoadClosure}
              onChange={(e) =>
                setInterventions((p) => ({ ...p, railRoadClosure: e.target.checked }))
              }
              className="w-3.5 h-3.5 accent-cyan-400 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Mass Vaccination Campaign */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1.5 font-semibold text-slate-100 text-xs">
          <Syringe className="w-3.5 h-3.5 text-indigo-400" />
          <span>Mass Vaccination Campaign</span>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Daily Rollout Speed</span>
            <span className="font-mono text-indigo-300">
              {(interventions.vaccineRolloutSpeed * 100).toFixed(2)}% of pop/day
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.02"
            step="0.001"
            value={interventions.vaccineRolloutSpeed}
            onChange={(e) =>
              setInterventions((p) => ({
                ...p,
                vaccineRolloutSpeed: parseFloat(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-400"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Vaccine Protection Efficacy</span>
            <span className="font-mono text-indigo-300">
              {(interventions.vaccineEffectiveness * 100).toFixed(0)}% efficacy
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.0"
            step="0.02"
            value={interventions.vaccineEffectiveness}
            onChange={(e) =>
              setInterventions((p) => ({
                ...p,
                vaccineEffectiveness: parseFloat(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-400"
          />
        </div>
      </div>

      {/* Healthcare Capacity Expansion */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1.5 font-semibold text-slate-100 text-xs">
          <Hospital className="w-3.5 h-3.5 text-rose-400" />
          <span>Healthcare Surge Capacity</span>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-slate-300">Field Hospitals & ICU Expansion</span>
            <span className="font-mono text-rose-300">
              {interventions.healthcareExpansionFactor.toFixed(1)}x capacity
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.1"
            value={interventions.healthcareExpansionFactor}
            onChange={(e) =>
              setInterventions((p) => ({
                ...p,
                healthcareExpansionFactor: parseFloat(e.target.value),
              }))
            }
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-rose-400"
          />
        </div>
      </div>
    </div>
  );
};
