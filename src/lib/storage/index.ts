
import type { Settings } from '#/lib/store.types'

export async function getSettings(sessionId: string): Promise<Settings> {
  const impl = await select()
  return impl.getSettings(sessionId)
}

export async function setSettings(sessionId: string, partial: Settings): Promise<Settings> {
  const impl = await select()
  return impl.setSettings(sessionId, partial)
}

async function select() {
  if (process.env.REDIS_URL || (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)) {
    const mod = await import('./redis')
    return mod
  }
  if (process.env.DATABASE_URL) {
    const mod = await import('./postgres')
    return mod
  }
  const mod = await import('./file')
  return mod
}
