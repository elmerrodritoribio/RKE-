import { Vertex, TechnicalSideRow, CoordinateSystem } from '../types';
import { toUtmMetric } from './geospatial';

/**
 * Generates an AutoCAD ASCII DXF (Release 2000 / AC1015 format)
 * compatible with AutoCAD, AutoCAD Civil 3D, QGIS, and ArcGIS.
 */
export function generateDXF(
  vertices: Vertex[],
  technicalTable: TechnicalSideRow[],
  system: CoordinateSystem,
  projectMetadata: { propertyName?: string; code?: string; owner?: string } = {}
): string {
  if (vertices.length < 3) return '';

  const metricPoints = vertices.map((v) => toUtmMetric(v.x, v.y, system));
  const n = vertices.length;

  let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
6
0
LAYER
2
0
70
0
62
7
6
CONTINUOUS
0
LAYER
2
PREDIO_POLIGONO
70
0
62
3
6
CONTINUOUS
0
LAYER
2
VERTICES_PUNTOS
70
0
62
1
6
CONTINUOUS
0
LAYER
2
ETIQUETAS_VERTICES
70
0
62
7
6
CONTINUOUS
0
LAYER
2
DISTANCIAS_LADOS
70
0
62
2
6
CONTINUOUS
0
LAYER
2
CUADRO_COORDENADAS
70
0
62
4
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
BLOCKS
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  // 1. Closed LWPOLYLINE for the polygon
  dxf += `0
LWPOLYLINE
5
100
100
AcDbEntity
8
PREDIO_POLIGONO
100
AcDbPolyline
90
${n}
70
1
43
0.0
`;

  for (let i = 0; i < n; i++) {
    const [x, y] = metricPoints[i];
    dxf += `10
${x.toFixed(4)}
20
${y.toFixed(4)}
`;
  }

  // 2. Vertex markers (CIRCLES and POINTS) and Vertex labels (TEXT)
  for (let i = 0; i < n; i++) {
    const [x, y] = metricPoints[i];
    const vName = vertices[i].vertexNumber || `V${i + 1}`;

    // Small circle at vertex
    dxf += `0
CIRCLE
8
VERTICES_PUNTOS
10
${x.toFixed(4)}
20
${y.toFixed(4)}
30
0.0
40
1.2
`;

    // Point
    dxf += `0
POINT
8
VERTICES_PUNTOS
10
${x.toFixed(4)}
20
${y.toFixed(4)}
30
0.0
`;

    // Text label
    dxf += `0
TEXT
8
ETIQUETAS_VERTICES
10
${(x + 2.0).toFixed(4)}
20
${(y + 2.0).toFixed(4)}
30
0.0
40
2.5
1
${vName}
`;
  }

  // 3. Side Distances on segments
  for (let i = 0; i < n; i++) {
    const p1 = metricPoints[i];
    const p2 = metricPoints[(i + 1) % n];
    const midX = (p1[0] + p2[0]) / 2;
    const midY = (p1[1] + p2[1]) / 2;

    const row = technicalTable[i];
    const distText = row ? `d=${row.distance}m` : '';

    if (distText) {
      dxf += `0
TEXT
8
DISTANCIAS_LADOS
10
${midX.toFixed(4)}
20
${midY.toFixed(4)}
30
0.0
40
1.8
1
${distText}
`;
    }
  }

  // 4. Coordinates Table in CAD space (offset from polygon)
  let minX = Infinity, maxY = -Infinity;
  metricPoints.forEach(([x, y]) => {
    if (x < minX) minX = x;
    if (y > maxY) maxY = y;
  });

  const tableX = minX - 120;
  let tableY = maxY;

  // Table Title
  dxf += `0
TEXT
8
CUADRO_COORDENADAS
10
${tableX.toFixed(4)}
20
${tableY.toFixed(4)}
30
0.0
40
3.0
1
CUADRO DE DATOS TECNICOS - ${projectMetadata.propertyName || 'PREDIO'}
`;

  tableY -= 6;
  dxf += `0
TEXT
8
CUADRO_COORDENADAS
10
${tableX.toFixed(4)}
20
${tableY.toFixed(4)}
30
0.0
40
2.0
1
VERTICE   LADO       DIST(m)   AZIMUT         ESTE(X)       NORTE(Y)
`;

  tableY -= 4;
  technicalTable.forEach((r) => {
    const line = `${r.vertex.padEnd(9)} ${`${r.vertex}-${r.nextVertex}`.padEnd(10)} ${r.distance.toFixed(2).padEnd(9)} ${r.azimuth.padEnd(14)} ${r.east.padEnd(13)} ${r.north}`;
    dxf += `0
TEXT
8
CUADRO_COORDENADAS
10
${tableX.toFixed(4)}
20
${tableY.toFixed(4)}
30
0.0
40
1.8
1
${line}
`;
    tableY -= 3.5;
  });

  dxf += `0
ENDSEC
0
EOF
`;

  return dxf;
}

/**
 * Trigger download of DXF file in the browser
 */
export function downloadDXFFile(
  vertices: Vertex[],
  technicalTable: TechnicalSideRow[],
  system: CoordinateSystem,
  projectMetadata: { propertyName?: string; code?: string; owner?: string } = {}
) {
  const content = generateDXF(vertices, technicalTable, system, projectMetadata);
  const blob = new Blob([content], { type: 'application/dxf;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const filename = `Plano_CAD_${(projectMetadata.code || 'PREDIO').replace(/[\s/]/g, '_')}.dxf`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
