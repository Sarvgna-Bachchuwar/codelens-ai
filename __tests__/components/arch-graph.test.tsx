import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ArchGraph } from '@/components/dashboard/arch-graph'

vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ nodes, children }: {
    nodes: Array<{ id: string; data: { label: string } }>,
    children?: React.ReactNode,
  }) => (
    <div data-testid="react-flow">
      {nodes.map((n) => (
        <div key={n.id} data-testid="flow-node">{n.data.label}</div>
      ))}
      {children}
    </div>
  ),
  Background: () => null,
  Controls: () => null,
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReactFlow: () => ({ fitView: vi.fn() }),
}))

const nodes = [
  { id: 'n1', label: 'UsersController', type: 'CONTROLLER' as const, filePath: 'app/controllers/users_controller.rb', analysisRunId: 'run-1' },
  { id: 'n2', label: 'UserService', type: 'SERVICE' as const, filePath: 'app/services/user_service.rb', analysisRunId: 'run-1' },
]

const edges = [
  { id: 'e1', sourceId: 'n1', targetId: 'n2', label: 'calls', analysisRunId: 'run-1' },
]

describe('ArchGraph', () => {
  it('shows empty state when no nodes', () => {
    render(<ArchGraph nodes={[]} edges={[]} />)
    expect(screen.getByText(/no architecture data/i)).toBeInTheDocument()
  })

  it('renders node labels in the flow', () => {
    render(<ArchGraph nodes={nodes} edges={edges} />)
    expect(screen.getByText('UsersController')).toBeInTheDocument()
    expect(screen.getByText('UserService')).toBeInTheDocument()
  })

  it('renders the correct number of nodes', () => {
    render(<ArchGraph nodes={nodes} edges={edges} />)
    expect(screen.getAllByTestId('flow-node')).toHaveLength(2)
  })

  it('renders the ReactFlow container', () => {
    render(<ArchGraph nodes={nodes} edges={edges} />)
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
  })

  it('renders the fit-to-view button', () => {
    render(<ArchGraph nodes={nodes} edges={edges} />)
    expect(screen.getByRole('button', { name: /fit/i })).toBeInTheDocument()
  })

  it('fit-to-view button is clickable without throwing', () => {
    render(<ArchGraph nodes={nodes} edges={edges} />)
    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: /fit/i })),
    ).not.toThrow()
  })
})
