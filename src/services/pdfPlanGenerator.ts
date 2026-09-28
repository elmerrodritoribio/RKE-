import { jsPDF } from 'jspdf';
import { Vertex, TechnicalSideRow, GeometryStats, Project, CoordinateSystem } from '../types';
import { toUtmMetric, COORDINATE_SYSTEMS } from './geospatial';

export interface PlanOptions {
  planType: 'PLANO PERIMÉTRICO' | 'PLANO DE UBICACIÓN' | 'PLANO CATASTRAL RURAL' | 'PLANO CATASTRAL URBANO';
  sheetCode: string; // e.g. PP-01, PU-01
  paperSize: 'A4' | 'A3';
  orientation: 'landscape';
  scaleText: string; // e.g. "1:1,000" or "INDICADA"
}

export function generateTechnicalPlanPDF(
  project: Project,
  vertices: Vertex[],
  technicalTable: TechnicalSideRow[],
  stats: GeometryStats | null,
  system: CoordinateSystem,
  options: PlanOptions = {
    planType: 'PLANO PERIMÉTRICO',
    sheetCode: 'PP-01',
    paperSize: 'A4',
    orientation: 'landscape',
    scaleText: '1:1,000',
  }
): jsPDF {
  const doc = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: options.paperSize.toLowerCase() as 'a4' | 'a3',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Margins
  const m = 10;
  const innerW = pageWidth - 2 * m;
  const innerH = pageHeight - 2 * m;

  // Outer technical border
  doc.setLineWidth(0.8);
  doc.setDrawColor(20, 30, 50);
  doc.rect(m, m, innerW, innerH);

  // Inner margin line
  doc.setLineWidth(0.2);
  doc.rect(m + 1.5, m + 1.5, innerW - 3, innerH - 3);

  // Layout Division:
  // Right side = 85mm for Technical Table + Membrete
  // Left side = Map Drawing Area
  const rightPanelW = 90;
  const mapAreaW = innerW - rightPanelW - 3;
  const mapAreaH = innerH - 12;

  // Map Drawing Window
  const mapX = m + 3;
  const mapY = m + 3;
  doc.setLineWidth(0.3);
  doc.setDrawColor(100, 116, 139);
  doc.rect(mapX, mapY, mapAreaW, mapAreaH);

  // Map Title / Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`${options.planType} - POLÍGONO PRINCIPAL`, mapX + 4, mapY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const sysInfo = COORDINATE_SYSTEMS[system];
  doc.text(`Proyección UTM ${sysInfo.datum} Zona ${sysInfo.utmZone || '18'}S | EPSG: ${sysInfo.epsg}`, mapX + 4, mapY + 10);

  // Draw North Arrow
  drawNorthArrow(doc, mapX + mapAreaW - 14, mapY + 14);

  // Draw Graphic Scale
  drawGraphicScale(doc, mapX + 4, mapY + mapAreaH - 6, options.scaleText);

  // Plot polygon geometry inside Map Window
  if (vertices.length >= 3 && stats) {
    plotPolygon(doc, vertices, system, stats, mapX + 15, mapY + 16, mapAreaW - 30, mapAreaH - 32);
  }

  // Right Panel: Top = Cuadro de Datos Técnicos, Bottom = Membrete Oficial
  const panelX = m + mapAreaW + 4;
  const tableH = 85;
  const membreteH = innerH - tableH - 8;
  const membreteY = m + tableH + 5;

  // 1. Technical Coordinates Table
  drawTechnicalTable(doc, panelX, mapY, rightPanelW - 1, tableH, technicalTable, stats, sysInfo);

  // 2. Official Membrete Box
  drawMembrete(doc, panelX, membreteY, rightPanelW - 1, membreteH, project, options, sysInfo);

  // Bottom Disclaimer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'AVISO: Documento técnico de apoyo generado por GeoSaneamiento Perú. Debe ser validado y firmado por profesional colegiado habilitado.',
    m + 3,
    pageHeight - m + 2
  );

  return doc;
}

function drawNorthArrow(doc: jsPDF, cx: number, cy: number) {
  doc.setLineWidth(0.4);
  doc.setDrawColor(30, 41, 59);

  // Arrow triangle (Left half filled, right half outline)
  doc.setFillColor(30, 41, 59);
  doc.triangle(cx, cy - 8, cx - 3.5, cy + 3, cx, cy + 1, 'FD');

  doc.setFillColor(255, 255, 255);
  doc.triangle(cx, cy - 8, cx + 3.5, cy + 3, cx, cy + 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('N', cx - 1.2, cy - 9.5);
}

function drawGraphicScale(doc: jsPDF, x: number, y: number, scaleText: string) {
  doc.setLineWidth(0.3);
  doc.setDrawColor(50, 50, 50);

  // Scale bar
  const segW = 10;
  doc.setFillColor(0, 0, 0);
  doc.rect(x, y - 2, segW, 2, 'FD');
  doc.setFillColor(255, 255, 255);
  doc.rect(x + segW, y - 2, segW, 2, 'FD');
  doc.setFillColor(0, 0, 0);
  doc.rect(x + 2 * segW, y - 2, segW, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(50, 50, 50);
  doc.text('0', x - 0.5, y + 2.5);
  doc.text('25', x + segW - 2, y + 2.5);
  doc.text('50m', x + 3 * segW - 2, y + 2.5);
  doc.text(`Escala: ${scaleText}`, x + 3 * segW + 6, y);
}

function plotPolygon(
  doc: jsPDF,
  vertices: Vertex[],
  system: CoordinateSystem,
  stats: GeometryStats,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const metricPoints = vertices.map((v) => toUtmMetric(v.x, v.y, system));
  const { minX, maxX, minY, maxY } = stats.bounds;

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  // Preserve aspect ratio
  const scale = Math.min(w / spanX, h / spanY);
  const offsetX = x + (w - spanX * scale) / 2;
  const offsetY = y + (h - spanY * scale) / 2;

  // Coordinate transform to paper mm (invert Y since CAD Y goes up, PDF goes down)
  const transform = (pt: [number, number]): [number, number] => {
    const px = offsetX + (pt[0] - minX) * scale;
    const py = offsetY + (maxY - pt[1]) * scale;
    return [px, py];
  };

  // Draw grid ticks
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.1);
  for (let gx = x; gx <= x + w; gx += 20) {
    doc.line(gx, y, gx, y + h);
  }
  for (let gy = y; gy <= y + h; gy += 20) {
    doc.line(x, gy, x + w, gy);
  }

  // Polygon fill & stroke
  doc.setDrawColor(16, 185, 129); // Emerald green boundary
  doc.setLineWidth(0.6);
  doc.setFillColor(209, 250, 229); // Light green

  const screenPoints = metricPoints.map(transform);

  // Draw lines
  for (let i = 0; i < screenPoints.length; i++) {
    const p1 = screenPoints[i];
    const p2 = screenPoints[(i + 1) % screenPoints.length];
    doc.line(p1[0], p1[1], p2[0], p2[1]);
  }

  // Draw vertices & labels
  screenPoints.forEach((p, idx) => {
    const vName = vertices[idx].vertexNumber || `V${idx + 1}`;
    doc.setFillColor(239, 68, 68); // Red vertex circle
    doc.circle(p[0], p[1], 1.0, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(vName, p[0] + 1.8, p[1] - 1.2);
  });
}

function drawTechnicalTable(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  table: TechnicalSideRow[],
  stats: GeometryStats | null,
  sysInfo: any
) {
  doc.setLineWidth(0.3);
  doc.setDrawColor(71, 85, 105);
  doc.rect(x, y, w, h);

  // Header background
  doc.setFillColor(30, 41, 59);
  doc.rect(x, y, w, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('CUADRO DE DATOS TÉCNICOS', x + w / 2 - 19, y + 4.2);

  // Sub-header columns
  doc.setFillColor(241, 245, 249);
  doc.rect(x, y + 6, w, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(51, 65, 85);

  const colX = [x + 2, x + 10, x + 24, x + 38, x + 62];
  doc.text('VÉRT', colX[0], y + 9.5);
  doc.text('LADO', colX[1], y + 9.5);
  doc.text('DIST(m)', colX[2], y + 9.5);
  doc.text('ESTE (X)', colX[3], y + 9.5);
  doc.text('NORTE (Y)', colX[4], y + 9.5);

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  let curY = y + 14;
  const maxRows = Math.min(table.length, 12);

  for (let i = 0; i < maxRows; i++) {
    const r = table[i];
    doc.setTextColor(30, 41, 59);
    doc.text(r.vertex, colX[0], curY);
    doc.text(`${r.vertex}-${r.nextVertex}`, colX[1], curY);
    doc.text(r.distanceFormatted, colX[2], curY);
    doc.text(r.east, colX[3], curY);
    doc.text(r.north, colX[4], curY);

    curY += 3.8;
  }

  if (table.length > 12) {
    doc.setFont('helvetica', 'italic');
    doc.text(`... y ${table.length - 12} vértices adicionales`, colX[0], curY);
  }

  // Summary box at bottom of table
  const sumY = y + h - 16;
  doc.setDrawColor(203, 213, 225);
  doc.line(x, sumY, x + w, sumY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('RESUMEN GEOMÉTRICO:', x + 2, sumY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  if (stats) {
    doc.text(`Área: ${stats.areaM2.toLocaleString('es-PE', { minimumFractionDigits: 2 })} m²  (${stats.areaHa.toFixed(4)} ha)`, x + 2, sumY + 8);
    doc.text(`Perímetro: ${stats.perimeterM.toLocaleString('es-PE', { minimumFractionDigits: 2 })} ml`, x + 2, sumY + 11.5);
    doc.text(`Datum: ${sysInfo.datum} UTM Zona ${sysInfo.utmZone || '18'}S (WGS84)`, x + 2, sumY + 14.5);
  }
}

function drawMembrete(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  project: Project,
  options: PlanOptions,
  sysInfo: any
) {
  doc.setLineWidth(0.4);
  doc.setDrawColor(30, 41, 59);
  doc.rect(x, y, w, h);

  // Institution / Header Bar
  doc.setFillColor(15, 23, 42);
  doc.rect(x, y, w, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('GEOSANEAMIENTO PERÚ', x + 3, y + 4.8);
  doc.setFontSize(5.5);
  doc.text('SANEAMIENTO CATASTRAL Y PREDIAL', x + w - 42, y + 4.8);

  let curY = y + 10;
  const drawRow = (label: string, value: string, height: number = 5) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label.toUpperCase(), x + 2, curY + 2.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(15, 23, 42);
    doc.text(value || '---', x + 28, curY + 2.5);

    doc.setLineWidth(0.1);
    doc.setDrawColor(226, 232, 240);
    doc.line(x, curY + height, x + w, curY + height);

    curY += height;
  };

  drawRow('Proyecto:', project.name || 'Saneamiento Predial');
  drawRow('Predio:', project.propertyName || 'Predio Sin Nombre');
  drawRow('Propietario:', `${project.owner || 'Titular'} (${project.docType || 'DNI'}: ${project.docNumber || '---'})`);
  drawRow('Ubicación:', `${project.department || ''} - ${project.province || ''} - ${project.district || ''}`);
  drawRow('Sector / C.P.:', project.sector || project.centerPopulated || 'Rural');
  drawRow('Trámite / Entidad:', `${project.procedureType} / ${project.destinationEntity}`);
  drawRow('Profesional:', `${project.professional || 'Ingeniero'} (${project.professionalReg || 'CIP'})`);
  drawRow('Fecha / Escala:', `${project.surveyDate || new Date().toISOString().split('T')[0]}  |  ${options.scaleText}`);

  // Bottom Laminar Box
  doc.setFillColor(248, 250, 252);
  doc.rect(x, curY, w, y + h - curY, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(options.planType, x + 3, curY + 5);

  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129);
  doc.text(options.sheetCode, x + w - 18, curY + 6.5);

  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text(`EXP: ${project.code || 'EXP-2025-001'} | VER: ${project.currentVersion || 1}`, x + 3, curY + 9);
}
