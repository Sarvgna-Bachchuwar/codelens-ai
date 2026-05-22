import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FindingsDetail } from '@/components/dashboard/findings-detail'

const finding = {
  id: 'f1',
  filePath: 'app/controllers/users_controller.rb',
  severity: 'HIGH' as const,
  category: 'N_PLUS_ONE',
  title: 'N+1 Query',
  description: 'Loop contains a database query that runs once per iteration.',
  suggestion: 'Use eager loading with includes() to batch the queries.',
  line: 42,
  aiSummary: 'This pattern causes N database calls for N records. Extract the query outside the loop.',
}

describe('FindingsDetail', () => {
  it('shows placeholder when no finding is selected', () => {
    render(<FindingsDetail finding={null} />)
    expect(screen.getByText(/select a finding/i)).toBeInTheDocument()
  })

  it('renders file path', () => {
    render(<FindingsDetail finding={finding} />)
    expect(screen.getByText('app/controllers/users_controller.rb')).toBeInTheDocument()
  })

  it('renders line number', () => {
    render(<FindingsDetail finding={finding} />)
    expect(screen.getByText(/line 42/i)).toBeInTheDocument()
  })

  it('renders category', () => {
    render(<FindingsDetail finding={finding} />)
    expect(screen.getByText('N_PLUS_ONE')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<FindingsDetail finding={finding} />)
    expect(screen.getByText(/loop contains a database query/i)).toBeInTheDocument()
  })

  it('renders suggestion', () => {
    render(<FindingsDetail finding={finding} />)
    expect(screen.getByText(/use eager loading/i)).toBeInTheDocument()
  })

  it('renders AI summary when present', () => {
    render(<FindingsDetail finding={finding} />)
    expect(screen.getByText(/n database calls/i)).toBeInTheDocument()
  })

  it('omits AI summary section when aiSummary is null', () => {
    render(<FindingsDetail finding={{ ...finding, aiSummary: null }} />)
    expect(screen.queryByText(/ai summary/i)).toBeNull()
  })

  it('omits line number when line is null', () => {
    render(<FindingsDetail finding={{ ...finding, line: null }} />)
    expect(screen.queryByText(/line/i)).toBeNull()
  })
})
