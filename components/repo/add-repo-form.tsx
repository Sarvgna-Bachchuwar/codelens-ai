'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseGithubUrl } from '@/lib/github/validate'

type ProjectType = 'RAILS' | 'NODE' | 'REACT' | 'GENERIC'

type Props = {
  workspaceId: string
}

export function AddRepoForm({ workspaceId }: Props) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [projectType, setProjectType] = useState<ProjectType>('GENERIC')
  const [urlError, setUrlError] = useState('')
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function validateUrl(value: string): string {
    if (!value.trim()) return 'GitHub URL is required'
    try {
      parseGithubUrl(value)
      return ''
    } catch {
      return 'Invalid GitHub URL — must be https://github.com/owner/repo'
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')

    const err = validateUrl(url)
    if (err) {
      setUrlError(err)
      return
    }
    setUrlError('')
    setLoading(true)

    try {
      const res = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), branch, projectType, workspaceId }),
      })

      if (!res.ok) {
        let message = 'Something went wrong — please try again'
        try {
          const data = (await res.json()) as { error?: string }
          if (data.error) message = data.error
        } catch {
          message = `Server error (${res.status}) — please try again`
        }
        setServerError(message)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setServerError('Network error — check your connection and try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="repo-url" className="text-sm font-medium">
          GitHub Repo URL
        </label>
        <input
          id="repo-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {urlError && <p className="text-xs text-destructive">{urlError}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="repo-branch" className="text-sm font-medium">
          Branch
        </label>
        <input
          id="repo-branch"
          type="text"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="repo-project-type" className="text-sm font-medium">
          Project Type
        </label>
        <select
          id="repo-project-type"
          value={projectType}
          onChange={(e) => setProjectType(e.target.value as ProjectType)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="GENERIC">Generic</option>
          <option value="RAILS">Rails</option>
          <option value="NODE">Node</option>
          <option value="REACT">React</option>
        </select>
      </div>

      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Adding…' : 'Add Repository'}
      </button>
    </form>
  )
}
