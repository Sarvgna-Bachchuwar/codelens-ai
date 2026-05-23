'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type ProjectType = 'RAILS' | 'NODE' | 'REACT' | 'GENERIC'

type Repo = {
  id: string
  name: string
  url: string
  branch: string
  projectType: ProjectType
}

type Props = {
  workspaceName: string
  repos: Repo[]
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

type EditState = { branch: string; projectType: ProjectType }

export function RepoList({ workspaceName, repos: initialRepos }: Props) {
  const router = useRouter()
  const [repos, setRepos] = useState(initialRepos)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ branch: '', projectType: 'GENERIC' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function startEdit(repo: Repo) {
    setEditingId(repo.id)
    setEditState({ branch: repo.branch, projectType: repo.projectType })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/repos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editState),
      })
      if (res.ok) {
        setRepos((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...editState } : r)),
        )
        setEditingId(null)
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteRepo(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This will remove all analysis runs and findings.`)) return
    setDeletingId(id)
    try {
      await fetch(`/api/repos/${id}`, { method: 'DELETE' })
      setRepos((prev) => prev.filter((r) => r.id !== id))
      if (editingId === id) setEditingId(null)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{workspaceName}</h1>
        <button
          onClick={() => router.push('/add-repo')}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Add Repository
        </button>
      </div>

      {repos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No repositories yet. Add one to get started.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border bg-card">
          {repos.map((repo) => (
            <li key={repo.id}>
              <div className="flex items-center justify-between px-4 py-3 gap-3">
                <Link
                  href={`/repos/${repo.id}`}
                  className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                >
                  <p className="font-medium truncate">{repo.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{repo.url}</p>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {repo.branch}
                  </span>
                  <button
                    onClick={() => startEdit(repo)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Edit"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    onClick={() => deleteRepo(repo.id, repo.name)}
                    disabled={deletingId === repo.id}
                    className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              {editingId === repo.id && (
                <div className="border-t bg-muted/30 px-4 py-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Branch</label>
                      <input
                        type="text"
                        value={editState.branch}
                        onChange={(e) => setEditState((s) => ({ ...s, branch: e.target.value }))}
                        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Project Type</label>
                      <select
                        value={editState.projectType}
                        onChange={(e) => setEditState((s) => ({ ...s, projectType: e.target.value as ProjectType }))}
                        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="GENERIC">Generic</option>
                        <option value="RAILS">Rails</option>
                        <option value="NODE">Node</option>
                        <option value="REACT">React</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={cancelEdit}
                      className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(repo.id)}
                      disabled={saving}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
