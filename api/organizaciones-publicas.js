import { sql, soloMetodos } from './_db.js';

const columnas = {
  usuario: ['NOMBRE DE USUARIO', 'USUARIO'],
  titulo: ['TÍTULO', 'TITULO'],
  descripcion: ['DESCRIPCIÓN', 'DESCRIPCION'],
  imagenPrincipal: ['IMAGEN PRINCIPAL'],
  imagenSecundaria: ['IMAGEN SECUNDARIA'],
  subtitulo: ['SUBTÍTULO 1', 'SUBTITULO 1'],
  subtitulo1: ['SUBTÍTULO 1', 'SUBTITULO 1'],
  texto1: ['TEXTO 1'],
  subtitulo2: ['SUBTÍTULO 2', 'SUBTITULO 2'],
  texto2: ['TEXTO 2'],
  web: ['WEB'],
  instagram: ['INSTAGRAM'],
  facebook: ['FACEBOOK'],
  tiktok: ['TIKTOK', 'TIK TOK']
};

function mapear(row) {
  const result = {};
  for (const [key, names] of Object.entries(columnas)) {
    const name = names.find((candidate) => Object.hasOwn(row, candidate));
    result[key] = name ? row[name] : null;
  }
  return result;
}

export default async function organizacionesPublicas(req, res) {
  if (!soloMetodos(req, res, ['GET'])) return;
  try {
    const rows = await sql`SELECT * FROM "PRINCIPAL_ORG"`;
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.status(200).json({ ok: true, organizaciones: rows.map(mapear) });
  } catch (error) {
    console.error('ERROR /api/organizaciones:', error);
    return res.status(500).json({ ok: false, message: 'No se pudo cargar el directorio de organizaciones.' });
  }
}
