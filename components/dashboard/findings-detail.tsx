type Severity = 'HIGH' | 'MEDIUM' | 'LOW'

type Finding = {
  id: string
  filePath: string
  severity: Severity
  category: string
  title: string
  description: string
  suggestion: string
  line: number | null
  aiSummary: string | null
}

type Props = {
  finding: Finding | null
}

export function FindingsDetail({ finding }: Props) {
  if (!finding) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Select a finding to see details
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">File</p>
        <p className="font-mono text-sm break-all">{finding.filePath}</p>
      </div>

      {finding.line != null && (
        <div>
          <p className="text-xs text-muted-foreground">Location</p>
          <p className="text-sm">Line {finding.line}</p>
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground">Category</p>
        <p className="text-sm font-mono">{finding.category}</p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">Description</p>
        <p className="text-sm">{finding.description}</p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">Suggestion</p>
        <p className="text-sm">{finding.suggestion}</p>
      </div>

      {finding.aiSummary && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1">AI Summary</p>
          <p className="text-sm">{finding.aiSummary}</p>
        </div>
      )}
    </div>
  )
}
