import { neon } from '@neondatabase/serverless';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

export const sql = neon(process.env.DATABASE_URL);

export async function ensureSuperAdminTable() {
  await sql`CREATE TABLE IF NOT EXISTS super_admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) NOT NULL,
    password_hash TEXT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS super_admins_email_uq
    ON super_admins (lower(email))`;
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
