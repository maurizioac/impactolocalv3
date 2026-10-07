import { sql, hashPassword, verifyPassword, EMAIL_RE, soloMetodos } from './_db.js';
import { setAdminSession } from './_admin-auth.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['POST'])) return;
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!EMAIL_RE.test(email)) return res.status(401).json({ ok: false, message: 'Correo o contraseña incorrectos.' });

  try {
    const [admin] = await sql`
      SELECT "NOMBRE DE USUARIO" AS nombre, "CONTRASEÑA" AS password_hash
      FROM "ADMINS" WHERE lower("CORREO ELECTRÓNICO") = ${email} LIMIT 1`;
    const stored = String(admin?.password_hash || '');
    if (!admin || !(verifyPassword(password, stored) || stored === password))
      return res.status(401).json({ ok: false, message: 'Correo o contraseña incorrectos.' });
    if (!stored.includes(':')) {
      await sql`UPDATE "ADMINS" SET "CONTRASEÑA" = ${hashPassword(password)} WHERE lower("CORREO ELECTRÓNICO") = ${email} AND "CONTRASEÑA" = ${stored}`;
    }
    setAdminSession(res, email);
    return res.status(200).json({ ok: true, nombre: admin.nombre || email, rol: 'superadmin' });
  } catch (err) {
    console.error('ERROR /api/admin/login:', err);
    return res.status(500).json({ ok: false, message: 'No se pudo iniciar sesión.' });
  }
}
