
import type { Settings } from '#/lib/store.types'
let _client: any

async function client() {
  if (_client) return _client
  const mod = await import('ioredis')
  const Redis = (mod as any).default
  const url = process.env.REDIS_URL || ''
  _client = new Redis(url)
  return _client
}

export async function getSettings(sessionId: string): Promise<Settings> {
  const c = await client()
  const raw = await c.get(`settings:${sessionId}`)
  return raw ? JSON.parse(raw) as Settings : {}
}

export async function setSettings(sessionId: string, partial: Settings): Promise<Settings> {
  const c = await client()
  const prev = await getSettings(sessionId)
  const next = { ...prev, ...partial }
  await c.set(`settings:${sessionId}`, JSON.stringify(next))
  return next
}
