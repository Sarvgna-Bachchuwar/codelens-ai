import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const run = await prisma.analysisRun.findUnique({
    where: { id },
    select: {
      status: true,
      totalFiles: true,
      totalFindings: true,
      highRiskCount: true,
      coverageScore: true,
      healthScore: true,
      completedAt: true,
    },
  })

  if (!run) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(run)
}
