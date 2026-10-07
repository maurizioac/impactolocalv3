import { sql, hashPassword, verifyPassword, soloMetodos } from './_db.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['POST'])) return;

  const rol = String(req.body?.rol || 'usuario');
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const generico = { ok: false, message: 'Credenciales incorrectas.' };

  try {
    let fila;
    let table = 'CLIENTES';
    if (rol === 'admin') {
      [fila] = await sql`
        SELECT "NOMBRE DE USUARIO" AS nombre, "CONTRASEÑA" AS password_hash
        FROM "ADMINS" WHERE lower("CORREO ELECTRÓNICO") = ${email} LIMIT 1`;
      table = 'ADMINS';
    } else {
      [fila] = await sql`
        SELECT "NOMBRE DE USUARIO" AS nombre, "CONTRASEÑA" AS password_hash
        FROM "CLIENTES" WHERE lower("CORREO ELECTRÓNICO") = ${email} LIMIT 1`;
      if (!fila) {
        [fila] = await sql`
          SELECT "NOMBRE DE USUARIO" AS nombre, "CONTRASEÑA" AS password_hash
          FROM "PERSONAS" WHERE lower("CORREO ELECTRÓNICO") = ${email} LIMIT 1`;
        table = 'PERSONAS';
      }
      if (!fila) {
        [fila] = await sql`
          SELECT "NOMBRE DE USUARIO" AS nombre, "CONTRASEÑA" AS password_hash
          FROM "ORGANIZACIONES" WHERE lower("CORREO ELECTRÓNICO") = ${email} LIMIT 1`;
        table = 'ORGANIZACIONES';
      }
    }

    const stored = String(fila?.password_hash || '');
    const valid = verifyPassword(password, stored) || stored === password;
    if (!fila || !valid) return res.status(401).json(generico);

    // Upgrade existing plain-text credentials after a successful login.
    if (!stored.includes(':')) {
      const hashed = hashPassword(password);
      if (table === 'ADMINS') {
        await sql`UPDATE "ADMINS" SET "CONTRASEÑA" = ${hashed} WHERE lower("CORREO ELECTRÓNICO") = ${email} AND "CONTRASEÑA" = ${stored}`;
      } else if (table === 'PERSONAS') {
        await sql`UPDATE "PERSONAS" SET "CONTRASEÑA" = ${hashed} WHERE lower("CORREO ELECTRÓNICO") = ${email} AND "CONTRASEÑA" = ${stored}`;
      } else if (table === 'ORGANIZACIONES') {
        await sql`UPDATE "ORGANIZACIONES" SET "CONTRASEÑA" = ${hashed} WHERE lower("CORREO ELECTRÓNICO") = ${email} AND "CONTRASEÑA" = ${stored}`;
      } else {
        await sql`UPDATE "CLIENTES" SET "CONTRASEÑA" = ${hashed} WHERE lower("CORREO ELECTRÓNICO") = ${email} AND "CONTRASEÑA" = ${stored}`;
      }
    }

    return res.status(200).json({ ok: true, nombre: fila.nombre, rol: rol === 'admin' ? 'admin' : 'usuario' });
  } catch (err) {
    console.error('ERROR /api/login:', err);
    return res.status(500).json({ ok: false, message: 'Error del servidor. Intenta de nuevo.' });
  }
}
