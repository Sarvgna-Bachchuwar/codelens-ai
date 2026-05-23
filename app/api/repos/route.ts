import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getDemoUserId } from '@/lib/demo-user'
import { parseGithubUrl } from '@/lib/github/validate'

export async function GET() {
  const userId = await getDemoUserId()

  const workspace = await prisma.workspace.findFirst({ where: { userId } })
  if (!workspace) return NextResponse.json([])

  const repos = await prisma.repository.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(repos)
}

export async function POST(req: Request) {
  const userId = await getDemoUserId()

  const { url, branch, projectType } = (await req.json()) as {
    url: string
    branch?: string
    projectType?: string
  }

  let owner: string, repo: string
  try {
    ;({ owner, repo } = parseGithubUrl(url))
  } catch {
    return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })
  }

  const workspace =
    (await prisma.workspace.findFirst({ where: { userId } })) ??
    (await prisma.workspace.create({ data: { name: 'My Workspace', userId } }))

  const created = await prisma.repository.create({
    data: {
      workspaceId: workspace.id,
      name: `${owner}/${repo}`,
      url: url.trim(),
      branch: branch ?? 'main',
      projectType: (projectType as 'RAILS' | 'NODE' | 'REACT' | 'GENERIC') ?? 'GENERIC',
    },
  })

  return NextResponse.json(created, { status: 201 })
}
