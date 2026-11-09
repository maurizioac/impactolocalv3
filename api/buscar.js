import { GoogleGenAI } from '@google/genai';
import { sql, soloMetodos } from './_db.js';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const NO_MATCH = 'No se pudo encontrar una ONG/voluntariado que le pueda ayudar.';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['POST'])) return;
  const termino = typeof req.body?.termino === 'string' ? req.body.termino.trim().slice(0, 600) : '';
  if (!termino) return res.status(400).json({ success: false, message: 'Cuéntanos qué necesitas buscar.' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ success: false, message: 'El asistente no está configurado en este momento.' });

  try {
    const organizaciones = await sql`
      SELECT
        "NOMBRE DE USUARIO" AS nombre_usuario,
        "TÍTULO" AS titulo,
        "DESCRIPCIÓN" AS descripcion,
        "SUBTÍTULO 1" AS subtitulo_1,
        "TEXTO 1" AS texto_1,
        "SUBTÍTULO 2" AS subtitulo_2,
        "TEXTO 2" AS texto_2
      FROM "PRINCIPAL_ORG"
      WHERE lower(trim(CAST("ESTADO" AS text))) IN ('aceptado', 'aceptada', 'aprobado', 'aprobada', 'vigente', 'true', '1')
      ORDER BY lower("NOMBRE DE USUARIO")
      LIMIT 150
    `;
    if (!organizaciones.length) {
      return res.status(200).json({ success: true, respuesta: NO_MATCH, organizaciones: [] });
    }

    const candidates = organizaciones.map((org, index) => ({
      id: String(index),
      nombre: String(org.nombre_usuario || '').slice(0, 160),
      titulo: String(org.titulo || '').slice(0, 240),
      descripcion: String(org.descripcion || '').slice(0, 1200),
      informacion: [org.subtitulo_1, org.texto_1, org.subtitulo_2, org.texto_2].filter(Boolean).join(' ').slice(0, 1200),
    }));
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Eres el asistente de ImpactoLOCAL, plataforma peruana que conecta personas con organizaciones comunitarias.\n\nCaso descrito por la persona:\n${termino}\n\nOrganizaciones aprobadas existentes en Neon (esta es la única fuente de verdad):\n${JSON.stringify(candidates)}\n\nAnaliza la necesidad aunque esté explicada como un caso, con sinónimos, errores ortográficos o lenguaje cotidiano. Selecciona solo organizaciones cuyo trabajo descrito realmente pueda ayudar con este caso. No inventes organizaciones, capacidades, horarios, direcciones ni promesas. Si no hay coincidencias claras, deja recomendaciones vacías y responde exactamente: "No se pudo encontrar una ONG/voluntariado que le pueda ayudar." Si encuentras coincidencias, responde con calidez en una o dos frases, explicando la conexión con el caso usando solo información de las fichas. Devuelve como máximo 5 coincidencias y un motivo breve basado únicamente en la ficha de cada organización. Los ids deben copiarse exactamente de la lista.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            respuesta: { type: 'STRING' },
            recomendaciones: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: { id: { type: 'STRING' }, motivo: { type: 'STRING' } },
                required: ['id', 'motivo'],
              },
            },
          },
          required: ['respuesta', 'recomendaciones'],
        },
      },
    });
    const generated = JSON.parse(response.text || '{}');
    const seen = new Set();
    const recomendaciones = (Array.isArray(generated.recomendaciones) ? generated.recomendaciones : [])
      .filter((item) => item && /^\d+$/.test(String(item.id)) && Number(item.id) < organizaciones.length && !seen.has(String(item.id)) && seen.add(String(item.id)))
      .slice(0, 5)
      .map((item) => ({
        ...organizaciones[Number(item.id)],
        motivo: String(item.motivo || 'Su ficha está relacionada con lo que buscas.').slice(0, 350),
      }));

    return res.status(200).json({
      success: true,
      respuesta: recomendaciones.length
        ? String(generated.respuesta || 'Encontré organizaciones relacionadas con lo que necesitas.').slice(0, 500)
        : NO_MATCH,
      organizaciones: recomendaciones,
    });
  } catch (error) {
    console.error('ERROR EN /api/buscar:', error);
    if (error.code === '42P01') return res.status(500).json({ success: false, message: 'No se encontró la tabla de organizaciones en Neon.' });
    if (error.code === '42703') return res.status(500).json({ success: false, message: 'Falta revisar la columna ESTADO de PRINCIPAL_ORG en Neon.' });
    return res.status(500).json({ success: false, message: 'No se pudo consultar a Gemini y Neon en este momento.' });
  }
}