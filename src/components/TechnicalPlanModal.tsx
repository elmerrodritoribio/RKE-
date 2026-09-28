import React, { useState } from 'react';
import { Project, Vertex, TechnicalSideRow, GeometryStats, CoordinateSystem, FichaConfig } from '../types';
import { generateTechnicalPlanPDF, PlanOptions } from '../services/pdfPlanGenerator';
import { downloadDXFFile } from '../services/dxfExporter';
import { COORDINATE_SYSTEMS } from '../services/geospatial';
import {
  FileText,
  Download,
  Printer,
  X,
  Compass,
  Layers,
  Sparkles,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';

interface TechnicalPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  vertices: Vertex[];
  technicalTable: TechnicalSideRow[];
  stats: GeometryStats | null;
  system: CoordinateSystem;
  fichaConfig?: FichaConfig;
}

export const TechnicalPlanModal: React.FC<TechnicalPlanModalProps> = ({
  isOpen,
  onClose,
  project,
  vertices,
  technicalTable,
  stats,
  system,
  fichaConfig,
}) => {
  const [planType, setPlanType] = useState<'PLANO PERIMÉTRICO' | 'PLANO DE UBICACIÓN' | 'PLANO CATASTRAL RURAL'>('PLANO PERIMÉTRICO');
  const [sheetCode, setSheetCode] = useState(fichaConfig?.sheetCode || 'PP-01');
  const [paperSize, setPaperSize] = useState<'A4' | 'A3'>(fichaConfig?.formatoLamina === 'A3' ? 'A3' : 'A4');
  const [scaleText, setScaleText] = useState(
    fichaConfig?.escalaPredeterminada && fichaConfig.escalaPredeterminada !== 'AUTO'
      ? fichaConfig.escalaPredeterminada
      : '1:1,000'
  );
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const sysInfo = COORDINATE_SYSTEMS[system];

  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      const options: PlanOptions = {
        planType,
        sheetCode,
        paperSize,
        orientation: 'landscape',
        scaleText,
      };

      const doc = generateTechnicalPlanPDF(project, vertices, technicalTable, stats, system, options);
      const filename = `${sheetCode}_${planType.replace(/\s+/g, '_')}_${(project.code || 'PREDIO').replace(/[\s/]/g, '_')}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al generar el plano PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadDXF = () => {
    downloadDXFFile(vertices, technicalTable, system, {
      propertyName: project.propertyName,
      code: project.code,
      owner: project.owner,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-850 px-6 py-3.5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Generador de Planos Técnicos Catastrales</h2>
              <p className="text-xs text-slate-400">
                Formato estándar para presentación ante SUNARP, COFOPRI y Gobiernos Regionales
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

        {/* Configuration Bar */}
        <div className="bg-slate-950/80 p-3.5 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">Tipo de Plano</label>
            <select
              value={planType}
              onChange={(e) => {
                const val = e.target.value as any;
                setPlanType(val);
                setSheetCode(val === 'PLANO PERIMÉTRICO' ? 'PP-01' : val === 'PLANO DE UBICACIÓN' ? 'PU-01' : 'PCR-01');
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 focus:outline-hidden text-xs"
            >
              <option value="PLANO PERIMÉTRICO">Plano Perimétrico (PP-01)</option>
              <option value="PLANO DE UBICACIÓN">Plano de Ubicación (PU-01)</option>
              <option value="PLANO CATASTRAL RURAL">Plano Catastral Rural (PCR-01)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">Código Lámina</label>
            <input
              type="text"
              value={sheetCode}
              onChange={(e) => setSheetCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-hidden text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">Formato Lámina</label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 focus:outline-hidden text-xs"
            >
              <option value="A4">A4 Horizontal (297 x 210 mm)</option>
              <option value="A3">A3 Horizontal (420 x 297 mm)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">Escala Indicada</label>
            <select
              value={scaleText}
              onChange={(e) => setScaleText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 focus:outline-hidden text-xs"
            >
              <option value="1:500">1:500</option>
              <option value="1:1,000">1:1,000</option>
              <option value="1:2,500">1:2,500</option>
              <option value="1:5,000">1:5,000</option>
              <option value="INDICADA">INDICADA</option>
            </select>
          </div>
        </div>

        {/* Interactive Vector Sheet Preview */}
        <div className="flex-1 bg-slate-950 p-6 overflow-y-auto flex items-center justify-center">
          <div className="bg-white text-slate-900 rounded-sm shadow-2xl p-4 border border-slate-300 max-w-3xl w-full aspect-[1.414/1] relative flex flex-col justify-between text-[10px]">
            {/* Sheet Outer Border */}
            <div className="absolute inset-2 border-2 border-slate-900 pointer-events-none" />
            <div className="absolute inset-3 border border-slate-400 pointer-events-none" />

            {/* Sheet Header Area */}
            <div className="relative z-10 flex items-start justify-between border-b pb-2 border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{planType}</h3>
                <p className="text-slate-500 text-[9px]">
                  PREDIO: {project.propertyName || 'S/N'} &bull; SISTEMA: {sysInfo.datum} {sysInfo.utmZone ? `UTM ${sysInfo.utmZone}S` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* North Arrow Graphic */}
                <div className="flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[18px] border-b-slate-900" />
                  <span className="font-bold text-[8px]">N</span>
                </div>
              </div>
            </div>

            {/* Main Area: Left (Drawing Canvas Preview) + Right (Technical Table) */}
            <div className="relative z-10 flex-1 grid grid-cols-3 gap-3 my-2 min-h-0">
              {/* Map Canvas Window */}
              <div className="col-span-2 border border-slate-300 bg-slate-50 rounded-xs p-2 relative flex flex-col justify-between">
                <div className="text-[8px] text-slate-400 font-mono">
                  Cuadrícula UTM WGS84 - Zona {sysInfo.utmZone || '18'} Sur
                </div>

                {/* Simulated Polygon plot */}
                <div className="flex-1 flex items-center justify-center p-4">
                  <svg className="w-full h-full max-h-48" viewBox="0 0 200 120">
                    <polygon
                      points="40,30 150,20 180,80 120,110 50,90"
                      fill="rgba(16, 185, 129, 0.15)"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                    <circle cx="40" cy="30" r="3" fill="#ef4444" />
                    <text x="32" y="24" fontSize="8" fontWeight="bold">V1</text>
                    <circle cx="150" cy="20" r="3" fill="#ef4444" />
                    <text x="154" y="18" fontSize="8" fontWeight="bold">V2</text>
                    <circle cx="180" cy="80" r="3" fill="#ef4444" />
                    <text x="184" y="82" fontSize="8" fontWeight="bold">V3</text>
                    <circle cx="120" cy="110" r="3" fill="#ef4444" />
                    <text x="122" y="118" fontSize="8" fontWeight="bold">V4</text>
                    <circle cx="50" cy="90" r="3" fill="#ef4444" />
                    <text x="40" y="98" fontSize="8" fontWeight="bold">V5</text>
                  </svg>
                </div>

                {/* Graphic Scale */}
                <div className="flex items-center gap-2 text-[8px] text-slate-600 border-t border-slate-200 pt-1">
                  <div className="flex h-1.5 w-16 border border-slate-600">
                    <div className="w-1/2 bg-slate-900" />
                    <div className="w-1/2 bg-white" />
                  </div>
                  <span>Escala {scaleText}</span>
                </div>
              </div>

              {/* Right Technical Table & Membrete */}
              <div className="flex flex-col justify-between border-l border-slate-200 pl-2 space-y-2">
                {/* Mini Coordinates Table */}
                <div className="border border-slate-300 rounded-xs overflow-hidden">
                  <div className="bg-slate-900 text-white font-bold p-1 text-[8px] text-center">
                    CUADRO DE DATOS TÉCNICOS
                  </div>
                  <div className="max-h-28 overflow-y-auto text-[7px] font-mono">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="p-0.5">V</th>
                          <th className="p-0.5">LADO</th>
                          <th className="p-0.5">DIST</th>
                          <th className="p-0.5">ESTE</th>
                          <th className="p-0.5">NORTE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {technicalTable.slice(0, 6).map((r, i) => (
                          <tr key={i} className="border-t border-slate-200">
                            <td className="p-0.5 font-bold">{r.vertex}</td>
                            <td className="p-0.5">{r.vertex}-{r.nextVertex}</td>
                            <td className="p-0.5">{r.distanceFormatted}</td>
                            <td className="p-0.5">{r.east}</td>
                            <td className="p-0.5">{r.north}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Membrete Oficial Box */}
                <div className="border-2 border-slate-900 text-[7px] p-1.5 bg-slate-50 space-y-0.5">
                  <div className="font-bold text-slate-900 text-[8px] border-b pb-0.5 mb-1">
                    GEOSANEAMIENTO PERÚ
                  </div>
                  <div><strong>PROYECTO:</strong> {project.name}</div>
                  <div><strong>PROPIETARIO:</strong> {project.owner}</div>
                  <div><strong>UBICACIÓN:</strong> {project.district} - {project.province} - {project.department}</div>
                  <div><strong>PROFESIONAL:</strong> {project.professional} ({project.professionalReg})</div>
                  <div className="flex justify-between items-center pt-1 border-t mt-1">
                    <span className="font-bold text-[9px] text-emerald-700">{sheetCode}</span>
                    <span className="text-slate-500">{project.surveyDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer at Bottom */}
            <div className="relative z-10 text-[6.5px] text-slate-400 italic text-center border-t border-slate-200 pt-1">
              Documento técnico de apoyo generado por GeoSaneamiento Perú. Debe ser revisado, sellado y firmado por profesional habilitado ante SUNARP / COFOPRI.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-850 px-6 py-3 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {vertices.length} vértices &bull; Área: {stats?.areaM2.toFixed(2)} m² ({stats?.areaHa.toFixed(4)} ha)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDXF}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              title="Descargar archivo vectorial AutoCAD DXF"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Exportar Plano CAD (.DXF)</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generando PDF...' : 'Descargar Plano PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
