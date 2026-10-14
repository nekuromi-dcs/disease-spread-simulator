/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SimulationStepRecord, CellData } from '../types/simulation';
import { Activity, AlertTriangle, Users } from 'lucide-react';

interface AnalyticsPanelProps {
  history: SimulationStepRecord[];
  selectedCell: CellData | null;
  currentDay: number;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  history,
  selectedCell,
  currentDay,
}) => {
  const [activeTab, setActiveTab] = useState<'compartments' | 'incidence' | 'healthcare'>(
    'compartments'
  );
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (history.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-950 border-t border-slate-800 text-slate-500 text-xs">
        Simulation waiting to start. Click &quot;Start Run&quot; or &quot;+1 Day&quot; to generate epidemic trajectories.
      </div>
    );
  }

  const latest = history[history.length - 1];

  // Peak infection and peak day
  let peakInfected = 0;
  let dayOfPeak = 0;
  for (const rec of history) {
    if (rec.totalI > peakInfected) {
      peakInfected = rec.totalI;
      dayOfPeak = rec.day;
    }
  }

  // Attack rate (% ever infected)
  const totalLivingInitial = history[0]?.totalPopulation || 1;
  const cumulativeInfectionsApprox = latest.totalR + latest.totalI + latest.totalD;
  const attackRatePercent = ((cumulativeInfectionsApprox / totalLivingInitial) * 100).toFixed(1);

  // SVG Chart Geometry
  const chartWidth = 900;
  const chartHeight = 180;
  const padding = { top: 20, right: 30, bottom: 25, left: 60 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const maxPop = Math.max(...history.map((h) => h.totalPopulation), 1);
  const maxIncidence = Math.max(
    ...history.map((h) => Math.max(h.newInfections, h.newDeaths * 5)),
    100
  );

  const getX = (idx: number) => {
    if (history.length <= 1) return padding.left;
    return padding.left + (idx / (history.length - 1)) * innerW;
  };

  const getYPop = (val: number) => {
    return padding.top + innerH - (val / maxPop) * innerH;
  };

  const getYInc = (val: number) => {
    return padding.top + innerH - (val / maxIncidence) * innerH;
  };

  // Build SVG path strings
  const pathS = history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPop(h.totalS)}`).join(' ');
  const pathI = history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPop(h.totalI)}`).join(' ');
  const pathR = history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPop(h.totalR)}`).join(' ');
  const pathV = history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPop(h.totalV)}`).join(' ');
  const pathD = history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPop(h.totalD)}`).join(' ');

  const pathNewInf = history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYInc(h.newInfections)}`).join(' ');
  const pathNewDeath = history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYInc(h.newDeaths)}`).join(' ');

  const pathCapacity = history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPop(h.totalHealthcareCapacity)}`).join(' ');

  const activeRecord = hoverIndex !== null && hoverIndex < history.length ? history[hoverIndex] : latest;

  return (
    <div className="bg-slate-950 border-t border-slate-800 flex flex-col text-slate-200 text-xs shrink-0 select-none">
      {/* Top Scientific Metric Strip (Tabular Numerals) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-slate-800/80 border-b border-slate-800 bg-slate-900/60 font-mono">
        {/* Susceptible */}
        <div className="p-2.5">
          <div className="text-[10px] text-sky-400 uppercase tracking-wider flex items-center justify-between">
            <span>Susceptible</span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          </div>
          <div className="text-base font-bold text-white mt-0.5 tabular-nums">
            {activeRecord.totalS.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 tabular-nums">
            {((activeRecord.totalS / activeRecord.totalPopulation) * 100).toFixed(1)}% of total
          </div>
        </div>

        {/* Infected */}
        <div className="p-2.5">
          <div className="text-[10px] text-rose-400 uppercase tracking-wider flex items-center justify-between">
            <span>Infected (I)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          </div>
          <div className="text-base font-bold text-rose-300 mt-0.5 tabular-nums">
            {activeRecord.totalI.toLocaleString()}
          </div>
          <div className="text-[10px] text-rose-400/90 tabular-nums">
            +{activeRecord.newInfections.toLocaleString()} new today
          </div>
        </div>

        {/* Recovered */}
        <div className="p-2.5">
          <div className="text-[10px] text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Recovered (R)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="text-base font-bold text-white mt-0.5 tabular-nums">
            {activeRecord.totalR.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 tabular-nums">
            {((activeRecord.totalR / activeRecord.totalPopulation) * 100).toFixed(1)}% immune
          </div>
        </div>

        {/* Vaccinated */}
        <div className="p-2.5">
          <div className="text-[10px] text-indigo-400 uppercase tracking-wider flex items-center justify-between">
            <span>Vaccinated (V)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          </div>
          <div className="text-base font-bold text-white mt-0.5 tabular-nums">
            {activeRecord.totalV.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 tabular-nums">
            {((activeRecord.totalV / activeRecord.totalPopulation) * 100).toFixed(1)}% coverage
          </div>
        </div>

        {/* Fatalities */}
        <div className="p-2.5">
          <div className="text-[10px] text-red-400 uppercase tracking-wider flex items-center justify-between">
            <span>Deceased (D)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          </div>
          <div className="text-base font-bold text-white mt-0.5 tabular-nums">
            {activeRecord.totalD.toLocaleString()}
          </div>
          <div className="text-[10px] text-red-400 tabular-nums">
            +{activeRecord.newDeaths.toLocaleString()} new today
          </div>
        </div>

        {/* Epidemiological Key Indicators */}
        <div className="p-2.5 bg-slate-950/80">
          <div className="text-[10px] text-cyan-400 uppercase tracking-wider flex items-center justify-between">
            <span>Rt & Peak Metrics</span>
            <span className="text-[9px] text-slate-400 font-mono">Day {activeRecord.day}</span>
          </div>
          <div className="text-base font-bold text-cyan-300 mt-0.5 tabular-nums">
            Rₜ = {activeRecord.effectiveRt.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 tabular-nums">
            Peak: {peakInfected.toLocaleString()} (Day {dayOfPeak})
          </div>
        </div>
      </div>

      {/* Chart Toolbar & Category Selector */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800/80 bg-slate-950 text-xs">
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded">
          <button
            onClick={() => setActiveTab('compartments')}
            className={`px-3 py-1 rounded transition-colors whitespace-nowrap font-medium ${
              activeTab === 'compartments'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            S-I-R-V-D Trajectories
          </button>
          <button
            onClick={() => setActiveTab('incidence')}
            className={`px-3 py-1 rounded transition-colors whitespace-nowrap font-medium ${
              activeTab === 'incidence'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Incident Cases & Deaths
          </button>
          <button
            onClick={() => setActiveTab('healthcare')}
            className={`px-3 py-1 rounded transition-colors whitespace-nowrap font-medium ${
              activeTab === 'healthcare'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Healthcare Demand vs ICU Capacity
          </button>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Attack Rate: {attackRatePercent}%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-rose-400" />
            <span>Active Epicenters: {latest.activeRegionsCount} regions</span>
          </span>
          {latest.healthcareOverloadedCellsCount > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{latest.healthcareOverloadedCellsCount} ICU Overloaded</span>
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Time-Series SVG Chart */}
      <div className="px-4 py-2 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-44 overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const idx = Math.round(relX * (history.length - 1));
            if (idx >= 0 && idx < history.length) {
              setHoverIndex(idx);
            }
          }}
        >
          {/* Background horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const y = padding.top + innerH * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerW}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-slate-500 font-mono"
                >
                  {activeTab === 'incidence'
                    ? Math.round(maxIncidence * ratio).toLocaleString()
                    : `${(ratio * 100).toFixed(0)}%`}
                </text>
              </g>
            );
          })}

          {/* Time axis day labels */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const idx = Math.min(history.length - 1, Math.round(ratio * (history.length - 1)));
            const x = getX(idx);
            const dayNum = history[idx]?.day || 0;
            return (
              <text
                key={ratio}
                x={x}
                y={chartHeight - 6}
                textAnchor="middle"
                className="text-[9px] fill-slate-500 font-mono"
              >
                Day {dayNum}
              </text>
            );
          })}

          {/* Curves for Compartments Tab */}
          {activeTab === 'compartments' && (
            <>
              <path d={pathS} fill="none" stroke="#38bdf8" strokeWidth="1.8" />
              <path d={pathI} fill="none" stroke="#f43f5e" strokeWidth="2.2" />
              <path d={pathR} fill="none" stroke="#10b981" strokeWidth="1.8" />
              <path d={pathV} fill="none" stroke="#818cf8" strokeWidth="1.8" />
              <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="1.8" strokeDasharray="4 2" />
            </>
          )}

          {/* Curves for Incidence Tab */}
          {activeTab === 'incidence' && (
            <>
              <path d={pathNewInf} fill="none" stroke="#fb7185" strokeWidth="2.0" />
              <path d={pathNewDeath} fill="none" stroke="#ef4444" strokeWidth="2.0" strokeDasharray="3 2" />
            </>
          )}

          {/* Curves for Healthcare Tab */}
          {activeTab === 'healthcare' && (
            <>
              <path d={pathI} fill="none" stroke="#f43f5e" strokeWidth="2.2" />
              <path
                d={pathCapacity}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.8"
                strokeDasharray="4 4"
              />
            </>
          )}

          {/* Interactive Hover Probe Hairline */}
          {hoverIndex !== null && hoverIndex < history.length && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={padding.top + innerH}
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getYPop(history[hoverIndex].totalI)}
                r="3.5"
                fill="#f43f5e"
                stroke="#ffffff"
                strokeWidth="1.2"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
