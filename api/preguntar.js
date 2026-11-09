import { GoogleGenAI } from '@google/genai';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const texto = typeof req.body?.texto === 'string' ? req.body.texto.trim() : '';
  if (!texto) {
    return res.status(400).json({
      error: 'El campo "texto" es obligatorio en el cuerpo JSON.',
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Falta configurar GEMINI_API_KEY en el archivo .env principal.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: texto,
    });
    return res.json({ pregunta: texto, respuesta: response.text });
  } catch (error) {
    console.error('Error al comunicarse con Gemini:', error);
    return res.status(500).json({
      error: 'Hubo un problema al procesar la solicitud con Gemini.',
    });
  }
}