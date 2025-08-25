
import { NextRequest } from 'next/server';
export const runtime = 'nodejs';

function parseDataUrl(dataUrl: string) {
  const m = /^data:(.*?);base64,(.*)$/.exec(dataUrl || '');
  if (!m) return null;
  return { mime: m[1], base64: m[2] };
}

export async function POST(req: NextRequest) {
  const { image } = await req.json().catch(() => ({ image: '' }));
  const parsed = parseDataUrl(image);
  if (!parsed) return Response.json({ error: 'image dataUrl required' }, { status: 400 });

  // TODO: Integrate a real vision provider. For now, simulate an interpretation.
  const analysis = `Frame received (${parsed.mime}), length=${parsed.base64.length}b`;
  return Response.json({ analysis });
}
