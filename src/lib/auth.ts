
import { cookies } from 'next/headers';
import crypto from 'crypto';

const COOKIE_NAME = 'sess';
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';

function sign(value: string) {
  const sig = crypto.createHmac('sha256', SECRET).update(value).digest('hex');
  return `${value}.${sig}`;
}

function verify(signed: string) {
  const [val, sig] = signed.split('.');
  if (!val || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(val).digest('hex');
  if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return val;
  return null;
}

export function getOrCreateSessionId() {
  const store = cookies();
  const c = store.get(COOKIE_NAME)?.value;
  if (c) {
    const v = verify(c);
    if (v) return v;
  }
  const sid = crypto.randomUUID();
  const signed = sign(sid);
  store.set(COOKIE_NAME, signed, { httpOnly: true, sameSite: 'lax', secure: false, path: '/' });
  return sid;
}

export function requireAuth() {
  if (process.env.AUTH_REQUIRED === 'true') {
    const store = cookies();
    const authed = store.get('authed')?.value === '1';
    if (!authed) throw new Error('Unauthorized');
  }
}

export function setAuthed() {
  const store = cookies();
  store.set('authed', '1', { httpOnly: true, sameSite: 'lax', secure: false, path: '/' });
}
