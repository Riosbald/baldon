
import { NextRequest } from 'next/server'
import { ChatRequestSchema } from '#/lib/provider'
import { streamUnified } from '#/lib/provider'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 })
  try {
    const body = await req.json()
    const parsed = ChatRequestSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const unified = await streamUnified(parsed.data)
    if (unified) return unified

    // Fallback mock stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const answer = 'This is a mock streamed response (configure API keys to enable live models).'
        for (const ch of answer) {
          controller.enqueue(encoder.encode(ch))
          await new Promise((r) => setTimeout(r, 10))
        }
        controller.close()
      }
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (e: any) {
    return Response.json({ error: e.message || 'Unknown error' }, { status: 500 })
  }
}
