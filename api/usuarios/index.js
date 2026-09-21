// ============================================================================
// api/usuarios/index.js — Función serverless de Vercel.
// GET  /api/usuarios  -> lista todos los usuarios
// POST /api/usuarios  -> crea un usuario nuevo
//
// Usa el driver "serverless" de Neon, pensado justo para este tipo de
// funciones (habla con la base de datos por HTTPS, no por conexión TCP
// directa, que es lo que no se puede hacer desde funciones serverless
// ni mucho menos desde el navegador).
// ============================================================================
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function asegurarTabla() {
  await sql`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      email VARCHAR(120) NOT NULL,
      edad INTEGER
    )
  `;
}

export default async function handler(req, res) {
  try {
    await asegurarTabla();

    if (req.method === 'GET') {
      const usuarios = await sql`SELECT * FROM usuarios ORDER BY id`;
      return res.status(200).json(usuarios);
    }

    if (req.method === 'POST') {
      const { nombre, email, edad } = req.body || {};

      if (!nombre || !email) {
        return res.status(400).json({ error: 'nombre y email son obligatorios' });
      }

      const [nuevoUsuario] = await sql`
        INSERT INTO usuarios (nombre, email, edad)
        VALUES (${nombre}, ${email}, ${edad ?? null})
        RETURNING *
      `;

      return res.status(201).json(nuevoUsuario);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('ERROR EN /api/usuarios:', err);
    return res.status(500).json({ error: err.message });
  }
}
