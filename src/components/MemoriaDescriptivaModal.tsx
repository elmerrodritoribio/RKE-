import React, { useState, useEffect } from 'react';
import { Project, Vertex, TechnicalSideRow, GeometryStats, CoordinateSystem } from '../types';
import { COORDINATE_SYSTEMS } from '../services/geospatial';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Download,
  X,
  RotateCcw,
  Bot,
  AlertCircle,
} from 'lucide-react';

interface MemoriaDescriptivaModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  vertices: Vertex[];
  technicalTable: TechnicalSideRow[];
  stats: GeometryStats | null;
  system: CoordinateSystem;
}

export const MemoriaDescriptivaModal: React.FC<MemoriaDescriptivaModalProps> = ({
  isOpen,
  onClose,
  project,
  vertices,
  technicalTable,
  stats,
  system,
}) => {
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const sysInfo = COORDINATE_SYSTEMS[system];

  // Generate standard technical text based on Peruvian cadastral regulations
  const generateBaseMemoria = (): string => {
    const areaFormatted = stats?.areaM2.toLocaleString('es-PE', { minimumFractionDigits: 2 }) || '0.00';
    const areaHaFormatted = stats?.areaHa.toFixed(4) || '0.0000';
    const perimeterFormatted = stats?.perimeterM.toLocaleString('es-PE', { minimumFractionDigits: 2 }) || '0.00';

    return `MEMORIA DESCRIPTIVA
(SANEAMIENTO FÍSICO LEGAL Y TRÁMITE REGISTRAL)

========================================================================
1. DATOS GENERALES DEL PROYECTO
========================================================================
• Código Único de Expediente: ${project.code || 'EXP-2025-001'}
• Nombre del Proyecto: ${project.name || 'Saneamiento Predial'}
• Denominación del Predio: ${project.propertyName || 'Predio Sin Denominación'}
• Tipo de Predio: ${project.propertyType || 'Rural'}
• Trámite Destinado: ${project.procedureType || 'Inmatriculación'}
• Entidad de Destino: ${project.destinationEntity || 'SUNARP - Registro de Predios'}

========================================================================
2. PROPIETARIO / SOLICITANTE
========================================================================
• Nombre o Razón Social: ${project.owner || 'Titular Registral'}
• Documento de Identidad (${project.docType || 'DNI'}): ${project.docNumber || '--------'}
• Condición Jurídica: Propietario / Posesionario

========================================================================
3. UBICACIÓN POLÍTICA Y GEOGRÁFICA
========================================================================
• Departamento: ${project.department || 'ICA'}
• Provincia: ${project.province || 'ICA'}
• Distrito: ${project.district || 'OCUCAJE'}
• Centro Poblado / Caserío: ${project.centerPopulated || 'No especificado'}
• Sector / Valle: ${project.sector || 'Valle Principal'}

========================================================================
4. SISTEMA DE REFERENCIA GEODÉSICO Y METODOLOGÍA
========================================================================
El levantamiento topográfico perimétrico se ejecutó utilizando equipos GNSS de precisión geodésica, enlazados a la Red Geodésica Geocéntrica Nacional (REGGEN) administrada por el Instituto Geográfico Nacional (IGN).
• Elipsoide de Referencia: WGS84 (World Geodetic System 1984)
• Datum Oficial: ${sysInfo.datum}
• Proyección Cartográfica: Universal Transversal de Mercator (UTM)
• Zona UTM: Zona ${sysInfo.utmZone || '18'} Sur (Hemisferio Sur)
• Código EPSG: ${sysInfo.epsg}

========================================================================
5. RESUMEN DE ÁREA Y PERÍMETRO
========================================================================
• Área Total del Polígono: ${areaFormatted} m²
• Equivalente en Hectáreas: ${areaHaFormatted} ha
• Perímetro Total: ${perimeterFormatted} ml (Metros lineales)
• Número de Vértices: ${vertices.length}

========================================================================
6. CUADRO DE DATOS TÉCNICOS
========================================================================
VÉRTICE   LADO       DISTANCIA (m)   AZIMUT         ESTE (X)        NORTE (Y)
------------------------------------------------------------------------
${technicalTable.map((r) => `${r.vertex.padEnd(9)} ${(r.vertex + '-' + r.nextVertex).padEnd(10)} ${r.distanceFormatted.padEnd(15)} ${r.azimuth.padEnd(14)} ${r.east.padEnd(15)} ${r.north}`).join('\n')}

========================================================================
7. DESCRIPCIÓN DE LINDEROS Y COLINDANCIAS
========================================================================
El predio se encuentra delimitado por una poligonal cerrada de ${vertices.length} lados, colindando de la siguiente manera:

${technicalTable.map((r) => `• Tramo ${r.vertex}-${r.nextVertex}: Línea recta de ${r.distanceFormatted} m con azimut ${r.azimuth}, colinda con ${r.colindancia || 'terrenos de terceros'}.`).join('\n\n')}

========================================================================
8. PROFESIONAL RESPONSABLE
========================================================================
• Profesional: ${project.professional || 'Ingeniero / Arquitecto'}
• Registro Colegiado: ${project.professionalReg || 'CIP / CAP N° ------'}
• Fecha de Levantamiento: ${project.surveyDate || new Date().toISOString().split('T')[0]}

========================================================================
9. DECLARACIÓN DE RESPONSABILIDAD
========================================================================
El suscrito profesional colegiado declara bajo juramento que los datos técnicos, coordenadas, rumbos, distancias y colindancias consignados en la presente Memoria Descriptiva corresponden fiel y exactamente al levantamiento topográfico y catastral realizado en campo.
`;
  };

  useEffect(() => {
    if (isOpen && !content) {
      setContent(generateBaseMemoria());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // AI Generation from backend /api/ai/memoria
  const handleAIGenerate = async () => {
    setIsGeneratingAI(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/memoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          technicalTable,
          stats,
          system,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error en servidor: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.memoria) {
        setContent(data.memoria);
      } else {
        throw new Error('No se recibió texto de la memoria descriptiva.');
      }
    } catch (err: any) {
      console.warn('AI Memoria error, using enriched standard template:', err);
      setAiError('No se pudo conectar al servicio de IA. Se ha generado la plantilla normativa SUNARP.');
      setContent(generateBaseMemoria());
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Memoria_Descriptiva_${(project.code || 'EXP').replace(/[\s/]/g, '_')}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-850 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Memoria Descriptiva Oficial (SUNARP)</h2>
              <p className="text-xs text-slate-400">
                Redacción técnica según Directiva 004-2020-SUNARP/SN y Ley 28294
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

        {/* Toolbar */}
        <div className="bg-slate-950 p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAIGenerate}
              disabled={isGeneratingAI}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-lg font-medium flex items-center gap-1.5 shadow transition"
              title="Redactar y enriquecer memoria con Asistente IA Catastral"
            >
              <Bot className="w-4 h-4" />
              <span>{isGeneratingAI ? 'Redactando con IA...' : 'Redactar con IA Catastral'}</span>
            </button>

            <button
              onClick={() => setContent(generateBaseMemoria())}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium flex items-center gap-1.5 transition"
              title="Restablecer a plantilla normativa base"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Plantilla Base</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium flex items-center gap-1.5 border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium flex items-center gap-1.5 transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar (.TXT)</span>
            </button>
          </div>
        </div>

        {aiError && (
          <div className="bg-amber-950/40 border-b border-amber-800/40 text-amber-300 text-xs px-4 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {/* Textarea Editor */}
        <div className="flex-1 p-4 bg-slate-950 overflow-hidden flex flex-col">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden resize-none leading-relaxed"
            placeholder="Generando memoria descriptiva..."
          />
        </div>

        {/* Footer info */}
        <div className="bg-slate-850 px-6 py-2.5 border-t border-slate-700 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            Predio: <strong className="text-white">{project.propertyName}</strong> &bull; {project.district}, {project.province}
          </span>
          <span className="text-slate-500">
            Requiere firma y sello del profesional colegiado ({project.professionalReg || 'CIP/CAP'})
          </span>
        </div>
      </div>
    </div>
  );
};
