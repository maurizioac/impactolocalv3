import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'il_admin_session';
const SESSION_SECONDS = 8 * 60 * 60;
const APPROVED_ADMIN_EMAILS = [
  'vdtq2020@gmail.com',
  'yamiledvilca@gmail.com',
  'alejandritodlcruz@gmail.com',
];

export function adminEmails() {
  const configuredEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...APPROVED_ADMIN_EMAILS, ...configuredEmails])];
}

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('ADMIN_SESSION_SECRET debe tener al menos 32 caracteres.');
  return secret;
}

function signature(payload) {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function cookieOptions(maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function setAdminSession(res, email) {
  const payload = Buffer.from(JSON.stringify({
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  })).toString('base64url');
  const token = `${payload}.${signature(payload)}`;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`);
}

export function clearAdminSession(res) {
  res.setHeader('Set-Cookie', cookieOptions(0));
}

export function getAdminSession(req) {
  const cookies = String(req.headers.cookie || '').split(';');
  const entry = cookies.map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!entry) return null;
  const token = entry.slice(COOKIE_NAME.length + 1);
  const [payload, supplied] = token.split('.');
  if (!payload || !supplied) return null;
  try {
    const expected = Buffer.from(signature(payload), 'base64url');
    const actual = Buffer.from(supplied, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.email || data.exp < Math.floor(Date.now() / 1000)) return null;
    return { email: String(data.email).toLowerCase() };
  } catch {
    return null;
  }
}

export function requireAdmin(req, res) {
  const admin = getAdminSession(req);
  if (admin) return admin;
  res.status(401).json({ ok: false, message: 'Inicia sesión como Super Admin.' });
  return null;
}

export function secretsEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
}
