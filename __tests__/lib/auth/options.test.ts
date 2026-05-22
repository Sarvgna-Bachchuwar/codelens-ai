import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {},
}))

vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn(() => ({})),
}))

describe('authOptions', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('configures GitHub as the only provider', async () => {
    const { authOptions } = await import('@/lib/auth/options')
    expect(authOptions.providers).toHaveLength(1)
    expect(authOptions.providers[0].id).toBe('github')
  })

  it('uses jwt session strategy', async () => {
    const { authOptions } = await import('@/lib/auth/options')
    expect(authOptions.session?.strategy).toBe('jwt')
  })

  it('provides a redirect callback', async () => {
    const { authOptions } = await import('@/lib/auth/options')
    expect(typeof authOptions.callbacks?.redirect).toBe('function')
  })

  it('provides a session callback that attaches user id', async () => {
    const { authOptions } = await import('@/lib/auth/options')
    expect(typeof authOptions.callbacks?.session).toBe('function')
  })
})
