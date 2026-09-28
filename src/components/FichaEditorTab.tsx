import React, { useState } from 'react';
import {
  Project,
  Vertex,
  TechnicalSideRow,
  GeometryStats,
  CoordinateSystem,
  FichaConfig,
  FichaStandardType,
  DEFAULT_FICHA_CONFIG,
} from '../types';
import { COORDINATE_SYSTEMS } from '../services/geospatial';
import {
  Sliders,
  FileText,
  UserCheck,
  Radio,
  Hash,
  Palette,
  Eye,
  Save,
  RotateCcw,
  Printer,
  CheckCircle2,
  AlertCircle,
  Building,
  MapPin,
  Compass,
  Layers,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Upload,
} from 'lucide-react';

interface FichaEditorTabProps {
  fichaConfig: FichaConfig;
  onUpdateFichaConfig: (config: FichaConfig) => void;
  project: Project;
  vertices: Vertex[];
  technicalTable: TechnicalSideRow[];
  stats: GeometryStats | null;
  system: CoordinateSystem;
}

export const FichaEditorTab: React.FC<FichaEditorTabProps> = ({
  fichaConfig,
  onUpdateFichaConfig,
  project,
  vertices,
  technicalTable,
  stats,
  system,
}) => {
  const [localConfig, setLocalConfig] = useState<FichaConfig>(fichaConfig);
  const [activeSubTab, setActiveSubTab] = useState<
    'identificacion' | 'verificador' | 'geodesia' | 'precision' | 'visualizacion' | 'previsualizacion'
  >('identificacion');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const sysInfo = COORDINATE_SYSTEMS[system];

  const handleChange = <K extends keyof FichaConfig>(field: K, value: FichaConfig[K]) => {
    setLocalConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Preset quick load
  const handleApplyPreset = (type: FichaStandardType) => {
    if (type === 'SNCP_INDIVIDUAL') {
      setLocalConfig((prev) => ({
        ...prev,
        fichaStandard: 'SNCP_INDIVIDUAL',
        sheetCode: 'FC-01',
        rotuloPersonalizado: 'FICHA CATASTRAL INDIVIDUAL (SNCP LEY 28294)',
        entidadEmisora: 'SISTEMA NACIONAL INTEGRADO DE INFORMACIÓN CATASTRAL PREDIAL - SNCP',
        decimalesCoordenadas: 4,
        decimalesArea: 2,
        formatoAngular: 'AMBOS',
        ambitoTolerancia: 'Rural Directo (0.50m)',
        toleranciaCatastralM: 0.5,
        colorPoligono: '#10b981',
      }));
    } else if (type === 'SNCP_RURAL_MIDAGRI') {
      setLocalConfig((prev) => ({
        ...prev,
        fichaStandard: 'SNCP_RURAL_MIDAGRI',
        sheetCode: 'FCR-01',
        rotuloPersonalizado: 'FICHA TÉCNICA CATASTRAL RURAL (D.L. 1089 / D.S. 008-2021-MIDAGRI)',
        entidadEmisora: 'MINISTERIO DE DESARROLLO AGRARIO Y RIEGO - DIGESPACR / GORE',
        decimalesCoordenadas: 4,
        decimalesArea: 4,
        formatoAngular: 'AZIMUT_DMS',
        ambitoTolerancia: 'Rural Directo (0.50m)',
        toleranciaCatastralM: 0.5,
        colorPoligono: '#059669',
      }));
    } else if (type === 'SUNARP_SANEAMIENTO') {
      setLocalConfig((prev) => ({
        ...prev,
        fichaStandard: 'SUNARP_SANEAMIENTO',
        sheetCode: 'PP-01',
        rotuloPersonalizado: 'MEMBRETE TÉCNICO REGISTRAL DE SANEAMIENTO (LEY 27333 / DIRECTIVA SUNARP)',
        entidadEmisora: 'SUPERINTENDENCIA NACIONAL DE LOS REGISTROS PÚBLICOS - SUNARP',
        decimalesCoordenadas: 4,
        decimalesArea: 2,
        formatoAngular: 'AMBOS',
        ambitoTolerancia: 'Rural Directo (0.50m)',
        toleranciaCatastralM: 0.5,
        colorPoligono: '#2563eb',
      }));
    } else if (type === 'MUNICIPAL_CATASTRO') {
      setLocalConfig((prev) => ({
        ...prev,
        fichaStandard: 'MUNICIPAL_CATASTRO',
        sheetCode: 'FCM-01',
        rotuloPersonalizado: 'FICHA CATASTRAL URBANA MUNICIPAL (GERENCIA DE DESARROLLO URBANO)',
        entidadEmisora: 'MUNICIPALIDAD PROVINCIAL / DISTRITAL - SUBGERENCIA DE CATASTRO',
        decimalesCoordenadas: 3,
        decimalesArea: 2,
        formatoAngular: 'AZIMUT_DMS',
        ambitoTolerancia: 'Urbano (0.20m)',
        toleranciaCatastralM: 0.2,
        colorPoligono: '#8b5cf6',
      }));
    }
  };

  const handleSave = () => {
    onUpdateFichaConfig(localConfig);
    try {
      localStorage.setItem('geosaneamiento_ficha_config', JSON.stringify(localConfig));
    } catch {
      // ignore
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm('¿Desea restaurar las configuraciones de la ficha técnica al estándar oficial SNCP?')) {
      setLocalConfig(DEFAULT_FICHA_CONFIG);
      onUpdateFichaConfig(DEFAULT_FICHA_CONFIG);
      try {
        localStorage.setItem('geosaneamiento_ficha_config', JSON.stringify(DEFAULT_FICHA_CONFIG));
      } catch {
        // ignore
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Image upload for signature/stamp
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleChange('selloFirmaUrl', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
      {/* Top Banner and Quick Presets */}
      <div className="p-3.5 bg-slate-850 border-b border-slate-800 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Editor de Ficha & Configuraciones</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-800">
                  {localConfig.sheetCode}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Personaliza la ficha técnica, formatos de coordenadas, verificador y salidas cartográficas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
              title="Restaurar valores predeterminados SNCP"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow transition"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Template Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          <span className="text-slate-500 font-semibold uppercase text-[10px] shrink-0 mr-1">Plantilla:</span>
          <button
            onClick={() => handleApplyPreset('SNCP_INDIVIDUAL')}
            className={`px-2.5 py-1 rounded-md shrink-0 transition border ${
              localConfig.fichaStandard === 'SNCP_INDIVIDUAL'
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60 font-semibold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            SNCP Individual (Ley 28294)
          </button>
          <button
            onClick={() => handleApplyPreset('SNCP_RURAL_MIDAGRI')}
            className={`px-2.5 py-1 rounded-md shrink-0 transition border ${
              localConfig.fichaStandard === 'SNCP_RURAL_MIDAGRI'
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60 font-semibold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            Rural MIDAGRI (D.L. 1089)
          </button>
          <button
            onClick={() => handleApplyPreset('SUNARP_SANEAMIENTO')}
            className={`px-2.5 py-1 rounded-md shrink-0 transition border ${
              localConfig.fichaStandard === 'SUNARP_SANEAMIENTO'
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/60 font-semibold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            Saneamiento SUNARP
          </button>
          <button
            onClick={() => handleApplyPreset('MUNICIPAL_CATASTRO')}
            className={`px-2.5 py-1 rounded-md shrink-0 transition border ${
              localConfig.fichaStandard === 'MUNICIPAL_CATASTRO'
                ? 'bg-purple-600/30 text-purple-300 border-purple-500/60 font-semibold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            Municipal Urbano
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-slate-950 px-2 border-b border-slate-800 text-[11px] overflow-x-auto shrink-0 select-none">
        <button
          onClick={() => setActiveSubTab('identificacion')}
          className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'identificacion'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>1. Estándar & Rótulos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('verificador')}
          className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'verificador'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>2. Verificador SUNARP</span>
        </button>

        <button
          onClick={() => setActiveSubTab('geodesia')}
          className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'geodesia'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>3. Equipos GNSS</span>
        </button>

        <button
          onClick={() => setActiveSubTab('precision')}
          className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'precision'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>4. Decimales & Tolerancias</span>
        </button>

        <button
          onClick={() => setActiveSubTab('visualizacion')}
          className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'visualizacion'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>5. Estilo & Visor</span>
        </button>

        <button
          onClick={() => setActiveSubTab('previsualizacion')}
          className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeSubTab === 'previsualizacion'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>6. Vista Previa Ficha</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0 space-y-4">
        {/* SUBTAB 1: IDENTIFICACIÓN Y RÓTULOS */}
        {activeSubTab === 'identificacion' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building className="w-4 h-4" />
                Configuración del Membrete y Carátula
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Código de Ficha / Lámina:
                  </label>
                  <input
                    type="text"
                    value={localConfig.sheetCode}
                    onChange={(e) => handleChange('sheetCode', e.target.value)}
                    placeholder="ej. FC-01, PP-01"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Formato de Lámina Predeterminado:
                  </label>
                  <select
                    value={localConfig.formatoLamina}
                    onChange={(e) => handleChange('formatoLamina', e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="A4">A4 (210 x 297 mm) - Estándar Memorias</option>
                    <option value="A3">A3 (297 x 420 mm) - Estándar Planos SUNARP</option>
                    <option value="A2">A2 (420 x 594 mm) - Predios Mayores</option>
                    <option value="A1">A1 (594 x 841 mm) - Grandes Extensiones</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">
                    Rótulo / Título Principal de la Ficha:
                  </label>
                  <input
                    type="text"
                    value={localConfig.rotuloPersonalizado}
                    onChange={(e) => handleChange('rotuloPersonalizado', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">
                    Entidad Emisora / Destino Oficial:
                  </label>
                  <input
                    type="text"
                    value={localConfig.entidadEmisora}
                    onChange={(e) => handleChange('entidadEmisora', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">
                    Consultora o Empresa de Topografía Responsable:
                  </label>
                  <input
                    type="text"
                    value={localConfig.consultoraEmpresa}
                    onChange={(e) => handleChange('consultoraEmpresa', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">
                    Nota Técnica y Descargo Legal al Pie:
                  </label>
                  <textarea
                    rows={2}
                    value={localConfig.notaDescargoPersonalizada}
                    onChange={(e) => handleChange('notaDescargoPersonalizada', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: VERIFICADOR CATASTRAL & COLEGIATURA */}
        {activeSubTab === 'verificador' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                Acreditación Profesional & SUNARP / SNCP
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Nombre del Profesional Responsable:
                  </label>
                  <input
                    type="text"
                    value={localConfig.verificadorNombre}
                    onChange={(e) => handleChange('verificadorNombre', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Colegio Profesional y Número:
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={localConfig.tipoColegiatura}
                      onChange={(e) => handleChange('tipoColegiatura', e.target.value as any)}
                      className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                    >
                      <option value="CIP">CIP</option>
                      <option value="CAP">CAP</option>
                      <option value="TOP">TOP</option>
                    </select>
                    <input
                      type="text"
                      value={localConfig.numeroColegiatura}
                      onChange={(e) => handleChange('numeroColegiatura', e.target.value)}
                      placeholder="164820"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Nº de Registro Verificador Catastral (SUNARP):
                  </label>
                  <input
                    type="text"
                    value={localConfig.verificadorIndiceSunarp}
                    onChange={(e) => handleChange('verificadorIndiceSunarp', e.target.value)}
                    placeholder="VC-02847-ZR-IX"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Zona Registral SUNARP:
                  </label>
                  <input
                    type="text"
                    value={localConfig.zonaRegistral}
                    onChange={(e) => handleChange('zonaRegistral', e.target.value)}
                    placeholder="Zona Registral N° IX - Sede Lima"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">
                    Cargo o Función Declarada:
                  </label>
                  <input
                    type="text"
                    value={localConfig.cargoProfesional}
                    onChange={(e) => handleChange('cargoProfesional', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* Sello y Firma Digitalizada */}
                <div className="md:col-span-2 pt-2 border-t border-slate-800">
                  <label className="block text-slate-400 mb-1 font-medium">
                    Sello y Firma Digitalizada del Verificador (Opcional):
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-xs flex items-center gap-2 text-slate-300 transition">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cargar Sello / Firma (PNG, JPG)</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                    </label>
                    {localConfig.selloFirmaUrl && (
                      <div className="flex items-center gap-2">
                        <img
                          src={localConfig.selloFirmaUrl}
                          alt="Sello"
                          className="h-10 w-24 object-contain bg-white rounded p-0.5"
                        />
                        <button
                          onClick={() => handleChange('selloFirmaUrl', undefined)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    El sello se incluirá en el recuadro de validación de la Ficha Técnica y el Plano Perimétrico.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: PARÁMETROS GEODÉSICOS Y EQUIPO GNSS */}
        {activeSubTab === 'geodesia' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Radio className="w-4 h-4" />
                Metodología y Equipos de Levantamiento Geodésico
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Método de Levantamiento:
                  </label>
                  <select
                    value={localConfig.metodoLevantamiento}
                    onChange={(e) => handleChange('metodoLevantamiento', e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="GNSS Diferencial RTK">GNSS Diferencial RTK (En tiempo real)</option>
                    <option value="GNSS Estático Posproceso">GNSS Estático Posproceso (Geodésico doble frecuencia)</option>
                    <option value="Estación Total">Estación Total (Poligonal amarrada a hito geodésico)</option>
                    <option value="Dron Fotogramétrico RTK">Dron Fotogramétrico RTK + Puntos de Control Terrestre (GCP)</option>
                    <option value="Mixto (GNSS + Estación Total)">Mixto (Base GNSS + Relleno Estación Total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Época de Referencia Geodésica:
                  </label>
                  <input
                    type="text"
                    value={localConfig.epocaWGS84}
                    onChange={(e) => handleChange('epocaWGS84', e.target.value)}
                    placeholder="WGS84 Época 2017.0 (SIRGAS)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">
                    Marca, Modelo y Especificaciones del Equipo:
                  </label>
                  <input
                    type="text"
                    value={localConfig.equipoMarcaModelo}
                    onChange={(e) => handleChange('equipoMarcaModelo', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">
                    Estación de Rastreo Permanente (ERP) IGN de Amarre:
                  </label>
                  <input
                    type="text"
                    value={localConfig.estacionBaseIGN}
                    onChange={(e) => handleChange('estacionBaseIGN', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Precisión Horizontal Nominal (mm):
                  </label>
                  <input
                    type="number"
                    value={localConfig.precisionHorizontalMm}
                    onChange={(e) => handleChange('precisionHorizontalMm', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Precisión Vertical Nominal (mm):
                  </label>
                  <input
                    type="number"
                    value={localConfig.precisionVerticalMm}
                    onChange={(e) => handleChange('precisionVerticalMm', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: PRECISIÓN NUMÉRICA & TOLERANCIAS SNCP */}
        {activeSubTab === 'precision' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Hash className="w-4 h-4" />
                Formatos de Coordenadas y Tolerancias Catastrales
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Decimales en Coordenadas UTM (Este / Norte):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 3, 4].map((dec) => (
                      <button
                        key={dec}
                        type="button"
                        onClick={() => handleChange('decimalesCoordenadas', dec as any)}
                        className={`py-2 rounded-lg text-center font-mono border transition ${
                          localConfig.decimalesCoordenadas === dec
                            ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {dec} dec. {dec === 4 && '(SNCP)'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    La directiva SNCP exige 4 decimales para coordenadas de apoyo geodésico y vértices.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Decimales en Cálculo de Superficie:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[2, 4].map((dec) => (
                      <button
                        key={dec}
                        type="button"
                        onClick={() => handleChange('decimalesArea', dec as any)}
                        className={`py-2 rounded-lg text-center font-mono border transition ${
                          localConfig.decimalesArea === dec
                            ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {dec} decimales {dec === 4 ? '(ha)' : '(m²)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Formato Angular en Cuadro Técnico:
                  </label>
                  <select
                    value={localConfig.formatoAngular}
                    onChange={(e) => handleChange('formatoAngular', e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="AZIMUT_DMS">Azimut Sexagesimal (e.g. 142°30'15")</option>
                    <option value="RUMBO">Rumbo Geodésico (e.g. S 37°29'45" E)</option>
                    <option value="AMBOS">Ambos (Azimut + Rumbo) - Recomendado SUNARP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Rango de Tolerancia Catastral SNCP:
                  </label>
                  <select
                    value={localConfig.ambitoTolerancia}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      const tol = val.includes('0.20') ? 0.2 : val.includes('0.50') ? 0.5 : 2.5;
                      setLocalConfig((prev) => ({
                        ...prev,
                        ambitoTolerancia: val,
                        toleranciaCatastralM: tol,
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="Urbano (0.20m)">Predio Urbano - Tolerancia lineal: 0.20 m</option>
                    <option value="Rural Directo (0.50m)">Predio Rural Directo - Tolerancia lineal: 0.50 m</option>
                    <option value="Rural Cartográfico (2.50m)">Predio Rural Satelital - Tolerancia lineal: 2.50 m</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 5: ESTILO & VISOR */}
        {activeSubTab === 'visualizacion' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Palette className="w-4 h-4" />
                Personalización del Visor Cartográfico y Plano
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Color del Polígono del Predio:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localConfig.colorPoligono}
                      onChange={(e) => handleChange('colorPoligono', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { color: '#10b981', label: 'Verde' },
                        { color: '#3b82f6', label: 'Azul' },
                        { color: '#f59e0b', label: 'Ámbar' },
                        { color: '#ef4444', label: 'Rojo' },
                        { color: '#8b5cf6', label: 'Morado' },
                        { color: '#06b6d4', label: 'Cian' },
                      ].map((item) => (
                        <button
                          key={item.color}
                          type="button"
                          onClick={() => handleChange('colorPoligono', item.color)}
                          style={{ backgroundColor: item.color }}
                          className={`w-6 h-6 rounded-full border-2 transition ${
                            localConfig.colorPoligono === item.color
                              ? 'border-white scale-110'
                              : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                          title={item.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Grosor de Línea Perimétrica:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={localConfig.grosorLinea}
                      onChange={(e) => handleChange('grosorLinea', parseInt(e.target.value) || 2)}
                      className="flex-1 accent-emerald-500 cursor-pointer"
                    />
                    <span className="font-mono text-emerald-400 font-bold w-6 text-center">
                      {localConfig.grosorLinea}px
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 pt-2 border-t border-slate-800 space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={localConfig.mostrarCuadriculaUTM}
                      onChange={(e) => handleChange('mostrarCuadriculaUTM', e.target.checked)}
                      className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Mostrar Cuadrícula UTM (Grid Cartográfico con coordenadas en bordes)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={localConfig.mostrarEtiquetasVertices}
                      onChange={(e) => handleChange('mostrarEtiquetasVertices', e.target.checked)}
                      className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Mostrar Etiquetas de Vértices en el Visor (V1, V2, V3...)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={localConfig.mostrarCotasZ}
                      onChange={(e) => handleChange('mostrarCotasZ', e.target.checked)}
                      className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Mostrar Cotas / Altitudes Z ortométricas en cuadro de vértices</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={localConfig.mostrarColindanciasEnPlano}
                      onChange={(e) => handleChange('mostrarColindanciasEnPlano', e.target.checked)}
                      className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Incluir nombres de colindantes en la lámina técnica</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 6: PREVISUALIZACIÓN DE LA FICHA TÉCNICA */}
        {activeSubTab === 'previsualizacion' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs text-slate-400">
                Previsualización en tiempo real de la Ficha Técnica con los parámetros configurados:
              </span>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Imprimir / Exportar Ficha</span>
              </button>
            </div>

            {/* Official Ficha Document Mockup (Printable view) */}
            <div className="bg-white text-slate-900 p-6 rounded-lg shadow-2xl text-[11px] font-sans border border-slate-300 print:m-0 print:border-none print:shadow-none">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  {localConfig.entidadEmisora}
                </div>
                <div className="text-sm font-black uppercase text-slate-950 mt-1">
                  {localConfig.rotuloPersonalizado}
                </div>
                <div className="flex items-center justify-center gap-4 text-[10px] text-slate-600 font-mono mt-1">
                  <span>CÓDIGO: <strong>{project.code || 'PRJ-001'}</strong></span>
                  <span>|</span>
                  <span>LÁMINA: <strong>{localConfig.sheetCode}</strong></span>
                  <span>|</span>
                  <span>FECHA: <strong>{project.surveyDate || new Date().toISOString().split('T')[0]}</strong></span>
                </div>
              </div>

              {/* Block A: General Parcel Info */}
              <div className="mb-3">
                <div className="bg-slate-900 text-white font-bold px-2 py-1 uppercase text-[10px] flex items-center justify-between">
                  <span>I. DATOS GENERALES DEL PREDIO Y TITULAR</span>
                  <span className="font-mono text-[9px]">{project.propertyType || 'RURAL'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-slate-50 border border-slate-300 border-t-0 text-[10px]">
                  <div>
                    <span className="text-slate-500 block">Nombre del Predio:</span>
                    <strong className="text-slate-900">{project.propertyName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Titular / Posesionario:</span>
                    <strong className="text-slate-900">{project.owner}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Doc. Identidad:</span>
                    <strong className="text-slate-900">{project.docType}: {project.docNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Trámite Catastral:</span>
                    <strong className="text-slate-900">{project.procedureType}</strong>
                  </div>
                </div>
              </div>

              {/* Block B: Politic & Cartographic Location */}
              <div className="mb-3">
                <div className="bg-slate-900 text-white font-bold px-2 py-1 uppercase text-[10px]">
                  II. UBICACIÓN POLÍTICA Y SISTEMA DE REFERENCIA GEODÉSICO
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-slate-50 border border-slate-300 border-t-0 text-[10px]">
                  <div>
                    <span className="text-slate-500 block">Departamento:</span>
                    <strong>{project.department}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Provincia / Distrito:</span>
                    <strong>{project.province} / {project.district}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sector / C. Poblado:</span>
                    <strong>{project.sector || project.centerPopulated || 'S/N'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sistema Geodésico:</span>
                    <strong className="font-mono">{sysInfo.name} (EPSG {sysInfo.epsg})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Zona UTM / Hemisferio:</span>
                    <strong>Zona {sysInfo.utmZone}S</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Método de Levantamiento:</span>
                    <strong>{localConfig.metodoLevantamiento}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Estación IGN de Amarre:</span>
                    <strong className="text-[9px]">{localConfig.estacionBaseIGN}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tolerancia SNCP Aplicada:</span>
                    <strong>{localConfig.toleranciaCatastralM.toFixed(2)} m ({localConfig.ambitoTolerancia})</strong>
                  </div>
                </div>
              </div>

              {/* Block C: Areas and Perimeters */}
              <div className="mb-3">
                <div className="bg-slate-900 text-white font-bold px-2 py-1 uppercase text-[10px] flex items-center justify-between">
                  <span>III. RESUMEN DE SUPERFICIE Y PERÍMETRO</span>
                  <span>{vertices.length} VÉRTICES</span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-emerald-50 border border-emerald-300 border-t-0 text-center text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Área en Metros Cuadrados:</span>
                    <span className="text-sm font-black text-emerald-900">
                      {stats?.areaM2.toLocaleString('es-PE', {
                        minimumFractionDigits: localConfig.decimalesArea,
                        maximumFractionDigits: localConfig.decimalesArea,
                      }) || '0.00'}{' '}
                      m²
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Área en Hectáreas:</span>
                    <span className="text-sm font-black text-emerald-900">
                      {stats?.areaHa.toFixed(4) || '0.0000'} ha
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Perímetro Total:</span>
                    <span className="text-sm font-black text-emerald-900">
                      {stats?.perimeterM.toFixed(2) || '0.00'} ml
                    </span>
                  </div>
                </div>
              </div>

              {/* Block D: Construction Table Preview */}
              <div className="mb-3">
                <div className="bg-slate-900 text-white font-bold px-2 py-1 uppercase text-[10px]">
                  IV. CUADRO DE DATOS TÉCNICOS (FORMATO SNCP)
                </div>
                <div className="border border-slate-300 border-t-0 overflow-x-auto">
                  <table className="w-full text-[9px] text-left border-collapse">
                    <thead className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-1 border-r border-slate-300">VÉRT.</th>
                        <th className="p-1 border-r border-slate-300">LADO</th>
                        <th className="p-1 border-r border-slate-300 text-right">DIST. (m)</th>
                        {localConfig.formatoAngular !== 'RUMBO' && (
                          <th className="p-1 border-r border-slate-300">AZIMUT</th>
                        )}
                        {localConfig.formatoAngular !== 'AZIMUT_DMS' && (
                          <th className="p-1 border-r border-slate-300">RUMBO</th>
                        )}
                        <th className="p-1 border-r border-slate-300 text-right">
                          ESTE (X) [{localConfig.decimalesCoordenadas} dec.]
                        </th>
                        <th className="p-1 border-r border-slate-300 text-right">
                          NORTE (Y) [{localConfig.decimalesCoordenadas} dec.]
                        </th>
                        <th className="p-1">COLINDANCIA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {technicalTable.slice(0, 8).map((r, i) => (
                        <tr key={r.vertex} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-1 border-r border-slate-200 font-bold">{r.vertex}</td>
                          <td className="p-1 border-r border-slate-200">
                            {r.vertex}-{r.nextVertex}
                          </td>
                          <td className="p-1 border-r border-slate-200 text-right font-mono">
                            {r.distanceFormatted}
                          </td>
                          {localConfig.formatoAngular !== 'RUMBO' && (
                            <td className="p-1 border-r border-slate-200 font-mono">{r.azimuth}</td>
                          )}
                          {localConfig.formatoAngular !== 'AZIMUT_DMS' && (
                            <td className="p-1 border-r border-slate-200 font-mono">{r.bearing}</td>
                          )}
                          <td className="p-1 border-r border-slate-200 text-right font-mono font-medium">
                            {parseFloat(r.east).toFixed(localConfig.decimalesCoordenadas)}
                          </td>
                          <td className="p-1 border-r border-slate-200 text-right font-mono font-medium">
                            {parseFloat(r.north).toFixed(localConfig.decimalesCoordenadas)}
                          </td>
                          <td className="p-1 text-slate-700 truncate max-w-[140px]">{r.colindancia}</td>
                        </tr>
                      ))}
                      {technicalTable.length > 8 && (
                        <tr>
                          <td colSpan={8} className="p-1 text-center italic text-slate-500 bg-slate-100">
                            ... y {technicalTable.length - 8} vértices más en la lámina completa.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Block E: Signatures and Certification */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-300">
                <div className="text-center">
                  <div className="h-16 flex items-end justify-center">
                    <div className="w-48 border-b border-slate-800" />
                  </div>
                  <div className="font-bold text-[10px] text-slate-900 mt-1">{project.owner}</div>
                  <div className="text-[9px] text-slate-500">
                    {project.docType} N° {project.docNumber}
                  </div>
                  <div className="text-[8px] text-slate-400 uppercase">TITULAR / POSESIONARIO</div>
                </div>

                <div className="text-center">
                  <div className="h-16 flex items-center justify-center relative">
                    {localConfig.selloFirmaUrl ? (
                      <img
                        src={localConfig.selloFirmaUrl}
                        alt="Firma"
                        className="max-h-14 max-w-full object-contain"
                      />
                    ) : (
                      <div className="border border-dashed border-slate-400 rounded px-3 py-1 text-[8px] text-slate-400">
                        [ Sello y Firma Digitalizada ]
                      </div>
                    )}
                  </div>
                  <div className="w-56 mx-auto border-b border-slate-800" />
                  <div className="font-bold text-[10px] text-slate-900 mt-1">
                    {localConfig.verificadorNombre}
                  </div>
                  <div className="text-[9px] text-slate-600 font-mono">
                    {localConfig.tipoColegiatura} N° {localConfig.numeroColegiatura} | Reg. SUNARP:{' '}
                    {localConfig.verificadorIndiceSunarp}
                  </div>
                  <div className="text-[8px] text-slate-400 uppercase">
                    {localConfig.cargoProfesional}
                  </div>
                </div>
              </div>

              {/* Legal Footer Note */}
              <div className="mt-4 pt-2 border-t border-slate-200 text-[8px] text-slate-500 text-center">
                {localConfig.notaDescargoPersonalizada}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="px-3.5 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Configuración activa:</span>
          <span className="font-medium text-slate-200">{localConfig.rotuloPersonalizado}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Precisión: <strong className="text-emerald-400 font-mono">{localConfig.decimalesCoordenadas} dec.</strong></span>
          <span>Tolerancia: <strong className="text-slate-200 font-mono">{localConfig.toleranciaCatastralM}m</strong></span>
        </div>
      </div>
    </div>
  );
};
