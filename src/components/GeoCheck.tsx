import React from 'react';
import { ValidationReport } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Compass,
} from 'lucide-react';

interface GeoCheckProps {
  report: ValidationReport | null;
  onReverseOrientation?: () => void;
  onOpenAssistant?: (prompt: string) => void;
}

export const GeoCheck: React.FC<GeoCheckProps> = ({
  report,
  onReverseOrientation,
  onOpenAssistant,
}) => {
  if (!report) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-500 text-xs">
        Ingrese coordenadas para ejecutar la validación topológica y normativa GeoCheck.
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (report.status) {
      case 'VALID':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>🟢 VÁLIDO - APTO PARA TRAMITACIÓN</span>
          </div>
        );
      case 'WARNING':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>🟡 REQUIERE REVISIÓN TÉCNICA</span>
          </div>
        );
      case 'ERROR':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-xs font-semibold">
            <XCircle className="w-4 h-4" />
            <span>🔴 ERROR TOPOLÓGICO DETECTADO</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-4 bg-slate-850 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">GeoCheck: Diagnóstico Topológico y Registral</h3>
            <p className="text-xs text-slate-400">
              Validación geométrica matemática según directivas SUNARP y SNCP
            </p>
          </div>
        </div>

        {getStatusBadge()}
      </div>

      {/* Main Diagnostic Checklist */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 1. Closed Polygon */}
          <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
            report.isClosed ? 'bg-slate-950/60 border-slate-800' : 'bg-red-950/20 border-red-900/50'
          }`}>
            {report.isClosed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="text-slate-200 block">Polígono Cerrado y Vértices Mínimos</strong>
              <span className="text-slate-400">
                {report.isClosed
                  ? 'Cumple con el mínimo de 3 vértices independientes para formar un recinto cerrado.'
                  : 'Requiere al menos 3 vértices no colineales para conformar un polígono predial.'}
              </span>
            </div>
          </div>

          {/* 2. Self Intersection */}
          <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
            !report.hasSelfIntersection ? 'bg-slate-950/60 border-slate-800' : 'bg-red-950/30 border-red-700/60'
          }`}>
            {!report.hasSelfIntersection ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="text-slate-200 block">Ausencia de Autointersecciones</strong>
              <span className="text-slate-400">
                {!report.hasSelfIntersection
                  ? 'Linderos simples sin cruces de aristas ni lazos en ocho.'
                  : 'Se detectó cruce de linderos. Causa común: orden alterado de vértices en el levantamiento.'}
              </span>
              {report.hasSelfIntersection && onOpenAssistant && (
                <button
                  onClick={() => onOpenAssistant('¿Cómo resuelvo la autointersección de linderos en mi predio?')}
                  className="mt-1 text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Consultar solución con el Asistente</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Duplicate Vertices */}
          <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
            !report.hasDuplicateVertices ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-950/30 border-amber-700/50'
          }`}>
            {!report.hasDuplicateVertices ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="text-slate-200 block">Vértices Redundantes / Duplicados</strong>
              <span className="text-slate-400">
                {!report.hasDuplicateVertices
                  ? 'No existen vértices consecutivos a menos de 1 centímetro de distancia.'
                  : 'Se encontraron puntos duplicados o con separación insignificante (< 1 cm).'}
              </span>
            </div>
          </div>

          {/* 4. Territorial Bounds */}
          <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
            report.isWithinPeruBounds ? 'bg-slate-950/60 border-slate-800' : 'bg-red-950/30 border-red-700/60'
          }`}>
            {report.isWithinPeruBounds ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="text-slate-200 block">Coordenadas en Territorio Peruano</strong>
              <span className="text-slate-400">
                {report.isWithinPeruBounds
                  ? 'Las coordenadas corresponden al rango geográfico del Perú (Lat 0° a -18.5°).'
                  : 'Coordenadas fuera del territorio nacional o ejes invertidos (X por Y).'}
              </span>
            </div>
          </div>
        </div>

        {/* Orientation & UTM Zone Section */}
        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-300 font-semibold">Sentido de Orientación: </span>
              <span className="text-emerald-400 font-bold">
                {report.orientation === 'CLOCKWISE' ? 'HORARIO (Recomendado SUNARP)' : 'ANTIHORARIO'}
              </span>
              <p className="text-[11px] text-slate-400">
                La directiva SUNARP recomienda listar los vértices en sentido de las agujas del reloj.
              </p>
            </div>
          </div>

          {report.orientation === 'COUNTER_CLOCKWISE' && onReverseOrientation && (
            <button
              onClick={onReverseOrientation}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
              title="Invertir orden de vértices a sentido horario"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Invertir a Sentido Horario</span>
            </button>
          )}
        </div>

        {/* Detailed Issues List if any */}
        {report.issues.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Detalle de Hallazgos ({report.issues.length}):
            </h4>
            {report.issues.map((issue) => (
              <div
                key={issue.id}
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  issue.type === 'ERROR'
                    ? 'bg-red-950/20 border-red-800/40 text-red-200'
                    : issue.type === 'WARNING'
                    ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                    : 'bg-blue-950/20 border-blue-800/40 text-blue-200'
                }`}
              >
                {issue.type === 'ERROR' ? (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-0.5">
                  <div className="font-semibold text-white">{issue.title}</div>
                  <p className="text-slate-300 leading-relaxed">{issue.description}</p>
                  {issue.recommendation && (
                    <div className="text-[11px] font-medium text-emerald-400 pt-1">
                      💡 Recomendación: {issue.recommendation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
