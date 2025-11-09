import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('extractResumeFromText', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws if API key missing', async () => {
    delete (process as any).env.DEEPSEEK_API_KEY
    const { extractResumeFromText } = await import('@/lib/deepseek')
    await expect(extractResumeFromText('hello')).rejects.toThrow(/Missing DEEPSEEK_API_KEY/)
  })

  it('parses model JSON content', async () => {
    ;(process as any).env.DEEPSEEK_API_KEY = 'test'
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: JSON.stringify({ skills: ['JS'], experience: [], education: [], summary: 'ok' }) } },
          ],
        }),
        { status: 200 } as any,
      ),
    ) as any)

    const { extractResumeFromText } = await import('@/lib/deepseek')
    const res = await extractResumeFromText('resume text')
    expect(res.skills).toEqual(['JS'])
    expect(res.summary).toBe('ok')
  })
})


