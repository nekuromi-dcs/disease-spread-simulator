/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { runAutomatedValidationTests, FullTestReport } from '../engine/tests/validationTests';
import { ShieldCheck, CheckCircle2, XCircle, RotateCw, Clock, Layers } from 'lucide-react';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: FullTestReport | null;
  onRunTests: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  report,
  onRunTests,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = [
    'all',
    'Mathematical Rigor',
    'Compartmental Validity',
    'Transitions',
    'Epidemiological Invariant',
    'Transportation Graph',
    'Policy Enforcement',
    'State Lifecycle',
    'Reproducibility',
  ];

  const filteredResults =
    report && selectedCategory !== 'all'
      ? report.results.filter((r) => r.category === selectedCategory)
      : report?.results || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-slate-200 text-xs overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Epidemiological Model Verification & Automated Test Suite
              </h2>
              <div className="text-slate-400 text-[11px]">
                Validating 15 core formal requirements from Section 13 (Population conservation, invariant transitions, PRNG determinism)
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

        {/* Status Strip & Run Button */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              {report?.allPassed ? (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold font-mono text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ALL {report.totalCount} TESTS PASSED</span>
                </span>
              ) : report ? (
                <span className="flex items-center gap-1 text-red-400 font-semibold font-mono text-[11px] bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{report.passedCount} / {report.totalCount} PASSED</span>
                </span>
              ) : (
                <span className="text-slate-500 font-mono">Not Run Yet</span>
              )}
            </div>

            {report && (
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Runtime: {report.executionTimeMs.toFixed(1)}ms</span>
              </div>
            )}
          </div>

          <button
            onClick={onRunTests}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold rounded shadow transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Re-Execute All 15 Tests</span>
          </button>
        </div>

        {/* Filter Category Tabs */}
        <div className="px-6 py-2 border-b border-slate-800 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors whitespace-nowrap capitalize ${
                selectedCategory === cat
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Tests (15)' : cat}
            </button>
          ))}
        </div>

        {/* Test Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredResults.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded border transition-colors ${
                item.passed
                  ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  : 'bg-red-950/20 border-red-900/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-xs">
                        #{item.id}. {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        [{item.category}]
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    {item.diagnosticData && (
                      <div className="mt-2 p-2 bg-slate-900 rounded font-mono text-[10px] text-cyan-300/90 border border-slate-800">
                        {JSON.stringify(item.diagnosticData, null, 2)}
                      </div>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                    item.passed
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {item.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
