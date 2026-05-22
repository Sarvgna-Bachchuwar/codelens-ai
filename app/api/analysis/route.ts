import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db/prisma'
import { runAnalysis } from '@/lib/analysis/runner'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { repositoryId } = (await req.json()) as { repositoryId?: string }
  if (!repositoryId) {
    return NextResponse.json({ error: 'repositoryId required' }, { status: 400 })
  }

  const analysisRun = await prisma.analysisRun.create({
    data: { repositoryId, status: 'PENDING' },
  })

  // Fire-and-forget — client polls /status for progress
  void runAnalysis(analysisRun.id).catch(console.error)

  return NextResponse.json({ analysisRunId: analysisRun.id }, { status: 201 })
}
