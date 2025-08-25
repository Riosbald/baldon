
import type { Settings } from '#/lib/store.types'
let _pool: any
let _ready = false

async function pool() {
  if (_pool) return _pool
  const mod = await import('pg')
  const { Pool } = mod as any
  _pool = new Pool({ connectionString: process.env.DATABASE_URL })
  return _pool
}

async function ensure() {
  if (_ready) return
  const p = await pool()
  await p.query(`CREATE TABLE IF NOT EXISTS settings (
    session_id TEXT PRIMARY KEY,
    data JSONB NOT NULL
  )`)
  _ready = true
}

export async function getSettings(sessionId: string): Promise<Settings> {
  await ensure()
  const p = await pool()
  const r = await p.query('SELECT data FROM settings WHERE session_id=$1', [sessionId])
  return r.rows?.[0]?.data || {}
}

export async function setSettings(sessionId: string, partial: Settings): Promise<Settings> {
  await ensure()
  const p = await pool()
  const existing = await getSettings(sessionId)
  const next = { ...existing, ...partial }
  await p.query('INSERT INTO settings (session_id, data) VALUES ($1,$2) ON CONFLICT (session_id) DO UPDATE SET data=EXCLUDED.data', [sessionId, next])
  return next
}
