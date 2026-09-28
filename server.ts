import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Shared Gemini client
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "GeoSaneamiento Perú API",
      timestamp: new Date().toISOString(),
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // AI Assistant Route
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, projectContext, geometryContext, history } = req.body;

      const ai = getGeminiClient();

      const systemInstruction = `
Eres el Asistente Técnico Especializado de "GeoSaneamiento Perú", una plataforma para ingenieros, topógrafos y arquitectos especializados en levantamiento predial, catastro y saneamiento físico-legal en el Perú.

REGLAS FUNDAMENTALES Y DEONTOLÓGICAS:
1. NUNCA inventes, modifiques o alteres las coordenadas del usuario. Las coordenadas son sagradas y provienen de levantamientos GNSS/Topográficos en campo.
2. Los cálculos geométricos determinísticos (áreas, rumbos, azimuts, distancias) se realizan con algoritmos matemáticos exactos en el motor de la plataforma.
3. NUNCA garantices la inscripción registral de un predio ni declares que una persona es propietaria legal definitiva. Tu rol es de ASISTENCIA TÉCNICA Y NORMATIVA.
4. Conoce a profundidad la normativa peruana:
   - Ley N° 28294 (Sistema Nacional Integrado de Información Catastral y Predial - SNCP).
   - Directivas y Resoluciones de la SUNARP (ej. Directiva N° 004-2020-SUNARP/SN sobre actos de saneamiento, Directiva de Catastro).
   - Estándares COFOPRI, MIDAGRI (para predios rurales/comunidades campesinas) y Municipalidades.
   - Sistemas de Referencia del Perú: WGS84 UTM Zonas 17S, 18S y 19S (antiguo PSAD56 con desfase de ~380m a 420m en Perú).
5. Explica en lenguaje técnico claro:
   - Errores geométricos (autointersección de linderos, vértices redundantes).
   - Desplazamiento por posible confusión de zona UTM (17S vs 18S vs 19S) o datum (PSAD56 vs WGS84).
   - Requisitos de expedientes para Inmatriculación, Subdivisión, Acumulación o Rectificación de Áreas y Linderos.

Contexto actual del proyecto del usuario:
${JSON.stringify(projectContext || {}, null, 2)}

Contexto de la geometría actual:
${JSON.stringify(geometryContext || {}, null, 2)}
`;

      if (!ai) {
        // Fallback knowledge base if no API key is available
        const fallbackReply = generateCadastralFallbackResponse(message, geometryContext);
        return res.json({ reply: fallbackReply, source: "rules_engine" });
      }

      const prompt = `Consulta del profesional: "${message}"\nPor favor responde con rigor técnico, citando la normativa peruana o recomendaciones geoespaciales cuando corresponda.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      const reply = response.text || "No se pudo obtener una respuesta técnica del asistente.";
      return res.json({ reply, source: "gemini" });
    } catch (error: any) {
      console.error("Error in /api/ai/chat:", error);
      const fallbackReply = generateCadastralFallbackResponse(req.body?.message || "", req.body?.geometryContext);
      return res.json({ reply: fallbackReply, source: "fallback_on_error" });
    }
  });

  // AI Memoria Descriptiva draft generation
  app.post("/api/ai/memoria", async (req, res) => {
    try {
      const { project, geometry, technicalTable } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          draft: generateTemplateMemoria(project, geometry, technicalTable),
          source: "template",
        });
      }

      const prompt = `
Genera un borrador formal y completo de MEMORIA DESCRIPTIVA según los estándares oficiales de SUNARP y COFOPRI para saneamiento físico legal en el Perú.

Datos del Proyecto:
- Código Único: ${project.code || "EXP-2025-001"}
- Nombre del Proyecto: ${project.name}
- Predio: ${project.propertyName}
- Propietario/Posesionario: ${project.owner} (DNI/RUC: ${project.docNumber})
- Ubicación Política: Dpto. ${project.department}, Prov. ${project.province}, Dist. ${project.district}, Sector/C.P.: ${project.sector || project.centerPopulated || "Sector Rural"}
- Tipo de Predio: ${project.propertyType}
- Trámite: ${project.procedureType}
- Entidad: ${project.destinationEntity}
- Profesional: ${project.professional} (${project.professionalReg || "CIP/CAP"})
- Fecha: ${project.surveyDate}

Datos Geométricos Determinísticos:
- Sistema: ${geometry.datum} ${geometry.coordinateSystem} Zona ${geometry.utmZone}${geometry.hemisphere} (EPSG: ${geometry.epsg})
- Área Calculada: ${geometry.areaM2.toLocaleString("es-PE", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} m² (${geometry.areaHa.toFixed(4)} ha)
- Perímetro: ${geometry.perimeterM.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ml
- Número de Vértices: ${technicalTable?.length || 0}

Cuadro Técnico de Linderos:
${technicalTable?.map((r: any) => `Tramo ${r.vertex} - ${r.nextVertex}: Distancia ${r.distance}m, Azimut ${r.azimuth}, Rumbo ${r.rumbo}, Colindancia: ${r.colindancia || "Predio colindante"}`).join("\n")}

Estructura obligatoria requerida:
1. ANTECEDENTES Y OBJETO
2. PROPIETARIO O POSESIONARIO
3. UBICACIÓN POLÍTICA Y GEOGRÁFICA
4. DATUM Y SISTEMA DE COORDENADAS
5. DESCRIPCIÓN DE LINDEROS Y COLINDANCIAS (Por el Norte, Por el Sur, Por el Este, Por el Oeste especificando tramos y medidas perimétricas exactas)
6. CUADRO DE RESUMEN TÉCNICO (Área en m² y Hectáreas, Perímetro)
7. METODOLOGÍA DEL LEVANTAMIENTO
8. DECLARACIÓN JURADA DEL PROFESIONAL RESPONSABLE

IMPORTANTE: Mantén los valores numéricos de distancias, áreas y coordenadas exactamente como se suministraron. No inventes colindantes no especificados (usa fórmula técnica estándar).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: "Eres un perito técnico y especialista en saneamiento catastral en Perú. Redacta documentos técnicos con la mayor formalidad jurídica y topográfica.",
          temperature: 0.2,
        },
      });

      return res.json({
        draft: response.text || generateTemplateMemoria(project, geometry, technicalTable),
        source: "gemini",
      });
    } catch (err) {
      console.error("Error generating memoria:", err);
      return res.json({
        draft: generateTemplateMemoria(req.body?.project, req.body?.geometry, req.body?.technicalTable),
        source: "template_fallback",
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GeoSaneamiento Perú] Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

function generateCadastralFallbackResponse(message: string, geometryContext: any): string {
  const lower = (message || "").toLowerCase();

  if (lower.includes("región") || lower.includes("zona") || lower.includes("desfase") || lower.includes("mar")) {
    return `En el Perú, el territorio nacional se divide en tres zonas UTM (Hemisferio Sur):
- Zona 17S: Costa norte y selva norte (Tumbes, Piura, Lambayeque, La Libertad, Cajamarca).
- Zona 18S: Zona central y gran parte del país (Lima, Callao, Ancash, Ica, Junín, Pasco, Huánuco, Ayacucho, Huancavelica, Apurímac, Cusco occidental).
- Zona 19S: Zona oriental y surandina (Puno, Tacna, Moquegua, Madre de Dios, selva oriental de Loreto y Ucayali).

Si su predio aparece desplazado varios cientos de kilómetros (por ejemplo, en el Océano Pacífico o en Brasil), es probable que haya seleccionado una Zona UTM distinta a la del levantamiento. Verifique si sus coordenadas corresponden a la Zona 17S, 18S o 19S. Asimismo, si los datos provienen de cartografía antigua en PSAD56, existe un desfase geodésico de ~380m a 420m respecto a WGS84 oficial.`;
  }

  if (lower.includes("autointersecc") || lower.includes("error") || lower.includes("geocheck") || lower.includes("cruz")) {
    return `El módulo GeoCheck valida la topología del polígono según la regla OGC de polígono simple:
1. Autointersección: Ocurre cuando el orden de ingreso de los vértices no sigue una secuencia perimétrica continua (horaria o antihoraria) y los segmentos de linderos se cruzan entre sí (formando un lazo en "8" o pajarita).
2. Solución: Verifique en la tabla de coordenadas el orden correlativo de los puntos perimétricos V1 → V2 → ... → Vn. Puede reordenar los vértices o invertir el sentido con las herramientas de la tabla.`;
  }

  if (lower.includes("sunarp") || lower.includes("requisito") || lower.includes("expediente") || lower.includes("tolerancia")) {
    return `Para la presentación ante SUNARP (según la Directiva N° 004-2020-SUNARP/SN y el Reglamento de Inscripciones del Registro de Predios):
1. El plano perimétrico y de ubicación debe estar georreferenciado a la Red Geodésica Geocéntrica Nacional (REGGEN) en datum oficial WGS84.
2. El Cuadro de Datos Técnicos debe indicar: Vértice, Lado, Distancia (en metros con 2 decimales), Azimut/Rumbo (grados, minutos, segundos), Coordenadas UTM Este (X) y Norte (Y) con 4 decimales para predios urbanos/rurales.
3. Debe incluir Memoria Descriptiva firmada y sellada por profesional colegiado habilitado (Ingeniero Civil, Agrícola, Geógrafo o Arquitecto).
4. La plataforma le permite generar el expediente técnico descargable (PDF, DXF para AutoCAD, GeoJSON y Memoria).`;
  }

  return `GeoSaneamiento Perú Asistente:
Para apoyarle de forma óptima en su levantamiento:
- Asegúrese de que el sistema de coordenadas esté configurado correctamente (WGS84 UTM 17S, 18S o 19S).
- Revise que todos los vértices mantengan un orden correlativo continuo.
- Utilice el módulo GeoCheck para descartar autointersecciones o vértices duplicados.
- Recuerde que según la normativa del Sistema Nacional Integrado de Catastro (SNCP - Ley 28294), todos los planos deben ser validados por el profesional responsable antes de su ingreso formal a la entidad registral o municipal.`;
}

function generateTemplateMemoria(project: any, geometry: any, technicalTable: any[]): string {
  const p = project || {};
  const g = geometry || { areaM2: 0, areaHa: 0, perimeterM: 0, utmZone: "18", hemisphere: "S", datum: "WGS84" };
  const rows = technicalTable || [];

  return `MEMORIA DESCRIPTIVA
SANEAMIENTO FÍSICO LEGAL DE PREDIO

1. ANTECEDENTES Y GENERALIDADES
El presente documento técnico forma parte del expediente de saneamiento físico-legal para el predio denominado "${p.propertyName || "PREDIO MATRIZ"}", en el marco del trámite de ${p.procedureType || "Inmatriculación / Modificación Física de Predio"}, a ser presentado ante ${p.destinationEntity || "SUNARP - Zona Registral"}.

2. PROPIETARIO / POSESIONARIO
- Titular / Posesionario: ${p.owner || "TITULAR NO ESPECIFICADO"}
- Documento de Identidad (DNI / RUC): ${p.docNumber || "---"}
- Condición: Propietario / Posesionario con justo título

3. UBICACIÓN POLÍTICA Y GEOGRÁFICA
- Departamento: ${p.department || "LIMA"}
- Provincia: ${p.province || "LIMA"}
- Distrito: ${p.district || "LIMA"}
- Sector / C.P.: ${p.sector || p.centerPopulated || "SECTOR MATRIZ"}
- Tipo de Predio: ${p.propertyType || "Rural"}

4. DATUM Y SISTEMA DE REFERENCIA GEODÉSICO
El levantamiento topográfico y georreferenciación ha sido enlazado a la Red Geodésica Geocéntrica Nacional (REGGEN) del Instituto Geográfico Nacional (IGN):
- Sistema Geodésico: ${g.datum || "WGS84"} (World Geodetic System 1984)
- Proyección Cartográfica: Universal Transversa de Mercator (UTM)
- Zona Geográfica: Zona ${g.utmZone || "18"} Sur (${g.epsg ? `EPSG: ${g.epsg}` : "UTM Sur"})
- Elipsoide de Referencia: GRS80

5. DESCRIPCIÓN PERIMÉTRICA Y COLINDANCIAS
El predio encierra un polígono regular/irregular de ${rows.length} vértices, cuyos linderos y colindancias se describen a continuación:

${rows.length > 0 ? rows.map((r) => `- Tramo del vértice ${r.vertex} al vértice ${r.nextVertex}: Con una distancia lineal de ${r.distance} metros, azimut ${r.azimuth} (${r.rumbo}), colindando con: ${r.colindancia || "Propiedad de terceros / Camino de acceso"}.`).join("\n") : "Sin tramos registrados."}

6. CUADRO DE RESUMEN TÉCNICO
- Área Total del Predio: ${(g.areaM2 || 0).toLocaleString("es-PE", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} m²
- Área Equivalente en Hectáreas: ${(g.areaHa || 0).toFixed(4)} ha
- Perímetro Total: ${(g.perimeterM || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ml
- Número de Vértices: ${rows.length}

7. METODOLOGÍA Y EQUIPO UTILIZADO
El levantamiento ha sido ejecutado mediante medición GNSS diferencial / Estación Total con precisión milimétrica, realizando post-proceso y cierre poligonal ajustado a las tolerancias catastrales y registrales establecidas en la Directiva SUNARP N° 004-2020-SUNARP/SN.

8. RESPONSABILIDAD TÉCNICA
El profesional que suscribe declara bajo juramento que los datos contenidos en la presente Memoria Descriptiva y los Planos anexos corresponden fielmente a la realidad física del predio levantado en campo.

Fecha: ${p.surveyDate || new Date().toLocaleDateString("es-PE")}
Profesional Responsable: ${p.professional || "INGENIERO RESPONSABLE"}
Registro Profesional: ${p.professionalReg || "CIP / CAP"}
`;
}

startServer();
