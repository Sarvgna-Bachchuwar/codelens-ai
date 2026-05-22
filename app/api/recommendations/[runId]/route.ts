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
      recommendations: {
        select: { id: true, title: true, reason: true, suggestion: true, priority: true, analysisRunId: true },
        orderBy: { priority: 'asc' },
      },
    },
  })

  if (!run) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ recommendations: run.recommendations })
}
