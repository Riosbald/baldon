
import { getOrCreateSessionId } from '#/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const sid = getOrCreateSessionId();
  return Response.json({ sessionId: sid });
}
