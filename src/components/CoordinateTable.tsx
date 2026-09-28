import React, { useState, useRef } from 'react';
import { Vertex, CoordinateSystem } from '../types';
import { COORDINATE_SYSTEMS } from '../services/geospatial';
import { parseRawText, parseGeoJSON, parseKML, SAMPLE_PARCELS } from '../services/parser';
import {
  Plus,
  Trash2,
  ArrowUpDown,
  RotateCcw,
  Clipboard,
  Upload,
  Table as TableIcon,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

interface CoordinateTableProps {
  vertices: Vertex[];
  onChangeVertices: (vertices: Vertex[], note?: string) => void;
  system: CoordinateSystem;
  onChangeSystem: (system: CoordinateSystem) => void;
}

export const CoordinateTable: React.FC<CoordinateTableProps> = ({
  vertices,
  onChangeVertices,
  system,
  onChangeSystem,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'paste' | 'file'>('manual');
  const [pasteText, setPasteText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sysInfo = COORDINATE_SYSTEMS[system];
  const isUtm = sysInfo.projection === 'UTM';

  // Add new vertex
  const handleAddRow = () => {
    const nextNum = vertices.length + 1;
    // Suggest coordinate near the last vertex or a sensible default
    let defaultX = 280000;
    let defaultY = 8640000;
    if (vertices.length > 0) {
      const last = vertices[vertices.length - 1];
      defaultX = Number((last.x + 50).toFixed(2));
      defaultY = Number((last.y + 30).toFixed(2));
    } else if (!isUtm) {
      defaultX = -77.0428;
      defaultY = -12.0464;
    }

    const newVertex: Vertex = {
      id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      vertexNumber: `V${nextNum}`,
      x: defaultX,
      y: defaultY,
      z: 0,
      description: 'Hito de campo',
      colindancia: 'Predio colindante',
    };

    onChangeVertices([...vertices, newVertex], `Agregado vértice V${nextNum}`);
  };

  // Update specific vertex property
  const handleUpdateVertex = (index: number, field: keyof Vertex, value: any) => {
    const updated = [...vertices];
    if (field === 'x' || field === 'y' || field === 'z') {
      const num = parseFloat(String(value).replace(/,/g, '.'));
      updated[index] = { ...updated[index], [field]: isNaN(num) ? 0 : num };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChangeVertices(updated);
  };

  // Delete vertex
  const handleDeleteRow = (index: number) => {
    const updated = vertices.filter((_, i) => i !== index);
    // Renumber vertices correlatively
    const renumbered = updated.map((v, i) => ({
      ...v,
      vertexNumber: `V${i + 1}`,
    }));
    onChangeVertices(renumbered, `Eliminado vértice V${index + 1}`);
  };

  // Reverse vertex order (Horario <-> Antihorario)
  const handleReverseOrder = () => {
    if (vertices.length < 2) return;
    const reversed = [...vertices].reverse().map((v, i) => ({
      ...v,
      vertexNumber: `V${i + 1}`,
    }));
    onChangeVertices(reversed, 'Invertido orden de vértices');
  };

  // Renumber vertices V1, V2...
  const handleRenumber = () => {
    const renumbered = vertices.map((v, i) => ({
      ...v,
      vertexNumber: `V${i + 1}`,
    }));
    onChangeVertices(renumbered, 'Renumeración correlativa');
  };

  // Clear all
  const handleClearAll = () => {
    if (window.confirm('¿Está seguro de que desea limpiar todas las coordenadas actuales?')) {
      onChangeVertices([], 'Vértices limpiados');
    }
  };

  // Process pasted Excel / Clipboard text
  const handleProcessPaste = () => {
    setParseError(null);
    if (!pasteText.trim()) {
      setParseError('Pegue primero los datos desde su hoja de cálculo o portapapeles.');
      return;
    }

    const res = parseRawText(pasteText);
    if (res.errors.length > 0 && res.vertices.length === 0) {
      setParseError(res.errors.join(' '));
      return;
    }

    if (res.vertices.length < 3) {
      setParseError('Se requieren al menos 3 vértices válidos para conformar un predio.');
      return;
    }

    if (res.suggestedSystem && res.suggestedSystem !== system) {
      onChangeSystem(res.suggestedSystem);
    }

    onChangeVertices(res.vertices, `Importados ${res.vertices.length} vértices desde portapapeles`);
    setActiveTab('manual');
    setPasteText('');
  };

  // Process file upload (CSV, TXT, KML, GeoJSON)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const ext = file.name.split('.').pop()?.toLowerCase();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      let res;
      if (ext === 'geojson' || ext === 'json') {
        res = parseGeoJSON(content);
      } else if (ext === 'kml') {
        res = parseKML(content);
      } else {
        // CSV, TXT, TSV
        res = parseRawText(content);
      }

      if (res.errors.length > 0 && res.vertices.length === 0) {
        setParseError(res.errors.join(' '));
        return;
      }

      if (res.vertices.length < 3) {
        setParseError('El archivo debe contener al menos 3 vértices válidos.');
        return;
      }

      if (res.suggestedSystem && res.suggestedSystem !== system) {
        onChangeSystem(res.suggestedSystem);
      }

      onChangeVertices(res.vertices, `Importado archivo: ${file.name}`);
      setActiveTab('manual');
    };

    reader.readAsText(file);
  };

  // Load preset sample parcel
  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_PARCELS.find((p) => p.id === sampleId);
    if (sample) {
      onChangeSystem(sample.system);
      onChangeVertices(sample.vertices, `Cargado predio de ejemplo: ${sample.name}`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
      {/* Top Header with System Configuration */}
      <div className="bg-slate-850 p-4 border-b border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-emerald-400" />
              <span>Ingreso y Gestión de Coordenadas</span>
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                {vertices.length} Vértices
              </span>
            </h3>
          </div>

          {/* Quick preset loader */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Ejemplos Perú:</span>
            <select
              onChange={(e) => {
                if (e.target.value) handleLoadSample(e.target.value);
              }}
              defaultValue=""
              className="bg-slate-950 text-emerald-400 border border-emerald-500/40 text-xs rounded-lg px-2.5 py-1 focus:outline-hidden focus:border-emerald-400 cursor-pointer"
            >
              <option value="" disabled>Cargar Predio de Prueba...</option>
              {SAMPLE_PARCELS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.department} - {p.system.split('_')[1] || 'WGS84'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* System of Reference Selector */}
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Sistema de Referencia:</span>
            <select
              value={system}
              onChange={(e) => onChangeSystem(e.target.value as CoordinateSystem)}
              className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-white text-xs font-medium focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="UTM_WGS84_18S">WGS84 / UTM Zona 18 Sur (Lima, Ica, Junín, Ancash...)</option>
              <option value="UTM_WGS84_17S">WGS84 / UTM Zona 17 Sur (Piura, Tumbes, Lambayeque...)</option>
              <option value="UTM_WGS84_19S">WGS84 / UTM Zona 19 Sur (Arequipa, Puno, Tacna, Cusco...)</option>
              <option value="GEOGRAPHIC_WGS84">Geográficas WGS84 (Latitud / Longitud Decimal)</option>
              <option value="PSAD56_18S">⚠️ PSAD56 / UTM Zona 18S (Histórico - Desfase ~400m)</option>
              <option value="PSAD56_17S">⚠️ PSAD56 / UTM Zona 17S (Histórico - Desfase ~400m)</option>
              <option value="PSAD56_19S">⚠️ PSAD56 / UTM Zona 19S (Histórico - Desfase ~400m)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Datum: <strong className="text-slate-200">{sysInfo.datum}</strong></span>
            <span>EPSG: <strong className="text-emerald-400 font-mono">{sysInfo.epsg}</strong></span>
            {sysInfo.utmZone && (
              <span>Zona: <strong className="text-slate-200">{sysInfo.utmZone} Sur</strong></span>
            )}
          </div>
        </div>

        {sysInfo.warning && (
          <div className="flex items-center gap-2 text-xs bg-amber-950/40 border border-amber-600/30 text-amber-300 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{sysInfo.warning}</span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-950 px-3 text-xs">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'manual'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Tabla Manual</span>
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'paste'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clipboard className="w-3.5 h-3.5" />
          <span>Pegar desde Excel</span>
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'file'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Cargar Archivo (CSV / KML / GeoJSON)</span>
        </button>
      </div>

      {/* TAB CONTENT: Manual Table */}
      {activeTab === 'manual' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Table Toolbar */}
          <div className="p-2.5 bg-slate-850/60 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAddRow}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1 transition"
                title="Agregar nuevo vértice"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Vértice</span>
              </button>
              <button
                onClick={handleRenumber}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                title="Renumerar vértices correlativamente (V1, V2...)"
              >
                Renumerar
              </button>
              <button
                onClick={handleReverseOrder}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 transition"
                title="Invertir orden de vértices (Sentido Horario / Antihorario)"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Invertir Sentido</span>
              </button>
            </div>

            <button
              onClick={handleClearAll}
              className="px-2 py-1 text-red-400 hover:bg-red-950/40 rounded text-xs transition"
              title="Borrar todas las coordenadas"
            >
              Limpiar
            </button>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-semibold sticky top-0 border-b border-slate-800 z-10">
                <tr>
                  <th className="p-2 w-10 text-center">#</th>
                  <th className="p-2 w-16">VÉRT</th>
                  <th className="p-2">
                    {isUtm ? 'ESTE / X (m)' : 'LONGITUD (°)'}
                  </th>
                  <th className="p-2">
                    {isUtm ? 'NORTE / Y (m)' : 'LATITUD (°)'}
                  </th>
                  <th className="p-2 w-24">COTA Z (m)</th>
                  <th className="p-2">DESCRIPCIÓN / HITO</th>
                  <th className="p-2">COLINDANCIA</th>
                  <th className="p-2 w-10 text-center">ACC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {vertices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500 font-sans">
                      No hay coordenadas registradas. Haga clic en <strong>"Agregar Vértice"</strong>, seleccione un <strong>predio de ejemplo</strong> o pegue desde Excel.
                    </td>
                  </tr>
                ) : (
                  vertices.map((v, idx) => (
                    <tr key={v.id} className="hover:bg-slate-800/40 group transition">
                      <td className="p-1.5 text-center text-slate-500 font-sans">{idx + 1}</td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={v.vertexNumber}
                          onChange={(e) => handleUpdateVertex(idx, 'vertexNumber', e.target.value)}
                          className="w-14 bg-slate-950 border border-slate-700/60 rounded px-1.5 py-0.5 text-emerald-400 font-bold text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.0001"
                          value={v.x}
                          onChange={(e) => handleUpdateVertex(idx, 'x', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700/60 rounded px-2 py-0.5 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.0001"
                          value={v.y}
                          onChange={(e) => handleUpdateVertex(idx, 'y', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700/60 rounded px-2 py-0.5 text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.1"
                          value={v.z ?? 0}
                          onChange={(e) => handleUpdateVertex(idx, 'z', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700/60 rounded px-1.5 py-0.5 text-slate-300 text-xs focus:border-emerald-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="p-1.5 font-sans">
                        <input
                          type="text"
                          value={v.description || ''}
                          onChange={(e) => handleUpdateVertex(idx, 'description', e.target.value)}
                          placeholder="Ej. Hito de concreto"
                          className="w-full bg-slate-950 border border-slate-700/60 rounded px-2 py-0.5 text-slate-300 text-xs focus:border-emerald-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="p-1.5 font-sans">
                        <input
                          type="text"
                          value={v.colindancia || ''}
                          onChange={(e) => handleUpdateVertex(idx, 'colindancia', e.target.value)}
                          placeholder="Ej. Propiedad de Juan Pérez"
                          className="w-full bg-slate-950 border border-slate-700/60 rounded px-2 py-0.5 text-slate-300 text-xs focus:border-emerald-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                          title="Eliminar vértice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Paste from Excel */}
      {activeTab === 'paste' && (
        <div className="p-4 flex-1 flex flex-col space-y-3">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-emerald-400">Instrucciones para pegar desde Excel:</p>
            <p>1. Seleccione las celdas en su hoja de cálculo (Excel / Google Sheets / LibreOffice).</p>
            <p>2. Columnas admitidas: <strong>Vértice | Este (X) | Norte (Y) | Altitud (Z) | Descripción</strong>.</p>
            <p>3. Presione <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-emerald-300">Ctrl + V</kbd> en el cuadro inferior.</p>
          </div>

          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`V1\t283120.45\t8645210.12\t150.0\tHito 1\nV2\t283450.80\t8645320.40\t152.0\tHito 2\nV3\t283520.10\t8645050.60\t149.5\tHito 3\nV4\t283180.30\t8644980.90\t148.0\tHito 4`}
            className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-3 font-mono text-xs text-white focus:border-emerald-500 focus:outline-hidden resize-none min-h-[160px]"
          />

          {parseError && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 p-2 rounded">
              {parseError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setPasteText('')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              Limpiar Texto
            </button>
            <button
              onClick={handleProcessPaste}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              Procesar e Importar Coordenadas
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: File Upload */}
      {activeTab === 'file' && (
        <div className="p-6 flex-1 flex flex-col items-center justify-center space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-xl p-8 max-w-md w-full flex flex-col items-center text-center cursor-pointer transition bg-slate-950/60 hover:bg-slate-950"
          >
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl mb-3">
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="font-semibold text-white text-sm">Seleccionar o Arrastrar Archivo</h4>
            <p className="text-xs text-slate-400 mt-1">
              Formatos soportados: <strong>CSV, TXT, GeoJSON, KML</strong>
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              (Preparado para integración futura con Shapefiles .SHP / Geopackage)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.geojson,.json,.kml,.gpx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {parseError && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 p-2.5 rounded-lg max-w-md w-full">
              {parseError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
