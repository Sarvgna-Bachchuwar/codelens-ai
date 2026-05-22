import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCards } from '@/components/dashboard/metric-cards'

const base = {
  totalFiles: 42,
  totalFindings: 15,
  highRiskCount: 3,
  coverageScore: 72,
  healthScore: 85,
  completedAt: new Date('2024-06-01T10:00:00Z'),
}

describe('MetricCards', () => {
  it('renders total files count', () => {
    render(<MetricCards {...base} />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText(/total files/i)).toBeInTheDocument()
  })

  it('renders total findings count', () => {
    render(<MetricCards {...base} />)
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText(/total findings/i)).toBeInTheDocument()
  })

  it('renders high risk count', () => {
    render(<MetricCards {...base} />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText(/high risk/i)).toBeInTheDocument()
  })

  it('renders coverage score as percentage', () => {
    render(<MetricCards {...base} />)
    expect(screen.getByText('72%')).toBeInTheDocument()
    expect(screen.getByText(/coverage/i)).toBeInTheDocument()
  })

  it('renders health score', () => {
    render(<MetricCards {...base} />)
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText(/health score/i)).toBeInTheDocument()
  })

  it('renders last analysis date', () => {
    render(<MetricCards {...base} />)
    expect(screen.getByText(/last analysis/i)).toBeInTheDocument()
  })

  it('renders dashes when completedAt is null', () => {
    render(<MetricCards {...base} completedAt={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
