import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db/prisma'
import { MetricCards } from '@/components/dashboard/metric-cards'
import { FindingsDashboard } from '@/components/dashboard/findings-dashboard'
import { AnalysisStatus } from '@/components/repo/analysis-status'

type Props = {
  params: Promise<{ id: string }>
}

export default async function RepoDashboardPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) notFound()

  const { id } = await params

  const repo = await prisma.repository.findFirst({
    where: {
      id,
      workspace: { userId: session.user.id },
    },
    include: {
      analysisRuns: {
        orderBy: { startedAt: 'desc' },
        take: 1,
        include: {
          findings: {
            select: {
              id: true,
              filePath: true,
              severity: true,
              category: true,
              title: true,
              description: true,
              suggestion: true,
              line: true,
              aiSummary: true,
            },
          },
        },
      },
    },
  })

  if (!repo) notFound()

  const latestRun = repo.analysisRuns[0] ?? null

  const metrics = latestRun
    ? {
        totalFiles: latestRun.totalFiles,
        totalFindings: latestRun.totalFindings,
        highRiskCount: latestRun.highRiskCount,
        coverageScore: latestRun.coverageScore,
        healthScore: latestRun.healthScore,
        completedAt: latestRun.completedAt,
      }
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{repo.name}</h1>
          <p className="text-sm text-muted-foreground">
            {repo.url} · {repo.branch}
          </p>
        </div>
        <AnalysisStatus
          repositoryId={repo.id}
          currentRunId={latestRun?.id ?? null}
          currentStatus={latestRun?.status ?? null}
        />
      </div>

      <div className="flex gap-1 border-b">
        <span className="border-b-2 border-primary px-4 py-2 text-sm font-medium">Findings</span>
        <Link href={`/repos/${repo.id}/architecture`} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
          Architecture
        </Link>
        <Link href={`/repos/${repo.id}/recommendations`} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
          Recommendations
        </Link>
      </div>

      <div className="space-y-8">
        {metrics ? (
          <MetricCards {...metrics} />
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No analysis yet. Click &ldquo;Run Analysis&rdquo; to get started.
          </div>
        )}

        {latestRun && latestRun.findings.length > 0 && (
          <FindingsDashboard findings={latestRun.findings} />
        )}
      </div>
    </div>
  )
}
