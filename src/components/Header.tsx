/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, RotateCcw, ShieldCheck, GitCompare, Download, BookOpen } from 'lucide-react';

import { MapSourceType } from './RealWorldMapModal';

interface HeaderProps {
  currentDay: number;
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  activeView: 'simulation' | 'curves' | 'comparison' | 'verification' | 'documentation';
  setActiveView: (view: 'simulation' | 'curves' | 'comparison' | 'verification' | 'documentation') => void;
  onOpenExport: () => void;
  verificationPassed: boolean | null;
  currentMapSource: MapSourceType;
  onOpenMapModal: () => void;
  testingDateString?: string;
  worldPopulation?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentDay,
  isRunning,
  onTogglePlay,
  onReset,
  activeView,
  setActiveView,
  onOpenExport,
  verificationPassed,
  currentMapSource,
  onOpenMapModal,
  testingDateString,
  worldPopulation,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3 bg-slate-900 border-b border-slate-800 text-slate-100 shrink-0 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#simulation"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('simulation');
          }}
          className="text-base font-semibold tracking-tight text-white whitespace-nowrap hover:text-cyan-400 transition-colors"
        >
          Spatial SIRVD Epidemic Simulator
        </a>
        <span className="text-xs font-mono text-slate-400 tracking-wider">
          Day {currentDay}
        </span>
        {worldPopulation && (
          <span
            title={`Testing date baseline world population (${testingDateString})`}
            className="hidden lg:inline text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/80 whitespace-nowrap"
          >
            {testingDateString} · Pop: {worldPopulation.toLocaleString()}
          </span>
        )}
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
        <button
          onClick={() => setActiveView('simulation')}
          className={`transition-colors whitespace-nowrap hover:text-white ${
            activeView === 'simulation'
              ? 'text-cyan-400 font-semibold'
              : 'text-slate-300'
          }`}
        >
          Simulation Map
        </button>
        <button
          onClick={() => setActiveView('curves')}
          className={`transition-colors whitespace-nowrap hover:text-white ${
            activeView === 'curves'
              ? 'text-cyan-400 font-semibold'
              : 'text-slate-300'
          }`}
        >
          Epidemic Curves
        </button>
        <button
          onClick={() => setActiveView('comparison')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap hover:text-white ${
            activeView === 'comparison'
              ? 'text-cyan-400 font-semibold'
              : 'text-slate-300'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Scenario Comparison</span>
        </button>
        <button
          onClick={() => setActiveView('verification')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap hover:text-white ${
            activeView === 'verification'
              ? 'text-cyan-400 font-semibold'
              : 'text-slate-300'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Model Verification (15/15)</span>
          {verificationPassed === true && (
            <span className="text-[10px] text-emerald-400 font-mono">Passed</span>
          )}
        </button>
        <button
          onClick={() => setActiveView('documentation')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap hover:text-white ${
            activeView === 'documentation'
              ? 'text-cyan-400 font-semibold'
              : 'text-slate-300'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Formulations & Guide</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action area */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenMapModal}
          title="Switch Map Geography or Import GeoJSON"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-800 rounded transition-colors whitespace-nowrap"
        >
          <span className="text-sm">🌍</span>
          <span>
            {currentMapSource === 'real_countries'
              ? 'Map: Real World (177 Nations)'
              : currentMapSource === 'real_earth_grid'
              ? 'Map: Earth 24×48 Grid'
              : currentMapSource === 'custom_geojson'
              ? 'Map: Custom GeoJSON'
              : 'Map: Synthetic World'}
          </span>
        </button>

        <button
          onClick={onOpenExport}
          title="Export CSV & Scenarios"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>

        <button
          onClick={onReset}
          title="Reset Simulation to Day 0"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded transition-colors whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-slate-950 rounded transition-colors whitespace-nowrap shadow-sm ${
            isRunning
              ? 'bg-amber-400 hover:bg-amber-300'
              : 'bg-cyan-400 hover:bg-cyan-300'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause Run</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Run</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
