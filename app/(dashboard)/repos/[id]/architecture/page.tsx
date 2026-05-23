import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { getDemoUserId } from '@/lib/demo-user'

export const dynamic = 'force-dynamic'
import { ArchGraph } from '@/components/dashboard/arch-graph'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ArchitecturePage({ params }: Props) {
  const userId = await getDemoUserId()
  const { id } = await params

  const repo = await prisma.repository.findFirst({
    where: {
      id,
      workspace: { userId },
    },
    select: {
      id: true,
      name: true,
      analysisRuns: {
        where: { status: 'COMPLETED' },
        orderBy: { startedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          archNodes: {
            select: { id: true, label: true, type: true, filePath: true, analysisRunId: true },
          },
          archEdges: {
            select: { id: true, sourceId: true, targetId: true, label: true, analysisRunId: true },
          },
        },
      },
    },
  })

  if (!repo) notFound()

  const latestRun = repo.analysisRuns[0] ?? null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{repo.name}</h1>
          <p className="text-sm text-muted-foreground">Architecture Map</p>
        </div>
        <Link
          href={`/repos/${repo.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Findings
        </Link>
      </div>

      <div className="flex gap-1 border-b">
        <Link href={`/repos/${repo.id}`} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
          Findings
        </Link>
        <span className="border-b-2 border-primary px-4 py-2 text-sm font-medium">Architecture</span>
        <Link href={`/repos/${repo.id}/recommendations`} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
          Recommendations
        </Link>
      </div>

      <ArchGraph
        nodes={latestRun?.archNodes ?? []}
        edges={latestRun?.archEdges ?? []}
      />
    </div>
  )
}
