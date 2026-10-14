/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { CellData, TransportLink, MapViewMode } from '../types/simulation';
import {
  geoNaturalEarth1,
  geoMercator,
  geoEquirectangular,
  geoOrthographic,
  geoPath,
  geoGraticule10,
  geoContains,
  GeoProjection,
} from 'd3-geo';
import {
  WORLD_COUNTRIES_FEATURE_COLLECTION,
  WORLD_LAND_FEATURE,
  WorldCountryGeoFeature,
} from '../engine/realWorldAtlas';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Crosshair,
  Globe,
  MapPin,
} from 'lucide-react';

export type ProjectionType = 'natural_earth' | 'orthographic' | 'mercator' | 'equirectangular';

interface MapCanvasProps {
  cells: CellData[];
  transitLinks: TransportLink[];
  selectedCellId: string | null;
  onSelectCell: (cell: CellData) => void;
  viewMode: MapViewMode;
  setViewMode: (mode: MapViewMode) => void;
  onSeedOutbreakInCell?: (cellId: string, count: number) => void;
  showTransitOverlay: boolean;
  setShowTransitOverlay: (show: boolean) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  cells,
  transitLinks,
  selectedCellId,
  onSelectCell,
  viewMode,
  setViewMode,
  onSeedOutbreakInCell,
  showTransitOverlay,
  setShowTransitOverlay,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Map Projection state (d3-geo)
  const [projectionType, setProjectionType] = useState<ProjectionType>('natural_earth');
  const [globeRotation, setGlobeRotation] = useState<[number, number, number]>([0, -15, 0]);

  // Pan and Zoom transform state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover probe state
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive tool mode: Inspect or Click to Seed Outbreak
  const [toolMode, setToolMode] = useState<'inspect' | 'seed_outbreak'>('inspect');

  // Check if current world is based on real country polygons
  const isCountryBased = useMemo(() => {
    return cells.some((c) => c.id.startsWith('country_'));
  }, [cells]);

  // Quick lookup map: cellId -> CellData
  const cellMap = useMemo(() => {
    const map = new Map<string, CellData>();
    for (const c of cells) {
      map.set(c.id, c);
    }
    return map;
  }, [cells]);

  // Pre-calculate GeoJSON polygon boundaries for grid cells (if grid-based)
  const cellGeoFeatures = useMemo(() => {
    if (isCountryBased) return [];

    let maxR = 24;
    let maxC = 48;
    for (const c of cells) {
      if (c.row >= maxR) maxR = c.row + 1;
      if (c.col >= maxC) maxC = c.col + 1;
    }

    const dLat = 135 / (maxR - 1 || 1);
    const dLon = 360 / (maxC - 1 || 1);

    return cells.map((cell) => {
      const lat = cell.environmental.latitude;
      const lon = cell.environmental.longitude;

      const latMin = Math.max(-89.9, lat - dLat / 2);
      const latMax = Math.min(89.9, lat + dLat / 2);
      const lonMin = Math.max(-180, lon - dLon / 2);
      const lonMax = Math.min(180, lon + dLon / 2);

      const feature: any = {
        type: 'Feature',
        properties: { cellId: cell.id },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lonMin, latMin],
            [lonMax, latMin],
            [lonMax, latMax],
            [lonMin, latMax],
            [lonMin, latMin],
          ]],
        },
      };

      return { cell, feature };
    });
  }, [cells, isCountryBased]);

  // Color interpolators for scientific palettes
  const getCellFillColor = useCallback(
    (cell: CellData): string => {
      if (!cell.isLand) {
        return '#081224'; // Ocean deep navy
      }

      const N = Math.max(1, cell.state.totalPopulation);
      const I = cell.state.infected;
      const S = cell.state.susceptible;
      const R = cell.state.recovered;
      const V = cell.state.vaccinated;
      const D = cell.state.deceased;

      switch (viewMode) {
        case 'infection_intensity': {
          const frac = I / N;
          if (frac <= 0) return '#1e293b'; // Clean uninfected slate
          if (frac < 0.005) return '#d97706'; // Early warning amber
          if (frac < 0.02) return '#ea580c'; // Active spread orange
          if (frac < 0.08) return '#e11d48'; // High spread red
          if (frac < 0.25) return '#be123c'; // Severe surge crimson
          return '#881337'; // Peak saturated burgundy
        }

        case 'susceptible': {
          const frac = S / N;
          const r = Math.round(15 + frac * 20);
          const g = Math.round(35 + frac * 140);
          const b = Math.round(70 + frac * 170);
          return `rgb(${r}, ${g}, ${b})`;
        }

        case 'recovered': {
          const frac = R / N;
          if (frac <= 0) return '#1e293b';
          const intensity = Math.min(1, frac * 2.5);
          const r = Math.round(15 + intensity * 20);
          const g = Math.round(40 + intensity * 180);
          const b = Math.round(40 + intensity * 120);
          return `rgb(${r}, ${g}, ${b})`;
        }

        case 'vaccinated': {
          const frac = V / N;
          if (frac <= 0) return '#1e293b';
          const intensity = Math.min(1, frac * 2.0);
          const r = Math.round(20 + intensity * 120);
          const g = Math.round(30 + intensity * 90);
          const b = Math.round(70 + intensity * 180);
          return `rgb(${r}, ${g}, ${b})`;
        }

        case 'deaths': {
          const frac = D / N;
          if (frac <= 0) return '#1e293b';
          const intensity = Math.min(1, frac * 25);
          const r = Math.round(50 + intensity * 180);
          const g = Math.round(20 + intensity * 30);
          const b = Math.round(30 + intensity * 30);
          return `rgb(${r}, ${g}, ${b})`;
        }

        case 'density': {
          const density = cell.environmental.populationDensity;
          const norm = Math.min(1, Math.log10(Math.max(10, density)) / 4.0);
          const r = Math.round(25 + norm * 200);
          const g = Math.round(30 + norm * 150);
          const b = Math.round(40 + norm * 60);
          return `rgb(${r}, ${g}, ${b})`;
        }

        case 'environment': {
          const temp = cell.environmental.temperature;
          const tNorm = Math.max(0, Math.min(1, (temp + 15) / 50));
          if (tNorm < 0.4) {
            return `rgb(${Math.round(30 + tNorm * 50)}, ${Math.round(70 + tNorm * 100)}, ${Math.round(180 - tNorm * 50)})`;
          } else if (tNorm < 0.7) {
            return `rgb(${Math.round(40 + (tNorm - 0.4) * 200)}, ${Math.round(140 + (tNorm - 0.4) * 80)}, 60)`;
          } else {
            return `rgb(${Math.round(180 + (tNorm - 0.7) * 70)}, ${Math.round(110 - (tNorm - 0.7) * 80)}, 30)`;
          }
        }

        case 'transport': {
          if (cell.infrastructure.hasAirport) return '#38bdf8';
          if (cell.infrastructure.hasSeaport) return '#06b6d4';
          if (cell.infrastructure.hasRailStation) return '#818cf8';
          return '#334155';
        }

        default:
          return '#1e293b';
      }
    },
    [viewMode]
  );

  // Instantiates the d3-geo projection
  const getProjection = useCallback(
    (width: number, height: number): GeoProjection => {
      let proj: GeoProjection;

      switch (projectionType) {
        case 'orthographic':
          proj = geoOrthographic().rotate(globeRotation);
          break;
        case 'mercator':
          proj = geoMercator();
          break;
        case 'equirectangular':
          proj = geoEquirectangular();
          break;
        case 'natural_earth':
        default:
          proj = geoNaturalEarth1();
          break;
      }

      let baseScale = width / 5.8;
      if (projectionType === 'orthographic') {
        baseScale = Math.min(width, height) * 0.42;
      } else if (projectionType === 'mercator') {
        baseScale = width / 6.4;
      }

      proj
        .scale(baseScale * zoom)
        .translate([width / 2 + pan.x, height / 2 + pan.y]);

      return proj;
    },
    [projectionType, globeRotation, zoom, pan]
  );

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = Math.floor(rect.width) || 800;
    const cssHeight = Math.floor(rect.height) || 500;

    // Physical canvas pixel buffer synchronization
    const targetWidth = Math.floor(cssWidth * dpr);
    const targetHeight = Math.floor(cssHeight * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear background in CSS coordinates
    ctx.fillStyle = '#060b18';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const projection = getProjection(cssWidth, cssHeight);
    const pathGen = geoPath(projection, ctx);

    // 1. Draw Earth Sphere Outline & Deep Ocean
    ctx.beginPath();
    pathGen({ type: 'Sphere' } as any);
    ctx.fillStyle = '#081224';
    ctx.fill();
    ctx.strokeStyle = projectionType === 'orthographic' ? 'rgba(56, 189, 248, 0.5)' : 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = projectionType === 'orthographic' ? 2.0 : 1.4;
    ctx.stroke();

    // 2. Draw Geographic Graticule lines
    ctx.beginPath();
    pathGen(geoGraticule10() as any);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // 3. Render Real World Map
    if (isCountryBased) {
      // Draw 177 Real Sovereign Countries as authentic vector polygons
      for (const feat of WORLD_COUNTRIES_FEATURE_COLLECTION.features) {
        const countryId = `country_${feat.id}`;
        const cell = cellMap.get(countryId);

        ctx.beginPath();
        pathGen(feat as any);

        // Fill based on SIRVD epidemiological state
        ctx.fillStyle = cell ? getCellFillColor(cell) : '#1e293b';
        ctx.fill();

        // Stroke country borders
        const isSelected = selectedCellId === countryId;
        const isHovered = hoveredCell && hoveredCell.id === countryId;

        if (isSelected) {
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2.4;
          ctx.stroke();
        } else if (isHovered) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Draw Airport marker at capital / centroid
        if ((viewMode === 'transport' || isSelected) && cell?.infrastructure.hasAirport) {
          const pt = projection([cell.environmental.longitude, cell.environmental.latitude]);
          if (pt) {
            ctx.beginPath();
            ctx.arc(pt[0], pt[1], 2.8, 0, Math.PI * 2);
            ctx.fillStyle = '#38bdf8';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    } else {
      // Grid-based mode: render real world continent coastlines underneath
      ctx.beginPath();
      pathGen(WORLD_LAND_FEATURE as any);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Render projected cells
      for (const { cell, feature } of cellGeoFeatures) {
        ctx.beginPath();
        pathGen(feature);
        ctx.fillStyle = getCellFillColor(cell);
        ctx.fill();

        if (cell.isLand) {
          if (cell.id === selectedCellId) {
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          } else if (hoveredCell && hoveredCell.id === cell.id) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }
    }

    // 4. Draw Great-Circle Transit Routes
    if (showTransitOverlay || viewMode === 'transport') {
      for (const link of transitLinks) {
        if (!link.active) continue;

        const from = cellMap.get(link.fromCellId);
        const to = cellMap.get(link.toCellId);
        if (!from || !to) continue;

        ctx.beginPath();
        const lineGeo: any = {
          type: 'LineString',
          coordinates: [
            [from.environmental.longitude, from.environmental.latitude],
            [to.environmental.longitude, to.environmental.latitude],
          ],
        };

        pathGen(lineGeo);

        if (link.mode === 'flight') {
          ctx.strokeStyle =
            link.restrictionLevel > 0.5
              ? 'rgba(239, 68, 68, 0.4)'
              : 'rgba(56, 189, 248, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
        } else {
          ctx.strokeStyle = 'rgba(129, 140, 248, 0.5)';
          ctx.lineWidth = 1.0;
          ctx.setLineDash([]);
        }

        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }, [
    cells,
    transitLinks,
    selectedCellId,
    hoveredCell,
    viewMode,
    projectionType,
    globeRotation,
    zoom,
    pan,
    showTransitOverlay,
    getCellFillColor,
    getProjection,
    cellGeoFeatures,
    isCountryBased,
    cellMap,
  ]);

  // Resize listener
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Mouse coordinate detection using d3-geo inverse projection & point-in-polygon
  const getCellFromMouse = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): CellData | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const projection = getProjection(rect.width, rect.height);
      const coords = projection.invert?.([clientX, clientY]);
      if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return null;

      const [lon, lat] = coords;

      if (isCountryBased) {
        // Point-in-polygon check on 177 sovereign country geometries
        for (const feat of WORLD_COUNTRIES_FEATURE_COLLECTION.features) {
          try {
            if (geoContains(feat as any, [lon, lat])) {
              return cellMap.get(`country_${feat.id}`) || null;
            }
          } catch {
            // ignore projection edge cases
          }
        }
      }

      // Fallback: nearest centroid
      let closestCell: CellData | null = null;
      let minDistance = Infinity;

      for (const cell of cells) {
        const dLat = cell.environmental.latitude - lat;
        let dLon = cell.environmental.longitude - lon;
        if (dLon > 180) dLon -= 360;
        if (dLon < -180) dLon += 360;

        const dist = dLat * dLat + dLon * dLon;
        if (dist < minDistance) {
          minDistance = dist;
          closestCell = cell;
        }
      }

      if (closestCell && minDistance < 18 * 18) {
        return closestCell;
      }
      return null;
    },
    [getProjection, cells, isCountryBased, cellMap]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setDragStart({ x: e.clientX, y: e.clientY });

      if (projectionType === 'orthographic') {
        setGlobeRotation(([r0, r1, r2]) => [
          r0 + dx * 0.35,
          Math.max(-80, Math.min(80, r1 - dy * 0.35)),
          r2,
        ]);
      } else {
        setPan((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));
      }
    } else {
      const cell = getCellFromMouse(e);
      setHoveredCell(cell);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromMouse(e);
    if (!cell) return;

    if (toolMode === 'seed_outbreak' && onSeedOutbreakInCell) {
      if (cell.isLand) {
        onSeedOutbreakInCell(cell.id, 500);
      }
    } else {
      onSelectCell(cell);
    }
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.6, Math.min(4.5, prev + delta)));
  };

  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setGlobeRotation([0, -15, 0]);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[460px] bg-slate-950 overflow-hidden select-none flex flex-col"
    >
      {/* Top Map Layer & Projection Selector Strip */}
      <div className="absolute top-3 left-4 z-10 flex flex-wrap items-center gap-2">
        {/* Layer Selector */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-md text-xs shadow-md">
          <button
            onClick={() => setViewMode('infection_intensity')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              viewMode === 'infection_intensity'
                ? 'bg-rose-500/20 text-rose-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Infection Intensity (I/N)
          </button>
          <button
            onClick={() => setViewMode('susceptible')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              viewMode === 'susceptible'
                ? 'bg-sky-500/20 text-sky-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Susceptible (S)
          </button>
          <button
            onClick={() => setViewMode('recovered')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              viewMode === 'recovered'
                ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Recovered (R)
          </button>
          <button
            onClick={() => setViewMode('vaccinated')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              viewMode === 'vaccinated'
                ? 'bg-indigo-500/20 text-indigo-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vaccinated (V)
          </button>
          <button
            onClick={() => setViewMode('deaths')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              viewMode === 'deaths'
                ? 'bg-red-500/20 text-red-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fatalities (D)
          </button>
          <button
            onClick={() => setViewMode('environment')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              viewMode === 'environment'
                ? 'bg-amber-500/20 text-amber-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Climate & Temp
          </button>
          <button
            onClick={() => setViewMode('transport')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              viewMode === 'transport'
                ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Transit Network
          </button>
        </div>

        {/* d3-geo Projection Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-md text-xs shadow-md">
          <Globe className="w-3.5 h-3.5 text-cyan-400 ml-1" />
          <select
            value={projectionType}
            onChange={(e) => setProjectionType(e.target.value as ProjectionType)}
            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
          >
            <option value="natural_earth" className="bg-slate-900 text-white">
              d3 Projection: Natural Earth (Curved)
            </option>
            <option value="orthographic" className="bg-slate-900 text-white">
              d3 Projection: Orthographic (3D Globe)
            </option>
            <option value="mercator" className="bg-slate-900 text-white">
              d3 Projection: Mercator
            </option>
            <option value="equirectangular" className="bg-slate-900 text-white">
              d3 Projection: Equirectangular
            </option>
          </select>
        </div>
      </div>

      {/* Action Mode Toggle & Overlay Checkbox */}
      <div className="absolute top-3 right-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-md text-xs shadow-md">
          <button
            onClick={() => setToolMode('inspect')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              toolMode === 'inspect'
                ? 'bg-slate-700 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inspect Mode
          </button>
          <button
            onClick={() => setToolMode('seed_outbreak')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              toolMode === 'seed_outbreak'
                ? 'bg-rose-900/80 text-rose-200 font-medium'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <Crosshair className="w-3 h-3" />
            <span>Seed Outbreak (+500 I)</span>
          </button>
        </div>

        <button
          onClick={() => setShowTransitOverlay(!showTransitOverlay)}
          title="Toggle Great-Circle Transit Route Lines"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md backdrop-blur shadow-md transition-colors whitespace-nowrap ${
            showTransitOverlay
              ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
              : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Flight Routes</span>
        </button>
      </div>

      {/* Main Interactive Projected Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setHoveredCell(null);
        }}
        onClick={handleClick}
        className={`w-full h-full cursor-${
          isDragging
            ? 'grabbing'
            : toolMode === 'seed_outbreak'
            ? 'crosshair'
            : projectionType === 'orthographic'
            ? 'grab'
            : 'pointer'
        }`}
      />

      {/* Canvas Zoom & Pan HUD Buttons */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 p-1 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-md shadow-md">
        <button
          onClick={() => handleZoom(0.25)}
          title="Zoom In"
          aria-label="Zoom in"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.25)}
          title="Zoom Out"
          aria-label="Zoom out"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          title="Reset Projection & Pan"
          aria-label="Reset projection view"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Scientific Legend */}
      <div className="absolute bottom-4 left-4 z-10 p-2.5 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-md text-slate-300 text-xs shadow-md max-w-xs">
        <div className="font-semibold text-slate-200 mb-1 flex items-center justify-between">
          <span>
            {viewMode === 'infection_intensity' && 'Infection Prevalence (I / N)'}
            {viewMode === 'susceptible' && 'Susceptible Share (S / N)'}
            {viewMode === 'recovered' && 'Recovered Share (R / N)'}
            {viewMode === 'vaccinated' && 'Vaccination Coverage (V / N)'}
            {viewMode === 'deaths' && 'Cumulative Fatalities (D / N)'}
            {viewMode === 'environment' && 'Climate Temperature & Biome'}
            {viewMode === 'transport' && 'Infrastructure & Great-Circle Transit'}
          </span>
          <span className="text-[10px] text-cyan-400 font-mono capitalize ml-1">
            {isCountryBased ? 'Natural Earth 110m' : 'Cellular Grid'}
          </span>
        </div>

        {viewMode === 'infection_intensity' && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-[#1e293b] border border-slate-700" />
              <span>0% (Uninfected)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-[#d97706]" />
              <span>&lt; 0.5% (Emerging)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-[#ea580c]" />
              <span>0.5% – 2.0% (Active Spread)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-[#e11d48]" />
              <span>2.0% – 8.0% (Outbreak Surge)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-[#881337]" />
              <span>&gt; 8.0% (Severe Critical)</span>
            </div>
          </div>
        )}

        {viewMode === 'environment' && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-cyan-400 font-mono">-15°C</span>
            <div className="h-2 w-28 rounded-sm bg-gradient-to-r from-blue-600 via-emerald-500 to-amber-500" />
            <span className="text-[10px] text-amber-400 font-mono">+35°C</span>
          </div>
        )}

        {viewMode === 'transport' && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span>International Hub (IATA)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span>High-Speed Rail Corridor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              <span>Coastal Maritime Seaport</span>
            </div>
          </div>
        )}

        {viewMode === 'susceptible' && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-slate-500 font-mono">0% S</span>
            <div className="h-2 w-28 rounded-sm bg-gradient-to-r from-slate-800 to-sky-400" />
            <span className="text-[10px] text-sky-400 font-mono">100% S</span>
          </div>
        )}

        {viewMode === 'recovered' && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-slate-500 font-mono">0% R</span>
            <div className="h-2 w-28 rounded-sm bg-gradient-to-r from-slate-800 to-emerald-500" />
            <span className="text-[10px] text-emerald-400 font-mono">100% R</span>
          </div>
        )}

        {viewMode === 'vaccinated' && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-slate-500 font-mono">0% V</span>
            <div className="h-2 w-28 rounded-sm bg-gradient-to-r from-slate-800 to-indigo-500" />
            <span className="text-[10px] text-indigo-400 font-mono">100% V</span>
          </div>
        )}

        {viewMode === 'deaths' && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-slate-500 font-mono">0% D</span>
            <div className="h-2 w-28 rounded-sm bg-gradient-to-r from-slate-800 to-rose-700" />
            <span className="text-[10px] text-rose-500 font-mono">&gt; 4% D</span>
          </div>
        )}
      </div>

      {/* Floating Hover Tooltip with Real Country Details */}
      {hoveredCell && (
        <div
          className="fixed pointer-events-none z-50 p-2.5 bg-slate-900/95 border border-slate-700 rounded-md text-xs text-slate-200 shadow-xl"
          style={{
            left: Math.min(window.innerWidth - 240, mousePos.x + 12),
            top: Math.min(window.innerHeight - 200, mousePos.y + 12),
          }}
        >
          <div className="font-semibold text-white flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{hoveredCell.name}</span>
          </div>
          <div className="text-[11px] text-slate-400 mb-1.5 font-mono">
            {hoveredCell.environmental.latitude > 0
              ? `${hoveredCell.environmental.latitude.toFixed(1)}°N`
              : `${Math.abs(hoveredCell.environmental.latitude).toFixed(1)}°S`}, {' '}
            {hoveredCell.environmental.longitude > 0
              ? `${hoveredCell.environmental.longitude.toFixed(1)}°E`
              : `${Math.abs(hoveredCell.environmental.longitude).toFixed(1)}°W`} · {hoveredCell.biome.replace('_', ' ')}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono tabular-nums text-[11px]">
            <div>Pop: {hoveredCell.state.totalPopulation.toLocaleString()}</div>
            <div className="text-rose-400">
              I: {hoveredCell.state.infected.toLocaleString()} (
              {((hoveredCell.state.infected / Math.max(1, hoveredCell.state.totalPopulation)) * 100).toFixed(1)}%)
            </div>
            <div className="text-sky-400">S: {hoveredCell.state.susceptible.toLocaleString()}</div>
            <div className="text-emerald-400">R: {hoveredCell.state.recovered.toLocaleString()}</div>
            <div className="text-indigo-400">V: {hoveredCell.state.vaccinated.toLocaleString()}</div>
            <div className="text-red-400">D: {hoveredCell.state.deceased.toLocaleString()}</div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Temp: {hoveredCell.environmental.temperature}°C</span>
            <span>Humidity: {hoveredCell.environmental.humidity}%</span>
            <span>Density: {hoveredCell.environmental.populationDensity}/km²</span>
          </div>
        </div>
      )}
    </div>
  );
};
