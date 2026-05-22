'use client'

type Severity = 'HIGH' | 'MEDIUM' | 'LOW'

type FindingRow = {
  id: string
  filePath: string
  severity: Severity
  category: string
  title: string
}

type Props = {
  findings: FindingRow[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const severityBadge: Record<Severity, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-blue-100 text-blue-700',
}

const severityOrder: Severity[] = ['HIGH', 'MEDIUM', 'LOW']

export function FindingsList({ findings, selectedId, onSelect }: Props) {
  if (findings.length === 0) {
    return <p className="text-sm text-muted-foreground">No findings — looking good!</p>
  }

  const grouped = severityOrder.reduce<Record<Severity, FindingRow[]>>(
    (acc, s) => {
      acc[s] = findings.filter((f) => f.severity === s)
      return acc
    },
    { HIGH: [], MEDIUM: [], LOW: [] },
  )

  return (
    <div className="space-y-6">
      {severityOrder.map((severity) => {
        const rows = grouped[severity]
        if (rows.length === 0) return null
        return (
          <section key={severity}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {severity}
            </h3>
            <ul className="divide-y divide-border rounded-xl border bg-card">
              {rows.map((f) => (
                <li
                  key={f.id}
                  data-selected={f.id === selectedId ? '' : undefined}
                  onClick={() => onSelect(f.id)}
                  className={`cursor-pointer px-4 py-3 transition-colors hover:bg-muted/50 ${
                    f.id === selectedId ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${severityBadge[f.severity]}`}
                    >
                      {f.severity}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">{f.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{f.filePath}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
