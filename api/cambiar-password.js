import { sql, hashPassword, verifyPassword, EMAIL_RE, soloMetodos } from './_db.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['POST'])) return;

  const email = String(req.body?.email || '').trim().toLowerCase();
  const actual = String(req.body?.actual || '');
  const nueva = String(req.body?.nueva || '');

  if (!EMAIL_RE.test(email))
    return res.status(400).json({ ok: false, message: 'Inicia sesión de nuevo para verificar tu cuenta.' });
  if (actual.length < 1)
    return res.status(400).json({ ok: false, message: 'Ingresa tu contraseña actual.' });
  if (nueva.length < 8)
    return res.status(400).json({ ok: false, message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
  if (actual === nueva)
    return res.status(400).json({ ok: false, message: 'La nueva contraseña debe ser distinta a la actual.' });

  try {
    const [cliente] = await sql`
      SELECT "CONTRASEÑA" AS password_hash
      FROM "CLIENTES"
      WHERE lower("CORREO ELECTRÓNICO") = ${email}
      LIMIT 1`;

    const guardada = String(cliente?.password_hash || '');
    const coincide = verifyPassword(actual, guardada) || guardada === actual;
    if (!cliente || !coincide)
      return res.status(401).json({ ok: false, message: 'La contraseña actual no es correcta.' });

    await sql`
      UPDATE "CLIENTES"
      SET "CONTRASEÑA" = ${hashPassword(nueva)}
      WHERE lower("CORREO ELECTRÓNICO") = ${email}`;

    return res.status(200).json({ ok: true, message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error('ERROR /api/cambiar-password:', err);
    return res.status(500).json({ ok: false, message: 'No se pudo actualizar la contraseña. Intenta de nuevo.' });
  }
}
