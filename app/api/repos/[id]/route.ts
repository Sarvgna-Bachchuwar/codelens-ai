import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getDemoUserId } from '@/lib/demo-user'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const userId = await getDemoUserId()
  const { id } = await params

  const repo = await prisma.repository.findFirst({
    where: { id, workspace: { userId } },
  })
  if (!repo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Cascade-delete all analysis runs and related data first
  const runs = await prisma.analysisRun.findMany({
    where: { repositoryId: id },
    select: { id: true },
  })
  const runIds = runs.map((r) => r.id)

  if (runIds.length > 0) {
    await prisma.finding.deleteMany({ where: { analysisRunId: { in: runIds } } })
    await prisma.archNode.deleteMany({ where: { analysisRunId: { in: runIds } } })
    await prisma.archEdge.deleteMany({ where: { analysisRunId: { in: runIds } } })
    await prisma.recommendation.deleteMany({ where: { analysisRunId: { in: runIds } } })
    await prisma.analysisRun.deleteMany({ where: { id: { in: runIds } } })
  }

  await prisma.repository.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(req: Request, { params }: Params) {
  const userId = await getDemoUserId()
  const { id } = await params

  const repo = await prisma.repository.findFirst({
    where: { id, workspace: { userId } },
  })
  if (!repo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { branch, projectType } = (await req.json()) as {
    branch?: string
    projectType?: string
  }

  const updated = await prisma.repository.update({
    where: { id },
    data: {
      ...(branch ? { branch } : {}),
      ...(projectType ? { projectType: projectType as 'RAILS' | 'NODE' | 'REACT' | 'GENERIC' } : {}),
    },
  })

  return NextResponse.json(updated)
}
