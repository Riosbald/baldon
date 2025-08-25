
import { NextRequest } from 'next/server'
export const runtime = 'nodejs'

// Supports providers: elevenlabs (default), gcp, aws
// GET allows low-latency playback via <audio src="/api/tts?..."> streaming

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const text = searchParams.get('text') || ''
  const voice = searchParams.get('voice') || 'Rachel'
  const provider = (searchParams.get('provider') || 'elevenlabs').toLowerCase()
  const stream = searchParams.get('stream') !== '0'
  return handleTTS({ text, voice, provider, stream })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as any
  const text = body.text || ''
  const voice = body.voice || 'Rachel'
  const provider = (body.provider || 'elevenlabs').toLowerCase()
  const stream = !!body.stream
  return handleTTS({ text, voice, provider, stream })
}

async function handleTTS({ text, voice, provider, stream }: { text: string; voice: string; provider: string; stream: boolean }) {
  if (!text) return Response.json({ error: 'text required' }, { status: 400 })

  if (provider === 'gcp' || provider === 'google') {
    const keyJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    if (!keyJson) return Response.json({ error: 'GCP creds not configured' }, { status: 501 })
    const { TextToSpeechClient } = await import('@google-cloud/text-to-speech')
    const creds = JSON.parse(keyJson)
    const client: any = new (TextToSpeechClient as any)({ credentials: creds })
    const [resp] = await client.synthesizeSpeech({
      input: { text },
      voice: { languageCode: 'en-US', name: 'en-US-Neural2-C' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0.0 },
    })
    const audioContent: Buffer = resp.audioContent
    // Stream it to client (chunked)
    const streamBody = new ReadableStream<Uint8Array>({
      start(controller) {
        const CH = 32 * 1024
        for (let i = 0; i < audioContent.length; i += CH) controller.enqueue(audioContent.subarray(i, i + CH))
        controller.close()
      }
    })
    return new Response(streamBody, { headers: { 'content-type': 'audio/mpeg', 'Transfer-Encoding': 'chunked' } })
  }

  if (provider === 'aws') {
    const { PollyClient, SynthesizeSpeechCommand } = await import('@aws-sdk/client-polly')
    const region = process.env.AWS_REGION || 'us-east-1'
    const client: any = new (PollyClient as any)({ region })
    const voiceId = voice?.includes('female') ? 'Joanna' : 'Matthew'
    const cmd = new (SynthesizeSpeechCommand as any)({ OutputFormat: 'mp3', Text: text, VoiceId: voiceId })
    const res: any = await client.send(cmd)
    const body = res.AudioStream as any
    // body is a Readable; stream to Response
    return new Response(body as ReadableStream, { headers: { 'content-type': 'audio/mpeg', 'Transfer-Encoding': 'chunked' } })
  }

  // default: elevenlabs
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) return Response.json({ error: 'No TTS provider configured' }, { status: 501 })
  const voiceId = encodeURIComponent(voice || 'Rachel')
  const endpoint = stream ? `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream` : `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ text, voice_settings: { stability: 0.5, similarity_boost: 0.8 } })
  })
  if (!upstream.ok) return new Response(await upstream.text(), { status: upstream.status })
  return new Response(upstream.body, { headers: { 'content-type': 'audio/mpeg', 'Transfer-Encoding': 'chunked' } })
}
