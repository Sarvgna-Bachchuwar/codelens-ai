type Priority = 'HIGH' | 'MEDIUM' | 'LOW'

type Recommendation = {
  id: string
  title: string
  reason: string
  suggestion: string
  priority: Priority
  analysisRunId: string
}

type Props = {
  recommendations: Recommendation[]
}

const priorityBadge: Record<Priority, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-blue-100 text-blue-700',
}

const PRIORITY_ORDER: Priority[] = ['HIGH', 'MEDIUM', 'LOW']

export function RecommendationsList({ recommendations }: Props) {
  if (recommendations.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        No recommendations yet — run an analysis with HIGH severity findings to generate them.
      </div>
    )
  }

  const sorted = [...recommendations].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  )

  return (
    <ul className="space-y-4">
      {sorted.map((rec) => (
        <li key={rec.id}>
          <article className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-semibold">{rec.title}</h3>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadge[rec.priority]}`}
              >
                {rec.priority}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Why this matters</p>
              <p className="text-sm">{rec.reason}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">What to do</p>
              <p className="text-sm">{rec.suggestion}</p>
            </div>
          </article>
        </li>
      ))}
    </ul>
  )
}
