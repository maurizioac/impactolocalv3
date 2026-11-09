import { sql, soloMetodos } from './_db.js';
import { requireAdmin } from './_admin-auth.js';

const quote = (value) => '"' + String(value).replace(/"/g, '""') + '"';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['GET', 'PATCH'])) return;
  if (!requireAdmin(req, res)) return;
  try {
    if (req.method === 'PATCH') {
      const username = String(req.body?.nombre_usuario || '').trim();
      const requestedState = String(req.body?.estado || '').trim().toLowerCase();
      if (!username || !['aceptado', 'rechazado'].includes(requestedState)) {
        return res.status(400).json({ ok: false, message: 'Selecciona aceptar o rechazar una publicación válida.' });
      }
      const columns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'PRINCIPAL_ORG'
      `;
      const status = columns.find((column) => String(column.column_name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === 'estado');
      const owner = columns.find((column) => String(column.column_name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '') === 'nombredeusuario');
      if (!status || !owner) return res.status(500).json({ ok: false, message: 'PRINCIPAL_ORG necesita las columnas ESTADO y NOMBRE DE USUARIO.' });

      const statusName = quote(status.column_name);
      const pendingCondition = `(${statusName} IS NULL OR lower(trim(CAST(${statusName} AS text))) IN ('', 'pendiente', 'pending', 'null'))`;
      const storedState = status.data_type === 'boolean' ? requestedState === 'aceptado' : requestedState.toUpperCase();
      const [publication] = await sql(
        `UPDATE "PRINCIPAL_ORG" SET ${statusName} = $1 WHERE lower(trim(CAST(${quote(owner.column_name)} AS text))) = lower(trim($2)) AND ${pendingCondition} RETURNING ${quote(owner.column_name)} AS nombre_usuario, ${statusName} AS estado`,
        [storedState, username]
      );
      if (!publication) return res.status(409).json({ ok: false, message: 'La publicación ya fue revisada o no existe.' });
      return res.status(200).json({ ok: true, publicacion: publication });
    }

    const publicaciones = await sql`
      SELECT
        "NOMBRE DE USUARIO" AS nombre_usuario,
        "TÍTULO" AS titulo,
        "DESCRIPCIÓN" AS descripcion,
        "IMAGEN PRINCIPAL" AS imagen_principal,
        "IMAGEN SECUNDARIA" AS imagen_secundaria,
        "SUBTÍTULO 1" AS subtitulo_1,
        "TEXTO 1" AS texto_1,
        "SUBTÍTULO 2" AS subtitulo_2,
        "TEXTO 2" AS texto_2,
        "WEB" AS web,
        "INSTAGRAM" AS instagram,
        "FACEBOOK" AS facebook,
        "TIK TOK" AS tik_tok,
        "HORA" AS hora,
        "FECHA" AS fecha,
        "ESTADO" AS estado
      FROM "PRINCIPAL_ORG"
      ORDER BY lower("NOMBRE DE USUARIO")
    `;
    return res.status(200).json({ ok: true, publicaciones });
  } catch (error) {
    console.error('ERROR /api/admin/publicaciones:', error);
    if (error.code === '42P01') return res.status(500).json({ ok: false, message: 'Neon no encuentra la tabla PRINCIPAL_ORG.' });
    if (error.code === '42703') return res.status(500).json({ ok: false, message: 'No coinciden los nombres de las columnas de PRINCIPAL_ORG.' });
    return res.status(500).json({ ok: false, message: 'No se pudieron cargar o moderar las publicaciones desde Neon.' });
  }
}