import { sql, soloMetodos } from './_db.js';
import { getOrganizationSession, requireOrganization } from './_org-auth.js';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function imageDataUrl(value) {
  if (!value) return null;
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(String(value));
  if (!match) return false;
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return false;
  const mime = match[1].toLowerCase();
  const validSignature = mime === 'png'
    ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : mime === 'jpeg'
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  return validSignature ? `data:image/${mime};base64,${bytes.toString('base64')}` : false;
}

function optionalUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : false;
  } catch { return false; }
}

function orgFields(row) {
  return {
    nombre_usuario: row.nombre_usuario,
    titulo: row.titulo,
    descripcion: row.descripcion,
    imagen_principal: row.imagen_principal,
    imagen_secundaria: row.imagen_secundaria,
    subtitulo_1: row.subtitulo_1,
    texto_1: row.texto_1,
    subtitulo_2: row.subtitulo_2,
    texto_2: row.texto_2,
    web: row.web,
    instagram: row.instagram,
    facebook: row.facebook,
    tik_tok: row.tik_tok,
  };
}

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['GET', 'POST'])) return;

  try {
    if (req.method === 'POST') {
      const organization = requireOrganization(req, res);
      if (!organization) return;

      const titulo = String(req.body?.titulo || '').trim();
      const descripcion = String(req.body?.descripcion || '').trim();
      const subtitulo1 = String(req.body?.subtitulo_1 || '').trim();
      const texto1 = String(req.body?.texto_1 || '').trim();
      const subtitulo2 = String(req.body?.subtitulo_2 || '').trim();
      const texto2 = String(req.body?.texto_2 || '').trim();
      const imagenPrincipal = imageDataUrl(req.body?.imagen_principal);
      const imagenSecundaria = imageDataUrl(req.body?.imagen_secundaria);
      const web = optionalUrl(req.body?.web);
      const instagram = optionalUrl(req.body?.instagram);
      const facebook = optionalUrl(req.body?.facebook);
      const tikTok = optionalUrl(req.body?.tik_tok);

      if (titulo.length < 3 || titulo.length > 120) return res.status(400).json({ ok: false, message: 'El título debe tener entre 3 y 120 caracteres.' });
      if (descripcion.length < 3 || descripcion.length > 500) return res.status(400).json({ ok: false, message: 'La descripción debe tener entre 3 y 500 caracteres.' });
      if (subtitulo1.length > 100 || subtitulo2.length > 100 || texto1.length > 500 || texto2.length > 500) return res.status(400).json({ ok: false, message: 'Revisa el largo de los subtítulos y textos complementarios.' });
      if ([imagenPrincipal, imagenSecundaria].includes(false)) return res.status(400).json({ ok: false, message: 'Cada imagen debe ser PNG, JPG o WEBP y no superar 3 MB.' });
      const totalImageBytes = [imagenPrincipal, imagenSecundaria].reduce(function (sum, image) {
        if (!image) return sum;
        const encoded = image.slice(image.indexOf(',') + 1);
        return sum + Math.floor(encoded.length * 3 / 4);
      }, 0);
      if (totalImageBytes > 5 * 1024 * 1024) return res.status(400).json({ ok: false, message: 'El tamaño combinado de las imágenes no puede superar 5 MB.' });
      if ([web, instagram, facebook, tikTok].includes(false)) return res.status(400).json({ ok: false, message: 'Los enlaces deben ser direcciones HTTP o HTTPS válidas.' });

      const [account] = await sql`
        SELECT "NOMBRE DE USUARIO" AS nombre_usuario
        FROM "ORGANIZACIONES"
        WHERE lower("NOMBRE DE USUARIO") = lower(${organization.username})
        LIMIT 1
      `;
      if (!account) return res.status(403).json({ ok: false, message: 'No se encontró la organización de esta sesión.' });

      const [updated] = await sql`
        UPDATE "PRINCIPAL_ORG"
        SET "TÍTULO" = ${titulo},
            "DESCRIPCIÓN" = ${descripcion},
            "IMAGEN PRINCIPAL" = COALESCE(${imagenPrincipal}, "IMAGEN PRINCIPAL"),
            "IMAGEN SECUNDARIA" = COALESCE(${imagenSecundaria}, "IMAGEN SECUNDARIA"),
            "SUBTÍTULO 1" = ${subtitulo1},
            "TEXTO 1" = ${texto1},
            "SUBTÍTULO 2" = ${subtitulo2},
            "TEXTO 2" = ${texto2},
            "WEB" = ${web},
            "INSTAGRAM" = ${instagram},
            "FACEBOOK" = ${facebook},
            "TIK TOK" = ${tikTok}
        WHERE lower("NOMBRE DE USUARIO") = lower(${account.nombre_usuario})
        RETURNING
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
          "TIK TOK" AS tik_tok
      `;
      if (updated) return res.status(200).json({ ok: true, organizacion: orgFields(updated) });

      const [created] = await sql`
        INSERT INTO "PRINCIPAL_ORG" (
          "NOMBRE DE USUARIO", "TÍTULO", "DESCRIPCIÓN", "IMAGEN PRINCIPAL", "IMAGEN SECUNDARIA",
          "SUBTÍTULO 1", "TEXTO 1", "SUBTÍTULO 2", "TEXTO 2", "WEB", "INSTAGRAM", "FACEBOOK", "TIK TOK"
        ) VALUES (
          ${account.nombre_usuario}, ${titulo}, ${descripcion}, ${imagenPrincipal}, ${imagenSecundaria},
          ${subtitulo1}, ${texto1}, ${subtitulo2}, ${texto2}, ${web}, ${instagram}, ${facebook}, ${tikTok}
        )
        RETURNING
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
          "TIK TOK" AS tik_tok
      `;
      return res.status(201).json({ ok: true, organizacion: orgFields(created) });
    }

    const organizaciones = await sql`
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
        "TIK TOK" AS tik_tok
      FROM "PRINCIPAL_ORG"
      ORDER BY lower("NOMBRE DE USUARIO")
    `;

    const currentOrganization = getOrganizationSession(req);
    const normalizeUsername = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const mi_organizacion = currentOrganization
      ? organizaciones.find((item) => normalizeUsername(item.nombre_usuario) === normalizeUsername(currentOrganization.username)) || null
      : null;

    return res.status(200).json({ ok: true, organizaciones, mi_organizacion });
  } catch (error) {
    console.error('ERROR /api/principal-org:', error);
    if (error.code === '42P01') {
      return res.status(500).json({ ok: false, message: 'Neon no encuentra la tabla PRINCIPAL_ORG.' });
    }
    if (error.code === '42703') {
      return res.status(500).json({ ok: false, message: 'No coinciden los nombres de las columnas de PRINCIPAL_ORG.' });
    }
    return res.status(500).json({ ok: false, message: 'No se pudieron cargar las organizaciones desde Neon.' });
  }
}
