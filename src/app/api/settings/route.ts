
import { NextRequest } from 'next/server';
import { getOrCreateSessionId, requireAuth } from '#/lib/auth';
import { getSettings, setSettings } from '#/lib/store';

export const runtime = 'nodejs';

export async function GET() {
  requireAuth();
  const sid = getOrCreateSessionId();
  const s = await getSettings(sid);
  return Response.json(s);
}

export async function POST(req: NextRequest) {
  requireAuth();
  const sid = getOrCreateSessionId();
  const body = await req.json().catch(() => ({}));
  const s = await setSettings(sid, body);
  return Response.json(s);
}
