import React, { useState } from 'react';
import { VersionSnapshot, Vertex, CoordinateSystem } from '../types';
import { History, RotateCcw, Plus, Trash2, Calendar, FileText, X, Check } from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: VersionSnapshot[];
  currentVertices: Vertex[];
  currentSystem: CoordinateSystem;
  onRestoreVersion: (snapshot: VersionSnapshot) => void;
  onCreateSnapshot: (note: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  versions,
  currentVertices,
  currentSystem,
  onRestoreVersion,
  onCreateSnapshot,
}) => {
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    onCreateSnapshot(note.trim());
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-850 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Historial y Trazabilidad de Versiones</h2>
              <p className="text-xs text-slate-400">
                Control de cambios geométricos para auditorías catastrales
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Snapshot Form */}
        <form onSubmit={handleCreate} className="p-4 bg-slate-950/80 border-b border-slate-800 flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota del cambio (ej. Ajuste de lindero Este, replanteo de hito V3...)"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={!note.trim()}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Guardar Versión</span>
          </button>
        </form>

        {/* Versions List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-950/50">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No hay versiones históricas registradas. Cada modificación relevante crea un punto de restauración.
            </div>
          ) : (
            versions.map((v) => (
              <div
                key={v.id}
                className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-mono font-bold text-[11px]">
                      VERSIÓN {v.versionNumber}
                    </span>
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(v.timestamp).toLocaleString('es-PE')}
                    </span>
                  </div>

                  <p className="text-white font-medium">{v.note}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>Vértices: {v.vertices.length}</span>
                    <span>Área: {v.areaM2.toLocaleString('es-PE', { minimumFractionDigits: 2 })} m²</span>
                    <span>Perímetro: {v.perimeterM.toLocaleString('es-PE', { minimumFractionDigits: 2 })} ml</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm(`¿Desea restaurar a la Versión ${v.versionNumber}?`)) {
                      onRestoreVersion(v);
                      onClose();
                    }
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition shrink-0"
                  title="Restaurar polígono a esta versión"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
