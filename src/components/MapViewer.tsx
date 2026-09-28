import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Vertex, CoordinateSystem, CartographicLayer } from '../types';
import { toLatLng, toUtmMetric, COORDINATE_SYSTEMS } from '../services/geospatial';
import {
  Layers,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Compass,
  Eye,
  EyeOff,
  Info,
  Ruler,
  Edit3,
  Check,
  RotateCcw,
} from 'lucide-react';

interface MapViewerProps {
  vertices: Vertex[];
  system: CoordinateSystem;
  onUpdateVertexPosition?: (index: number, newX: number, newY: number) => void;
  areaM2?: number;
  perimeterM?: number;
  polygonColor?: string;
  polygonWeight?: number;
  showVertexLabels?: boolean;
}

const DEFAULT_LAYERS: CartographicLayer[] = [
  {
    id: 'utm-zones',
    name: 'Límites de Zonas UTM Perú (17S, 18S, 19S)',
    entity: 'IGN / NGA',
    category: 'Zonas UTM',
    source: 'Meridianos 84°W, 78°W, 72°W, 66°W',
    updateDate: '2024',
    system: 'WGS84',
    isOfficialCadastral: false,
    visible: true,
    opacity: 0.8,
    color: '#38bdf8',
  },
  {
    id: 'dept-limits',
    name: 'Límites Departamentales del Perú',
    entity: 'IGN (Instituto Geográfico Nacional)',
    category: 'Límites',
    source: 'Cartografía Oficial IGN 1:100,000',
    updateDate: '2023',
    system: 'WGS84',
    isOfficialCadastral: false,
    visible: true,
    opacity: 0.7,
    color: '#fbbf24',
  },
  {
    id: 'anp-sernanp',
    name: 'Áreas Naturales Protegidas (ANP)',
    entity: 'SERNANP',
    category: 'Áreas Protegidas',
    source: 'Geoservicio SERNANP',
    updateDate: '2024',
    system: 'WGS84',
    isOfficialCadastral: false,
    visible: false,
    opacity: 0.5,
    color: '#22c55e',
  },
  {
    id: 'vial-mtc',
    name: 'Red Vial Nacional',
    entity: 'MTC / Provías Nacional',
    category: 'Infraestructura',
    source: 'Infraestructura de Datos Espaciales MTC',
    updateDate: '2024',
    system: 'WGS84',
    isOfficialCadastral: false,
    visible: false,
    opacity: 0.6,
    color: '#f97316',
  },
  {
    id: 'hidro-ana',
    name: 'Red Hidrográfica y Ríos',
    entity: 'ANA (Autoridad Nacional del Agua)',
    category: 'Hidrografía',
    source: 'SNIRH - ANA',
    updateDate: '2023',
    system: 'WGS84',
    isOfficialCadastral: false,
    visible: false,
    opacity: 0.6,
    color: '#06b6d4',
  },
];

export const MapViewer: React.FC<MapViewerProps> = ({
  vertices,
  system,
  onUpdateVertexPosition,
  areaM2 = 0,
  perimeterM = 0,
  polygonColor = '#10b981',
  polygonWeight = 3,
  showVertexLabels = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const sideLabelsGroupRef = useRef<L.LayerGroup | null>(null);
  const referenceLayersGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTilesRef = useRef<Record<string, L.TileLayer>>({});

  const [activeBasemap, setActiveBasemap] = useState<'satellite' | 'osm' | 'topo' | 'carto'>('satellite');
  const [layersOpen, setLayersOpen] = useState(false);
  const [cartoLayers, setCartoLayers] = useState<CartographicLayer[]>(DEFAULT_LAYERS);
  const [cursorCoord, setCursorCoord] = useState<{ lat: number; lng: number; east: number; north: number } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [hasPendingEdits, setHasPendingEdits] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered on Peru (-9.19, -75.015)
    const map = L.map(mapContainerRef.current, {
      center: [-9.19, -75.015],
      zoom: 6,
      zoomControl: false,
    });

    // Basemaps
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, IGN Peru',
      }
    );

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    });

    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Map data: &copy; OpenStreetMap, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    });

    const carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
    });

    satellite.addTo(map);
    baseTilesRef.current = { satellite, osm, topo, carto };

    // Layer groups
    markersGroupRef.current = L.layerGroup().addTo(map);
    sideLabelsGroupRef.current = L.layerGroup().addTo(map);
    referenceLayersGroupRef.current = L.layerGroup().addTo(map);

    // Track mouse coordinates
    map.on('mousemove', (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const [east, north] = toUtmMetric(lng, lat, 'GEOGRAPHIC_WGS84');
      setCursorCoord({
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        east: Math.round(east),
        north: Math.round(north),
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch basemap
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    Object.values(baseTilesRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });

    const target = baseTilesRef.current[activeBasemap];
    if (target) target.addTo(map);
  }, [activeBasemap]);

  // Render Reference Layers (Peruvian Cartography)
  useEffect(() => {
    if (!referenceLayersGroupRef.current || !mapInstanceRef.current) return;
    const group = referenceLayersGroupRef.current;
    group.clearLayers();

    // 1. UTM Zone Boundaries (Meridians for Peru: 84°W, 78°W, 72°W, 66°W)
    const utmLayer = cartoLayers.find((l) => l.id === 'utm-zones');
    if (utmLayer?.visible) {
      const meridian78 = L.polyline([[-0.05, -78], [-18.5, -78]], {
        color: '#38bdf8',
        weight: 2,
        dashArray: '6, 6',
        opacity: utmLayer.opacity,
      }).bindTooltip('Límite Zona 17S | Zona 18S (78°W)', { permanent: true, direction: 'top', className: 'utm-tooltip' });

      const meridian72 = L.polyline([[-0.05, -72], [-18.5, -72]], {
        color: '#38bdf8',
        weight: 2,
        dashArray: '6, 6',
        opacity: utmLayer.opacity,
      }).bindTooltip('Límite Zona 18S | Zona 19S (72°W)', { permanent: true, direction: 'top', className: 'utm-tooltip' });

      group.addLayer(meridian78);
      group.addLayer(meridian72);
    }

    // 2. Representative Departmental Boundaries (Key regions)
    const deptLayer = cartoLayers.find((l) => l.id === 'dept-limits');
    if (deptLayer?.visible) {
      // Simplified departmental border arcs for reference
      const limaBorder = L.polygon([
        [-10.27, -77.85], [-10.45, -76.8], [-11.8, -76.3], [-13.15, -75.8],
        [-13.3, -76.3], [-12.5, -76.8], [-11.8, -77.2], [-10.27, -77.85],
      ], {
        color: deptLayer.color,
        fillColor: deptLayer.color,
        fillOpacity: 0.05,
        weight: 1.5,
        dashArray: '4, 4',
      }).bindPopup('<strong>Límite Departamental: LIMA</strong><br><span class="text-xs text-amber-500">Capa Informativa de Referencia IGN</span>');

      const icaBorder = L.polygon([
        [-13.3, -76.3], [-13.15, -75.8], [-14.0, -75.0], [-15.4, -74.8],
        [-15.3, -75.6], [-14.0, -76.3], [-13.3, -76.3],
      ], {
        color: deptLayer.color,
        fillColor: deptLayer.color,
        fillOpacity: 0.05,
        weight: 1.5,
        dashArray: '4, 4',
      }).bindPopup('<strong>Límite Departamental: ICA</strong><br><span class="text-xs text-amber-500">Capa Informativa de Referencia IGN</span>');

      group.addLayer(limaBorder);
      group.addLayer(icaBorder);
    }
  }, [cartoLayers]);

  // Update Polygon & Vertices on the Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || !sideLabelsGroupRef.current) return;
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const sideLabelsGroup = sideLabelsGroupRef.current;

    markersGroup.clearLayers();
    sideLabelsGroup.clearLayers();

    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    if (!vertices || vertices.length < 2) return;

    // Convert vertices to Leaflet [lat, lng]
    const latLngs: [number, number][] = vertices.map((v) => toLatLng(v.x, v.y, system));

    // Draw Polygon if 3+ vertices
    if (latLngs.length >= 3) {
      const polygon = L.polygon(latLngs, {
        color: polygonColor,
        weight: polygonWeight,
        fillColor: polygonColor,
        fillOpacity: 0.22,
      }).addTo(map);

      polygon.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px;">
          <strong style="color: #065f46; font-size: 14px;">Polígono del Predio</strong><br>
          <strong>Vértices:</strong> ${vertices.length}<br>
          <strong>Área:</strong> ${areaM2.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m² (${(areaM2 / 10000).toFixed(4)} ha)<br>
          <strong>Perímetro:</strong> ${perimeterM.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ml<br>
          <span style="color: #64748b; font-size: 11px;">Sistema: ${COORDINATE_SYSTEMS[system].name}</span>
        </div>
      `);

      polygonLayerRef.current = polygon;

      // Fit map to bounds
      const bounds = L.latLngBounds(latLngs);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
      }
    } else if (latLngs.length === 2) {
      // Just a polyline
      const line = L.polyline(latLngs, { color: polygonColor, weight: polygonWeight, dashArray: '4, 4' }).addTo(map);
      polygonLayerRef.current = line as any;
      map.fitBounds(line.getBounds(), { padding: [50, 50], maxZoom: 18 });
    }

    // Add Vertex Markers & Side Labels if enabled
    if (showVertexLabels) {
      latLngs.forEach((coord, idx) => {
        const v = vertices[idx];
        const vName = v.vertexNumber || `V${idx + 1}`;

        // Custom Vertex Marker
        const iconHtml = `
          <div style="
            background-color: #ef4444;
            color: white;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            font-weight: bold;
            font-size: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: ${editMode ? 'grab' : 'pointer'};
          ">${vName}</div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-vertex-marker',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker(coord, {
          icon: customIcon,
          draggable: editMode,
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 170px;">
            <strong style="color: #b91c1c; font-size: 13px;">Vértice ${vName}</strong><br>
            <strong>Este (X):</strong> ${v.x.toFixed(3)}<br>
            <strong>Norte (Y):</strong> ${v.y.toFixed(3)}<br>
            <strong>Cota Z:</strong> ${v.z ?? 0}m<br>
            <strong>Hito / Descripción:</strong> ${v.description || 'Sin descripción'}<br>
            <strong>Colindante:</strong> ${v.colindancia || 'No especificado'}<br>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Lat: ${coord[0].toFixed(6)}°, Lng: ${coord[1].toFixed(6)}°</div>
          </div>
        `);

        // Handle drag when in Edit Mode
        if (editMode && onUpdateVertexPosition) {
          marker.on('dragend', (e) => {
            const newLatLng = e.target.getLatLng();
            const [newEast, newNorth] = toUtmMetric(newLatLng.lng, newLatLng.lat, 'GEOGRAPHIC_WGS84');
            onUpdateVertexPosition(idx, Number(newEast.toFixed(2)), Number(newNorth.toFixed(2)));
            setHasPendingEdits(true);
          });
        }

        markersGroup.addLayer(marker);

        // Side length labels between vertices
        if (latLngs.length >= 3) {
          const nextCoord = latLngs[(idx + 1) % latLngs.length];
          const midLat = (coord[0] + nextCoord[0]) / 2;
          const midLng = (coord[1] + nextCoord[1]) / 2;

          const [x1, y1] = toUtmMetric(v.x, v.y, system);
          const nextV = vertices[(idx + 1) % vertices.length];
          const [x2, y2] = toUtmMetric(nextV.x, nextV.y, system);
          const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

          const distIcon = L.divIcon({
            html: `<div style="
              background-color: rgba(15, 23, 42, 0.85);
              color: #34d399;
              font-size: 10px;
              font-family: monospace;
              padding: 1px 4px;
              border-radius: 4px;
              border: 1px solid rgba(52, 211, 153, 0.4);
              white-space: nowrap;
            ">${dist.toFixed(1)}m</div>`,
            className: 'side-dist-label',
            iconSize: [40, 16],
            iconAnchor: [20, 8],
          });

          const distMarker = L.marker([midLat, midLng], { icon: distIcon, interactive: false });
          sideLabelsGroup.addLayer(distMarker);
        }
      });
    }
  }, [vertices, system, editMode, areaM2, perimeterM, polygonColor, polygonWeight, showVertexLabels]);

  // Zoom to fit bounds
  const handleZoomToFit = () => {
    if (!mapInstanceRef.current || !vertices || vertices.length < 2) return;
    const latLngs: [number, number][] = vertices.map((v) => toLatLng(v.x, v.y, system));
    const bounds = L.latLngBounds(latLngs);
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Toggle Cartographic Layer
  const handleToggleLayer = (layerId: string) => {
    setCartoLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Header Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1 shadow-lg flex items-center gap-1">
          <button
            onClick={() => setActiveBasemap('satellite')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition ${
              activeBasemap === 'satellite'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Satelital (Esri)
          </button>
          <button
            onClick={() => setActiveBasemap('osm')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition ${
              activeBasemap === 'osm'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Calles (OSM)
          </button>
          <button
            onClick={() => setActiveBasemap('topo')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition ${
              activeBasemap === 'topo'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Topográfico
          </button>
          <button
            onClick={() => setActiveBasemap('carto')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition ${
              activeBasemap === 'carto'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Claro
          </button>
        </div>

        {/* Catálogo de Capas button */}
        <button
          onClick={() => setLayersOpen(!layersOpen)}
          className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-md transition ${
            layersOpen
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="hidden sm:inline">Capas Cartográficas</span>
        </button>

        {/* Edit vertices mode toggle */}
        <button
          onClick={() => setEditMode(!editMode)}
          className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-md transition ${
            editMode
              ? 'bg-amber-600 border-amber-500 text-white animate-pulse'
              : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title="Permitir arrastrar vértices directamente sobre el mapa"
        >
          <Edit3 className="w-4 h-4" />
          <span className="hidden sm:inline">{editMode ? 'Modo Edición Activo' : 'Editar Vértices'}</span>
        </button>
      </div>

      {/* Right Map Tools (Zoom, Fit, Compass) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleZoomToFit}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg shadow-lg backdrop-blur-md transition"
          title="Centrar y hacer zoom al predio"
        >
          <Crosshair className="w-4 h-4 text-emerald-400" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg shadow-lg backdrop-blur-md transition"
          title="Acercar mapa"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg shadow-lg backdrop-blur-md transition"
          title="Alejar mapa"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Catálogo de Capas Drawer Modal */}
      {layersOpen && (
        <div className="absolute top-14 left-3 z-20 bg-slate-900/95 border border-slate-700 rounded-xl p-4 shadow-2xl backdrop-blur-md max-w-sm w-full animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Catálogo de Capas del Perú</h4>
            </div>
            <button
              onClick={() => setLayersOpen(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
            <div className="p-2 bg-slate-950/80 rounded border border-slate-800 text-[11px] text-slate-400 leading-tight">
              <span className="text-amber-400 font-semibold block mb-0.5">⚠️ DISTINCIÓN NORMATIVA:</span>
              Las capas disponibles son <strong>Capas de Referencia Cartográfica</strong> provistas por entidades oficiales (IGN, SERNANP, MTC). <em>No constituyen límites registrales definitivos de propiedad privada.</em>
            </div>

            {cartoLayers.map((layer) => (
              <div
                key={layer.id}
                className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleLayer(layer.id)}
                      className={`p-1 rounded ${layer.visible ? 'text-emerald-400' : 'text-slate-600'}`}
                    >
                      {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <div className="text-xs font-medium text-white">{layer.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {layer.entity} &bull; {layer.system}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                    {layer.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Status Bar: Cursor Coordinates & Quick Stats */}
      <div className="absolute bottom-2 left-2 right-2 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-1 shadow-md">
        <div className="flex items-center gap-3 font-mono text-[11px]">
          {cursorCoord ? (
            <>
              <span>
                ESTE (X): <strong className="text-emerald-400">{cursorCoord.east}m</strong>
              </span>
              <span>
                NORTE (Y): <strong className="text-emerald-400">{cursorCoord.north}m</strong>
              </span>
              <span className="hidden md:inline text-slate-400">
                (Lat: {cursorCoord.lat}°, Lon: {cursorCoord.lng}°)
              </span>
            </>
          ) : (
            <span className="text-slate-500 font-sans">Mueva el cursor sobre el mapa para visualizar coordenadas</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span>
            Área: <strong className="text-white">{areaM2.toLocaleString('es-PE', { minimumFractionDigits: 2 })} m²</strong> ({ (areaM2 / 10000).toFixed(4) } ha)
          </span>
          <span>
            Perímetro: <strong className="text-white">{perimeterM.toLocaleString('es-PE', { minimumFractionDigits: 2 })} ml</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
