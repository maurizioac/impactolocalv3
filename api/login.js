import { sql, hashPassword, verifyPassword, soloMetodos } from './_db.js';

export default async function handler(req, res) {
  if (!soloMetodos(req, res, ['POST'])) return;

  const rol = String(req.body?.rol || 'usuario');
  const username = String(req.body?.username || req.body?.usuario || '').trim();
  const password = String(req.body?.password || '');
  const generico = { ok: false, message: 'Credenciales incorrectas.' };
  if (username.length < 2 || username.length > 120 || !password)
    return res.status(401).json(generico);

  try {
    const candidates = [];
    if (rol === 'organizacion') {
      const rows = await sql`
        SELECT "NOMBRE DE USUARIO" AS nombre, "CORREO ELECTRÓNICO" AS email,
               "CONTRASEÑA" AS password_hash, NULL::text AS ocupacion
        FROM "ORGANIZACIONES" WHERE lower("NOMBRE DE USUARIO") = lower(${username})`;
      rows.forEach(function (row) { candidates.push({ row, table: 'ORGANIZACIONES' }); });
    } else {
      const clientRows = await sql`
        SELECT "NOMBRE DE USUARIO" AS nombre, "CORREO ELECTRÓNICO" AS email,
               "CONTRASEÑA" AS password_hash, "OCUPACIÓN" AS ocupacion
        FROM "CLIENTES" WHERE lower("NOMBRE DE USUARIO") = lower(${username})`;
      clientRows.forEach(function (row) { candidates.push({ row, table: 'CLIENTES' }); });
      if (!clientRows.length) {
        const personRows = await sql`
          SELECT "NOMBRE DE USUARIO" AS nombre, "CORREO ELECTRÓNICO" AS email,
                 "CONTRASEÑA" AS password_hash, NULL::text AS ocupacion
          FROM "PERSONAS" WHERE lower("NOMBRE DE USUARIO") = lower(${username})`;
        personRows.forEach(function (row) { candidates.push({ row, table: 'PERSONAS' }); });
      }
    }
    const matched = candidates.map(function (candidate) {
      const stored = String(candidate.row.password_hash || '');
      return { row: candidate.row, table: candidate.table, stored, valid: verifyPassword(password, stored) || stored === password };
    }).find(function (candidate) { return candidate.valid; });
    if (!matched) return res.status(401).json(generico);
    const fila = matched.row;
    const table = matched.table;
    const stored = matched.stored;
    const email = String(fila.email || '').trim().toLowerCase();

    // Upgrade existing plain-text credentials after a successful login.
    if (!stored.includes(':')) {
      const hashed = hashPassword(password);
      if (table === 'PERSONAS') {
        await sql`UPDATE "PERSONAS" SET "CONTRASEÑA" = ${hashed} WHERE lower("NOMBRE DE USUARIO") = lower(${username}) AND "CONTRASEÑA" = ${stored}`;
      } else if (table === 'ORGANIZACIONES') {
        await sql`UPDATE "ORGANIZACIONES" SET "CONTRASEÑA" = ${hashed} WHERE lower("NOMBRE DE USUARIO") = lower(${username}) AND "CONTRASEÑA" = ${stored}`;
      } else {
        await sql`UPDATE "CLIENTES" SET "CONTRASEÑA" = ${hashed} WHERE lower("NOMBRE DE USUARIO") = lower(${username}) AND "CONTRASEÑA" = ${stored}`;
      }
    }

    const perfil = table === 'CLIENTES' ? {
      nombre: fila.nombre,
      email: fila.email || email,
      ocupacion: fila.ocupacion
    } : null;
    const rolAutenticado = table === 'ORGANIZACIONES' ? 'organizacion' : 'usuario';
    return res.status(200).json({ ok: true, nombre: fila.nombre, email, rol: rolAutenticado, perfil });
  } catch (err) {
    console.error('ERROR /api/login:', err);
    return res.status(500).json({ ok: false, message: 'Error del servidor. Intenta de nuevo.' });
  }
}
