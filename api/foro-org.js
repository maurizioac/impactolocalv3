import { sql, soloMetodos } from './_db.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['GET'])) return;

  try {
    const publicaciones = await sql`
      SELECT
        "NOMBRE DE USUARIO" AS nombre_usuario,
        "TÍTULO" AS titulo,
        "DESCRIPCIÓN" AS descripcion,
        "IMAGEN PARCIAL" AS imagen_parcial,
        "WEB" AS web,
        "INSTAGRAM" AS instagram,
        "FACEBOOK" AS facebook,
        "TIK TOK" AS tik_tok
      FROM foro_org
      ORDER BY "NOMBRE DE USUARIO", "TÍTULO"
    `;

    return res.status(200).json({ ok: true, publicaciones });
  } catch (error) {
    console.error('ERROR /api/foro-org:', error);
    if (error.code === '42P01') {
      return res.status(500).json({ ok: false, message: 'Neon no encuentra la tabla foro_org.' });
    }
    if (error.code === '42703') {
      return res.status(500).json({ ok: false, message: 'No coinciden los nombres de las columnas de foro_org.' });
    }
    return res.status(500).json({ ok: false, message: 'No se pudieron cargar las publicaciones de organizaciones.' });
  }
}
