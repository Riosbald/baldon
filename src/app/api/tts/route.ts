
import { NextRequest } from 'next/server'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { text, voice, stream } = await req.json().catch(() => ({ text: '', voice: 'Rachel' })) as any
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) return Response.json({ error: 'No TTS provider configured' }, { status: 501 })
  const voiceId = encodeURIComponent(voice || 'Rachel')
  const endpoint = stream ? `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream` : `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ text, voice_settings: { stability: 0.5, similarity_boost: 0.8 } })
  })
  if (!res.ok) return new Response(await res.text(), { status: res.status })
  return new Response(res.body, { headers: { 'content-type': 'audio/mpeg', 'Transfer-Encoding': 'chunked' } })
}
