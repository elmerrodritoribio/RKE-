import { Vertex, CoordinateSystem } from '../types';

export interface ParseResult {
  vertices: Vertex[];
  detectedFormat: string;
  errors: string[];
  suggestedSystem?: CoordinateSystem;
}

/**
 * Parses raw text copied from Excel or from CSV/TXT files.
 * Format examples:
 * Vértice | Este | Norte | Altitud | Descripción
 * V1 283120.45 8645210.12 150.0 Hito 1
 */
export function parseRawText(text: string): ParseResult {
  const lines = text.trim().split(/\r?\n/);
  const vertices: Vertex[] = [];
  const errors: string[] = [];

  if (lines.length === 0) {
    return { vertices: [], detectedFormat: 'vacío', errors: ['El texto está vacío.'] };
  }

  // Check if first line is a header
  let startIdx = 0;
  const firstLine = lines[0].toLowerCase();
  if (
    firstLine.includes('vert') ||
    firstLine.includes('este') ||
    firstLine.includes('norte') ||
    firstLine.includes('long') ||
    firstLine.includes('lat') ||
    firstLine.includes('punto') ||
    firstLine.includes('x') ||
    firstLine.includes('y')
  ) {
    startIdx = 1;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Split by comma, tab, semicolon, or multiple spaces
    let tokens: string[] = [];
    if (rawLine.includes('\t')) {
      tokens = rawLine.split('\t');
    } else if (rawLine.includes(';')) {
      tokens = rawLine.split(';');
    } else if (rawLine.includes(',')) {
      tokens = rawLine.split(',');
    } else {
      tokens = rawLine.split(/\s+/);
    }

    tokens = tokens.map((t) => t.trim()).filter((t) => t.length > 0);

    if (tokens.length < 2) {
      errors.push(`Línea ${i + 1}: Faltan coordenadas mínimas.`);
      continue;
    }

    // Identify vertex label, X, Y, Z, description
    let vLabel = `V${vertices.length + 1}`;
    let xStr = '';
    let yStr = '';
    let zStr = '';
    let descStr = '';

    // If first token is not a number, treat as vertex label
    const firstNum = parseCleanNumber(tokens[0]);
    let colOffset = 0;

    if (isNaN(firstNum)) {
      vLabel = tokens[0].replace(/^["']|["']$/g, '');
      colOffset = 1;
    }

    if (tokens.length > colOffset + 1) {
      xStr = tokens[colOffset];
      yStr = tokens[colOffset + 1];
    }

    if (tokens.length > colOffset + 2) {
      zStr = tokens[colOffset + 2];
    }

    if (tokens.length > colOffset + 3) {
      descStr = tokens.slice(colOffset + 3).join(' ').replace(/^["']|["']$/g, '');
    }

    const x = parseCleanNumber(xStr);
    const y = parseCleanNumber(yStr);
    const z = zStr ? parseCleanNumber(zStr) : undefined;

    if (isNaN(x) || isNaN(y)) {
      errors.push(`Línea ${i + 1}: Coordenadas inválidas ("${xStr}", "${yStr}").`);
      continue;
    }

    vertices.push({
      id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      vertexNumber: vLabel,
      x,
      y,
      z: !isNaN(z as number) ? z : 0,
      description: descStr,
      colindancia: 'Predio colindante',
    });
  }

  // Suggest coordinate system based on coordinate ranges
  let suggestedSystem: CoordinateSystem = 'UTM_WGS84_18S';
  if (vertices.length > 0) {
    const sample = vertices[0];
    if (Math.abs(sample.x) <= 180 && Math.abs(sample.y) <= 90) {
      suggestedSystem = 'GEOGRAPHIC_WGS84';
    } else if (sample.x >= 100000 && sample.x <= 900000 && sample.y >= 7000000 && sample.y <= 10000000) {
      suggestedSystem = 'UTM_WGS84_18S';
    }
  }

  return {
    vertices,
    detectedFormat: lines[0].includes('\t') ? 'Excel / Tabulado' : 'CSV / Texto',
    errors,
    suggestedSystem,
  };
}

/**
 * Parses GeoJSON text and extracts polygon vertices
 */
export function parseGeoJSON(content: string): ParseResult {
  try {
    const data = JSON.parse(content);
    let coords: number[][] = [];

    if (data.type === 'FeatureCollection' && data.features?.length > 0) {
      const geom = data.features[0].geometry;
      if (geom.type === 'Polygon') coords = geom.coordinates[0];
    } else if (data.type === 'Feature' && data.geometry?.type === 'Polygon') {
      coords = data.geometry.coordinates[0];
    } else if (data.type === 'Polygon') {
      coords = data.coordinates[0];
    }

    if (!coords || coords.length === 0) {
      return { vertices: [], detectedFormat: 'GeoJSON', errors: ['No se encontró geometría de Polígono válida.'] };
    }

    // Remove closing duplicate vertex if present
    const pts = [...coords];
    if (
      pts.length > 3 &&
      pts[0][0] === pts[pts.length - 1][0] &&
      pts[0][1] === pts[pts.length - 1][1]
    ) {
      pts.pop();
    }

    const vertices: Vertex[] = pts.map((pt, idx) => ({
      id: `v-geojson-${idx}`,
      vertexNumber: `V${idx + 1}`,
      x: pt[0], // Longitude
      y: pt[1], // Latitude
      z: pt[2] || 0,
      description: 'Importado de GeoJSON',
      colindancia: 'Predio colindante',
    }));

    return {
      vertices,
      detectedFormat: 'GeoJSON',
      errors: [],
      suggestedSystem: 'GEOGRAPHIC_WGS84',
    };
  } catch (err: any) {
    return { vertices: [], detectedFormat: 'GeoJSON', errors: [`Error de sintaxis JSON: ${err.message}`] };
  }
}

/**
 * Parses KML text and extracts polygon coordinates
 */
export function parseKML(content: string): ParseResult {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(content, 'text/xml');
    const coordsNode = xml.querySelector('coordinates');

    if (!coordsNode || !coordsNode.textContent) {
      return { vertices: [], detectedFormat: 'KML', errors: ['No se encontró etiqueta <coordinates> en el KML.'] };
    }

    const text = coordsNode.textContent.trim();
    const rawPairs = text.split(/\s+/);
    const vertices: Vertex[] = [];

    rawPairs.forEach((pair, idx) => {
      const parts = pair.split(',');
      if (parts.length >= 2) {
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        const z = parts[2] ? parseFloat(parts[2]) : 0;

        if (!isNaN(lng) && !isNaN(lat)) {
          vertices.push({
            id: `v-kml-${idx}`,
            vertexNumber: `V${idx + 1}`,
            x: lng,
            y: lat,
            z,
            description: 'Importado de KML',
            colindancia: 'Predio colindante',
          });
        }
      }
    });

    // Remove closing duplicate
    if (
      vertices.length > 3 &&
      vertices[0].x === vertices[vertices.length - 1].x &&
      vertices[0].y === vertices[vertices.length - 1].y
    ) {
      vertices.pop();
    }

    return {
      vertices,
      detectedFormat: 'Google Earth KML',
      errors: [],
      suggestedSystem: 'GEOGRAPHIC_WGS84',
    };
  } catch (err: any) {
    return { vertices: [], detectedFormat: 'KML', errors: [`Error al procesar KML: ${err.message}`] };
  }
}

function parseCleanNumber(val: string): number {
  if (!val) return NaN;
  // Replace comma with dot if used as decimal separator
  const cleaned = val.replace(/,/g, '.');
  return parseFloat(cleaned);
}

// -------------------------------------------------------------
// PRESET SAMPLE PARCELS FOR INSTANT ACCURATE DEMONSTRATION
// -------------------------------------------------------------

export interface SampleParcel {
  id: string;
  name: string;
  department: string;
  province: string;
  district: string;
  system: CoordinateSystem;
  propertyType: 'Rural' | 'Urbano' | 'Agrícola' | 'Eriazo' | 'Otros';
  description: string;
  vertices: Vertex[];
}

export const SAMPLE_PARCELS: SampleParcel[] = [
  {
    id: 'sample-ica-18s',
    name: 'Fundo "El Olivar de Ocucaje"',
    department: 'ICA',
    province: 'ICA',
    district: 'OCUCAJE',
    system: 'UTM_WGS84_18S',
    propertyType: 'Agrícola',
    description: 'Predio agrícola en el Valle de Ica, levantado con GNSS diferencial en Zona 18 Sur (WGS84). Polígono cerrado de 6 vértices.',
    vertices: [
      { id: 'v1', vertexNumber: 'V1', x: 418520.45, y: 8412350.80, z: 320.5, description: 'Hito H-01 Concreto', colindancia: 'Propiedad de Agrícola Don Mateo S.A.C.' },
      { id: 'v2', vertexNumber: 'V2', x: 418790.12, y: 8412490.25, z: 322.0, description: 'Hito H-02 Tubo Fierro', colindancia: 'Acequia de regadío matriz' },
      { id: 'v3', vertexNumber: 'V3', x: 418940.88, y: 8412150.60, z: 319.4, description: 'Hito H-03 Esquina cerco', colindancia: 'Fundo Santa Rosa (Posesión)' },
      { id: 'v4', vertexNumber: 'V4', x: 418810.35, y: 8411890.15, z: 318.0, description: 'Hito H-04 Muro pirca', colindancia: 'Camino carrozable afirmado' },
      { id: 'v5', vertexNumber: 'V5', x: 418460.70, y: 8411980.50, z: 316.8, description: 'Hito H-05 Concreto', colindancia: 'Parcela N° 44 Sector Ocucaje' },
      { id: 'v6', vertexNumber: 'V6', x: 418380.20, y: 8412190.90, z: 318.9, description: 'Hito H-06 Estaca madera', colindancia: 'Propiedad de Familia Benavides' },
    ],
  },
  {
    id: 'sample-piura-17s',
    name: 'Parcela Rural "San Isidro de Sechura"',
    department: 'PIURA',
    province: 'SECHURA',
    district: 'SECHURA',
    system: 'UTM_WGS84_17S',
    propertyType: 'Rural',
    description: 'Predio rural en la costa norte del Perú, Zona 17 Sur (WGS84). Polígono de 5 vértices.',
    vertices: [
      { id: 'vp1', vertexNumber: 'V1', x: 521350.25, y: 9385620.40, z: 25.0, description: 'Hito V1 Concreto', colindancia: 'Comunidad Campesina San Martín' },
      { id: 'vp2', vertexNumber: 'V2', x: 521680.90, y: 9385790.80, z: 24.5, description: 'Hito V2 Esquina', colindancia: 'Canal de derivación lateral' },
      { id: 'vp3', vertexNumber: 'V3', x: 521820.40, y: 9385390.10, z: 22.8, description: 'Hito V3 Concreto', colindancia: 'Terrenos eriazos del Estado' },
      { id: 'vp4', vertexNumber: 'V4', x: 521490.65, y: 9385210.75, z: 23.2, description: 'Hito V4 Estaca', colindancia: 'Propiedad de Pedro Morales' },
      { id: 'vp5', vertexNumber: 'V5', x: 521270.15, y: 9385410.30, z: 24.0, description: 'Hito V5 Hito IGN', colindancia: 'Trocha carrozable de acceso' },
    ],
  },
  {
    id: 'sample-arequipa-19s',
    name: 'Fundo "Chilina Alta"',
    department: 'AREQUIPA',
    province: 'AREQUIPA',
    district: 'ALTO SELVA ALEGRE',
    system: 'UTM_WGS84_19S',
    propertyType: 'Rural',
    description: 'Predio en la cuenca del Río Chili, Zona 19 Sur (WGS84). 5 vértices con topografía andina.',
    vertices: [
      { id: 'va1', vertexNumber: 'V1', x: 228450.10, y: 8185620.50, z: 2450.0, description: 'Hito H-1 Roca fijada', colindancia: 'Ribera del Río Chili' },
      { id: 'va2', vertexNumber: 'V2', x: 228720.80, y: 8185810.20, z: 2465.0, description: 'Hito H-2 Muro andén', colindancia: 'Camino vecinal Chilina' },
      { id: 'va3', vertexNumber: 'V3', x: 228890.30, y: 8185490.60, z: 2480.0, description: 'Hito H-3 Hito concreto', colindancia: 'Comunidad Campesina Cayma' },
      { id: 'va4', vertexNumber: 'V4', x: 228610.70, y: 8185320.10, z: 2470.0, description: 'Hito H-4 Esquina pirca', colindancia: 'Propiedad de Carlos Valdivia' },
      { id: 'va5', vertexNumber: 'V5', x: 228390.45, y: 8185440.85, z: 2455.0, description: 'Hito H-5 Tubo fierro', colindancia: 'Canal de regadío Acequia Alta' },
    ],
  },
  {
    id: 'sample-error-intersection',
    name: 'Demostración de Error Topológico (Linderos Cruzados)',
    department: 'LIMA',
    province: 'LIMA',
    district: 'LURIN',
    system: 'UTM_WGS84_18S',
    propertyType: 'Urbano',
    description: 'Predio con orden alterado de vértices que genera una autointersección (lazo en forma de 8) para probar el módulo GeoCheck.',
    vertices: [
      { id: 've1', vertexNumber: 'V1', x: 290100.0, y: 8640000.0, z: 45.0, description: 'Hito V1', colindancia: 'Calle Los Pinos' },
      { id: 've2', vertexNumber: 'V2', x: 290400.0, y: 8640300.0, z: 48.0, description: 'Hito V2', colindancia: 'Propiedad colindante' },
      { id: 've3', vertexNumber: 'V3', x: 290100.0, y: 8640300.0, z: 46.0, description: 'Hito V3 (Alterado)', colindancia: 'Calle Principal' },
      { id: 've4', vertexNumber: 'V4', x: 290400.0, y: 8640000.0, z: 47.0, description: 'Hito V4 (Alterado)', colindancia: 'Av. Las Palmas' },
    ],
  },
];
