import { sql, hashPassword, EMAIL_RE, soloMetodos } from './_db.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['POST'])) return;

  const nombre = String(req.body?.nombre || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (nombre.length < 2 || nombre.length > 120)
    return res.status(400).json({ ok: false, message: 'Ingresa tu nombre completo.' });
  if (!EMAIL_RE.test(email) || email.length > 120)
    return res.status(400).json({ ok: false, message: 'Correo electrónico no válido.' });
  if (password.length < 8)
    return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 8 caracteres.' });

  try {
    await sql`
      INSERT INTO usuarios (nombre, email, password_hash)
      VALUES (${nombre}, ${email}, ${hashPassword(password)})`;
    return res.status(201).json({ ok: true, nombre });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ ok: false, message: 'Ese correo ya está registrado.' });
    console.error('ERROR /api/registro:', err);
    return res.status(500).json({ ok: false, message: 'No pudimos crear tu cuenta. Intenta de nuevo.' });
  }
}
