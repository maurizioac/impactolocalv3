import { sql, soloMetodos } from './_db.js';
import { getOrganizationSession, requireOrganization } from './_org-auth.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['GET', 'POST'])) return;

  try {
    if (req.method === 'POST') {
      const organization = requireOrganization(req, res);
      if (!organization) return;

      const titulo = String(req.body?.titulo || '').trim();
      const descripcion = String(req.body?.descripcion || '').trim();
      const imagen = imageDataUrl(req.body?.imagen);
      if (titulo.length < 3 || titulo.length > 150) {
        return res.status(400).json({ ok: false, message: 'El título debe tener entre 3 y 150 caracteres.' });
      }
      if (descripcion.length < 3 || descripcion.length > 2500) {
        return res.status(400).json({ ok: false, message: 'La descripción debe tener entre 3 y 2500 caracteres.' });
      }
      if (imagen === false) {
        return res.status(400).json({ ok: false, message: 'La imagen debe ser PNG, JPG o WEBP y no superar 5 MB.' });
      }

      const [perfil] = await sql`
        SELECT "NOMBRE DE USUARIO" AS nombre_usuario,
               "WEB" AS web,
               "INSTAGRAM" AS instagram,
               "FACEBOOK" AS facebook,
               "TIK TOK" AS tik_tok
        FROM "ORGANIZACIONES"
        WHERE lower("NOMBRE DE USUARIO") = lower(${organization.username})
        LIMIT 1
      `;
      if (!perfil) return res.status(403).json({ ok: false, message: 'No se encontró la organización de esta sesión.' });

      const [actualizada] = await sql`
        UPDATE "FORO_ORG"
        SET "TÍTULO" = ${titulo},
            "DESCRIPCIÓN" = ${descripcion},
            "IMAGEN PRINCIPAL" = COALESCE(${imagen}, "IMAGEN PRINCIPAL"),
            "WEB" = ${perfil.web},
            "INSTAGRAM" = ${perfil.instagram},
            "FACEBOOK" = ${perfil.facebook},
            "TIK TOK" = ${perfil.tik_tok}
        WHERE lower("NOMBRE DE USUARIO") = lower(${perfil.nombre_usuario})
        RETURNING
          "NOMBRE DE USUARIO" AS nombre_usuario,
          "TÍTULO" AS titulo,
          "DESCRIPCIÓN" AS descripcion,
          "IMAGEN PRINCIPAL" AS imagen_parcial,
          "WEB" AS web,
          "INSTAGRAM" AS instagram,
          "FACEBOOK" AS facebook,
          "TIK TOK" AS tik_tok
      `;

      if (actualizada) return res.status(201).json({ ok: true, publicacion: actualizada });

      const [publicacion] = await sql`
        INSERT INTO "FORO_ORG" (
          "NOMBRE DE USUARIO", "TÍTULO", "DESCRIPCIÓN", "IMAGEN PRINCIPAL",
          "WEB", "INSTAGRAM", "FACEBOOK", "TIK TOK"
        ) VALUES (
          ${perfil.nombre_usuario}, ${titulo}, ${descripcion}, ${imagen},
          ${perfil.web}, ${perfil.instagram}, ${perfil.facebook}, ${perfil.tik_tok}
        )
        RETURNING
          "NOMBRE DE USUARIO" AS nombre_usuario,
          "TÍTULO" AS titulo,
          "DESCRIPCIÓN" AS descripcion,
          "IMAGEN PRINCIPAL" AS imagen_parcial,
          "WEB" AS web,
          "INSTAGRAM" AS instagram,
          "FACEBOOK" AS facebook,
          "TIK TOK" AS tik_tok
      `;
      return res.status(201).json({ ok: true, publicacion });
    }

    const publicaciones = await sql`
      SELECT
        "NOMBRE DE USUARIO" AS nombre_usuario,
        "TÍTULO" AS titulo,
        "DESCRIPCIÓN" AS descripcion,
        "IMAGEN PRINCIPAL" AS imagen_parcial,
        "WEB" AS web,
        "INSTAGRAM" AS instagram,
        "FACEBOOK" AS facebook,
        "TIK TOK" AS tik_tok
      FROM "FORO_ORG"
      ORDER BY "NOMBRE DE USUARIO", "TÍTULO"
    `;

    const organization = getOrganizationSession(req);
    return res.status(200).json({
      ok: true,
      publicaciones,
      usuario_autenticado: organization?.username || null,
    });
  } catch (error) {
    console.error('ERROR /api/foro-org:', error);
    if (error.code === '42P01') {
      return res.status(500).json({ ok: false, message: 'Neon no encuentra la tabla foro_org.' });
    }
    if (error.code === '42703') {
      return res.status(500).json({ ok: false, message: 'No coinciden los nombres de las columnas de foro_org.' });
    }
    return res.status(500).json({ ok: false, message: 'No se pudieron completar las publicaciones de organizaciones.' });
  }
}
