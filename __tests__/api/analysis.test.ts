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
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/analysis/runner', () => ({
  runAnalysis: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/analysis/route'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/db/prisma'
import { runAnalysis } from '@/lib/analysis/runner'

const mockSession = { user: { id: 'u1', name: 'Alice' }, expires: '2099-01-01' }

describe('POST /api/analysis', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await POST(new Request('http://localhost/api/analysis', {
      method: 'POST', body: JSON.stringify({ repositoryId: 'repo-1' }),
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when repositoryId is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    const res = await POST(new Request('http://localhost/api/analysis', {
      method: 'POST', body: JSON.stringify({}),
    }))
    expect(res.status).toBe(400)
  })

  it('creates an AnalysisRun and returns its id with 201', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.analysisRun.create).mockResolvedValue({
      id: 'run-1', repositoryId: 'repo-1', status: 'PENDING',
      totalFiles: 0, totalFindings: 0, highRiskCount: 0,
      coverageScore: 0, healthScore: 0, startedAt: new Date(), completedAt: null,
    })
    const res = await POST(new Request('http://localhost/api/analysis', {
      method: 'POST', body: JSON.stringify({ repositoryId: 'repo-1' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    const data = await res.json()
    expect(res.status).toBe(201)
    expect(data.analysisRunId).toBe('run-1')
  })

  it('fires runAnalysis without blocking the response', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.analysisRun.create).mockResolvedValue({
      id: 'run-2', repositoryId: 'repo-1', status: 'PENDING',
      totalFiles: 0, totalFindings: 0, highRiskCount: 0,
      coverageScore: 0, healthScore: 0, startedAt: new Date(), completedAt: null,
    })
    await POST(new Request('http://localhost/api/analysis', {
      method: 'POST', body: JSON.stringify({ repositoryId: 'repo-1' }),
    }))
    expect(runAnalysis).toHaveBeenCalledWith('run-2')
  })
})
