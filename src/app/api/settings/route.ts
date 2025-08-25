
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

let settings: any = {};

export async function GET() { return Response.json(settings); }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  settings = { ...settings, ...body };
  return Response.json({ ok: true });
}
