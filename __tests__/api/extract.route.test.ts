import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/deepseek', () => ({
  extractResumeFromText: vi.fn(async () => ({ skills: [], experience: [], education: [] })),
}))

import { POST } from '@/app/api/extract/route'

describe('POST /api/extract', () => {
  it('400 on missing text', async () => {
    const req = new Request('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('200 on valid text', async () => {
    const req = new Request('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({ text: 'hi' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
  })
})


