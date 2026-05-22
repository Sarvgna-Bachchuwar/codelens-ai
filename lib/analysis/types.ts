export type FileContent = {
  path: string
  content: string
}

export type FindingInput = {
  filePath: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  category: string
  title: string
  description: string
  suggestion: string
  line?: number
}

export type ArchNodeInput = {
  label: string
  type: 'CONTROLLER' | 'SERVICE' | 'MODEL' | 'DATABASE' | 'ROUTE' | 'COMPONENT'
  filePath?: string
}

export type ArchEdgeInput = {
  sourceLabel: string
  targetLabel: string
  label?: string
}

export type ArchOutput = {
  nodes: ArchNodeInput[]
  edges: ArchEdgeInput[]
}

export type RecommendationInput = {
  title: string
  reason: string
  suggestion: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}
