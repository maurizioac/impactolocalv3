import { sql, soloMetodos } from './_db.js';
import { requireAdmin } from './_admin-auth.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['GET'])) return;
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await sql`
      SELECT "NOMBRE DE USUARIO" AS nombre,
             "CORREO ELECTRÓNICO" AS email,
             "OCUPACIÓN" AS descripcion,
             "WEB" AS web,
             "INSTAGRAM" AS instagram,
             "FACEBOOK" AS facebook,
             "TIK TOK" AS tiktok
      FROM "ORGANIZACIONES"
      ORDER BY lower("NOMBRE DE USUARIO")`;
    return res.status(200).json({ ok: true, organizaciones: rows });
  } catch (err) {
    console.error('ERROR /api/admin/organizaciones:', err);
    return res.status(500).json({ ok: false, message: 'No se pudo cargar el directorio de organizaciones.' });
  }
}
