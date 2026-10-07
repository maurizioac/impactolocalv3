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
      WITH solicitud AS (
        SELECT id, usuario, email, password_hash
        FROM solicitudes_registro_org
        WHERE id = ${id} AND estado = 'pendiente'
      ),
      insertada AS (
        INSERT INTO "ORGANIZACIONES" ("NOMBRE DE USUARIO", "CORREO ELECTRÓNICO", "CONTRASEÑA")
        SELECT s.usuario, s.email, s.password_hash
        FROM solicitud s
        WHERE ${estado} = 'aprobada'
          AND NOT EXISTS (
            SELECT 1 FROM "ORGANIZACIONES" o
            WHERE lower(o."NOMBRE DE USUARIO") = lower(s.usuario)
               OR lower(o."CORREO ELECTRÓNICO") = lower(s.email)
          )
        RETURNING id
      )
      UPDATE solicitudes_registro_org r
      SET estado = ${estado}, motivo_rechazo = ${estado === 'rechazada' ? motivo : null}
      WHERE r.id IN (SELECT id FROM solicitud)
        AND (${estado} = 'rechazada' OR EXISTS (SELECT 1 FROM insertada))
      RETURNING r.id, r.estado, r.motivo_rechazo`;
    if (!rows.length) {
      if (estado === 'aprobada')
        return res.status(409).json({ ok: false, message: 'El usuario o correo ya existe en ORGANIZACIONES, o la solicitud ya fue atendida.' });
      return res.status(404).json({ ok: false, message: 'No existe una solicitud pendiente con ese identificador.' });
    }
    return res.status(200).json({ ok: true, solicitud: rows[0] });
  } catch (err) {
    console.error('ERROR /api/admin/solicitudes/:id:', err);
    return res.status(500).json({ ok: false, message: 'No se pudo actualizar la solicitud.' });
  }
}
