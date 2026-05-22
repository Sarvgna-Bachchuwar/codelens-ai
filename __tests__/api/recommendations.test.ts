import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  },
}))

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth/options', () => ({ authOptions: {} }))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    analysisRun: { findUnique: vi.fn() },
  },
}))

import { GET } from '@/app/api/recommendations/[runId]/route'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/db/prisma'

const mockSession = { user: { id: 'u1' }, expires: '2099-01-01' }
const params = (runId: string) => Promise.resolve({ runId })

const mockRun = {
  id: 'run-1',
  recommendations: [
    { id: 'r1', title: 'Fix N+1', reason: 'Performance.', suggestion: 'Use includes.', priority: 'HIGH', analysisRunId: 'run-1' },
    { id: 'r2', title: 'Add tests', reason: 'Coverage.', suggestion: 'Write specs.', priority: 'MEDIUM', analysisRunId: 'run-1' },
  ],
}

describe('GET /api/recommendations/:runId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await GET(
      new Request('http://localhost/api/recommendations/run-1'),
      { params: params('run-1') },
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 when run does not exist', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.analysisRun.findUnique).mockResolvedValue(null)
    const res = await GET(
      new Request('http://localhost/api/recommendations/missing'),
      { params: params('missing') },
    )
    expect(res.status).toBe(404)
  })

  it('returns recommendations for a valid run', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.analysisRun.findUnique).mockResolvedValue(mockRun as never)
    const res = await GET(
      new Request('http://localhost/api/recommendations/run-1'),
      { params: params('run-1') },
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.recommendations).toHaveLength(2)
    expect(data.recommendations[0].title).toBe('Fix N+1')
  })

  it('returns empty array when run has no recommendations', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.analysisRun.findUnique).mockResolvedValue({ ...mockRun, recommendations: [] } as never)
    const res = await GET(
      new Request('http://localhost/api/recommendations/run-1'),
      { params: params('run-1') },
    )
    const data = await res.json()
    expect(data.recommendations).toHaveLength(0)
  })
})
