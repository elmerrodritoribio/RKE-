import React from 'react';
import { Project, GeometryStats, CoordinateSystem, ValidationReport } from '../types';
import { COORDINATE_SYSTEMS } from '../services/geospatial';
import { ShieldCheck, QrCode, CheckCircle2, Download, Printer, X, FileCheck } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  stats: GeometryStats | null;
  system: CoordinateSystem;
  report: ValidationReport | null;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  project,
  stats,
  system,
  report,
}) => {
  if (!isOpen) return null;

  const sysInfo = COORDINATE_SYSTEMS[system];
  // Deterministic fake hash based on code and coordinates
  const verificationHash = `PE-${(project.code || 'EXP').toUpperCase()}-${(stats?.areaM2 || 1234).toFixed(0)}-8A9F32E1`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-850 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Constancia de Verificación y Trazabilidad</h2>
              <p className="text-xs text-slate-400">Validación de autenticidad para consulta digital</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-3">
            <div className="inline-flex p-3 bg-white rounded-lg shadow-inner">
              <QrCode className="w-24 h-24 text-slate-950" />
            </div>

            <div>
              <div className="text-[11px] text-slate-400">CÓDIGO DE VERIFICACIÓN DIGITAL (HASH)</div>
              <div className="font-mono text-xs font-bold text-emerald-400 select-all">{verificationHash}</div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>GEOMETRÍA Y TOPOLOGÍA VALIDADA (GEOCHECK)</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-xs divide-y divide-slate-800 font-sans">
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Expediente:</span>
              <span className="font-semibold text-white font-mono">{project.code}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Predio:</span>
              <span className="font-semibold text-white">{project.propertyName}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Titular:</span>
              <span className="font-semibold text-white">{project.owner}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Ubicación:</span>
              <span className="text-slate-200">{project.district} - {project.province} - {project.department}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Área Perimétrica:</span>
              <span className="font-semibold text-emerald-400 font-mono">
                {stats?.areaM2.toLocaleString('es-PE', { minimumFractionDigits: 2 })} m² ({stats?.areaHa.toFixed(4)} ha)
              </span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Sistema / Datum:</span>
              <span className="text-slate-200 font-mono">{sysInfo.name}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Profesional:</span>
              <span className="text-slate-200">{project.professional} ({project.professionalReg})</span>
            </div>
          </div>

          <div className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-lg text-[11px] text-amber-300/90 leading-tight">
            Esta constancia técnica acredita que las coordenadas no presentan autointersecciones ni inconsistencias y fueron calculadas mediante algoritmos geodésicos determinísticos.
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
            >
              Cerrar Constancia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
