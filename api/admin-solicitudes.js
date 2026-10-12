import { sql, soloMetodos } from './_db.js';
import { requireAdmin } from './_admin-auth.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['GET'])) return;
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const rows = await sql`
      SELECT id, tipo, usuario, email, estado, motivo_rechazo, creado_en
      FROM solicitudes_registro_org
      ORDER BY CASE WHEN estado = 'pendiente' THEN 0 ELSE 1 END, creado_en DESC`;
    return res.status(200).json({ ok: true, solicitudes: rows });
  } catch (err) {
    console.error('ERROR /api/admin/solicitudes:', err);
    return res.status(500).json({ ok: false, message: 'No se pudieron cargar las solicitudes.' });
  }
}
