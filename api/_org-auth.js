import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'il_org_session';
const SESSION_SECONDS = 12 * 60 * 60;

function sessionSecret() {
  const secret = process.env.ORG_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.DATABASE_URL;
  if (!secret || secret.length < 32) throw new Error('Configura un secreto de sesión de al menos 32 caracteres.');
  return secret;
}

function signature(payload) {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function secureSuffix() {
  return process.env.NODE_ENV === 'production' ? '; Secure' : '';
}

export function setOrganizationSession(res, organization) {
  const payload = Buffer.from(JSON.stringify({
    email: organization.email,
    username: organization.username,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  })).toString('base64url');
  const token = `${payload}.${signature(payload)}`;
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secureSuffix()}`);
}

export function clearOrganizationSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secureSuffix()}`);
}

export function getOrganizationSession(req) {
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
    if (!data.email || !data.username || data.exp < Math.floor(Date.now() / 1000)) return null;
    return { email: String(data.email).toLowerCase(), username: String(data.username) };
  } catch {
    return null;
  }
}

export function requireOrganization(req, res) {
  const organization = getOrganizationSession(req);
  if (organization) return organization;
  res.status(401).json({ ok: false, message: 'Inicia sesión con una cuenta de organización para publicar.' });
  return null;
}
