'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Status = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

type Props = {
  repositoryId: string
  currentRunId: string | null
  currentStatus: Status | null
}

export function AnalysisStatus({ repositoryId, currentRunId, currentStatus }: Props) {
  const router = useRouter()
  const [runId, setRunId] = useState<string | null>(currentRunId)
  const [status, setStatus] = useState<Status | null>(currentStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositoryId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to start analysis')
        return
      }
      const data = await res.json()
      setRunId(data.analysisRunId)
      setStatus('PENDING')
    } finally {
      setLoading(false)
    }
  }, [repositoryId])

  useEffect(() => {
    if (!runId || status === 'COMPLETED' || status === 'FAILED') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/analysis/${runId}/status`)
        if (!res.ok) return
        const data = await res.json()
        setStatus(data.status)
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          clearInterval(interval)
          router.refresh()
        }
      } catch {
        // ignore transient network errors
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [runId, status, router])

  const isRunning = status === 'PENDING' || status === 'RUNNING'

  return (
    <div className="flex items-center gap-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {isRunning && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {status === 'PENDING' ? 'Queued…' : 'Analysing…'}
        </span>
      )}
      <button
        onClick={startAnalysis}
        disabled={loading || isRunning}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {loading || isRunning ? 'Running…' : 'Run Analysis'}
      </button>
    </div>
  )
}
