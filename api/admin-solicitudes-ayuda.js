import { sql, soloMetodos } from './_db.js';
import { requireAdmin } from './_admin-auth.js';

const normalizeKey = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const quote = (value) => '"' + String(value).replace(/"/g, '""') + '"';
const pick = (row, aliases) => {
  const keys = aliases.map(normalizeKey);
  const actual = Object.keys(row).find((key) => keys.includes(normalizeKey(key)));
  return actual ? row[actual] : '';
};

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['GET', 'PATCH'])) return;
  if (!requireAdmin(req, res)) return;
  try {
    let columns = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'SOLICITUDES_ORG' ORDER BY ordinal_position`;
    let status = columns.find((column) => ['estado', 'status'].includes(normalizeKey(column.column_name)));
    if (!status) {
      await sql`ALTER TABLE "SOLICITUDES_ORG" ADD COLUMN IF NOT EXISTS "ESTADO" VARCHAR(30) NOT NULL DEFAULT 'pendiente'`;
      columns = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'SOLICITUDES_ORG' ORDER BY ordinal_position`;
      status = columns.find((column) => ['estado', 'status'].includes(normalizeKey(column.column_name)));
    }
    if (!status) return res.status(500).json({ ok: false, message: 'La tabla SOLICITUDES_ORG necesita una columna de estado para moderar solicitudes.' });
    if (status.data_type !== 'boolean') await sql(`UPDATE "SOLICITUDES_ORG" SET ${quote(status.column_name)} = 'pendiente' WHERE ${quote(status.column_name)} IS NULL OR btrim(CAST(${quote(status.column_name)} AS text)) = ''`);
    const idColumn = columns.find((column) => ['id', 'idsolicitud', 'solicitudid'].includes(normalizeKey(column.column_name)));
    if (!idColumn) return res.status(500).json({ ok: false, message: 'La tabla SOLICITUDES_ORG necesita una columna de identificador.' });

    if (req.method === 'PATCH') {
      const id = req.body?.id;
      const state = String(req.body?.estado || '').trim().toLowerCase();
      if (id === undefined || id === null || !['aprobada', 'rechazada'].includes(state))
        return res.status(400).json({ ok: false, message: 'Selecciona aprobar o rechazar una solicitud válida.' });
      const storedState = status.data_type === 'boolean' ? state === 'aprobada' : state;
      const pendingCondition = status.data_type === 'boolean' ? `${quote(status.column_name)} IS NULL` : `lower(CAST(${quote(status.column_name)} AS text)) IN ('pendiente', 'pending', '')`;
      const [row] = await sql(`UPDATE "SOLICITUDES_ORG" SET ${quote(status.column_name)} = $1 WHERE ${quote(idColumn.column_name)} = $2 AND ${pendingCondition} RETURNING *`, [storedState, id]);
      if (!row) return res.status(404).json({ ok: false, message: 'La solicitud ya fue atendida o no existe.' });
      return res.status(200).json({ ok: true, solicitud: row });
    }

    const rows = await sql(`SELECT * FROM "SOLICITUDES_ORG" ORDER BY ${quote(idColumn.column_name)} DESC`);
    const solicitudes = rows.map((row) => ({
      id: pick(row, ['id', 'id solicitud', 'solicitud id']),
      nombre_usuario: pick(row, ['nombre usuario', 'usuario', 'organizacion', 'autor', 'nombre de la organizacion']),
      titulo: pick(row, ['titulo', 'titulo de la solicitud', 'title', 'asunto']),
      tipo: pick(row, ['tipo', 'tipo de solicitud', 'categoria']),
      descripcion: pick(row, ['descripcion', 'descripcion y detalles', 'description', 'detalles']),
      ubicacion: pick(row, ['ubicacion', 'location', 'lugar']),
      meta: pick(row, ['meta', 'cantidad solicitada', 'objetivo', 'goal']),
      imagen: pick(row, ['imagen', 'imagen principal', 'imagen de evidencia', 'evidencia']),
      estado: status.data_type === 'boolean' ? (pick(row, ['estado', 'status']) === true ? 'aprobada' : pick(row, ['estado', 'status']) === false ? 'rechazada' : 'pendiente') : (pick(row, ['estado', 'status']) || 'pendiente')
    })).filter((item) => item.titulo);
    return res.status(200).json({ ok: true, solicitudes });
  } catch (error) {
    console.error('ERROR /api/admin/solicitudes-ayuda:', error);
    return res.status(500).json({ ok: false, message: 'No se pudieron cargar o moderar las solicitudes de ayuda.' });
  }
}
