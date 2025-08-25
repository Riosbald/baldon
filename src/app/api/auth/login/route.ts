
import { NextRequest } from 'next/server';
import { setAuthed } from '#/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: '' }));
  const required = process.env.AUTH_REQUIRED === 'true';
  const admin = process.env.ADMIN_PASSWORD || '';
  if (required && (!password || password !== admin)) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  setAuthed();
  return Response.json({ ok: true });
}
