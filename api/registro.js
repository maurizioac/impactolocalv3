import { sql, hashPassword, EMAIL_RE, soloMetodos } from './_db.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['POST'])) return;

  const nombre = String(req.body?.nombre || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const telefono = String(req.body?.telefono || '').trim();
  const dni = String(req.body?.dni || '').trim();
  const ocupacion = String(req.body?.ocupacion || '').trim();

  if (nombre.length < 2 || nombre.length > 120)
    return res.status(400).json({ ok: false, message: 'Ingresa tu nombre completo.' });
  if (!EMAIL_RE.test(email) || email.length > 120)
    return res.status(400).json({ ok: false, message: 'Correo electrónico no válido.' });
  if (password.length < 8)
    return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 8 caracteres.' });
  if (!/^\d{9}$/.test(telefono))
    return res.status(400).json({ ok: false, message: 'El número telefónico debe tener 9 dígitos.' });
  if (!/^\d{8}$/.test(dni))
    return res.status(400).json({ ok: false, message: 'El DNI debe tener 8 dígitos.' });
  if (ocupacion.length < 2 || ocupacion.length > 120)
    return res.status(400).json({ ok: false, message: 'Ingresa tu ocupación.' });

  try {
    const [existing] = await sql`
      SELECT "ID" FROM "CLIENTES" WHERE lower("CORREO ELECTRÓNICO") = ${email} LIMIT 1`;
    if (existing) return res.status(409).json({ ok: false, message: 'Ese correo ya está registrado.' });
    await sql`
      INSERT INTO "CLIENTES" ("NOMBRE DE USUARIO", "CORREO ELECTRÓNICO", "CONTRASEÑA", "NÚMERO TELEFÓNICO", "DNI", "OCUPACIÓN")
      VALUES (${nombre}, ${email}, ${hashPassword(password)}, ${telefono}, ${dni}, ${ocupacion})`;
    return res.status(201).json({
      ok: true,
      nombre,
      email,
      perfil: { nombre, email, ocupacion }
    });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ ok: false, message: 'Ese correo ya está registrado.' });
    console.error('ERROR /api/registro:', err);
    return res.status(500).json({ ok: false, message: 'No pudimos crear tu cuenta. Intenta de nuevo.' });
  }
}
