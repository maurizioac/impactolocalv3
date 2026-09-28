import { sql, soloMetodos } from './_db.js';
import { requireAdmin } from './_admin-auth.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['PATCH'])) return;
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const id = Number(req.params?.id);
  const estado = req.body?.estado;
  const motivo = String(req.body?.motivo || '').trim();
  if (!Number.isInteger(id) || id < 1)
    return res.status(400).json({ ok: false, message: 'Solicitud no válida.' });
  if (!['aprobada', 'rechazada'].includes(estado))
    return res.status(400).json({ ok: false, message: 'Elige aprobar o rechazar la solicitud.' });
  if (estado === 'rechazada' && (motivo.length < 5 || motivo.length > 1000))
    return res.status(400).json({ ok: false, message: 'Escribe un motivo de rechazo de entre 5 y 1000 caracteres.' });

  try {
    const rows = await sql`
      UPDATE solicitudes_org
      SET estado = ${estado}, motivo_rechazo = ${estado === 'rechazada' ? motivo : null}
      WHERE id = ${id} AND estado = 'pendiente'
      RETURNING id, estado, motivo_rechazo`;
    if (!rows.length) return res.status(404).json({ ok: false, message: 'No existe una solicitud pendiente con ese identificador.' });
    return res.status(200).json({ ok: true, solicitud: rows[0] });
  } catch (err) {
    console.error('ERROR /api/admin/solicitudes/:id:', err);
    return res.status(500).json({ ok: false, message: 'No se pudo actualizar la solicitud.' });
  }
}
