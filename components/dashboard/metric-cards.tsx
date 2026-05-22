type Props = {
  totalFiles: number
  totalFindings: number
  highRiskCount: number
  coverageScore: number
  healthScore: number
  completedAt: Date | null
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

export function MetricCards({
  totalFiles,
  totalFindings,
  highRiskCount,
  coverageScore,
  healthScore,
  completedAt,
}: Props) {
  const lastAnalysis = completedAt
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(completedAt),
      )
    : '—'

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <Card label="Total Files" value={String(totalFiles)} />
      <Card label="Total Findings" value={String(totalFindings)} />
      <Card label="High Risk" value={String(highRiskCount)} />
      <Card label="Coverage" value={`${coverageScore}%`} />
      <Card label="Health Score" value={String(healthScore)} />
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">Last Analysis</p>
        <p className="mt-1 text-sm font-medium">{lastAnalysis}</p>
      </div>
    </div>
  )
}
