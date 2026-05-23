import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RepoList } from '@/components/dashboard/repo-list'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const repos = [
  { id: '1', name: 'my-app', url: 'https://github.com/u/my-app', branch: 'main', projectType: 'GENERIC' as const },
  { id: '2', name: 'api-service', url: 'https://github.com/u/api-service', branch: 'main', projectType: 'NODE' as const },
]

describe('RepoList', () => {
  it('renders the workspace name as a heading', () => {
    render(<RepoList workspaceName="Alice Workspace" repos={[]} />)
    expect(screen.getByRole('heading', { name: 'Alice Workspace' })).toBeInTheDocument()
  })

  it('renders each repository name', () => {
    render(<RepoList workspaceName="Alice Workspace" repos={repos} />)
    expect(screen.getByText('my-app')).toBeInTheDocument()
    expect(screen.getByText('api-service')).toBeInTheDocument()
  })

  it('renders an Add Repository button', () => {
    render(<RepoList workspaceName="Alice Workspace" repos={[]} />)
    expect(screen.getByRole('button', { name: /add repository/i })).toBeInTheDocument()
  })

  it('shows empty state message when no repositories exist', () => {
    render(<RepoList workspaceName="Alice Workspace" repos={[]} />)
    expect(screen.getByText(/no repositories/i)).toBeInTheDocument()
  })
})
