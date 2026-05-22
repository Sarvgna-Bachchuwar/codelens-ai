import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { runId } = await params

  const run = await prisma.analysisRun.findUnique({
    where: { id: runId },
    select: {
      id: true,
      archNodes: {
        select: { id: true, label: true, type: true, filePath: true, analysisRunId: true },
      },
      archEdges: {
        select: { id: true, sourceId: true, targetId: true, label: true, analysisRunId: true },
      },
    },
  })

  if (!run) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ nodes: run.archNodes, edges: run.archEdges })
}
