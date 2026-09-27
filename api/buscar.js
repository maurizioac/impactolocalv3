// ============================================================================
// api/buscar.js — Función serverless de Vercel.
// Recibe lo que el usuario escribió en el buscador de descubre.html y usa
// Gemini para decidir cuáles categorías reales de la plataforma aplican.
//
// IMPORTANTE: este archivo corre en el servidor de Vercel, nunca en el
// navegador. Por eso es seguro leer aquí GEMINI_API_KEY desde las variables
// de entorno — el visitante de la página jamás la ve.
// ============================================================================
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { termino, categorias } = req.body || {};
    if (!termino) {
      return res.status(400).json({
        success: false,
        message: 'El campo termino es obligatorio',
      });
    }

    const palabrasDisponibles = Array.isArray(categorias) ? categorias : [];
    if (palabrasDisponibles.length === 0) {
      return res.status(200).json({
        success: true,
        data: { palabras_relacionadas: [] },
      });
    }

    const palabrasTexto = palabrasDisponibles.map((p) => `- ${p}`).join('\n');
    const prompt = `
Eres el motor de búsqueda de una plataforma que conecta ONGs con
donantes y voluntarios.

Un usuario escribió esta búsqueda en el buscador del sitio:

"${termino}"

Estas son TODAS las palabras/categorías que existen actualmente en las
organizaciones registradas en la plataforma:

${palabrasTexto}

INSTRUCCIONES:

1. Selecciona únicamente palabras de la lista anterior que estén
   relacionadas con la búsqueda del usuario.
2. Considera sinónimos, errores de tipeo y relaciones de significado
   (por ejemplo: "comida" puede relacionarse con "víveres" o
   "alimentos").
3. NO inventes palabras que no estén en la lista.
4. Si ninguna palabra de la lista aplica, devuelve un array vacío.
5. Cada palabra devuelta debe coincidir EXACTAMENTE (mismo texto) con
   una de la lista proporcionada.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            palabras_relacionadas: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
          },
          required: ['palabras_relacionadas'],
        },
      },
    });

    const data = JSON.parse(response.text);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('ERROR EN /api/buscar:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
