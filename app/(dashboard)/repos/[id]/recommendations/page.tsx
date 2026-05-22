import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db/prisma'
import { RecommendationsList } from '@/components/dashboard/recommendations-list'

type Props = {
  params: Promise<{ id: string }>
}

export default async function RecommendationsPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) notFound()

  const { id } = await params

  const repo = await prisma.repository.findFirst({
    where: {
      id,
      workspace: { userId: session.user.id },
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
          recommendations: {
            select: { id: true, title: true, reason: true, suggestion: true, priority: true, analysisRunId: true },
            orderBy: { priority: 'asc' },
          },
        },
      },
    },
  })

  if (!repo) notFound()

  const latestRun = repo.analysisRuns[0] ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{repo.name}</h1>
        <p className="text-sm text-muted-foreground">AI Recommendations</p>
      </div>

      <div className="flex gap-1 border-b">
        <Link href={`/repos/${repo.id}`} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
          Findings
        </Link>
        <Link href={`/repos/${repo.id}/architecture`} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
          Architecture
        </Link>
        <span className="border-b-2 border-primary px-4 py-2 text-sm font-medium">
          Recommendations
        </span>
      </div>

      <RecommendationsList recommendations={latestRun?.recommendations ?? []} />
    </div>
  )
}
