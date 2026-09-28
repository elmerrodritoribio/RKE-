import React, { useState } from 'react';
import { TechnicalSideRow, GeometryStats, CoordinateSystem, FichaConfig } from '../types';
import { COORDINATE_SYSTEMS } from '../services/geospatial';
import {
  FileSpreadsheet,
  Copy,
  Check,
  Download,
  Share2,
  Table as TableIcon,
  Compass,
} from 'lucide-react';

interface TechnicalTablePanelProps {
  technicalTable: TechnicalSideRow[];
  stats: GeometryStats | null;
  system: CoordinateSystem;
  propertyName?: string;
  fichaConfig?: FichaConfig;
}

export const TechnicalTablePanel: React.FC<TechnicalTablePanelProps> = ({
  technicalTable,
  stats,
  system,
  propertyName = 'PREDIO',
  fichaConfig,
}) => {
  const [copied, setCopied] = useState(false);
  const sysInfo = COORDINATE_SYSTEMS[system];
  const decCoord = fichaConfig?.decimalesCoordenadas ?? 4;
  const decArea = fichaConfig?.decimalesArea ?? 2;

  // Copy as Excel TSV
  const handleCopyExcel = () => {
    let tsv = `CUADRO DE DATOS TÉCNICOS - ${propertyName}\n`;
    tsv += `SISTEMA: ${sysInfo.name} | EPSG: ${sysInfo.epsg}\n`;
    tsv += `VÉRTICE\tLADO\tDISTANCIA (m)\tAZIMUT\tRUMBO\tESTE (X)\tNORTE (Y)\tCOLINDANCIA\n`;

    technicalTable.forEach((r) => {
      tsv += `${r.vertex}\t${r.vertex}-${r.nextVertex}\t${r.distanceFormatted}\t${r.azimuth}\t${r.bearing}\t${r.east}\t${r.north}\t${r.colindancia}\n`;
    });

    if (stats) {
      tsv += `\nÁREA TOTAL:\t${stats.areaM2.toFixed(2)} m²\t(${stats.areaHa.toFixed(4)} ha)\n`;
      tsv += `PERÍMETRO TOTAL:\t${stats.perimeterM.toFixed(2)} ml\n`;
    }

    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Download as CSV
  const handleDownloadCSV = () => {
    let csv = `VERTICE,LADO,DISTANCIA_M,AZIMUT,RUMBO,ESTE_X,NORTE_Y,COLINDANCIA\n`;
    technicalTable.forEach((r) => {
      csv += `"${r.vertex}","${r.vertex}-${r.nextVertex}",${r.distanceFormatted},"${r.azimuth}","${r.bearing}",${r.east},${r.north},"${r.colindancia}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cuadro_Datos_Tecnicos_${propertyName.replace(/[\s/]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (technicalTable.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
        El Cuadro de Datos Técnicos se calculará automáticamente cuando el polígono cuente con al menos 3 vértices válidos.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
      {/* Header and Toolbar */}
      <div className="p-4 bg-slate-850 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <TableIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Cuadro de Datos Técnicos (SUNARP / SNCP)</h3>
            <p className="text-xs text-slate-400">
              Coordenadas planas, distancias perimétricas euclidianas y azimuts sexagesimales
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleCopyExcel}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
            title="Copiar datos tabulados para pegar directamente en Microsoft Excel o Civil 3D"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado a Excel!' : 'Copiar a Excel'}</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
            title="Descargar archivo CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-950/70 border-b border-slate-800 text-xs">
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Área Perimétrica (m²)</span>
            <strong className="text-emerald-400 font-mono text-sm block">
              {stats.areaM2.toLocaleString('es-PE', { minimumFractionDigits: decArea, maximumFractionDigits: decArea })} m²
            </strong>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Área Agrícola / Rural (ha)</span>
            <strong className="text-emerald-400 font-mono text-sm block">
              {stats.areaHa.toFixed(decArea === 2 ? 4 : decArea)} ha
            </strong>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Perímetro Total (ml)</span>
            <strong className="text-white font-mono text-sm block">
              {stats.perimeterM.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ml
            </strong>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Sistema Geodésico</span>
            <strong className="text-slate-200 text-xs block truncate" title={sysInfo.name}>
              {sysInfo.datum} {sysInfo.utmZone ? `UTM ${sysInfo.utmZone}S` : ''}
            </strong>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead className="bg-slate-950 text-slate-400 font-semibold sticky top-0 border-b border-slate-800 z-10 text-[11px]">
            <tr>
              <th className="p-2.5 w-16">VÉRTICE</th>
              <th className="p-2.5 w-20">LADO</th>
              <th className="p-2.5 w-28 text-right">DISTANCIA (m)</th>
              <th className="p-2.5 w-32">AZIMUT</th>
              <th className="p-2.5 w-28">RUMBO</th>
              <th className="p-2.5 text-right">ESTE (X)</th>
              <th className="p-2.5 text-right">NORTE (Y)</th>
              <th className="p-2.5 font-sans">COLINDANCIA REGISTRAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {technicalTable.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition">
                <td className="p-2 font-bold text-emerald-400">{row.vertex}</td>
                <td className="p-2 text-slate-300">{row.vertex} - {row.nextVertex}</td>
                <td className="p-2 text-right text-white font-bold">{row.distanceFormatted}</td>
                <td className="p-2 text-slate-300">{row.azimuth}</td>
                <td className="p-2 text-slate-400">{row.bearing}</td>
                <td className="p-2 text-right text-emerald-300 font-mono">
                  {parseFloat(row.east).toFixed(decCoord)}
                </td>
                <td className="p-2 text-right text-emerald-300 font-mono">
                  {parseFloat(row.north).toFixed(decCoord)}
                </td>
                <td className="p-2 text-slate-300 font-sans text-xs">{row.colindancia || 'Predio colindante'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
