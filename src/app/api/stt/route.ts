
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: 'No STT provider configured' }, { status: 501 });
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return Response.json({ error: 'file required' }, { status: 400 });
  const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: (() => { const fd = new FormData(); fd.append('model','whisper-1'); fd.append('file', file); return fd; })(),
  });
  if (!upstream.ok) return new Response(await upstream.text(), { status: upstream.status });
  return upstream;
}
