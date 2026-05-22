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

import { GET } from '@/app/api/architecture/[runId]/route'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/db/prisma'

const mockSession = { user: { id: 'u1' }, expires: '2099-01-01' }
const params = (runId: string) => Promise.resolve({ runId })

const mockRun = {
  id: 'run-1',
  archNodes: [
    { id: 'n1', label: 'UsersController', type: 'CONTROLLER', filePath: 'app/controllers/users_controller.rb', analysisRunId: 'run-1' },
    { id: 'n2', label: 'UserService', type: 'SERVICE', filePath: 'app/services/user_service.rb', analysisRunId: 'run-1' },
  ],
  archEdges: [
    { id: 'e1', sourceId: 'n1', targetId: 'n2', label: 'calls', analysisRunId: 'run-1' },
  ],
}

describe('GET /api/architecture/:runId', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await GET(
      new Request('http://localhost/api/architecture/run-1'),
      { params: params('run-1') },
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 when run does not exist', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.analysisRun.findUnique).mockResolvedValue(null)
    const res = await GET(
      new Request('http://localhost/api/architecture/missing'),
      { params: params('missing') },
    )
    expect(res.status).toBe(404)
  })

  it('returns nodes and edges for a valid run', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.analysisRun.findUnique).mockResolvedValue(mockRun as never)
    const res = await GET(
      new Request('http://localhost/api/architecture/run-1'),
      { params: params('run-1') },
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.nodes).toHaveLength(2)
    expect(data.edges).toHaveLength(1)
    expect(data.nodes[0].label).toBe('UsersController')
    expect(data.edges[0].sourceId).toBe('n1')
  })

  it('returns empty arrays when run has no architecture data', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.analysisRun.findUnique).mockResolvedValue({
      ...mockRun,
      archNodes: [],
      archEdges: [],
    } as never)
    const res = await GET(
      new Request('http://localhost/api/architecture/run-1'),
      { params: params('run-1') },
    )
    const data = await res.json()
    expect(data.nodes).toHaveLength(0)
    expect(data.edges).toHaveLength(0)
  })
})
