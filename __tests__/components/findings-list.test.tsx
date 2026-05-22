import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FindingsList } from '@/components/dashboard/findings-list'

const findings = [
  { id: 'f1', filePath: 'app/controllers/users.rb', severity: 'HIGH' as const, category: 'N_PLUS_ONE', title: 'N+1 Query' },
  { id: 'f2', filePath: 'app/models/post.rb', severity: 'MEDIUM' as const, category: 'LARGE_FILE', title: 'Large File' },
  { id: 'f3', filePath: 'app/helpers/app.rb', severity: 'LOW' as const, category: 'TODO_COMMENT', title: 'TODO Comment' },
]

describe('FindingsList', () => {
  it('renders findings grouped under severity headings', () => {
    render(<FindingsList findings={findings} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /high/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /medium/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /low/i })).toBeInTheDocument()
  })

  it('renders finding title and file path', () => {
    render(<FindingsList findings={findings} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('N+1 Query')).toBeInTheDocument()
    expect(screen.getByText('app/controllers/users.rb')).toBeInTheDocument()
  })

  it('calls onSelect with finding id when a row is clicked', () => {
    const onSelect = vi.fn()
    render(<FindingsList findings={findings} selectedId={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('N+1 Query'))
    expect(onSelect).toHaveBeenCalledWith('f1')
  })

  it('highlights the selected finding row', () => {
    render(<FindingsList findings={findings} selectedId="f2" onSelect={vi.fn()} />)
    const row = screen.getByText('Large File').closest('[data-selected]')
    expect(row).not.toBeNull()
  })

  it('shows empty state when findings array is empty', () => {
    render(<FindingsList findings={[]} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText(/no findings/i)).toBeInTheDocument()
  })

  it('omits severity groups with no findings', () => {
    const onlyHigh = [findings[0]]
    render(<FindingsList findings={onlyHigh} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.queryByRole('heading', { name: /medium/i })).toBeNull()
    expect(screen.queryByRole('heading', { name: /low/i })).toBeNull()
  })
})
