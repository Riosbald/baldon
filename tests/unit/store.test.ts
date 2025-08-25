
import { describe, it, expect } from 'vitest'
import { getSettings, setSettings } from '../../src/lib/store'

const sid = 'test-session'

describe('store', () => {
  it('persists settings', async () => {
    const s1 = await getSettings(sid)
    expect(s1).toEqual({})
    const s2 = await setSettings(sid, { agentName: 'Test' })
    expect(s2.agentName).toBe('Test')
    const s3 = await getSettings(sid)
    expect(s3.agentName).toBe('Test')
  })
})
