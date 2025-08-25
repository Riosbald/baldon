
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

function parseDataUrl(dataUrl: string) {
  const m = /^data:(.*?);base64,(.*)$/.exec(dataUrl || '')
  if (!m) return null
  return { mime: m[1], base64: m[2] }
}

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY
  const body = await req.json().catch(() => ({})) as any
  const image = body.image as string | undefined
  const prompt = body.prompt as string | undefined
  if (!image) return Response.json({ error: 'image (dataURL) required' }, { status: 400 })
  const parsed = parseDataUrl(image)
  if (!parsed) return Response.json({ error: 'invalid dataURL' }, { status: 400 })

  if (!key) return Response.json({ error: 'GEMINI_API_KEY not set' }, { status: 501 })

  const model = 'gemini-1.5-pro-latest'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt || 'Analyze and summarize the key information on this screen.' },
          { inline_data: { mime_type: parsed.mime, data: parsed.base64 } }
        ]
      }
    ]
  }

  const upstream = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!upstream.ok) return new Response(await upstream.text(), { status: upstream.status })
  const j = await upstream.json()
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return Response.json({ analysis: text || 'No text returned' })
}
