import React, { useState, useMemo, useEffect } from 'react';
import {
  Project,
  Vertex,
  CoordinateSystem,
  VersionSnapshot,
  FichaConfig,
  DEFAULT_FICHA_CONFIG,
} from './types';
import {
  calculatePolygonStats,
  calculateTechnicalTable,
  validateGeometry,
} from './services/geospatial';
import { SAMPLE_PARCELS } from './services/parser';

// Components
import { LegalBanner } from './components/LegalBanner';
import { Navbar } from './components/Navbar';
import { MapViewer } from './components/MapViewer';
import { CoordinateTable } from './components/CoordinateTable';
import { GeoCheck } from './components/GeoCheck';
import { TechnicalTablePanel } from './components/TechnicalTablePanel';
import { FichaEditorTab } from './components/FichaEditorTab';
import { ProjectModal } from './components/ProjectModal';
import { TechnicalPlanModal } from './components/TechnicalPlanModal';
import { MemoriaDescriptivaModal } from './components/MemoriaDescriptivaModal';
import { ExpedienteZipModal } from './components/ExpedienteZipModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { VerificationModal } from './components/VerificationModal';
import { GeoAIAssistantModal } from './components/GeoAIAssistantModal';

import {
  Table as TableIcon,
  ShieldCheck,
  FileSpreadsheet,
  Sliders,
  Layers,
  MapPin,
  Sparkles,
  Maximize2,
  FolderOpen,
} from 'lucide-react';

const INITIAL_PROJECT: Project = {
  id: 'proj-001',
  code: 'EXP-2025-ICA-0089',
  name: 'Saneamiento Físico Legal Fundo El Olivar',
  propertyName: 'Fundo "El Olivar de Ocucaje"',
  owner: 'AGRÍCOLA DON MATEO S.A.C.',
  docType: 'RUC',
  docNumber: '20601234567',
  department: 'ICA',
  province: 'ICA',
  district: 'OCUCAJE',
  sector: 'Valle de Ocucaje - Sector Los Médanos',
  centerPopulated: 'Ocucaje',
  propertyType: 'Agrícola',
  procedureType: 'Inmatriculación',
  destinationEntity: 'SUNARP (Registro de Predios)',
  professional: 'Ing. Carlos Mendoza Quispe',
  professionalReg: 'CIP N° 189423',
  surveyDate: new Date().toISOString().split('T')[0],
  observations: 'Levantamiento ejecutado con GNSS Diferencial Geodésico de doble frecuencia enlazado a la estación de rastreo permanente ICA1 del IGN.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  currentVersion: 1,
};

export default function App() {
  // Core Domain State
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [system, setSystem] = useState<CoordinateSystem>('UTM_WGS84_18S');
  const [vertices, setVertices] = useState<Vertex[]>(SAMPLE_PARCELS[0].vertices);

  // Versions History State
  const [versions, setVersions] = useState<VersionSnapshot[]>([
    {
      id: 'v-snap-initial',
      versionNumber: 1,
      timestamp: new Date().toISOString(),
      vertices: [...SAMPLE_PARCELS[0].vertices],
      areaM2: 182450.75,
      perimeterM: 1740.32,
      note: 'Versión inicial: Levantamiento de campo con GNSS diferencial',
    },
  ]);

  // Ficha Catastral & App Configurations State
  const [fichaConfig, setFichaConfig] = useState<FichaConfig>(() => {
    try {
      const saved = localStorage.getItem('geosaneamiento_ficha_config');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_FICHA_CONFIG;
  });

  // UI Tabs & Modals State
  const [activeTab, setActiveTab] = useState<'coordinates' | 'geocheck' | 'technical-table' | 'ficha-editor'>('coordinates');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTechnicalPlanModalOpen, setIsTechnicalPlanModalOpen] = useState(false);
  const [isMemoriaModalOpen, setIsMemoriaModalOpen] = useState(false);
  const [isZipModalOpen, setIsZipModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState<string | undefined>(undefined);

  // Deterministic GIS Calculations
  const stats = useMemo(() => {
    return calculatePolygonStats(vertices, system);
  }, [vertices, system]);

  const technicalTable = useMemo(() => {
    return calculateTechnicalTable(vertices, system);
  }, [vertices, system]);

  const validationReport = useMemo(() => {
    return validateGeometry(vertices, system);
  }, [vertices, system]);

  // Handle vertex change and create auto-snapshot if significant
  const handleVerticesChange = (newVertices: Vertex[], note?: string) => {
    setVertices(newVertices);
    if (note && newVertices.length >= 3) {
      const newStats = calculatePolygonStats(newVertices, system);
      const newSnap: VersionSnapshot = {
        id: `snap-${Date.now()}`,
        versionNumber: versions.length + 1,
        timestamp: new Date().toISOString(),
        vertices: [...newVertices],
        areaM2: newStats?.areaM2 || 0,
        perimeterM: newStats?.perimeterM || 0,
        note,
      };
      setVersions((prev) => [newSnap, ...prev]);
      setProject((prev) => ({ ...prev, currentVersion: newSnap.versionNumber, updatedAt: new Date().toISOString() }));
    }
  };

  // Update vertex position from drag on the map
  const handleUpdateVertexPosition = (index: number, newX: number, newY: number) => {
    const updated = [...vertices];
    updated[index] = { ...updated[index], x: newX, y: newY };
    setVertices(updated);
  };

  // Reverse orientation (Horario <-> Antihorario)
  const handleReverseOrientation = () => {
    if (vertices.length < 2) return;
    const reversed = [...vertices].reverse().map((v, i) => ({
      ...v,
      vertexNumber: `V${i + 1}`,
    }));
    handleVerticesChange(reversed, 'Orientación invertida a Sentido Horario (Recomendado SUNARP)');
  };

  // Open Assistant with specific prompt
  const handleOpenAssistantWithPrompt = (prompt: string) => {
    setAssistantPrompt(prompt);
    setIsAssistantModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Obligatory Legal & Normative Banner */}
      <LegalBanner />

      {/* Top Application Header */}
      <Navbar
        project={project}
        system={system}
        report={validationReport}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onOpenTechnicalPlanModal={() => setIsTechnicalPlanModalOpen(true)}
        onOpenMemoriaModal={() => setIsMemoriaModalOpen(true)}
        onOpenZipModal={() => setIsZipModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
        onOpenAssistantModal={() => {
          setAssistantPrompt(undefined);
          setIsAssistantModalOpen(true);
        }}
        onOpenFichaEditor={() => setActiveTab('ficha-editor')}
        fichaCode={fichaConfig.sheetCode}
      />

      {/* Main Workspace: Split View (Map Left/Center + Panel Right) */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        {/* Map View Canvas (Flexible full-height) */}
        <section
          aria-label="Visor Cartográfico Interactivo"
          className="flex-1 h-[45vh] lg:h-full relative min-h-0 border-b lg:border-b-0 lg:border-r border-slate-800"
        >
          <MapViewer
            vertices={vertices}
            system={system}
            onUpdateVertexPosition={handleUpdateVertexPosition}
            areaM2={stats?.areaM2 || 0}
            perimeterM={stats?.perimeterM || 0}
            polygonColor={fichaConfig.colorPoligono}
            polygonWeight={fichaConfig.grosorLinea}
            showVertexLabels={fichaConfig.mostrarEtiquetasVertices}
          />
        </section>

        {/* Right Tabbed Management Panel */}
        <section
          aria-label="Panel de Gestión y Diagnóstico Catastral"
          className="w-full lg:w-[560px] xl:w-[640px] h-[55vh] lg:h-full flex flex-col bg-slate-900 overflow-hidden shadow-2xl shrink-0"
        >
          {/* Panel Tab Switcher */}
          <div className="flex bg-slate-950 px-2 border-b border-slate-800 text-xs shrink-0 select-none overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('coordinates')}
              className={`px-3 py-2.5 font-medium border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'coordinates'
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Coordenadas</span>
            </button>

            <button
              onClick={() => setActiveTab('geocheck')}
              className={`px-3 py-2.5 font-medium border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'geocheck'
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>GeoCheck</span>
              {validationReport && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    validationReport.status === 'VALID'
                      ? 'bg-emerald-400'
                      : validationReport.status === 'WARNING'
                      ? 'bg-amber-400'
                      : 'bg-red-400 animate-ping'
                  }`}
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('technical-table')}
              className={`px-3 py-2.5 font-medium border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'technical-table'
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Cuadro Técnico</span>
            </button>

            <button
              onClick={() => setActiveTab('ficha-editor')}
              className={`px-3 py-2.5 font-medium border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'ficha-editor'
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Editor de Ficha</span>
              <span className="font-mono text-[10px] px-1 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700">
                {fichaConfig.sheetCode}
              </span>
            </button>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 overflow-hidden p-3 min-h-0">
            {activeTab === 'coordinates' && (
              <CoordinateTable
                vertices={vertices}
                onChangeVertices={handleVerticesChange}
                system={system}
                onChangeSystem={setSystem}
              />
            )}

            {activeTab === 'geocheck' && (
              <div className="h-full overflow-y-auto pr-1">
                <GeoCheck
                  report={validationReport}
                  onReverseOrientation={handleReverseOrientation}
                  onOpenAssistant={handleOpenAssistantWithPrompt}
                />
              </div>
            )}

            {activeTab === 'technical-table' && (
              <div className="h-full overflow-y-auto pr-1">
                <TechnicalTablePanel
                  technicalTable={technicalTable}
                  stats={stats}
                  system={system}
                  propertyName={project.propertyName}
                  fichaConfig={fichaConfig}
                />
              </div>
            )}

            {activeTab === 'ficha-editor' && (
              <div className="h-full overflow-hidden">
                <FichaEditorTab
                  fichaConfig={fichaConfig}
                  onUpdateFichaConfig={setFichaConfig}
                  project={project}
                  vertices={vertices}
                  technicalTable={technicalTable}
                  stats={stats}
                  system={system}
                />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* MODALS */}
      {/* 1. Project Details Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        project={project}
        onSave={setProject}
      />

      {/* 2. Technical Plan Generator & Previewer Modal */}
      <TechnicalPlanModal
        isOpen={isTechnicalPlanModalOpen}
        onClose={() => setIsTechnicalPlanModalOpen(false)}
        project={project}
        vertices={vertices}
        technicalTable={technicalTable}
        stats={stats}
        system={system}
        fichaConfig={fichaConfig}
      />

      {/* 3. Memoria Descriptiva Modal */}
      <MemoriaDescriptivaModal
        isOpen={isMemoriaModalOpen}
        onClose={() => setIsMemoriaModalOpen(false)}
        project={project}
        vertices={vertices}
        technicalTable={technicalTable}
        stats={stats}
        system={system}
      />

      {/* 4. Complete Expediente ZIP Modal */}
      <ExpedienteZipModal
        isOpen={isZipModalOpen}
        onClose={() => setIsZipModalOpen(false)}
        project={project}
        vertices={vertices}
        technicalTable={technicalTable}
        stats={stats}
        system={system}
      />

      {/* 5. Version History & Audit Modal */}
      <VersionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        versions={versions}
        currentVertices={vertices}
        currentSystem={system}
        onRestoreVersion={(snap) => {
          setVertices([...snap.vertices]);
          setProject((prev) => ({ ...prev, currentVersion: snap.versionNumber }));
        }}
        onCreateSnapshot={(userNote) => {
          const newSnap: VersionSnapshot = {
            id: `snap-${Date.now()}`,
            versionNumber: versions.length + 1,
            timestamp: new Date().toISOString(),
            vertices: [...vertices],
            areaM2: stats?.areaM2 || 0,
            perimeterM: stats?.perimeterM || 0,
            note: userNote,
          };
          setVersions((prev) => [newSnap, ...prev]);
          setProject((prev) => ({ ...prev, currentVersion: newSnap.versionNumber }));
        }}
      />

      {/* 6. Digital Verification & QR Certificate Modal */}
      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        project={project}
        stats={stats}
        system={system}
        report={validationReport}
      />

      {/* 7. Geospatial AI Assistant Modal */}
      <GeoAIAssistantModal
        isOpen={isAssistantModalOpen}
        onClose={() => setIsAssistantModalOpen(false)}
        project={project}
        system={system}
        initialPrompt={assistantPrompt}
      />
    </div>
  );
}
