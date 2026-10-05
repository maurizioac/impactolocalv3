import { sql, verifyPassword, EMAIL_RE, soloMetodos, ensureSuperAdminTable } from './_db.js';
import { adminEmails, setAdminSession } from './_admin-auth.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['POST'])) return;
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!EMAIL_RE.test(email) || !adminEmails().includes(email))
    return res.status(401).json({ ok: false, message: 'Correo o contraseña incorrectos.' });

  try {
    await ensureSuperAdminTable();
    const [admin] = await sql`SELECT email, password_hash FROM super_admins WHERE lower(email) = ${email} LIMIT 1`;
    if (!admin || !verifyPassword(password, admin.password_hash))
      return res.status(401).json({ ok: false, message: 'Correo o contraseña incorrectos.' });
    setAdminSession(res, email);
    return res.status(200).json({ ok: true, nombre: email, rol: 'superadmin' });
  } catch (err) {
    console.error('ERROR /api/admin/login:', err);
    return res.status(500).json({ ok: false, message: 'No se pudo iniciar sesión.' });
  }
}
