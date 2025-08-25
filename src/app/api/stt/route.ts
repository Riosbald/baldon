
export const runtime = 'nodejs';

// Accepts multipart form-data with `file`, and optional provider query: openai|google|aws
export async function POST(req: Request) {
  const url = new URL(req.url)
  const provider = (url.searchParams.get('provider') || 'openai').toLowerCase()
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return Response.json({ error: 'file required' }, { status: 400 });

  if (provider === 'google') {
    const keyJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    if (!keyJson) return Response.json({ error: 'GCP creds not configured' }, { status: 501 })
    const { SpeechClient } = await import('@google-cloud/speech')
    const creds = JSON.parse(keyJson)
    const client: any = new (SpeechClient as any)({ credentials: creds })
    const buf = Buffer.from(await file.arrayBuffer())
    let encoding: any = 'ENCODING_UNSPECIFIED'
    const type = file.type || ''
    if (type.includes('webm')) encoding = 'WEBM_OPUS'
    else if (type.includes('ogg')) encoding = 'OGG_OPUS'
    else if (type.includes('wav') || type.includes('x-wav')) encoding = 'LINEAR16'
    const [resp] = await client.recognize({
      config: { languageCode: 'en-US', encoding },
      audio: { content: buf.toString('base64') },
    })
    const text = (resp.results || []).map((r: any) => r.alternatives?.[0]?.transcript || '').join(' ').trim()
    return Response.json({ text })
  }

  if (provider === 'aws') {
    return Response.json({ error: 'AWS STT streaming requires WebSocket and S3 or media URI; not configured' }, { status: 501 })
  }

  // default: OpenAI Whisper
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: 'No STT provider configured' }, { status: 501 });
  const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: (() => { const fd = new FormData(); fd.append('model','whisper-1'); fd.append('file', file); return fd; })(),
  });
  if (!upstream.ok) return new Response(await upstream.text(), { status: upstream.status });
  return upstream;
}
