import { sql, hashPassword, verifyPassword, soloMetodos } from './_db.js';
import { setAdminSession } from './_admin-auth.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['POST'])) return;
  const username = String(req.body?.username || req.body?.usuario || '').trim();
  const password = String(req.body?.password || '');
  if (username.length < 2 || username.length > 120 || !password)
    return res.status(401).json({ ok: false, message: 'Usuario o contraseña incorrectos.' });

  try {
    const [admin] = await sql`
      SELECT "NOMBRE DE USUARIO" AS nombre, "CORREO ELECTRÓNICO" AS email,
             "CONTRASEÑA" AS password_hash
      FROM "ADMINS" WHERE lower("NOMBRE DE USUARIO") = lower(${username}) LIMIT 1`;
    const stored = String(admin?.password_hash || '');
    if (!admin || !(verifyPassword(password, stored) || stored === password))
      return res.status(401).json({ ok: false, message: 'Usuario o contraseña incorrectos.' });
    if (!stored.includes(':')) {
      await sql`UPDATE "ADMINS" SET "CONTRASEÑA" = ${hashPassword(password)} WHERE lower("NOMBRE DE USUARIO") = lower(${username}) AND "CONTRASEÑA" = ${stored}`;
    }
    setAdminSession(res, String(admin.email || '').toLowerCase());
    return res.status(200).json({ ok: true, nombre: admin.nombre || username, email: admin.email, rol: 'superadmin' });
  } catch (err) {
    console.error('ERROR /api/admin/login:', err);
    return res.status(500).json({ ok: false, message: 'No se pudo iniciar sesión.' });
  }
}
