import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddRepoForm } from '@/components/repo/add-repo-form'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('AddRepoForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('renders URL, branch, and project type fields', () => {
    render(<AddRepoForm workspaceId="ws1" />)
    expect(screen.getByLabelText(/github repo url/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/branch/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/project type/i)).toBeInTheDocument()
  })

  it('defaults branch to main and project type to Generic', () => {
    render(<AddRepoForm workspaceId="ws1" />)
    expect(screen.getByLabelText<HTMLInputElement>(/branch/i).value).toBe('main')
    expect(screen.getByLabelText<HTMLSelectElement>(/project type/i).value).toBe('GENERIC')
  })

  it('shows inline error when URL is empty on submit', async () => {
    render(<AddRepoForm workspaceId="ws1" />)
    fireEvent.click(screen.getByRole('button', { name: /add repository/i }))
    await waitFor(() =>
      expect(screen.getByText(/github url is required/i)).toBeInTheDocument(),
    )
  })

  it('shows inline error when URL is not a valid GitHub URL', async () => {
    render(<AddRepoForm workspaceId="ws1" />)
    fireEvent.change(screen.getByLabelText(/github repo url/i), {
      target: { value: 'https://gitlab.com/user/repo' },
    })
    fireEvent.click(screen.getByRole('button', { name: /add repository/i }))
    await waitFor(() =>
      expect(screen.getByText(/invalid github url/i)).toBeInTheDocument(),
    )
  })

  it('shows server error when the API returns an error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Repository not accessible' }), { status: 422 }),
    )
    render(<AddRepoForm workspaceId="ws1" />)
    fireEvent.change(screen.getByLabelText(/github repo url/i), {
      target: { value: 'https://github.com/u/private-repo' },
    })
    fireEvent.click(screen.getByRole('button', { name: /add repository/i }))
    await waitFor(() =>
      expect(screen.getByText(/repository not accessible/i)).toBeInTheDocument(),
    )
  })

  it('calls POST /api/repos with correct payload on valid submission', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'r1', name: 'u/repo' }), { status: 201 }),
    )
    render(<AddRepoForm workspaceId="ws1" />)
    fireEvent.change(screen.getByLabelText(/github repo url/i), {
      target: { value: 'https://github.com/u/repo' },
    })
    fireEvent.change(screen.getByLabelText(/branch/i), {
      target: { value: 'develop' },
    })
    fireEvent.click(screen.getByRole('button', { name: /add repository/i }))
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    const [url, opts] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/repos')
    expect(JSON.parse(opts.body as string)).toMatchObject({
      url: 'https://github.com/u/repo',
      branch: 'develop',
    })
  })
})
