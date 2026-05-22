'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Repo = {
  id: string
  name: string
  url: string
  branch: string
}

type Props = {
  workspaceName: string
  repos: Repo[]
}

export function RepoList({ workspaceName, repos }: Props) {
  const router = useRouter()
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
              <Link
                href={`/repos/${repo.id}`}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{repo.name}</p>
                  <p className="text-xs text-muted-foreground">{repo.url}</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {repo.branch}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
