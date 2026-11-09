import { sql, soloMetodos } from './_db.js';
import { requireAdmin } from './_admin-auth.js';

const normalizeKey = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const quote = (value) => '"' + String(value).replace(/"/g, '""') + '"';
const pick = (row, aliases) => {
  const keys = aliases.map(normalizeKey);
  const actual = Object.keys(row).find((key) => keys.includes(normalizeKey(key)));
  return actual ? row[actual] : null;
};
function stateLabel(value) {
  if (value === true || value === 1) return 'ACEPTADO';
  if (value === false || value === 0) return 'RECHAZADO';
  const state = String(value ?? '').trim().toLowerCase();
  if (['aceptado', 'aceptada', 'aprobado', 'aprobada', 'vigente', 'true', '1'].includes(state)) return 'ACEPTADO';
  if (['rechazado', 'rechazada', 'false', '0'].includes(state)) return 'RECHAZADO';
  return 'pendiente';
}

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['GET', 'PATCH'])) return;
  if (!requireAdmin(req, res)) return;
  try {
    let columns = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'SOLICITUDES_ORG' ORDER BY ordinal_position`;
    let status = columns.find((column) => ['estado', 'status'].includes(normalizeKey(column.column_name)));
    if (!status) {
      await sql`ALTER TABLE "SOLICITUDES_ORG" ADD COLUMN IF NOT EXISTS "ESTADO" VARCHAR(30)`;
      columns = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'SOLICITUDES_ORG' ORDER BY ordinal_position`;
      status = columns.find((column) => ['estado', 'status'].includes(normalizeKey(column.column_name)));
    }
    if (!status) return res.status(500).json({ ok: false, message: 'La tabla SOLICITUDES_ORG necesita una columna ESTADO.' });
    const idColumn = columns.find((column) => ['id', 'idsolicitud', 'solicitudid'].includes(normalizeKey(column.column_name)));
    if (!idColumn) return res.status(500).json({ ok: false, message: 'La tabla SOLICITUDES_ORG necesita una columna ID.' });

    if (req.method === 'PATCH') {
      const id = req.body?.id;
      const requestedState = String(req.body?.estado || '').trim().toLowerCase();
      if (id === undefined || id === null || !['aceptado', 'aceptada', 'aprobado', 'aprobada', 'rechazado', 'rechazada'].includes(requestedState)) {
        return res.status(400).json({ ok: false, message: 'Selecciona aceptar o rechazar una solicitud válida.' });
      }
      const accepted = ['aceptado', 'aceptada', 'aprobado', 'aprobada'].includes(requestedState);
      const storedState = status.data_type === 'boolean' ? accepted : (accepted ? 'ACEPTADO' : 'RECHAZADO');
      const pendingCondition = status.data_type === 'boolean'
        ? `${quote(status.column_name)} IS NULL`
        : `(${quote(status.column_name)} IS NULL OR lower(trim(CAST(${quote(status.column_name)} AS text))) IN ('', 'pendiente', 'pending', 'null'))`;
      const [row] = await sql(
        `UPDATE "SOLICITUDES_ORG" SET ${quote(status.column_name)} = $1 WHERE ${quote(idColumn.column_name)} = $2 AND ${pendingCondition} RETURNING *`,
        [storedState, id]
      );
      if (!row) return res.status(404).json({ ok: false, message: 'La solicitud ya fue atendida o no existe.' });
      return res.status(200).json({ ok: true, solicitud: row });
    }

    const rows = await sql(`SELECT * FROM "SOLICITUDES_ORG" ORDER BY ${quote(idColumn.column_name)} DESC`);
    const solicitudes = rows.map((row) => ({
      id: pick(row, ['id', 'id solicitud', 'solicitud id']),
      nombre_usuario: pick(row, ['nombre usuario', 'usuario', 'organizacion', 'autor', 'nombre de la organizacion']),
      titulo: pick(row, ['titulo', 'titulo de la solicitud', 'title', 'asunto']),
      descripcion: pick(row, ['descripcion', 'descripcion y detalles', 'description', 'detalles']),
      imagen: pick(row, ['imagen principal', 'imagen', 'imagen de evidencia', 'evidencia']),
      imagen_nombre: pick(row, ['nombre archivo', 'imagen nombre', 'nombre imagen', 'archivo evidencia']),
      web: pick(row, ['web', 'sitio web']),
      instagram: pick(row, ['instagram']),
      facebook: pick(row, ['facebook']),
      tik_tok: pick(row, ['tik tok', 'tiktok']),
      hora: pick(row, ['hora']),
      fecha: pick(row, ['fecha']),
      fecha_limite: pick(row, ['fecha limite']),
      estado: stateLabel(pick(row, ['estado', 'status'])),
      tipo: pick(row, ['tipo de solicitud', 'tipo', 'categoria']),
      ubicacion: pick(row, ['ubicacion', 'lugar']),
      meta: pick(row, ['meta / cantidad solicitada', 'meta cantidad solicitada', 'cantidad solicitada', 'meta', 'objetivo'])
    })).filter((item) => item.titulo);
    return res.status(200).json({ ok: true, solicitudes });
  } catch (error) {
    console.error('ERROR /api/admin/solicitudes-ayuda:', error);
    return res.status(500).json({ ok: false, message: 'No se pudieron cargar o moderar las solicitudes de ayuda.' });
  }
}