import { sql, hashPassword, EMAIL_RE, soloMetodos } from './_db.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['GET', 'POST'])) return;

  try {
    if (req.method === 'GET') {
      const [{ total }] = await sql`SELECT count(*)::int AS total FROM solicitudes_org`;
      return res.status(200).json({ ok: true, total });
    }

    const tipo = req.body?.tipo === 'benefica' ? 'benefica' : 'ong';
    const usuario = String(req.body?.username || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (usuario.length < 3 || usuario.length > 60)
      return res.status(400).json({ ok: false, message: 'El usuario debe tener entre 3 y 60 caracteres.' });
    if (!EMAIL_RE.test(email) || email.length > 120)
      return res.status(400).json({ ok: false, message: 'Correo electrónico no válido.' });
    if (password.length < 8)
      return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 8 caracteres.' });

    await sql`
      INSERT INTO solicitudes_org (tipo, usuario, email, password_hash)
      VALUES (${tipo}, ${usuario}, ${email}, ${hashPassword(password)})`;
    return res.status(201).json({ ok: true, message: 'Tu solicitud fue enviada y está en revisión.' });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ ok: false, message: 'Ese usuario ya envió una solicitud.' });
    console.error('ERROR /api/solicitudes:', err);
    return res.status(500).json({ ok: false, message: 'No pudimos guardar tu solicitud. Intenta de nuevo.' });
  }
}
