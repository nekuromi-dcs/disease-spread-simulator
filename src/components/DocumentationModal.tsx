/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, ShieldAlert, Cpu, Terminal, ArrowRight } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-slate-200 text-xs overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Mathematical Model & Simulation Architecture Documentation
              </h2>
              <div className="text-slate-400 text-[11px]">
                Formal formulation of the Spatially Distributed SIRVD Cellular Automata Engine
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300 leading-relaxed">
          {/* Section 1: Epidemiological Compartments & Accounting */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
              <span>01. Compartmental Structure & Conservation Law</span>
            </h3>
            <p className="text-[11px] text-slate-300">
              Each geographic cell $i$ represents a discrete region containing a closed population $N_i$. The model tracks five mutually exclusive compartments:
            </p>
            <div className="grid grid-cols-5 gap-2 my-2 font-mono text-[11px]">
              <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                <span className="text-sky-400 font-bold block">S</span> Susceptible
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                <span className="text-rose-400 font-bold block">I</span> Infectious
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                <span className="text-emerald-400 font-bold block">R</span> Recovered
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                <span className="text-indigo-400 font-bold block">V</span> Vaccinated
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded">
                <span className="text-red-400 font-bold block">D</span> Deceased
              </div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-cyan-300">
              {'N_i = S_i(t) + I_i(t) + R_i(t) + V_i(t) + D_i(t) = Constant (Conservation Law)'}
            </div>
            <p className="text-[11px] text-slate-400">
              {'Living population is defined as N_living = S_i + I_i + R_i + V_i = N_i - D_i. Disease-related fatalities remain tracked within the cumulative population ledger.'}
            </p>
          </div>

          {/* Section 2: Force of Infection & Cellular Automata */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <h3 className="text-sm font-bold text-cyan-300">
              02. Cellular Automata & Spatial Interaction
            </h3>
            <p className="text-[11px] text-slate-300">
              Transmission in region i is driven by effective transmission rate beta, local prevalence, neighboring cellular interaction, and long-range transport flux:
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-cyan-300">
              {'λ_i = β_eff · [ I_i / N_living + ω_spatial · Σ (w_ij · I_j / N_j,living) + Σ (F_ki,eff · I_k / N_k,living) / N_living ]'}
            </div>
            <p className="text-[11px] text-slate-400">
              Where w_ij represents the adjacency interaction weight (4-neighbor, 8-neighbor, or distance-weighted), and F_ki,eff is the net daily passenger flux along air, rail, and sea links.
            </p>
          </div>

          {/* Section 3: Environmental Modifiers */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <h3 className="text-sm font-bold text-cyan-300">
              03. Environmental & Meteorological Modifiers
            </h3>
            <p className="text-[11px] text-slate-300">
              The environmental modifier E_i dynamically scales local transmission based on temperature lapse rates, relative humidity, and crowd density:
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-cyan-300">
              {'E_i = 1.0 + κ_env · [ ((T_opt - T_i) / 30) · 0.35 + ((50% - H_i) / 100) · 0.25 + log10(Density_i / 250) · 0.20 ]'}
            </div>
            <p className="text-[11px] text-slate-400">
              Pathogen transmission is enhanced in cool temperatures and low relative humidity (prolonging aerosol suspension lifetime) and high urban densities.
            </p>
          </div>

          {/* Section 4: Healthcare Capacity & Excess Mortality */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <h3 className="text-sm font-bold text-cyan-300">
              04. Healthcare Capacity & Triage Saturation
            </h3>
            <p className="text-[11px] text-slate-300">
              When the active infected load I_i exceeds the regional critical care bed threshold C_i, excess patients receive substandard triage, scaling effective mortality:
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-cyan-300">
              {'μ_eff = ( min(I_i, C_i) · μ_0 + max(0, I_i - C_i) · μ_0 · Multiplier ) / I_i'}
            </div>
          </div>

          {/* Section 5: Educational Boundaries & Disclaimer */}
          <div className="p-4 bg-slate-950 border border-amber-900/60 rounded space-y-2 text-amber-200/90">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Educational & Analytical Scope Disclaimer</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This application is designed strictly for scientific education, policy exploration, and computational epidemiology demonstration. It is not an empirical real-world forecasting tool or clinical diagnostic instrument.
            </p>
          </div>

          {/* Section 6: Future Enhancements */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <h3 className="text-sm font-bold text-cyan-300">
              05. Implemented & Future Planned Enhancements
            </h3>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li>Multi-strain viral competition and antigen mutation drift.</li>
              <li>Agent-based individual micro-mobility tracking with sub-grid agent flows.</li>
              <li>Dynamic economic cost-benefit loss function optimization per day of lockdown.</li>
              <li>Direct GeoJSON shapefile import for real national boundaries.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
