import { sql, verifyPassword, soloMetodos } from './_db.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['POST'])) return;

  const { rol } = req.body || {};
  const password = String(req.body?.password || '');
  const generico = { ok: false, message: 'Credenciales incorrectas.' };

  try {
    let fila;
    if (rol === 'admin') {
      const usuario = String(req.body?.usuario || '').trim().toLowerCase();
      [fila] = await sql`
        SELECT usuario AS nombre, password_hash FROM solicitudes_org
        WHERE lower(usuario) = ${usuario} AND estado = 'aprobada' LIMIT 1`;
    } else {
      const email = String(req.body?.email || '').trim().toLowerCase();
      [fila] = await sql`
        SELECT nombre, password_hash FROM usuarios WHERE lower(email) = ${email} LIMIT 1`;
    }

    if (!fila || !verifyPassword(password, fila.password_hash))
      return res.status(401).json(generico);

    return res.status(200).json({ ok: true, nombre: fila.nombre, rol: rol === 'admin' ? 'admin' : 'usuario' });
  } catch (err) {
    console.error('ERROR /api/login:', err);
    return res.status(500).json({ ok: false, message: 'Error del servidor. Intenta de nuevo.' });
  }
}
