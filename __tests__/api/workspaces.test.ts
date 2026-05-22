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

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    workspace: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth/options', () => ({
  authOptions: {},
}))

import { GET, POST } from '@/app/api/workspaces/route'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/db/prisma'

const mockSession = {
  user: { id: 'u1', name: 'Alice', email: 'alice@test.com' },
  expires: '2099-01-01',
}

const mockWorkspace = {
  id: 'ws1',
  name: 'Alice Workspace',
  userId: 'u1',
  createdAt: new Date(),
}

describe('GET /api/workspaces', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns existing workspace for authenticated user', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue(mockWorkspace)
    const res = await GET()
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.id).toBe('ws1')
    expect(data.name).toBe('Alice Workspace')
  })

  it('auto-creates a default workspace when user has none', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.workspace.create).mockResolvedValue({
      id: 'ws-new',
      name: 'My Workspace',
      userId: 'u1',
      createdAt: new Date(),
    })
    const res = await GET()
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.id).toBe('ws-new')
    expect(prisma.workspace.create).toHaveBeenCalledWith({
      data: { name: 'My Workspace', userId: 'u1' },
    })
  })
})

describe('POST /api/workspaces', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await POST(
      new Request('http://localhost/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name: 'New' }),
      }),
    )
    expect(res.status).toBe(401)
  })

  it('creates and returns a new workspace with status 201', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.workspace.create).mockResolvedValue({
      id: 'ws2',
      name: 'New Workspace',
      userId: 'u1',
      createdAt: new Date(),
    })
    const res = await POST(
      new Request('http://localhost/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Workspace' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const data = await res.json()
    expect(res.status).toBe(201)
    expect(data.name).toBe('New Workspace')
    expect(prisma.workspace.create).toHaveBeenCalledWith({
      data: { name: 'New Workspace', userId: 'u1' },
    })
  })
})
