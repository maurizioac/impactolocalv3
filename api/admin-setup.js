import { sql, hashPassword, EMAIL_RE, soloMetodos } from './_db.js';
import { adminEmails, secretsEqual } from './_admin-auth.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['POST'])) return;
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const setupKey = String(req.body?.setupKey || '');
  const configuredKey = process.env.ADMIN_SETUP_KEY;

  if (!configuredKey || configuredKey.length < 32)
    return res.status(503).json({ ok: false, message: 'La configuración inicial no está habilitada.' });
  if (!secretsEqual(setupKey, configuredKey))
    return res.status(403).json({ ok: false, message: 'Clave de configuración incorrecta.' });
  if (!EMAIL_RE.test(email) || !adminEmails().includes(email))
    return res.status(403).json({ ok: false, message: 'Ese correo no está autorizado como administrador.' });
  if (password.length < 12)
    return res.status(400).json({ ok: false, message: 'Usa una contraseña de al menos 12 caracteres.' });

  try {
    const [existing] = await sql`SELECT id FROM "ADMINS" WHERE lower("CORREO ELECTRÓNICO") = ${email} LIMIT 1`;
    if (existing) return res.status(409).json({ ok: false, message: 'La cuenta de ese correo ya está configurada.' });
    const username = email.split('@')[0].slice(0, 120);
    await sql`
      INSERT INTO "ADMINS" ("NOMBRE DE USUARIO", "CORREO ELECTRÓNICO", "CONTRASEÑA")
      VALUES (${username}, ${email}, ${hashPassword(password)})`;
    return res.status(201).json({ ok: true, message: 'Cuenta administradora creada. Ya puedes iniciar sesión.' });
  } catch (err) {
    console.error('ERROR /api/admin/setup:', err);
    return res.status(500).json({ ok: false, message: 'No se pudo crear la cuenta administradora.' });
  }
}
