/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  CellData,
  TransportLink,
  GlobalDiseaseParameters,
  GlobalInterventions,
  NeighborAdjacencyMode,
  MapViewMode,
  SimulationStepRecord,
  SimulationScenario,
} from './types/simulation';
import { generateSyntheticWorld, getRecommendedOutbreakCell } from './engine/worldGenerator';
import {
  generateRealEarthWorld,
  getWorldPopulationAtDate,
  getFormattedTestingDate,
} from './engine/realWorldData';
import { generateRealCountrySimulationWorld } from './engine/realWorldAtlas';
import { executeSimulationStep } from './engine/sirvdEngine';
import { SeededPRNG } from './engine/prng';
import { BASELINE_DISEASE_PARAMS, PRESET_SCENARIOS } from './engine/scenarioPresets';
import { runAutomatedValidationTests, FullTestReport } from './engine/tests/validationTests';
import { MapSourceType } from './components/RealWorldMapModal';

import { Header } from './components/Header';
import { MapCanvas } from './components/MapCanvas';
import { ControlSidebar } from './components/ControlSidebar';
import { SelectedCellInspector } from './components/SelectedCellInspector';
import { InterventionPanel } from './components/InterventionPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { ScenarioComparisonModal } from './components/ScenarioComparisonModal';
import { ValidationModal } from './components/ValidationModal';
import { ExportModal } from './components/ExportModal';
import { DocumentationModal } from './components/DocumentationModal';
import { RealWorldMapModal } from './components/RealWorldMapModal';
import { Activity, ShieldAlert, Sliders } from 'lucide-react';

export default function App() {
  // Navigation View State
  const [activeView, setActiveView] = useState<
    'simulation' | 'curves' | 'comparison' | 'verification' | 'documentation'
  >('simulation');

  // World and Simulation State
  const [cells, setCells] = useState<CellData[]>([]);
  const [transitLinks, setTransitLinks] = useState<TransportLink[]>([]);
  const [history, setHistory] = useState<SimulationStepRecord[]>([]);
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Disease Parameters & Interventions
  const [diseaseParams, setDiseaseParams] = useState<GlobalDiseaseParameters>({
    ...BASELINE_DISEASE_PARAMS,
  });
  const [globalInterventions, setGlobalInterventions] = useState<GlobalInterventions>({
    ...PRESET_SCENARIOS[0].globalInterventions,
  });

  // Spatial Automata Configuration
  const [adjacencyMode, setAdjacencyMode] = useState<NeighborAdjacencyMode>('eight');
  const [envModifierEnabled, setEnvModifierEnabled] = useState<boolean>(true);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const prngRef = useRef<SeededPRNG>(new SeededPRNG(42));

  // Map Visualization Controls
  const [viewMode, setViewMode] = useState<MapViewMode>('infection_intensity');
  const [showTransitOverlay, setShowTransitOverlay] = useState<boolean>(true);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  // Outbreak Seeding State
  const [selectedSeedCellId, setSelectedSeedCellId] = useState<string>('');
  const [initialInfectedCount, setInitialInfectedCount] = useState<number>(400);

  // Right Panel Tabs: Cell Inspector vs Global Interventions
  const [rightPanelTab, setRightPanelTab] = useState<'inspector' | 'interventions'>('interventions');

  // Map Source State: Real Sovereign Countries (default), Real Earth Grid, Synthetic, or Custom GeoJSON
  const [mapSource, setMapSource] = useState<MapSourceType>('real_countries');
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);

  // Modals State
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Validation Test Suite State
  const [testReport, setTestReport] = useState<FullTestReport | null>(null);

  // Testing Date & Baseline Global Population
  const testingDate = useMemo(() => new Date(), []);
  const testingDateString = useMemo(() => getFormattedTestingDate(testingDate), [testingDate]);
  const currentTestingPopulation = useMemo(() => getWorldPopulationAtDate(testingDate), [testingDate]);

  // Snapshot of Day 0 state for exact reset
  const baselineSnapshotRef = useRef<string>('');

  // 1. Initial World Generation & Outbreak Seeding
  const initializeWorld = useCallback(
    (
      seed: number = 42,
      customSeedCellId?: string,
      infectedCount: number = 400,
      sourceOverride?: MapSourceType | 'real_earth'
    ) => {
      const normalizedSource: MapSourceType =
        sourceOverride === 'real_earth'
          ? 'real_countries'
          : sourceOverride || (mapSource === 'custom_geojson' ? 'real_countries' : mapSource);

      let newCells: CellData[];
      let newLinks: TransportLink[];

      if (normalizedSource === 'real_countries') {
        const res = generateRealCountrySimulationWorld(testingDate);
        newCells = res.cells;
        newLinks = res.transitLinks;
      } else if (normalizedSource === 'real_earth_grid') {
        const res = generateRealEarthWorld(testingDate);
        newCells = res.cells;
        newLinks = res.transitLinks;
      } else {
        const res = generateSyntheticWorld();
        newCells = res.cells;
        newLinks = res.transitLinks;
      }

      prngRef.current = new SeededPRNG(seed);

      // Find initial epicenter
      let seedCell: CellData | undefined;
      if (customSeedCellId) {
        seedCell = newCells.find((c) => c.id === customSeedCellId);
      }
      if (!seedCell) {
        if (normalizedSource === 'real_countries') {
          // Default to United States of America, United Kingdom, or China
          seedCell =
            newCells.find((c) => c.name.includes('United States')) ||
            newCells.find((c) => c.name.includes('United Kingdom')) ||
            newCells.find((c) => c.name.includes('China')) ||
            newCells.find((c) => c.isLand);
        } else if (normalizedSource === 'real_earth_grid') {
          seedCell = newCells.find((c) => c.id === 'c_6_13') || newCells.find((c) => c.isLand);
        } else {
          seedCell = getRecommendedOutbreakCell(newCells);
        }
      }

      // Seed initial outbreak
      if (seedCell && seedCell.isLand) {
        const count = Math.min(seedCell.state.totalPopulation - 1, infectedCount);
        seedCell.state.infected = count;
        seedCell.state.susceptible -= count;
        seedCell.state.newInfectionsToday = count;
        setSelectedSeedCellId(seedCell.id);
        setSelectedCellId(seedCell.id);
      }

      setCells(newCells);
      setTransitLinks(newLinks);
      setCurrentDay(0);
      setIsRunning(false);

      // Initial record
      let sumPop = 0;
      let sumS = 0;
      let sumI = 0;
      let sumR = 0;
      let sumV = 0;
      let sumD = 0;
      let sumCap = 0;

      for (const c of newCells) {
        sumPop += c.state.totalPopulation;
        sumS += c.state.susceptible;
        sumI += c.state.infected;
        sumR += c.state.recovered;
        sumV += c.state.vaccinated;
        sumD += c.state.deceased;
        sumCap += c.healthcareCapacity;
      }

      const initialRecord: SimulationStepRecord = {
        day: 0,
        totalPopulation: sumPop,
        totalS: sumS,
        totalI: sumI,
        totalR: sumR,
        totalV: sumV,
        totalD: sumD,
        newInfections: sumI,
        newDeaths: 0,
        effectiveRt: diseaseParams.baseTransmissionRateBeta / diseaseParams.recoveryRateGamma,
        activeRegionsCount: sumI > 0 ? 1 : 0,
        healthcareOverloadedCellsCount: 0,
        totalHealthcareCapacity: sumCap,
        totalHealthcareDemand: sumI,
      };

      setHistory([initialRecord]);
      baselineSnapshotRef.current = JSON.stringify({
        cells: newCells,
        transitLinks: newLinks,
        initialRecord,
      });
    },
    [diseaseParams.baseTransmissionRateBeta, diseaseParams.recoveryRateGamma]
  );

  // Initialize on mount and run initial validation tests
  useEffect(() => {
    initializeWorld(42);
    // Run automated tests in background so status is instantly available
    const report = runAutomatedValidationTests();
    setTestReport(report);
  }, [initializeWorld]);

  // 2. Advance 1 Simulation Step
  const advanceStep = useCallback(() => {
    setCurrentDay((prevDay) => {
      const nextDay = prevDay + 1;
      setCells((curCells) => {
        const step = executeSimulationStep(
          curCells,
          transitLinks,
          diseaseParams,
          globalInterventions,
          adjacencyMode,
          envModifierEnabled,
          nextDay,
          prngRef.current
        );

        setHistory((prevHistory) => [...prevHistory, step.record]);
        return step.nextCells;
      });
      return nextDay;
    });
  }, [
    transitLinks,
    diseaseParams,
    globalInterventions,
    adjacencyMode,
    envModifierEnabled,
  ]);

  // 3. Simulation Animation Loop
  useEffect(() => {
    if (!isRunning) return;

    // Milliseconds per day interval based on playback speed
    const intervalMs = Math.max(40, Math.floor(400 / playbackSpeed));
    const timer = setInterval(() => {
      advanceStep();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, playbackSpeed, advanceStep]);

  // Reset Simulation to Day 0
  const handleReset = () => {
    setIsRunning(false);
    if (baselineSnapshotRef.current) {
      const snapshot = JSON.parse(baselineSnapshotRef.current);
      setCells(snapshot.cells);
      setTransitLinks(snapshot.transitLinks);
      setHistory([snapshot.initialRecord]);
      setCurrentDay(0);
      prngRef.current = new SeededPRNG(randomSeed);
    } else {
      initializeWorld(randomSeed, selectedSeedCellId, initialInfectedCount);
    }
  };

  // Click on a cell on the map
  const handleSelectCell = (cell: CellData) => {
    setSelectedCellId(cell.id);
    setRightPanelTab('inspector');
  };

  // Seed Outbreak by clicking on map
  const handleSeedOutbreakInCell = (cellId: string, count: number) => {
    setCells((prev) =>
      prev.map((c) => {
        if (c.id === cellId && c.isLand) {
          const actualInfect = Math.min(c.state.susceptible, count);
          return {
            ...c,
            state: {
              ...c.state,
              susceptible: Math.max(0, c.state.susceptible - actualInfect),
              infected: c.state.infected + actualInfect,
              newInfectionsToday: c.state.newInfectionsToday + actualInfect,
            },
          };
        }
        return c;
      })
    );
  };

  // Update specific cell local interventions
  const handleUpdateCellInterventions = (
    cellId: string,
    updates: Partial<CellData['interventions']>
  ) => {
    setCells((prev) =>
      prev.map((c) => {
        if (c.id === cellId) {
          return {
            ...c,
            interventions: {
              ...c.interventions,
              ...updates,
            },
          };
        }
        return c;
      })
    );
  };

  // Load a preset scenario into simulator
  const handleLoadScenario = (scen: SimulationScenario) => {
    setDiseaseParams({ ...scen.diseaseParameters });
    setGlobalInterventions({ ...scen.globalInterventions });
    setAdjacencyMode(scen.adjacencyMode);
    setEnvModifierEnabled(scen.envModifierEnabled);
    setRandomSeed(scen.randomSeed);
    initializeWorld(scen.randomSeed, scen.initialInfectedRegionId, scen.initialInfectedCount || 400);
  };

  // Randomize Seed
  const handleRandomizeSeed = () => {
    const newSeed = Math.floor(Math.random() * 900000) + 10000;
    setRandomSeed(newSeed);
    initializeWorld(newSeed, selectedSeedCellId, initialInfectedCount);
  };

  const handleSelectMapSource = (source: 'real_countries' | 'real_earth_grid' | 'synthetic') => {
    setMapSource(source);
    initializeWorld(randomSeed, undefined, initialInfectedCount, source);
  };

  const handleLoadCustomWorld = (customCells: CellData[], customLinks: TransportLink[], _sourceName: string) => {
    setMapSource('custom_geojson');
    setCells(customCells);
    setTransitLinks(customLinks);
    setCurrentDay(0);
    setIsRunning(false);

    const seedCell = customCells.find((c) => c.isLand && c.state.totalPopulation > 0) || customCells[0];
    if (seedCell && seedCell.isLand) {
      const count = Math.min(seedCell.state.totalPopulation - 1, initialInfectedCount);
      seedCell.state.infected = count;
      seedCell.state.susceptible -= count;
      seedCell.state.newInfectionsToday = count;
      setSelectedSeedCellId(seedCell.id);
      setSelectedCellId(seedCell.id);
    }
  };

  const selectedCell = cells.find((c) => c.id === selectedCellId) || null;

  const currentScenarioObject: SimulationScenario = {
    id: `scen_custom_${Date.now()}`,
    name: 'Custom User Scenario',
    description: 'User-configured epidemiological simulation run',
    diseaseParameters: diseaseParams,
    globalInterventions: globalInterventions,
    randomSeed: randomSeed,
    adjacencyMode: adjacencyMode,
    envModifierEnabled: envModifierEnabled,
    initialInfectedRegionId: selectedSeedCellId,
    initialInfectedCount: initialInfectedCount,
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 3-Zone Header Contract */}
      <Header
        currentDay={currentDay}
        isRunning={isRunning}
        onTogglePlay={() => setIsRunning(!isRunning)}
        onReset={handleReset}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenExport={() => setIsExportOpen(true)}
        verificationPassed={testReport?.allPassed ?? null}
        currentMapSource={mapSource}
        onOpenMapModal={() => setIsMapModalOpen(true)}
        testingDateString={testingDateString}
        worldPopulation={history[0]?.totalPopulation || currentTestingPopulation}
      />

      {/* Main Workspace Stage */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Sidebar */}
        <ControlSidebar
          currentDay={currentDay}
          isRunning={isRunning}
          onTogglePlay={() => setIsRunning(!isRunning)}
          onStepForward={advanceStep}
          onReset={handleReset}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
          diseaseParams={diseaseParams}
          setDiseaseParams={setDiseaseParams}
          adjacencyMode={adjacencyMode}
          setAdjacencyMode={setAdjacencyMode}
          envModifierEnabled={envModifierEnabled}
          setEnvModifierEnabled={setEnvModifierEnabled}
          randomSeed={randomSeed}
          setRandomSeed={setRandomSeed}
          onRandomizeSeed={handleRandomizeSeed}
          cells={cells}
          selectedSeedCellId={selectedSeedCellId}
          setSelectedSeedCellId={setSelectedSeedCellId}
          initialInfectedCount={initialInfectedCount}
          setInitialInfectedCount={setInitialInfectedCount}
        />

        {/* Center Interactive Map Viewport */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative overflow-hidden">
          <MapCanvas
            cells={cells}
            transitLinks={transitLinks}
            selectedCellId={selectedCellId}
            onSelectCell={handleSelectCell}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onSeedOutbreakInCell={handleSeedOutbreakInCell}
            showTransitOverlay={showTransitOverlay}
            setShowTransitOverlay={setShowTransitOverlay}
          />
        </main>

        {/* Right Tabbed Panel: Regional Inspector vs Global Interventions */}
        <aside className="w-84 h-full bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 overflow-hidden">
          {/* Right Panel Sub-navigation Strip */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950 p-1 shrink-0 text-xs">
            <button
              onClick={() => setRightPanelTab('interventions')}
              className={`flex-1 py-1.5 px-2 rounded text-center transition-colors flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'interventions'
                  ? 'bg-slate-800 text-cyan-300 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Global Policies</span>
            </button>
            <button
              onClick={() => setRightPanelTab('inspector')}
              className={`flex-1 py-1.5 px-2 rounded text-center transition-colors flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'inspector'
                  ? 'bg-slate-800 text-cyan-300 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Region Inspector</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {rightPanelTab === 'inspector' ? (
              <SelectedCellInspector
                selectedCell={selectedCell}
                transitLinks={transitLinks}
                onUpdateCellInterventions={handleUpdateCellInterventions}
                onClose={() => setRightPanelTab('interventions')}
              />
            ) : (
              <InterventionPanel
                interventions={globalInterventions}
                setInterventions={setGlobalInterventions}
                currentDay={currentDay}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Bottom Telemetry & Epidemic Curves Tray */}
      <AnalyticsPanel
        history={history}
        selectedCell={selectedCell}
        currentDay={currentDay}
      />

      {/* Scenario Comparison Modal */}
      <ScenarioComparisonModal
        isOpen={activeView === 'comparison'}
        onClose={() => setActiveView('simulation')}
        onLoadScenarioToSimulator={handleLoadScenario}
      />

      {/* Automated Validation Test Suite Modal */}
      <ValidationModal
        isOpen={activeView === 'verification'}
        onClose={() => setActiveView('simulation')}
        report={testReport}
        onRunTests={() => {
          const rep = runAutomatedValidationTests();
          setTestReport(rep);
        }}
      />

      {/* Mathematical & Architectural Documentation Modal */}
      <DocumentationModal
        isOpen={activeView === 'documentation'}
        onClose={() => setActiveView('simulation')}
      />

      {/* Data Export / Import Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        history={history}
        cells={cells}
        currentDay={currentDay}
        currentScenario={currentScenarioObject}
        onLoadImportedScenario={handleLoadScenario}
      />

      {/* Real-World Earth Map & GeoJSON Importer Modal */}
      <RealWorldMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        currentMapSource={mapSource}
        onSelectMapSource={handleSelectMapSource}
        onLoadCustomWorld={handleLoadCustomWorld}
        testingDateString={testingDateString}
        worldPopulation={currentTestingPopulation}
      />
    </div>
  );
}
