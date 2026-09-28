import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldCheck, X } from 'lucide-react';

export const LegalBanner: React.FC = () => {
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside
      aria-label="Aviso Técnico y Legal de Responsabilidad Profesional"
      className="bg-amber-950/40 border-b border-amber-600/30 text-amber-200 text-xs px-4 py-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 transition-all shadow-inner"
    >
      <div className="flex items-center gap-2 flex-1">
        <div className="p-1 bg-amber-500/20 text-amber-400 rounded-md shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-amber-300 mr-1">AVISO TÉCNICO Y LEGAL:</span>
          {!minimized ? (
            <span className="text-amber-100/90 leading-tight">
              “LOS RESULTADOS GENERADOS POR LA PLATAFORMA SON HERRAMIENTAS DE APOYO TÉCNICO Y DEBEN SER REVISADOS Y VALIDADOS POR UN PROFESIONAL RESPONSABLE (INGENIERO O ARQUITECTO COLEGIADO) SEGÚN LOS REQUISITOS Y NORMATIVA APLICABLE (SUNARP / SNCP / COFOPRI).”
            </span>
          ) : (
            <span className="text-amber-200/80">Herramienta de apoyo técnico sujeta a validación profesional colegiada.</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
          <ShieldCheck className="w-3 h-3" />
          <span>Cálculo Determinístico Gauss / Proj4</span>
        </div>
        <button
          onClick={() => setMinimized(!minimized)}
          className="text-amber-300/80 hover:text-amber-100 p-1 hover:bg-amber-900/40 rounded transition"
          title={minimized ? 'Expandir aviso completo' : 'Minimizar aviso'}
        >
          {minimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-300/80 hover:text-amber-100 p-1 hover:bg-amber-900/40 rounded transition"
          title="Ocultar aviso durante la sesión"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
