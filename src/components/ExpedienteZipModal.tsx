import React, { useState } from 'react';
import JSZip from 'jszip';
import { Project, Vertex, TechnicalSideRow, GeometryStats, CoordinateSystem } from '../types';
import { generateTechnicalPlanPDF } from '../services/pdfPlanGenerator';
import { generateDXF } from '../services/dxfExporter';
import { toGeoJSON, toKML, COORDINATE_SYSTEMS } from '../services/geospatial';
import {
  Archive,
  Download,
  FileCheck,
  CheckCircle2,
  X,
  FileText,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ExpedienteZipModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  vertices: Vertex[];
  technicalTable: TechnicalSideRow[];
  stats: GeometryStats | null;
  system: CoordinateSystem;
}

export const ExpedienteZipModal: React.FC<ExpedienteZipModalProps> = ({
  isOpen,
  onClose,
  project,
  vertices,
  technicalTable,
  stats,
  system,
}) => {
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleBuildAndDownload = async () => {
    setIsBuilding(true);
    setProgress(10);

    try {
      const zip = new JSZip();
      const codeClean = (project.code || 'EXP-2025-001').replace(/[\s/]/g, '_');
      const folder = zip.folder(`Expediente_${codeClean}`);

      // 1. Technical Plan PDF
      setProgress(25);
      const pdfDoc = generateTechnicalPlanPDF(project, vertices, technicalTable, stats, system, {
        planType: 'PLANO PERIMÉTRICO',
        sheetCode: 'PP-01',
        paperSize: 'A4',
        orientation: 'landscape',
        scaleText: '1:1,000',
      });
      const pdfArrayBuffer = pdfDoc.output('arraybuffer');
      folder?.file(`01_Plano_Perimetrico_${codeClean}.pdf`, pdfArrayBuffer);

      // 2. AutoCAD DXF
      setProgress(45);
      const dxfContent = generateDXF(vertices, technicalTable, system, {
        propertyName: project.propertyName,
        code: project.code,
        owner: project.owner,
      });
      folder?.file(`02_Plano_CAD_${codeClean}.dxf`, dxfContent);

      // 3. GeoJSON & KML
      setProgress(60);
      const geojsonContent = toGeoJSON(vertices, system, {
        name: project.propertyName,
        areaM2: stats?.areaM2,
        perimeterM: stats?.perimeterM,
      });
      folder?.file(`03_Poligono_${codeClean}.geojson`, geojsonContent);

      const kmlContent = toKML(vertices, system, project.propertyName);
      folder?.file(`04_Poligono_GoogleEarth_${codeClean}.kml`, kmlContent);

      // 4. Coordinates CSV
      setProgress(75);
      let csv = `VERTICE,LADO,DISTANCIA_M,AZIMUT,RUMBO,ESTE_X,NORTE_Y,COLINDANCIA\n`;
      technicalTable.forEach((r) => {
        csv += `"${r.vertex}","${r.vertex}-${r.nextVertex}",${r.distanceFormatted},"${r.azimuth}","${r.bearing}",${r.east},${r.north},"${r.colindancia}"\n`;
      });
      folder?.file(`05_Cuadro_Datos_Tecnicos_${codeClean}.csv`, csv);

      // 5. Index & Legal Notice
      setProgress(85);
      const indexText = `EXPEDIENTE TÉCNICO DE SANEAMIENTO CATASTRAL Y PREDIAL
============================================================
Proyecto: ${project.name}
Predio: ${project.propertyName}
Código Único: ${project.code}
Propietario: ${project.owner} (DNI/RUC: ${project.docNumber})
Ubicación: ${project.district}, ${project.province}, ${project.department}
Entidad de Destino: ${project.destinationEntity}
Trámite: ${project.procedureType}
Profesional Responsable: ${project.professional} (${project.professionalReg})
Fecha: ${project.surveyDate}

RESUMEN TÉCNICO:
Área: ${stats?.areaM2.toFixed(2)} m² (${stats?.areaHa.toFixed(4)} ha)
Perímetro: ${stats?.perimeterM.toFixed(2)} ml
Número de Vértices: ${vertices.length}
Sistema Geodésico: ${COORDINATE_SYSTEMS[system].name} (EPSG: ${COORDINATE_SYSTEMS[system].epsg})

CONTENIDO DEL EXPEDIENTE DIGITAL:
1. 01_Plano_Perimetrico_${codeClean}.pdf (Plano vectorizado oficial con membrete)
2. 02_Plano_CAD_${codeClean}.dxf (Plano AutoCAD compatible Civil 3D y QGIS)
3. 03_Poligono_${codeClean}.geojson (Geometría estándar GIS)
4. 04_Poligono_GoogleEarth_${codeClean}.kml (Visualización en Google Earth)
5. 05_Cuadro_Datos_Tecnicos_${codeClean}.csv (Coordenadas y linderos)

AVISO LEGAL OBLIGATORIO:
“LOS RESULTADOS GENERADOS POR LA PLATAFORMA SON HERRAMIENTAS DE APOYO TÉCNICO Y DEBEN SER REVISADOS Y VALIDADOS POR UN PROFESIONAL RESPONSABLE SEGÚN LOS REQUISITOS Y NORMATIVA APLICABLE.”
`;
      folder?.file(`00_Indice_Expediente_${codeClean}.txt`, indexText);

      // Generate ZIP blob
      setProgress(95);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Expediente_Tecnico_${codeClean}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgress(100);
      setTimeout(() => {
        setIsBuilding(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al compilar el expediente.');
      setIsBuilding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-850 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Descargar Expediente Técnico Digital</h2>
              <p className="text-xs text-slate-400">Paquete completo para trámite registral y municipal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 space-y-4">
          <div className="text-xs text-slate-300">
            El archivo <strong>.ZIP</strong> contendrá todos los entregables normalizados para <strong>{project.destinationEntity}</strong>:
          </div>

          <div className="space-y-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Plano Perimétrico Oficial (.PDF en alta resolución)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Plano Vectorial AutoCAD (.DXF con capas y cotas)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Polígono Espacial (.GeoJSON y .KML para Google Earth)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cuadro de Datos Técnicos y Coordenadas (.CSV)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Índice del Expediente y Declaración de Responsabilidad</span>
            </div>
          </div>

          {isBuilding && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Compilando archivos técnicos...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleBuildAndDownload}
              disabled={isBuilding}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition"
            >
              <Download className="w-4 h-4" />
              <span>{isBuilding ? 'Generando ZIP...' : 'Descargar Expediente (.ZIP)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
