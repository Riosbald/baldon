
import { NextRequest } from 'next/server';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { context } = await req.json().catch(() => ({ context: '' }));
  return Response.json({ analysis: `Analyzed: ${context || 'frame'}` });
}
