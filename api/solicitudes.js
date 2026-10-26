import { sql, hashPassword, EMAIL_RE, soloMetodos } from './_db.js';

function optionalUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : false;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['GET', 'POST'])) return;

  try {
    if (req.method === 'GET') {
      const [{ total }] = await sql`SELECT count(*)::int AS total FROM solicitudes_registro_org`;
      return res.status(200).json({ ok: true, total });
    }

    const tipo = String(req.body?.tipo || '').trim().toUpperCase();
    const usuario = String(req.body?.username || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const ocupacion = String(req.body?.ocupacion || '').trim();
    const web = optionalUrl(req.body?.web);
    const instagram = optionalUrl(req.body?.instagram);
    const facebook = optionalUrl(req.body?.facebook);
    const tiktok = optionalUrl(req.body?.tiktok);

    if (!['ONG', 'VOLUNTARIADO'].includes(tipo))
      return res.status(400).json({ ok: false, message: 'Elige si representas a una ONG o a una organización de voluntariado.' });
    if (usuario.length < 3 || usuario.length > 120)
      return res.status(400).json({ ok: false, message: 'El usuario debe tener entre 3 y 120 caracteres.' });
    if (!EMAIL_RE.test(email) || email.length > 254)
      return res.status(400).json({ ok: false, message: 'Correo electrónico no válido.' });
    if (password.length < 8)
      return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 8 caracteres.' });
    if (ocupacion.length < 2 || ocupacion.length > 120)
      return res.status(400).json({ ok: false, message: 'Describe la ocupación de la organización (2 a 120 caracteres).' });
    if ([web, instagram, facebook, tiktok].includes(false))
      return res.status(400).json({ ok: false, message: 'Cada enlace debe ser una URL válida que empiece con http:// o https://.' });

    const [existing] = await sql`
      SELECT 1 FROM "ORGANIZACIONES"
      WHERE lower("NOMBRE DE USUARIO") = lower(${usuario})
         OR lower("CORREO ELECTRÓNICO") = ${email}
      LIMIT 1`;
    if (existing)
      return res.status(409).json({ ok: false, message: 'Ese nombre de usuario o correo ya está registrado.' });

    await sql`
      INSERT INTO solicitudes_registro_org (
        tipo, usuario, email, password_hash, ocupacion, web, instagram, facebook, tiktok
      ) VALUES (
        ${tipo}, ${usuario}, ${email}, ${hashPassword(password)}, ${ocupacion},
        ${web}, ${instagram}, ${facebook}, ${tiktok}
      )`;

    return res.status(201).json({ ok: true, message: 'La solicitud de tu organización se envió para revisión.' });
  } catch (err) {
    console.error('ERROR /api/solicitudes:', err);
    if (err.code === '23505')
      return res.status(409).json({ ok: false, message: 'Ese nombre de usuario o correo ya está registrado.' });
    if (err.code === '42P01')
      return res.status(500).json({ ok: false, message: 'Falta una tabla de la base de datos. Ejecuta db/schema.sql en PostgreSQL.' });
    if (err.code === '42703')
      return res.status(500).json({ ok: false, message: 'Falta una columna en la base de datos. Revisa db/schema.sql.' });
    return res.status(500).json({ ok: false, message: 'No pudimos crear la cuenta. Revisa la estructura de ORGANIZACIONES e intenta de nuevo.' });
  }
}
