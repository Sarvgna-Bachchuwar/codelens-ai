'use client'

import { useState } from 'react'
import { FindingsList } from './findings-list'
import { FindingsDetail } from './findings-detail'

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
  findings: Finding[]
}

export function FindingsDashboard({ findings }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = findings.find((f) => f.id === selectedId) ?? null

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <FindingsList findings={findings} selectedId={selectedId} onSelect={setSelectedId} />
      <FindingsDetail finding={selected} />
    </div>
  )
}
