import { neon } from '@neondatabase/serverless';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

let neonSql;

// Deja que la página se pueda abrir en localhost aunque todavía no se haya
// configurado la base de datos. Las rutas API mostrarán un error claro al usarse.
export function sql(strings, ...values) {
  if (!process.env.DATABASE_URL) {
    const error = new Error('Falta DATABASE_URL. Configura la conexión PostgreSQL en el archivo .env.');
    error.code = 'DATABASE_URL_MISSING';
    throw error;
  }
  neonSql ||= neon(process.env.DATABASE_URL);
  return neonSql(strings, ...values);
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const a = Buffer.from(hash, 'hex');
  const b = scryptSync(password, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function soloMetodos(req, res, metodos) {
  if (metodos.includes(req.method)) return true;
  res.setHeader('Allow', metodos.join(', '));
  res.status(405).json({ ok: false, message: 'Método no permitido' });
  return false;
}
