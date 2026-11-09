import express from 'express'; 
import { GoogleGenAI } from '@google/genai'; 
import dotenv from 'dotenv';

dotenv.config();

const app = express(); 
const port = process.env.PORT || 3000;

app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/preguntar', async (req, res) => {  
    try {
        const { texto } = req.body;
        if (!texto) {      
            return res.status(400).json({
                error: 'El campo "texto" es obligatorio en el cuerpo JSON.'
            });
        }
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: texto,
        });
        res.json({
            pregunta: texto,
            respuesta: response.text
        });
        } catch (error) {
            console.error('Error al comunicarse con Gemini:', error);
            res.status(500).json({
                error: 'Hubo un problema al procesar la solicitud con Gemini.'
            });
        }
    }
);

app.listen(port, () => {  
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});