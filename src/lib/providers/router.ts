
import { ChatRequest } from '#/lib/provider'

export async function routeChat(req: ChatRequest) {
  const model = req.model
  if (model.startsWith('claude')) return streamAnthropic(req)
  if (model.startsWith('gemini')) return streamGemini(req)
  if (model.startsWith('mistral')) return streamMistral(req)
  if (model.startsWith('llama') || model.includes('together')) return streamTogether(req)
  return streamOpenAICompat(req)
}

// Default OpenAI-compatible endpoint
async function streamOpenAICompat(req: ChatRequest) {
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  const res = await fetch(baseURL + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ ...req, stream: true })
  })
  if (!res.ok) throw new Error(await res.text())
  return res
}

// Anthropic (Claude) SSE
async function streamAnthropic(req: ChatRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  const sys = req.messages.find(m => m.role === 'system')?.content || ''
  const msgs = req.messages.filter(m => m.role !== 'system').map(m => (
    m.role === 'assistant' ? { role: 'assistant', content: m.content } : { role: 'user', content: m.content }
  ))
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({ model: req.model, max_tokens: 1024, system: sys, messages: msgs, stream: true })
  })
  if (!res.ok) throw new Error(await res.text())
  return new Response(res.body, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } })
}

// Google Gemini streaming via streamGenerateContent
async function streamGemini(req: ChatRequest) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const sys = req.messages.find(m => m.role === 'system')?.content || ''
  const conv = req.messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))
  if (sys) conv.unshift({ role: 'user', parts: [{ text: '(System instruction) ' + sys }] })
  const model = req.model || 'gemini-1.5-pro-latest'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?key=${key}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: conv, generationConfig: { temperature: req.temperature ?? 0.7 } })
  })
  if (!res.ok) throw new Error(await res.text())
  // Response is a newline-delimited JSON stream
  return new Response(res.body, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}

// Mistral streaming (OpenAI-compatible chat API)
async function streamMistral(req: ChatRequest) {
  const key = process.env.MISTRAL_API_KEY
  if (!key) return null
  const url = 'https://api.mistral.ai/v1/chat/completions'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ ...req, stream: true })
  })
  if (!res.ok) throw new Error(await res.text())
  return new Response(res.body, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } })
}

// Together AI (OpenAI-compatible)
async function streamTogether(req: ChatRequest) {
  const key = process.env.TOGETHER_API_KEY
  if (!key) return null
  const url = 'https://api.together.xyz/v1/chat/completions'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ ...req, stream: true })
  })
  if (!res.ok) throw new Error(await res.text())
  return new Response(res.body, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } })
}
