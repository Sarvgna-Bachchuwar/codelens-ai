import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecommendationsList } from '@/components/dashboard/recommendations-list'

type Priority = 'HIGH' | 'MEDIUM' | 'LOW'

const recs = [
  {
    id: 'r1',
    title: 'Fix N+1 Queries',
    reason: 'Multiple DB calls per request slow down response times.',
    suggestion: 'Use eager loading with includes() to batch the queries.',
    priority: 'HIGH' as Priority,
    analysisRunId: 'run-1',
  },
  {
    id: 'r2',
    title: 'Add Test Coverage',
    reason: 'Missing tests increase risk of regressions.',
    suggestion: 'Write unit tests for each service method.',
    priority: 'MEDIUM' as Priority,
    analysisRunId: 'run-1',
  },
]

describe('RecommendationsList', () => {
  it('shows empty state when there are no recommendations', () => {
    render(<RecommendationsList recommendations={[]} />)
    expect(screen.getByText(/no recommendations/i)).toBeInTheDocument()
  })

  it('renders recommendation titles', () => {
    render(<RecommendationsList recommendations={recs} />)
    expect(screen.getByText('Fix N+1 Queries')).toBeInTheDocument()
    expect(screen.getByText('Add Test Coverage')).toBeInTheDocument()
  })

  it('renders reason and suggestion text', () => {
    render(<RecommendationsList recommendations={recs} />)
    expect(screen.getByText(/multiple db calls/i)).toBeInTheDocument()
    expect(screen.getByText(/use eager loading/i)).toBeInTheDocument()
  })

  it('renders priority badges', () => {
    render(<RecommendationsList recommendations={recs} />)
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
  })

  it('renders one card per recommendation', () => {
    render(<RecommendationsList recommendations={recs} />)
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })
})
