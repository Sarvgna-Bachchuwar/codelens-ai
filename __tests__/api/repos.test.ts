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
    repository: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth/options', () => ({
  authOptions: {},
}))

const { mockOctokitReposGet } = vi.hoisted(() => ({
  mockOctokitReposGet: vi.fn(),
}))

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(function () {
    return { repos: { get: mockOctokitReposGet } }
  }),
}))

import { GET, POST } from '@/app/api/repos/route'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/db/prisma'

const mockSession = {
  user: { id: 'u1', name: 'Alice', email: 'alice@test.com' },
  expires: '2099-01-01',
}

describe('GET /api/repos', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns empty array when user has no workspace', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue(null)
    const res = await GET()
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toEqual([])
  })

  it('returns repositories for user workspace', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({
      id: 'ws1', name: 'My Workspace', userId: 'u1', createdAt: new Date(),
    })
    vi.mocked(prisma.repository.findMany).mockResolvedValue([
      {
        id: 'repo1', name: 'my-app', url: 'https://github.com/u/my-app',
        branch: 'main', workspaceId: 'ws1', projectType: 'NODE' as const,
        createdAt: new Date(),
      },
    ])
    const res = await GET()
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('my-app')
  })
})

describe('POST /api/repos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOctokitReposGet.mockResolvedValue({ data: { id: 123 } })
    vi.mocked(prisma.account.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({
      id: 'ws1', name: 'My Workspace', userId: 'u1', createdAt: new Date(),
    })
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await POST(new Request('http://localhost/api/repos', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://github.com/u/repo', branch: 'main', projectType: 'NODE' }),
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for an invalid GitHub URL', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    const res = await POST(new Request('http://localhost/api/repos', {
      method: 'POST',
      body: JSON.stringify({ url: 'not-a-github-url', branch: 'main', projectType: 'NODE' }),
    }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/invalid github url/i)
  })

  it('returns 422 when the repository is not accessible via Octokit', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    mockOctokitReposGet.mockRejectedValueOnce(new Error('Not Found'))
    const res = await POST(new Request('http://localhost/api/repos', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://github.com/u/private-repo', branch: 'main', projectType: 'NODE' }),
    }))
    expect(res.status).toBe(422)
    const data = await res.json()
    expect(data.error).toMatch(/not accessible/i)
  })

  it('saves repository and returns 201 for a valid accessible repo', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.repository.create).mockResolvedValue({
      id: 'repo-new', name: 'u/my-app', url: 'https://github.com/u/my-app',
      branch: 'main', workspaceId: 'ws1', projectType: 'NODE' as const,
      createdAt: new Date(),
    })
    const res = await POST(new Request('http://localhost/api/repos', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://github.com/u/my-app', branch: 'main', projectType: 'NODE' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    const data = await res.json()
    expect(res.status).toBe(201)
    expect(data.id).toBe('repo-new')
    expect(prisma.repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'u/my-app', branch: 'main' }),
      }),
    )
  })
})
