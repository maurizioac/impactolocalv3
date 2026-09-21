// ============================================================================
// api/usuarios/[id].js — Función serverless de Vercel (ruta dinámica).
// GET    /api/usuarios/5 -> obtiene un usuario
// PUT    /api/usuarios/5 -> edita un usuario
// DELETE /api/usuarios/5 -> elimina un usuario
// ============================================================================
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const [usuario] = await sql`SELECT * FROM usuarios WHERE id = ${id}`;
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      return res.status(200).json(usuario);
    }

    if (req.method === 'PUT') {
      const { nombre, email, edad } = req.body || {};
      const [usuario] = await sql`
        UPDATE usuarios
        SET nombre = COALESCE(${nombre}, nombre),
            email = COALESCE(${email}, email),
            edad = COALESCE(${edad}, edad)
        WHERE id = ${id}
        RETURNING *
      `;
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      return res.status(200).json(usuario);
    }

    if (req.method === 'DELETE') {
      const [usuario] = await sql`DELETE FROM usuarios WHERE id = ${id} RETURNING *`;
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      return res.status(200).json({ mensaje: 'Usuario eliminado correctamente' });
    }

    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('ERROR EN /api/usuarios/[id]:', err);
    return res.status(500).json({ error: err.message });
  }
}
