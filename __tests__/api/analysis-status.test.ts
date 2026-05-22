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
    analysisRun: {
      findUnique: vi.fn(),
    },
  },
}))

import { GET } from '@/app/api/analysis/[id]/status/route'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/db/prisma'

const mockSession = { user: { id: 'u1' }, expires: '2099-01-01' }
const params = (id: string) => Promise.resolve({ id })

describe('GET /api/analysis/:id/status', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await GET(
      new Request('http://localhost/api/analysis/run-1/status'),
      { params: params('run-1') },
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 for a non-existent analysis run', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.analysisRun.findUnique).mockResolvedValue(null)
    const res = await GET(
      new Request('http://localhost/api/analysis/missing/status'),
      { params: params('missing') },
    )
    expect(res.status).toBe(404)
  })

  it('returns 200 with run status for an existing run', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.analysisRun.findUnique).mockResolvedValue({
      id: 'run-1', status: 'RUNNING', totalFiles: 42,
      totalFindings: 7, highRiskCount: 2,
      coverageScore: 80, healthScore: 75,
      repositoryId: 'repo-1', startedAt: new Date(), completedAt: null,
    })
    const res = await GET(
      new Request('http://localhost/api/analysis/run-1/status'),
      { params: params('run-1') },
    )
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.status).toBe('RUNNING')
    expect(data.totalFiles).toBe(42)
    expect(data.totalFindings).toBe(7)
  })

  it('returns completedAt when the run is finished', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    const completedAt = new Date('2025-01-01')
    vi.mocked(prisma.analysisRun.findUnique).mockResolvedValue({
      id: 'run-1', status: 'COMPLETED', totalFiles: 10,
      totalFindings: 3, highRiskCount: 1,
      coverageScore: 90, healthScore: 85,
      repositoryId: 'repo-1', startedAt: new Date(), completedAt,
    })
    const res = await GET(
      new Request('http://localhost/api/analysis/run-1/status'),
      { params: params('run-1') },
    )
    const data = await res.json()
    expect(data.status).toBe('COMPLETED')
    expect(data.completedAt).toBeTruthy()
  })
})
