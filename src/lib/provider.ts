
import { z } from 'zod';

export const ChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({ role: z.enum(['system','user','assistant']), content: z.string() })),
  temperature: z.number().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export async function streamFromOpenAICompat(req: ChatRequest) {
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(baseURL + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: mapModel(req.model),
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      stream: true,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res;
}

function mapModel(model: string) {
  switch (model) {
    case 'gpt-4-turbo': return 'gpt-4o-mini';
    default: return model;
  }
}
