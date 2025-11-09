import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/upload/route'

describe('POST /api/upload', () => {
  it('400 when file missing', async () => {
    const form = new FormData()
    const req = new Request('http://localhost/api/upload', { method: 'POST', body: form as any })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('415 when unsupported type', async () => {
    const form = new FormData()
    const file = new File([new Blob(['hello'], { type: 'text/plain' })], 'note.txt', { type: 'text/plain' })
    form.set('file', file)
    const req = new Request('http://localhost/api/upload', { method: 'POST', body: form as any })
    const res = await POST(req as any)
    expect(res.status).toBe(415)
  })
})


