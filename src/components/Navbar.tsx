import React from 'react';
import { Project, CoordinateSystem, ValidationReport } from '../types';
import { COORDINATE_SYSTEMS } from '../services/geospatial';
import {
  Compass,
  FileText,
  Archive,
  Bot,
  History,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Briefcase,
  Layers,
  ChevronDown,
  Sliders,
} from 'lucide-react';

interface NavbarProps {
  project: Project;
  system: CoordinateSystem;
  report: ValidationReport | null;
  onOpenProjectModal: () => void;
  onOpenTechnicalPlanModal: () => void;
  onOpenMemoriaModal: () => void;
  onOpenZipModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenVerificationModal: () => void;
  onOpenAssistantModal: () => void;
  onOpenFichaEditor?: () => void;
  fichaCode?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  system,
  report,
  onOpenProjectModal,
  onOpenTechnicalPlanModal,
  onOpenMemoriaModal,
  onOpenZipModal,
  onOpenHistoryModal,
  onOpenVerificationModal,
  onOpenAssistantModal,
  onOpenFichaEditor,
  fichaCode,
}) => {
  const sysInfo = COORDINATE_SYSTEMS[system];

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 text-xs select-none sticky top-0 z-40 shadow-md">
      {/* Brand & Active Project */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black shadow-md shadow-emerald-950">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-white tracking-wider flex items-center gap-1.5 text-sm">
              <span>GEOSANEAMIENTO</span>
              <span className="text-emerald-400">PERÚ</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium leading-none">
              Gestión Predial & Catastro
            </div>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="hidden lg:block h-6 w-px bg-slate-800" />

        {/* Project Selector / Info Pill */}
        <button
          onClick={onOpenProjectModal}
          className="hidden sm:flex items-center gap-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-left transition group"
          title="Editar datos del proyecto y expediente"
        >
          <div className="p-1 bg-emerald-500/10 text-emerald-400 rounded">
            <Briefcase className="w-3.5 h-3.5" />
          </div>
          <div className="max-w-[180px] truncate">
            <div className="font-semibold text-white group-hover:text-emerald-300 truncate text-[11px]">
              {project.name || 'Proyecto Sin Nombre'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {project.code} &bull; {project.propertyName || 'Predio'}
            </div>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </button>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden md:flex items-center gap-2 font-mono text-[11px]">
        {/* System Pill */}
        <div className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>{sysInfo.datum} {sysInfo.utmZone ? `18S` : ''}</span>
          <span className="text-slate-500 font-sans text-[10px]">(EPSG:{sysInfo.epsg})</span>
        </div>

        {/* GeoCheck Status Pill */}
        {report && (
          <div
            className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 font-sans font-semibold text-[11px] ${
              report.status === 'VALID'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400'
                : report.status === 'WARNING'
                ? 'bg-amber-950/50 border-amber-500/40 text-amber-400'
                : 'bg-red-950/50 border-red-500/40 text-red-400'
            }`}
          >
            {report.status === 'VALID' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {report.status === 'WARNING' && <AlertTriangle className="w-3.5 h-3.5" />}
            {report.status === 'ERROR' && <XCircle className="w-3.5 h-3.5" />}
            <span>GeoCheck: {report.status === 'VALID' ? 'Conforme' : report.status === 'WARNING' ? 'Revisar' : 'Error'}</span>
          </div>
        )}
      </div>

      {/* Main Action Buttons */}
      <div className="flex items-center gap-1.5">
        {onOpenFichaEditor && (
          <button
            onClick={onOpenFichaEditor}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
            title="Abrir Editor de Ficha y Configuración del Aplicativo"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Editor de Ficha</span>
            {fichaCode && (
              <span className="hidden md:inline font-mono text-[9px] px-1 bg-slate-900 text-amber-300 rounded border border-slate-750">
                {fichaCode}
              </span>
            )}
          </button>
        )}

        <button
          onClick={onOpenTechnicalPlanModal}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
          title="Generar y previsualizar plano perimétrico y de ubicación"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Plano Técnico</span>
        </button>

        <button
          onClick={onOpenMemoriaModal}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
          title="Redactar y exportar memoria descriptiva según SUNARP"
        >
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline">Memoria Descriptiva</span>
        </button>

        <button
          onClick={onOpenZipModal}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition"
          title="Descargar paquete completo del expediente técnico (PDF, DXF, GeoJSON, CSV, Memoria)"
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Expediente ZIP</span>
        </button>

        <button
          onClick={onOpenHistoryModal}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
          title="Historial de versiones y auditoría"
        >
          <History className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenVerificationModal}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
          title="Constancia de verificación QR y trazabilidad"
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
        </button>

        <button
          onClick={onOpenAssistantModal}
          className="px-3 py-1.5 bg-purple-600/90 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-950 transition"
          title="Abrir Asistente Catastral y Legal IA (Gemini Pro)"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Asistente IA</span>
        </button>
      </div>
    </header>
  );
};
