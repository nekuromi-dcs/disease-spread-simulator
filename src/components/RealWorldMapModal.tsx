/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Globe, Upload, CheckCircle2, AlertCircle, FileCode, Check, Map } from 'lucide-react';
import { convertGeoJSONToSimulationWorld, GeoJSONFeatureCollection } from '../engine/geoJsonImporter';
import { CellData, TransportLink } from '../types/simulation';

export type MapSourceType = 'real_countries' | 'real_earth_grid' | 'synthetic' | 'custom_geojson';

interface RealWorldMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMapSource: MapSourceType;
  onSelectMapSource: (source: 'real_countries' | 'real_earth_grid' | 'synthetic') => void;
  onLoadCustomWorld: (cells: CellData[], transitLinks: TransportLink[], sourceName: string) => void;
  testingDateString?: string;
  worldPopulation?: number;
}

export const RealWorldMapModal: React.FC<RealWorldMapModalProps> = ({
  isOpen,
  onClose,
  currentMapSource,
  onSelectMapSource,
  onLoadCustomWorld,
  testingDateString,
  worldPopulation,
}) => {
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleGeoJSONUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as GeoJSONFeatureCollection;
        if (!parsed || parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
          setImportStatus({
            success: false,
            message: 'Invalid GeoJSON: Expected a GeoJSON FeatureCollection object.',
          });
          return;
        }

        const { cells, transitLinks } = convertGeoJSONToSimulationWorld(parsed);
        const landCount = cells.filter((c) => c.isLand).length;
        onLoadCustomWorld(cells, transitLinks, file.name);
        setImportStatus({
          success: true,
          message: `Successfully projected ${parsed.features.length} GeoJSON features onto ${landCount} land cells!`,
        });
      } catch (err) {
        setImportStatus({
          success: false,
          message: `GeoJSON Parse error: ${String(err)}`,
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col text-slate-200 text-xs overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">Geographic Map Selection & World Demographics</h2>
              <div className="text-slate-400 text-[11px]">
                {testingDateString && worldPopulation
                  ? `Testing Date: ${testingDateString} · Global Population: ${worldPopulation.toLocaleString()}`
                  : 'Choose between Real Earth Sovereign Nations, Geographic Grids, or Custom GeoJSON'}
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

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Option 1: Authentic Real World Sovereign Nations Map (Default / Primary) */}
          <div
            onClick={() => {
              onSelectMapSource('real_countries');
              onClose();
            }}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              currentMapSource === 'real_countries'
                ? 'bg-cyan-950/50 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white text-xs flex items-center gap-2">
                    <span>Real-World Sovereign Nations Map (177 Sovereign Countries)</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
                      RECOMMENDED
                    </span>
                    {currentMapSource === 'real_countries' && (
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded font-mono">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                    Authentic vector map of all 177 sovereign nations on Earth with true geographic boundaries, real UN 2026 demographic populations, regional biomes, intercontinental airline routes, and cross-border land diffusion. Projected via d3-geo (Natural Earth, 3D Globe, Mercator).
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono text-cyan-400">
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">177 Real Nations</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">100% Conserved Population</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Great-Circle Flight Arcs</span>
                  </div>
                </div>
              </div>
              {currentMapSource === 'real_countries' && (
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
            </div>
          </div>

          {/* Option 2: Real-World Geographic Land Grid (24x48) */}
          <div
            onClick={() => {
              onSelectMapSource('real_earth_grid');
              onClose();
            }}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              currentMapSource === 'real_earth_grid'
                ? 'bg-cyan-950/40 border-cyan-500 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Map className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white text-xs flex items-center gap-2">
                    <span>Real-World Geographic Land Grid (24×48 Earth Grid)</span>
                    {currentMapSource === 'real_earth_grid' && (
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded font-mono">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                    Continuous 1,152-cell spatial grid sampling Earth's continental landmasses, latitude/altitude temperature lapse rates, and 30+ IATA airline megacities for dense grid cellular automata experiments.
                  </p>
                </div>
              </div>
              {currentMapSource === 'real_earth_grid' && (
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
            </div>
          </div>

          {/* Option 3: Synthetic Benchmark World (20x30) */}
          <div
            onClick={() => {
              onSelectMapSource('synthetic');
              onClose();
            }}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              currentMapSource === 'synthetic'
                ? 'bg-cyan-950/40 border-cyan-500 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <FileCode className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white text-xs flex items-center gap-2">
                    <span>Synthetic Benchmark World (20×30 Procedural Model)</span>
                    {currentMapSource === 'synthetic' && (
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded font-mono">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                    Theoretical two-continent demonstration world designed for controlled theoretical cellular automata benchmarks, isolation testing, and synthetic stress experiments.
                  </p>
                </div>
              </div>
              {currentMapSource === 'synthetic' && (
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
            </div>
          </div>

          {/* Option 4: Upload Custom GeoJSON File */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center gap-2 font-semibold text-white text-xs">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Import Custom World GeoJSON (`.geojson` / `.json`)</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Upload any GeoJSON feature collection (e.g. from Natural Earth, world-atlas, or OpenData) to project polygon features directly into the simulation engine.
            </p>

            <div className="pt-1">
              <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-dashed border-slate-600 rounded-lg text-slate-200 font-medium text-xs cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Select GeoJSON File to Load</span>
                <input
                  type="file"
                  accept=".geojson,.json,application/geo+json,application/json"
                  onChange={handleGeoJSONUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div
                className={`p-2.5 rounded border text-[11px] flex items-center gap-2 mt-2 ${
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
