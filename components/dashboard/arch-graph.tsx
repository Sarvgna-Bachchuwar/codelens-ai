'use client'

import { ReactFlow, Background, Controls, ReactFlowProvider, useReactFlow } from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

type NodeType = 'CONTROLLER' | 'SERVICE' | 'MODEL' | 'DATABASE' | 'ROUTE' | 'COMPONENT'

type ArchNodeData = {
  id: string
  label: string
  type: NodeType
  filePath: string | null
  analysisRunId: string
}

type ArchEdgeData = {
  id: string
  sourceId: string
  targetId: string
  label: string | null
  analysisRunId: string
}

type Props = {
  nodes: ArchNodeData[]
  edges: ArchEdgeData[]
}

const NODE_COLORS: Record<NodeType, string> = {
  CONTROLLER: '#3b82f6',
  SERVICE: '#14b8a6',
  MODEL: '#f59e0b',
  DATABASE: '#6b7280',
  ROUTE: '#a855f7',
  COMPONENT: '#22c55e',
}

const TYPE_X: Record<NodeType, number> = {
  ROUTE: 0,
  CONTROLLER: 240,
  SERVICE: 480,
  MODEL: 720,
  DATABASE: 960,
  COMPONENT: 1200,
}

const TYPE_LABEL: Record<NodeType, string> = {
  CONTROLLER: 'Controller',
  SERVICE: 'Service',
  MODEL: 'Model',
  DATABASE: 'Database',
  ROUTE: 'Route',
  COMPONENT: 'Component',
}

function toFlowNodes(dbNodes: ArchNodeData[]): Node[] {
  const counters: Partial<Record<NodeType, number>> = {}
  return dbNodes.map((n) => {
    const col = counters[n.type] ?? 0
    counters[n.type] = col + 1
    return {
      id: n.id,
      position: { x: TYPE_X[n.type], y: col * 90 },
      data: {
        label: (
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{n.label}</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{TYPE_LABEL[n.type]}</div>
          </div>
        ),
      },
      style: {
        background: NODE_COLORS[n.type],
        color: '#fff',
        borderRadius: 8,
        padding: '8px 12px',
        border: 'none',
        width: 180,
      },
    }
  })
}

function toFlowEdges(dbEdges: ArchEdgeData[]): Edge[] {
  return dbEdges.map((e) => ({
    id: e.id,
    source: e.sourceId,
    target: e.targetId,
    label: e.label ?? undefined,
  }))
}

const LEGEND_ITEMS: { type: NodeType; label: string }[] = [
  { type: 'ROUTE', label: 'Route' },
  { type: 'CONTROLLER', label: 'Controller' },
  { type: 'SERVICE', label: 'Service' },
  { type: 'MODEL', label: 'Model' },
  { type: 'DATABASE', label: 'Database' },
  { type: 'COMPONENT', label: 'Component' },
]

function Legend() {
  return (
    <div className="absolute right-2 top-2 z-10 rounded-lg border bg-white/90 backdrop-blur-sm p-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Legend</p>
      <ul className="space-y-1.5">
        {LEGEND_ITEMS.map(({ type, label }) => (
          <li key={type} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: NODE_COLORS[type] }}
            />
            <span className="text-xs text-gray-700">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FitViewButton() {
  const { fitView } = useReactFlow()
  return (
    <div className="absolute left-2 top-2 z-10">
      <button
        onClick={() => fitView({ padding: 0.2 })}
        className="rounded-lg border bg-white px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-gray-50"
      >
        Fit to View
      </button>
    </div>
  )
}

export function ArchGraph({ nodes: dbNodes, edges: dbEdges }: Props) {
  if (dbNodes.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        No architecture data yet — run an analysis first.
      </div>
    )
  }

  const flowNodes = toFlowNodes(dbNodes)
  const flowEdges = toFlowEdges(dbEdges)

  return (
    <ReactFlowProvider>
      <div className="relative h-150 rounded-xl border bg-card overflow-hidden">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <FitViewButton />
          <Legend />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  )
}
