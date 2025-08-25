
import { ChatRequest } from '#/lib/provider';

export async function routeChat(req: ChatRequest) {
  const model = req.model;
  if (model.startsWith('claude')) return streamAnthropic(req);
  // Default to OpenAI-compatible
  return streamOpenAICompat(req);
}

async function streamOpenAICompat(req: ChatRequest) {
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const res = await fetch(baseURL + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ ...req, stream: true }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res;
}

async function streamAnthropic(req: ChatRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  // Convert OpenAI-like messages to Anthropic messages
  const sys = req.messages.find(m => m.role === 'system')?.content || '';
  const msgs = req.messages.filter(m => m.role !== 'system').map((m) => (m.role === 'assistant' ? { role: 'assistant', content: m.content } : { role: 'user', content: m.content }));

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: req.model.includes('opus') ? 'claude-3-opus-20240229' : req.model,
      max_tokens: 1024,
      system: sys,
      messages: msgs,
      stream: true,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return new Response(res.body, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } });
}
