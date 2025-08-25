
import { z } from 'zod';
import { routeChat } from '#/lib/providers/router';

export const ChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({ role: z.enum(['system','user','assistant']), content: z.string() })),
  temperature: z.number().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export async function streamFromOpenAICompat(req: ChatRequest) {
  return routeChat(req);
}
