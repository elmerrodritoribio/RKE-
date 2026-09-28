import proj4 from 'proj4';
import {
  CoordinateSystem,
  CoordinateSystemInfo,
  Vertex,
  TechnicalSideRow,
  GeometryStats,
  ValidationReport,
  ValidationIssue,
} from '../types';

// Register standard projections for Peru
// WGS84 UTM Zones 17S, 18S, 19S
proj4.defs('EPSG:32717', '+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:32718', '+proj=utm +zone=18 +south +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:32719', '+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs');

// PSAD56 UTM Zones (Provisional South American 1956)
proj4.defs('EPSG:24877', '+proj=utm +zone=17 +south +ellps=intl +towgs84=-288,175,-376,0,0,0,0 +units=m +no_defs');
proj4.defs('EPSG:24878', '+proj=utm +zone=18 +south +ellps=intl +towgs84=-288,175,-376,0,0,0,0 +units=m +no_defs');
proj4.defs('EPSG:24879', '+proj=utm +zone=19 +south +ellps=intl +towgs84=-288,175,-376,0,0,0,0 +units=m +no_defs');

// Geographic WGS84
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

export const COORDINATE_SYSTEMS: Record<CoordinateSystem, CoordinateSystemInfo> = {
  UTM_WGS84_18S: {
    id: 'UTM_WGS84_18S',
    name: 'WGS84 / UTM Zona 18 Sur (Oficial)',
    datum: 'WGS84',
    projection: 'UTM',
    utmZone: '18',
    hemisphere: 'S',
    epsg: 32718,
    description: 'Sistema oficial para Lima, Callao, Ancash, Ica, Junín, Pasco, Huánuco, Ayacucho, Huancavelica.',
    isOfficial: true,
  },
  UTM_WGS84_17S: {
    id: 'UTM_WGS84_17S',
    name: 'WGS84 / UTM Zona 17 Sur (Oficial)',
    datum: 'WGS84',
    projection: 'UTM',
    utmZone: '17',
    hemisphere: 'S',
    epsg: 32717,
    description: 'Sistema oficial para Tumbes, Piura, Lambayeque, La Libertad y Cajamarca occidental.',
    isOfficial: true,
  },
  UTM_WGS84_19S: {
    id: 'UTM_WGS84_19S',
    name: 'WGS84 / UTM Zona 19 Sur (Oficial)',
    datum: 'WGS84',
    projection: 'UTM',
    utmZone: '19',
    hemisphere: 'S',
    epsg: 32719,
    description: 'Sistema oficial para Puno, Tacna, Moquegua, Madre de Dios y selva suroriental.',
    isOfficial: true,
  },
  GEOGRAPHIC_WGS84: {
    id: 'GEOGRAPHIC_WGS84',
    name: 'Geográficas WGS84 (Latitud / Longitud)',
    datum: 'WGS84',
    projection: 'Geográficas',
    hemisphere: 'S',
    epsg: 4326,
    description: 'Coordenadas esféricas en grados decimales (Latitud negativa en Perú).',
    isOfficial: true,
  },
  PSAD56_18S: {
    id: 'PSAD56_18S',
    name: 'PSAD56 / UTM Zona 18 Sur (Histórico)',
    datum: 'PSAD56',
    projection: 'UTM',
    utmZone: '18',
    hemisphere: 'S',
    epsg: 24878,
    description: 'Antiguo sistema provisional. Desfase aproximado de 380m a 420m respecto a WGS84.',
    isOfficial: false,
    warning: 'La directiva SUNARP exige transformación técnica a WGS84 para actos registrales.',
  },
  PSAD56_17S: {
    id: 'PSAD56_17S',
    name: 'PSAD56 / UTM Zona 17 Sur (Histórico)',
    datum: 'PSAD56',
    projection: 'UTM',
    utmZone: '17',
    hemisphere: 'S',
    epsg: 24877,
    description: 'Antiguo sistema provisional para la costa norte del Perú.',
    isOfficial: false,
    warning: 'Requiere transformación a WGS84 oficial para presentación formal.',
  },
  PSAD56_19S: {
    id: 'PSAD56_19S',
    name: 'PSAD56 / UTM Zona 19 Sur (Histórico)',
    datum: 'PSAD56',
    projection: 'UTM',
    utmZone: '19',
    hemisphere: 'S',
    epsg: 24879,
    description: 'Antiguo sistema provisional para el sur y oriente peruano.',
    isOfficial: false,
    warning: 'Requiere transformación a WGS84 oficial para presentación formal.',
  },
};

/**
 * Converts a point [x, y] in the given coordinate system to WGS84 Lat/Lng [lat, lng]
 */
export function toLatLng(x: number, y: number, system: CoordinateSystem): [number, number] {
  if (system === 'GEOGRAPHIC_WGS84') {
    // If entered as Longitude (x) and Latitude (y)
    // In Peru, Longitude is approx -81 to -68, Latitude is approx 0 to -18
    let lng = x;
    let lat = y;
    if (Math.abs(x) < 20 && Math.abs(y) > 60) {
      // Swapped inputs (Lat, Lng)
      lat = x;
      lng = y;
    }
    return [lat, lng];
  }

  const info = COORDINATE_SYSTEMS[system];
  const sourceProj = `EPSG:${info.epsg}`;

  try {
    const [lng, lat] = proj4(sourceProj, 'EPSG:4326', [x, y]);
    return [lat, lng];
  } catch (err) {
    console.error('Error transforming coordinate to LatLng:', err);
    return [-12.0464, -77.0428]; // Fallback to Lima center
  }
}

/**
 * Converts a point [x, y] in the source coordinate system to metric UTM coordinates [x_utm, y_utm]
 * in the active UTM zone for accurate metric geometry calculations.
 */
export function toUtmMetric(x: number, y: number, system: CoordinateSystem): [number, number] {
  if (system.startsWith('UTM_WGS84_')) {
    return [x, y];
  }

  if (system === 'GEOGRAPHIC_WGS84') {
    // Determine the closest UTM zone for Peru based on longitude
    let lng = x;
    let lat = y;
    if (Math.abs(x) < 20 && Math.abs(y) > 60) {
      lat = x;
      lng = y;
    }
    let targetEpsg = 'EPSG:32718'; // default 18S
    if (lng < -78) targetEpsg = 'EPSG:32717'; // 17S
    else if (lng > -72) targetEpsg = 'EPSG:32719'; // 19S

    try {
      const [east, north] = proj4('EPSG:4326', targetEpsg, [lng, lat]);
      return [east, north];
    } catch {
      return [x, y];
    }
  }

  // If PSAD56, project through WGS84 to standard metric
  const info = COORDINATE_SYSTEMS[system];
  try {
    const [lng, lat] = proj4(`EPSG:${info.epsg}`, 'EPSG:4326', [x, y]);
    let targetEpsg = 'EPSG:32718';
    if (info.utmZone === '17') targetEpsg = 'EPSG:32717';
    if (info.utmZone === '19') targetEpsg = 'EPSG:32719';
    const [east, north] = proj4('EPSG:4326', targetEpsg, [lng, lat]);
    return [east, north];
  } catch {
    return [x, y];
  }
}

/**
 * Converts decimal angle in degrees [0, 360) to DD°MM'SS.ss"
 */
export function formatDMS(degrees: number): string {
  let normalized = ((degrees % 360) + 360) % 360;
  const d = Math.floor(normalized);
  const minFloat = (normalized - d) * 60;
  const m = Math.floor(minFloat);
  const s = ((minFloat - m) * 60).toFixed(1);
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(4, '0')}"`;
}

/**
 * Computes the Rumbo (Quadrant Bearing) from Azimuth
 * e.g., 45.5° -> N 45°30'00" E, 135° -> S 45°00'00" E
 */
export function calculateRumbo(azimuthDeg: number): string {
  const norm = ((azimuthDeg % 360) + 360) % 360;
  if (norm >= 0 && norm < 90) {
    return `N ${formatDMS(norm)} E`;
  } else if (norm >= 90 && norm < 180) {
    return `S ${formatDMS(180 - norm)} E`;
  } else if (norm >= 180 && norm < 270) {
    return `S ${formatDMS(norm - 180)} W`;
  } else {
    return `N ${formatDMS(360 - norm)} W`;
  }
}

/**
 * Deterministic Area calculation using the Gauss / Shoelace formula:
 * Area = 0.5 * | sum(X_i * Y_{i+1} - X_{i+1} * Y_i) |
 */
export function calculateArea(points: [number, number][]): number {
  const n = points.length;
  if (n < 3) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sum += points[i][0] * points[j][1] - points[j][0] * points[i][1];
  }
  return Math.abs(sum) / 2.0;
}

/**
 * Deterministic Perimeter calculation:
 * Perimeter = sum( sqrt( (X_{i+1} - X_i)^2 + (Y_{i+1} - Y_i)^2 ) )
 */
export function calculatePerimeter(points: [number, number][]): number {
  const n = points.length;
  if (n < 2) return 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dx = points[j][0] - points[i][0];
    const dy = points[j][1] - points[i][1];
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

/**
 * Check if the polygon ring is defined in clockwise order.
 */
export function isClockwise(points: [number, number][]): boolean {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    sum += (points[j][0] - points[i][0]) * (points[j][1] + points[i][1]);
  }
  return sum > 0;
}

/**
 * Line Segment Intersection Check (Bentley-Ottmann / Cross Product method)
 * Returns true if segment p1-p2 strictly intersects segment p3-p4
 */
function ccw(p1: [number, number], p2: [number, number], p3: [number, number]): number {
  return (p3[1] - p1[1]) * (p2[0] - p1[0]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
}

function segmentsIntersect(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number]
): boolean {
  const d1 = ccw(p3, p4, p1);
  const d2 = ccw(p3, p4, p2);
  const d3 = ccw(p1, p2, p3);
  const d4 = ccw(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

/**
 * Detects self-intersections in the polygon boundary.
 */
export function findSelfIntersections(points: [number, number][]): Array<{ segA: [number, number]; segB: [number, number] }> {
  const intersections: Array<{ segA: [number, number]; segB: [number, number] }> = [];
  const n = points.length;
  if (n < 4) return intersections;

  for (let i = 0; i < n; i++) {
    const iNext = (i + 1) % n;
    for (let j = i + 1; j < n; j++) {
      const jNext = (j + 1) % n;
      // Skip adjacent segments which share a vertex
      if (i === j || i === jNext || iNext === j || iNext === jNext) continue;

      if (segmentsIntersect(points[i], points[iNext], points[j], points[jNext])) {
        intersections.push({ segA: [i, iNext], segB: [j, jNext] });
      }
    }
  }
  return intersections;
}

/**
 * Computes full geometry statistics (Area, Perimeter, Centroids, Bounds).
 */
export function computeGeometryStats(vertices: Vertex[], system: CoordinateSystem): GeometryStats | null {
  if (!vertices || vertices.length < 3) return null;

  // Metric coordinates for planar calculations
  const metricPoints: [number, number][] = vertices.map((v) => toUtmMetric(v.x, v.y, system));
  const latLngPoints: [number, number][] = vertices.map((v) => toLatLng(v.x, v.y, system));

  const areaM2 = calculateArea(metricPoints);
  const areaHa = areaM2 / 10000;
  const perimeterM = calculatePerimeter(metricPoints);

  // Centroid
  let sumX = 0;
  let sumY = 0;
  let sumLat = 0;
  let sumLng = 0;
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  for (let i = 0; i < vertices.length; i++) {
    const [mx, my] = metricPoints[i];
    const [lat, lng] = latLngPoints[i];

    sumX += mx;
    sumY += my;
    sumLat += lat;
    sumLng += lng;

    if (mx < minX) minX = mx;
    if (mx > maxX) maxX = mx;
    if (my < minY) minY = my;
    if (my > maxY) maxY = my;

    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  const n = vertices.length;

  return {
    areaM2,
    areaHa,
    perimeterM,
    verticesCount: n,
    centroid: [sumLat / n, sumLng / n],
    utmCentroid: [sumX / n, sumY / n],
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      minLat,
      maxLat,
      minLng,
      maxLng,
    },
    isClosed: true,
    isClockwise: isClockwise(metricPoints),
  };
}

/**
 * Generates the official Peruvian cadastral technical table (Cuadro de Datos Técnicos)
 * Vértice | Lado | Distancia (m) | Azimut | Rumbo | Este (X) | Norte (Y)
 */
export function generateTechnicalTable(vertices: Vertex[], system: CoordinateSystem): TechnicalSideRow[] {
  if (!vertices || vertices.length < 2) return [];

  const rows: TechnicalSideRow[] = [];
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const vCurr = vertices[i];
    const vNext = vertices[(i + 1) % n];

    const [x1, y1] = toUtmMetric(vCurr.x, vCurr.y, system);
    const [x2, y2] = toUtmMetric(vNext.x, vNext.y, system);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Azimuth in degrees from North clockwise: atan2(dx, dy)
    let azRad = Math.atan2(dx, dy);
    if (azRad < 0) azRad += 2 * Math.PI;
    const azDeg = (azRad * 180) / Math.PI;

    rows.push({
      vertex: vCurr.vertexNumber || `V${i + 1}`,
      nextVertex: vNext.vertexNumber || `V${((i + 1) % n) + 1}`,
      distance: Number(dist.toFixed(2)),
      distanceFormatted: dist.toFixed(2),
      azimuth: formatDMS(azDeg),
      azimuthDeg: azDeg,
      rumbo: calculateRumbo(azDeg),
      bearing: calculateRumbo(azDeg),
      east: x1.toFixed(4),
      north: y1.toFixed(4),
      colindancia: vCurr.colindancia || 'Colindante no especificado',
    });
  }

  return rows;
}

// Aliases for compatibility
export const calculatePolygonStats = computeGeometryStats;
export const calculateTechnicalTable = generateTechnicalTable;
export const toGeoJSON = (vertices: Vertex[], system: CoordinateSystem, meta?: any): string =>
  JSON.stringify(generateGeoJSON(vertices, system, meta), null, 2);
export const toKML = generateKML;

/**
 * Comprehensive GeoCheck validation engine
 */
export function validateGeometry(vertices: Vertex[], system: CoordinateSystem): ValidationReport {
  const issues: ValidationIssue[] = [];

  // 1. Check minimum vertices
  const minVertices = vertices.length >= 3;
  if (!minVertices) {
    issues.push({
      id: 'min-vertices',
      severity: 'error',
      title: 'Polígono incompleto',
      description: `Se requieren al menos 3 vértices para definir un predio. Actualmente tiene ${vertices.length}.`,
      recommendation: 'Ingrese los vértices faltantes en la tabla o importe un archivo de coordenadas.',
    });
  }

  // 2. Check for missing or invalid numerical coordinates
  let hasInvalidCoords = false;
  vertices.forEach((v, idx) => {
    if (isNaN(v.x) || isNaN(v.y) || v.x === null || v.y === null) {
      hasInvalidCoords = true;
      issues.push({
        id: `invalid-coord-${v.id}`,
        severity: 'error',
        title: `Coordenada no numérica en vértice ${v.vertexNumber || `V${idx + 1}`}`,
        description: `El vértice ${v.vertexNumber} contiene un valor no numérico o vacío.`,
        affectedVertices: [v.vertexNumber || `V${idx + 1}`],
        recommendation: 'Corrija el valor de Este/X o Norte/Y con un número válido.',
      });
    }
  });

  if (hasInvalidCoords || !minVertices) {
    return {
      status: 'ERROR',
      issues,
      checks: {
        closed: false,
        noSelfIntersections: false,
        noDuplicates: false,
        inPeruBounds: false,
        validUtmZone: false,
        minVertices: false,
      },
    };
  }

  // 3. Check for duplicate or near-identical vertices (< 0.01m tolerance)
  const metricPoints = vertices.map((v) => toUtmMetric(v.x, v.y, system));
  let hasDuplicates = false;
  for (let i = 0; i < metricPoints.length; i++) {
    for (let j = i + 1; j < metricPoints.length; j++) {
      const dx = metricPoints[i][0] - metricPoints[j][0];
      const dy = metricPoints[i][1] - metricPoints[j][1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.01) {
        hasDuplicates = true;
        const vA = vertices[i].vertexNumber || `V${i + 1}`;
        const vB = vertices[j].vertexNumber || `V${j + 1}`;
        issues.push({
          id: `duplicate-${i}-${j}`,
          severity: 'error',
          title: `Vértices duplicados: ${vA} y ${vB}`,
          description: `La distancia entre ${vA} y ${vB} es de solo ${dist.toFixed(3)}m. Vértices idénticos generan linderos nulos que invalidan el polígono.`,
          affectedVertices: [vA, vB],
          recommendation: 'Elimine uno de los dos vértices repetidos para garantizar la continuidad topológica.',
        });
      }
    }
  }

  // 4. Check for self-intersections (linderos cruzados)
  const intersections = findSelfIntersections(metricPoints);
  const noSelfIntersections = intersections.length === 0;
  if (!noSelfIntersections) {
    intersections.forEach((inter, idx) => {
      const v1 = vertices[inter.segA[0]].vertexNumber || `V${inter.segA[0] + 1}`;
      const v2 = vertices[inter.segA[1]].vertexNumber || `V${inter.segA[1] + 1}`;
      const v3 = vertices[inter.segB[0]].vertexNumber || `V${inter.segB[0] + 1}`;
      const v4 = vertices[inter.segB[1]].vertexNumber || `V${inter.segB[1] + 1}`;

      issues.push({
        id: `self-intersection-${idx}`,
        severity: 'error',
        title: `Autointersección detectada: Tramo ${v1}–${v2} cruza con ${v3}–${v4}`,
        description: `Los segmentos ${v1}–${v2} y ${v3}–${v4} se cortan entre sí. Esto viola el principio OGC de polígono simple y genera polígonos complejos en forma de "8".`,
        affectedVertices: [v1, v2, v3, v4],
        recommendation: 'Verifique el orden correlativo de los vértices o invierta el sentido de recorrido perimétrico.',
      });
    });
  }

  // 5. Geographic sanity check in Peru territory
  // Peru bounds approx: Lat -0.03° to -18.35°, Lng -81.33° to -68.65°
  const latLngPoints = vertices.map((v) => toLatLng(v.x, v.y, system));
  let inPeruBounds = true;
  let suggestedZone: string | null = null;

  latLngPoints.forEach((pt, idx) => {
    const [lat, lng] = pt;
    if (lat > 1 || lat < -20 || lng < -85 || lng > -65) {
      inPeruBounds = false;
      const vName = vertices[idx].vertexNumber || `V${idx + 1}`;
      issues.push({
        id: `out-of-bounds-${idx}`,
        severity: 'warning',
        title: `Ubicación fuera del territorio peruano (${vName})`,
        description: `El vértice ${vName} se ubica en Lat: ${lat.toFixed(4)}°, Lon: ${lng.toFixed(4)}°. Coordenadas fuera de las fronteras de la República del Perú.`,
        affectedVertices: [vName],
        recommendation: 'Compruebe si el sistema de referencia configurado coincide con la zona de levantamiento (Zonas 17S, 18S o 19S) o si las coordenadas están invertidas.',
      });
    }

    // Check UTM zone suggestion based on calculated longitude
    if (lng < -78) suggestedZone = '17';
    else if (lng > -72) suggestedZone = '19';
    else suggestedZone = '18';
  });

  // 6. Check UTM Zone consistency with geographic position
  let validUtmZone = true;
  const currentSysInfo = COORDINATE_SYSTEMS[system];
  if (currentSysInfo.utmZone && suggestedZone && currentSysInfo.utmZone !== suggestedZone) {
    validUtmZone = false;
    issues.push({
      id: 'utm-zone-mismatch',
      severity: 'warning',
      title: `Posible zona UTM discordante (Seleccionada Zona ${currentSysInfo.utmZone}S vs Estimada Zona ${suggestedZone}S)`,
      description: `Por la longitud geográfica calculada, este predio parecería pertenecer a la Zona ${suggestedZone} Sur en lugar de la Zona ${currentSysInfo.utmZone} Sur configurada.`,
      recommendation: `Verifique la ficha técnica del levantamiento. Si el predio está en Cajamarca/Piura suele ser Zona 17S; Lima/Ica Zona 18S; Puno/Cusco/Arequipa Zona 19S.`,
    });
  }

  // 7. Check PSAD56 Warning
  if (currentSysInfo.datum === 'PSAD56') {
    issues.push({
      id: 'psad56-official-notice',
      severity: 'info',
      title: 'Datum Histórico PSAD56 en uso',
      description: 'El Sistema Provisional Sudamericano 1956 presenta un desplazamiento de ~390 metros respecto al datum oficial WGS84.',
      recommendation: 'Para expedientes formales ante SUNARP o COFOPRI, transforme sus coordenadas al sistema oficial WGS84.',
    });
  }

  // Determine global status
  const hasErrors = issues.some((i) => i.severity === 'error');
  const hasWarnings = issues.some((i) => i.severity === 'warning');

  let status: 'VALID' | 'WARNING' | 'ERROR' = 'VALID';
  if (hasErrors) status = 'ERROR';
  else if (hasWarnings) status = 'WARNING';

  return {
    status,
    issues,
    checks: {
      closed: minVertices && noSelfIntersections && !hasDuplicates,
      noSelfIntersections,
      noDuplicates: !hasDuplicates,
      inPeruBounds,
      validUtmZone,
      minVertices,
    },
  };
}

/**
 * Generate standard GeoJSON FeatureCollection
 */
export function generateGeoJSON(vertices: Vertex[], system: CoordinateSystem, projectMetadata?: Record<string, any>) {
  if (vertices.length < 3) return null;

  const latLngs = vertices.map((v) => toLatLng(v.x, v.y, system));
  // GeoJSON uses [Longitude, Latitude]
  const coordinates = latLngs.map((pt) => [Number(pt[1].toFixed(6)), Number(pt[0].toFixed(6))]);
  // Close the ring
  coordinates.push([...coordinates[0]]);

  return {
    type: 'FeatureCollection',
    name: projectMetadata?.propertyName || 'Predio_GeoSaneamiento_Peru',
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:OGC:1.3:CRS84',
      },
    },
    features: [
      {
        type: 'Feature',
        properties: {
          codigo: projectMetadata?.code || 'EXP-001',
          predio: projectMetadata?.propertyName || 'Predio',
          propietario: projectMetadata?.owner || 'Propietario',
          departamento: projectMetadata?.department || '',
          provincia: projectMetadata?.province || '',
          distrito: projectMetadata?.district || '',
          datum: COORDINATE_SYSTEMS[system].datum,
          sistema: COORDINATE_SYSTEMS[system].name,
          epsg: COORDINATE_SYSTEMS[system].epsg,
          vertices_total: vertices.length,
          generado_por: 'GeoSaneamiento Perú',
          fecha: new Date().toISOString(),
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
      },
    ],
  };
}

/**
 * Generate standard KML file string
 */
export function generateKML(vertices: Vertex[], system: CoordinateSystem, propertyName: string = 'Predio'): string {
  if (vertices.length < 3) return '';

  const latLngs = vertices.map((v) => toLatLng(v.x, v.y, system));
  const coordsStr = latLngs
    .map((pt) => `${pt[1].toFixed(7)},${pt[0].toFixed(7)},0`)
    .concat(`${latLngs[0][1].toFixed(7)},${latLngs[0][0].toFixed(7)},0`)
    .join(' ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${propertyName} - GeoSaneamiento Perú</name>
    <description>Polígono de levantamiento predial georreferenciado.</description>
    <Style id="predioStyle">
      <LineStyle>
        <color>ff00aa00</color>
        <width>3</width>
      </LineStyle>
      <PolyStyle>
        <color>4400ff00</color>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>${propertyName}</name>
      <styleUrl>#predioStyle</styleUrl>
      <Polygon>
        <extrude>1</extrude>
        <altitudeMode>clampToGround</altitudeMode>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${coordsStr}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;
}

/**
 * Generate CSV string of the coordinate table
 */
export function generateCSV(vertices: Vertex[], technicalTable: TechnicalSideRow[]): string {
  let csv = 'VERTICE,ESTE_X,NORTE_Y,ALTITUD_Z,LADO,DISTANCIA_M,AZIMUT,RUMBO,COLINDANCIA\n';
  vertices.forEach((v, idx) => {
    const row = technicalTable[idx];
    csv += `"${v.vertexNumber}","${v.x.toFixed(4)}","${v.y.toFixed(4)}","${v.z || 0}","${row?.vertex || ''}-${row?.nextVertex || ''}","${row?.distance || ''}","${row?.azimuth || ''}","${row?.rumbo || ''}","${v.colindancia || ''}"\n`;
  });
  return csv;
}
