
import { z } from 'zod'
import { routeChat, RoutedResponse } from '#/lib/providers/router'

export const ChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({ role: z.enum(['system','user','assistant']), content: z.string() })),
  temperature: z.number().optional(),
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>

export async function streamUnified(req: ChatRequest): Promise<Response | null> {
  const routed = await routeChat(req)
  if (!routed) return null
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const upstream = routed.res
  const reader = upstream.body?.getReader()
  if (!reader) return null

  let buffer = ''

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await reader.read()
      if (done) { controller.close(); return }
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      // Split into lines for SSE/NDJSON
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ''

      for (const line of lines) {
        const txt = parseLine(routed, line)
        if (txt) controller.enqueue(encoder.encode(txt))
      }
    }
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' } })
}

function parseLine(routed: RoutedResponse, line: string): string | null {
  try {
    // OpenAI/Mistral/Together SSE: lines may be like "data: {json}" or other control lines
    if (routed.provider === 'openai' || routed.provider === 'mistral' || routed.provider === 'together') {
      if (!line.startsWith('data:')) return null
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') return ''
      const obj = JSON.parse(payload)
      const delta = obj?.choices?.[0]?.delta?.content || obj?.choices?.[0]?.delta?.text || ''
      return delta || null
    }
    // Anthropic SSE: lines alternate between event: and data:
    if (routed.provider === 'anthropic') {
      if (!line.startsWith('data:')) return null
      const payload = line.slice(5).trim()
      const obj = JSON.parse(payload)
      const txt = obj?.delta?.text || obj?.content_block?.text || obj?.message?.content?.[0]?.text || ''
      return txt || null
    }
    // Gemini NDJSON: each line is JSON object; extract text from candidates parts
    if (routed.provider === 'gemini') {
      if (!line.trim()) return null
      const obj = JSON.parse(line)
      const cand = obj?.candidates?.[0]
      const parts = cand?.content?.parts || []
      let acc = ''
      for (const p of parts) if (typeof p?.text === 'string') acc += p.text
      return acc || null
    }
  } catch { /* ignore parse errors */ }
  return null
}
