import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Octokit } from '@octokit/rest'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db/prisma'
import { parseGithubUrl } from '@/lib/github/validate'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workspace = await prisma.workspace.findFirst({
    where: { userId: session.user.id },
  })
  if (!workspace) {
    return NextResponse.json([])
  }

  const repos = await prisma.repository.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(repos)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: 'github' },
    select: { access_token: true },
  })

  const octokit = new Octokit({ auth: account?.access_token ?? undefined })
  try {
    await octokit.repos.get({ owner, repo })
  } catch {
    return NextResponse.json(
      { error: 'Repository not found or not accessible' },
      { status: 422 },
    )
  }

  const workspace =
    (await prisma.workspace.findFirst({ where: { userId: session.user.id } })) ??
    (await prisma.workspace.create({
      data: { name: 'My Workspace', userId: session.user.id },
    }))

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
