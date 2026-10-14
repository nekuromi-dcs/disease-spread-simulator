/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CellData,
  SimulationScenario,
  SimulationStepRecord,
} from '../types/simulation';
import {
  exportTimeSeriesToCSV,
  exportRegionalSummaryToCSV,
  downloadFile,
  validateAndParseScenarioJSON,
} from '../engine/exportUtils';
import { Download, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SimulationStepRecord[];
  cells: CellData[];
  currentDay: number;
  currentScenario: SimulationScenario;
  onLoadImportedScenario: (scenario: SimulationScenario) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  history,
  cells,
  currentDay,
  currentScenario,
  onLoadImportedScenario,
}) => {
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(currentScenario, null, 2);
    downloadFile(
      jsonStr,
      `scenario_${currentScenario.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.json`,
      'application/json'
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateAndParseScenarioJSON(content);
      if (res.valid && res.scenario) {
        onLoadImportedScenario(res.scenario);
        setImportStatus({
          success: true,
          message: `Successfully loaded scenario: "${res.scenario.name}"`,
        });
      } else {
        setImportStatus({
          success: false,
          message: res.error || 'Invalid scenario format.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl w-full max-w-xl flex flex-col text-slate-200 text-xs overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Data Export & Scenario Management</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* CSV Data Exports */}
          <div className="space-y-3">
            <div className="font-semibold text-slate-100 text-xs flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Export Empirical Simulation Data (CSV)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Export full precision data for external analysis in Python, R, Excel, or scientific research platforms.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => exportTimeSeriesToCSV(history, currentScenario.name)}
                disabled={history.length === 0}
                className="flex flex-col items-start p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 rounded text-left transition-colors"
              >
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Time-Series CSV</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Daily S, I, R, V, D, Rt, incidence & deaths ({history.length} days)
                </div>
              </button>

              <button
                onClick={() => exportRegionalSummaryToCSV(cells, currentDay)}
                className="flex flex-col items-start p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded text-left transition-colors"
              >
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Regional Cells CSV</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Full 600-cell breakdown with climate, transit & local states
                </div>
              </button>
            </div>
          </div>

          {/* Scenario JSON Serialization */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="font-semibold text-slate-100 text-xs flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Scenario Configuration (JSON)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Save scenario parameters for future runs, or import previously saved scenarios.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportJSON}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-medium text-xs transition-colors text-center"
              >
                Export Scenario JSON
              </button>

              <label className="flex-1 py-2 px-3 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800 text-cyan-300 rounded font-medium text-xs transition-colors cursor-pointer text-center">
                <span>Import Scenario JSON</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div
                className={`p-2.5 rounded border text-[11px] flex items-center gap-2 ${
                  importStatus.success
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-red-950/40 border-red-800 text-red-300'
                }`}
              >
                {importStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
