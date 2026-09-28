export type CoordinateSystem =
  | 'UTM_WGS84_17S'
  | 'UTM_WGS84_18S'
  | 'UTM_WGS84_19S'
  | 'GEOGRAPHIC_WGS84'
  | 'PSAD56_17S'
  | 'PSAD56_18S'
  | 'PSAD56_19S';

export interface CoordinateSystemInfo {
  id: CoordinateSystem;
  name: string;
  datum: 'WGS84' | 'PSAD56';
  projection: 'UTM' | 'Geográficas';
  utmZone?: '17' | '18' | '19';
  hemisphere: 'S' | 'N';
  epsg: number;
  description: string;
  isOfficial: boolean;
  warning?: string;
}

export interface Vertex {
  id: string;
  vertexNumber: string; // V1, V2, V3...
  x: number; // Este en UTM o Longitud en Geográficas
  y: number; // Norte en UTM o Latitud en Geográficas
  z?: number; // Altitud ortométrica / elipsoidal en metros
  description?: string; // e.g. "Hito de concreto", "Esquina cercado"
  colindancia?: string; // e.g. "Propiedad de Juan Pérez", "Camino carrozable"
}

export interface TechnicalSideRow {
  vertex: string;
  nextVertex: string;
  distance: number; // metros
  distanceFormatted: string;
  azimuth: string; // formato DD°MM'SS"
  azimuthDeg: number;
  rumbo: string; // formato N 45°20'10" E
  bearing?: string; // alias en inglés
  east: string; // X con 4 decimales
  north: string; // Y con 4 decimales
  colindancia: string;
}

export interface GeometryStats {
  areaM2: number;
  areaHa: number;
  perimeterM: number;
  verticesCount: number;
  centroid: [number, number]; // [lat, lng]
  utmCentroid: [number, number]; // [x, y]
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  isClosed: boolean;
  isClockwise: boolean;
}

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  affectedVertices?: string[];
  recommendation?: string;
}

export interface ValidationReport {
  status: 'VALID' | 'WARNING' | 'ERROR';
  issues: ValidationIssue[];
  checks: {
    closed: boolean;
    noSelfIntersections: boolean;
    noDuplicates: boolean;
    inPeruBounds: boolean;
    validUtmZone: boolean;
    minVertices: boolean;
  };
}

export type PropertyType = 'Rural' | 'Urbano' | 'Agrícola' | 'Eriazo' | 'Otros';

export type ProcedureType =
  | 'Inmatriculación'
  | 'Subdivisión'
  | 'Acumulación'
  | 'Rectificación de Áreas y Linderos'
  | 'Búsqueda Catastral'
  | 'Visación de Planos'
  | 'Prescripción Adquisitiva'
  | 'Saneamiento de Bienes Estatales';

export type DestinationEntity =
  | 'SUNARP (Registro de Predios)'
  | 'COFOPRI'
  | 'Gobierno Regional (GORE - Dirección de Agricultura)'
  | 'Municipalidad Provincial'
  | 'Municipalidad Distrital'
  | 'MIDAGRI'
  | 'SBN (Superintendencia Nacional de Bienes Estatales)';

export interface Project {
  id: string;
  code: string;
  name: string;
  propertyName: string;
  owner: string;
  docType: 'DNI' | 'RUC' | 'CE';
  docNumber: string;
  department: string;
  province: string;
  district: string;
  centerPopulated: string;
  sector: string;
  propertyType: PropertyType;
  procedureType: ProcedureType;
  destinationEntity: DestinationEntity;
  professional: string;
  professionalReg: string; // CIP o CAP
  professionalType?: 'Ingeniero Civil' | 'Ingeniero Agrícola' | 'Ingeniero Geógrafo' | 'Arquitecto' | 'Topógrafo Colegiado';
  surveyDate: string;
  observations: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: number;
}

export interface VersionSnapshot {
  id: string;
  versionNumber: number;
  timestamp: string;
  vertices: Vertex[];
  areaM2: number;
  perimeterM: number;
  note: string;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  timestamp: string;
  user: string;
  verticesCount: number;
  areaM2: number;
  perimeterM: number;
  notes: string;
  verticesSnapshot: Vertex[];
}

export interface CartographicLayer {
  id: string;
  name: string;
  entity: string; // IGN, INGEMMET, SERNANP, MINEDU, MTC, etc.
  category: 'Límites' | 'Topografía' | 'Áreas Protegidas' | 'Infraestructura' | 'Hidrografía' | 'Zonas UTM';
  source: string;
  updateDate: string;
  system: string;
  url?: string;
  isOfficialCadastral: boolean; // True = oficial con valor registral, False = capa de referencia
  visible: boolean;
  opacity: number;
  color?: string;
}

export type FichaStandardType =
  | 'SNCP_INDIVIDUAL'
  | 'SNCP_RURAL_MIDAGRI'
  | 'SUNARP_SANEAMIENTO'
  | 'MUNICIPAL_CATASTRO';

export interface FichaConfig {
  // 1. Plantilla y Estándar
  fichaStandard: FichaStandardType;
  sheetCode: string; // e.g. "F-01" o "PP-01"
  formatoLamina: 'A4' | 'A3' | 'A2' | 'A1';
  escalaPredeterminada: 'AUTO' | '1:500' | '1:1000' | '1:2500' | '1:5000' | '1:10000';

  // 2. Membrete & Identidad Institucional
  entidadEmisora: string;
  consultoraEmpresa: string;
  rotuloPersonalizado: string;

  // 3. Verificador Catastral & Colegiatura
  verificadorNombre: string;
  verificadorIndiceSunarp: string;
  zonaRegistral: string;
  tipoColegiatura: 'CIP' | 'CAP' | 'TOP';
  numeroColegiatura: string;
  cargoProfesional: string;
  selloFirmaUrl?: string;

  // 4. Parámetros de Equipos GNSS y Georreferenciación
  metodoLevantamiento:
    | 'GNSS Diferencial RTK'
    | 'GNSS Estático Posproceso'
    | 'Estación Total'
    | 'Dron Fotogramétrico RTK'
    | 'Mixto (GNSS + Estación Total)';
  equipoMarcaModelo: string;
  estacionBaseIGN: string;
  epocaWGS84: string;
  precisionHorizontalMm: number;
  precisionVerticalMm: number;

  // 5. Configuración de Precisión Numérica y Tolerancias
  decimalesCoordenadas: 2 | 3 | 4;
  decimalesArea: 2 | 4;
  formatoAngular: 'AZIMUT_DMS' | 'RUMBO' | 'AMBOS';
  toleranciaCatastralM: number;
  ambitoTolerancia: 'Urbano (0.20m)' | 'Rural Directo (0.50m)' | 'Rural Cartográfico (2.50m)';

  // 6. Visualización y Estilos Cartográficos del Aplicativo
  colorPoligono: string;
  grosorLinea: number;
  mostrarCuadriculaUTM: boolean;
  mostrarEtiquetasVertices: boolean;
  mostrarCotasZ: boolean;
  mostrarColindanciasEnPlano: boolean;

  // 7. Notas Técnicas y Descargos
  notaDescargoPersonalizada: string;
}

export const DEFAULT_FICHA_CONFIG: FichaConfig = {
  fichaStandard: 'SNCP_INDIVIDUAL',
  sheetCode: 'FC-01',
  formatoLamina: 'A4',
  escalaPredeterminada: 'AUTO',
  entidadEmisora: 'SISTEMA NACIONAL INTEGRADO DE INFORMACIÓN CATASTRAL PREDIAL - SNCP',
  consultoraEmpresa: 'GEO-CONSULTORES TOPOGRÁFICOS & ASOCIADOS S.A.C.',
  rotuloPersonalizado: 'FICHA TÉCNICA CATASTRAL DE SANEAMIENTO FÍSICO LEGAL',
  verificadorNombre: 'ING. CARLOS MENDOZA ARCE',
  verificadorIndiceSunarp: 'VC-02847-ZR-IX',
  zonaRegistral: 'Zona Registral N° IX - Sede Lima (Oficina Registral Ica / Ocucaje)',
  tipoColegiatura: 'CIP',
  numeroColegiatura: '164820',
  cargoProfesional: 'Verificador Catastral Acreditado SNCP / SUNARP',
  metodoLevantamiento: 'GNSS Diferencial RTK',
  equipoMarcaModelo: 'Receptor GNSS Geodésico Multifrecuencia RTK South Galaxy G7 (220 Canales)',
  estacionBaseIGN: 'IGN ERP-LIM01 (Red Geodésica Geocéntrica Nacional REGGEN)',
  epocaWGS84: 'WGS84 Época 2017.0 (SIRGAS)',
  precisionHorizontalMm: 8,
  precisionVerticalMm: 15,
  decimalesCoordenadas: 4,
  decimalesArea: 2,
  formatoAngular: 'AMBOS',
  toleranciaCatastralM: 0.5,
  ambitoTolerancia: 'Rural Directo (0.50m)',
  colorPoligono: '#10b981',
  grosorLinea: 2,
  mostrarCuadriculaUTM: true,
  mostrarEtiquetasVertices: true,
  mostrarCotasZ: false,
  mostrarColindanciasEnPlano: true,
  notaDescargoPersonalizada:
    'El presente documento técnico y su cartografía asociada han sido elaborados conforme a la Ley N° 28294 (Ley del SNCP), D.S. N° 005-2006-JUS y directivas vinculadas de SUNARP.',
};
