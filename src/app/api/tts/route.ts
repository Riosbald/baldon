
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { text, voice } = await req.json().catch(() => ({ text: '', voice: 'Rachel' }));
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return Response.json({ error: 'No TTS provider configured' }, { status: 501 });
  const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(voice || 'Rachel'), {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ text, voice_settings: { stability: 0.5, similarity_boost: 0.8 } })
  });
  if (!res.ok) return new Response(await res.text(), { status: res.status });
  const buf = await res.arrayBuffer();
  return new Response(buf, { headers: { 'content-type': 'audio/mpeg' } });
}
