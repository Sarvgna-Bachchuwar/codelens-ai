import path from 'path'
import type { FileContent, ArchOutput, ArchNodeInput, ArchEdgeInput } from './types'

type NodeType = ArchNodeInput['type']

const MAX_NODES = 40
const MAX_EDGES = 60

const IMPORT_RE = /(?:import(?:[^'"]*?)from\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\))/g

function extractRelativeImports(content: string): string[] {
  const out: string[] = []
  for (const match of content.matchAll(IMPORT_RE)) {
    const p = match[1] ?? match[2]
    if (p && (p.startsWith('./') || p.startsWith('../'))) out.push(p)
  }
  return out
}

const SKIP_BASES = new Set([
  'package.json', 'package-lock.json', 'yarn.lock', 'tsconfig.json',
  'jest.config.js', 'jest.config.ts', 'vitest.config.ts', 'vitest.config.js',
  'next.config.js', 'next.config.ts', 'next.config.mjs',
  'tailwind.config.js', 'tailwind.config.ts', 'postcss.config.js',
  'eslint.config.js', 'eslint.config.mjs', '.eslintrc.js',
  'playwright.config.ts', 'playwright.config.js',
])

function isTestFile(p: string): boolean {
  return (
    p.includes('.test.') || p.includes('.spec.') ||
    p.includes('/__tests__/') || p.includes('/test/') || p.includes('/spec/')
  )
}

function detectNodeType(file: FileContent): NodeType | null {
  const p = file.path.toLowerCase()
  const base = path.basename(p)
  const content = file.content

  if (isTestFile(p)) return null

  if (
    SKIP_BASES.has(base) ||
    base.endsWith('.yml') || base.endsWith('.yaml') ||
    base.endsWith('.json') || base.endsWith('.md') || base.endsWith('.lock')
  ) {
    return null
  }

  // DATABASE
  if (base === 'schema.prisma' || base.endsWith('.sql') || p.includes('/migrations/')) {
    return 'DATABASE'
  }

  // CONTROLLER — directory or name contains "controller"
  if (
    p.includes('/controllers/') || base.endsWith('_controller.rb') ||
    /controller\.[jt]sx?$/.test(base) || base.includes('controller')
  ) {
    return 'CONTROLLER'
  }

  // ROUTE — Next.js API routes or router/routes files
  if (p.includes('/api/') && (base === 'route.ts' || base === 'route.js')) {
    return 'ROUTE'
  }
  if (
    base === 'router.js' || base === 'router.ts' || base === 'router.mjs' ||
    base === 'routes.js' || base === 'routes.ts' || base === 'routes.mjs' ||
    base.startsWith('router.') || base.startsWith('routes.')
  ) {
    return 'ROUTE'
  }

  // SERVICE — directory or name contains "service", "util", "helper", "middleware"
  if (
    p.includes('/services/') || base.endsWith('_service.rb') ||
    /service\.[jt]sx?$/.test(base) || base.includes('service') ||
    p.includes('/utils/') || p.includes('/helpers/') || p.includes('/middleware/') ||
    base.includes('util') || base.includes('helper') || base.includes('middleware') ||
    base === 'app.js' || base === 'app.ts' || base === 'app.mjs' ||
    base === 'index.js' || base === 'index.ts' || base === 'index.mjs' ||
    base === 'main.js' || base === 'main.ts' || base === 'main.mjs' ||
    base === 'server.js' || base === 'server.ts' || base === 'server.mjs'
  ) {
    return 'SERVICE'
  }

  // MODEL — directory or name contains "model" / "schema"
  if (
    p.includes('/models/') ||
    (base.endsWith('.rb') && !p.includes('spec/')) ||
    base.includes('model') ||
    (base.includes('schema') && !base.endsWith('.prisma'))
  ) {
    const nonModelDirs = ['/controllers/', '/services/', '/helpers/', '/mailers/', '/jobs/']
    if (!nonModelDirs.some((d) => p.includes(d))) return 'MODEL'
  }

  // COMPONENT — .tsx/.jsx with JSX return
  if ((base.endsWith('.tsx') || base.endsWith('.jsx')) && /return\s*\(?\s*</.test(content)) {
    return 'COMPONENT'
  }

  // Catch-all for remaining .js/.ts files
  if (
    base.endsWith('.js') || base.endsWith('.ts') ||
    base.endsWith('.mjs') || base.endsWith('.cjs')
  ) {
    return 'SERVICE'
  }

  return null
}

function labelFromPath(filePath: string): string {
  const base = path.basename(filePath, path.extname(filePath))
  return base.replace(/[_-]([a-z])/g, (_, c: string) => c.toUpperCase())
}

export function buildArchMap(files: FileContent[]): ArchOutput {
  const nodes: ArchNodeInput[] = []
  const edges: ArchEdgeInput[] = []

  for (const file of files) {
    if (nodes.length >= MAX_NODES) break
    const type = detectNodeType(file)
    if (!type) continue
    nodes.push({ label: labelFromPath(file.path), type, filePath: file.path })
  }

  // Build a lookup: normalised path (without extension) → label
  const pathToLabel = new Map<string, string>()
  for (const node of nodes) {
    if (!node.filePath) continue
    pathToLabel.set(node.filePath, node.label)
    pathToLabel.set(node.filePath.replace(/\.[jt]sx?$/, ''), node.label)
  }

  const edgeSet = new Set<string>()

  function addEdge(srcLabel: string, targetLabel: string) {
    if (edges.length >= MAX_EDGES) return
    const key = `${srcLabel}→${targetLabel}`
    if (!edgeSet.has(key) && srcLabel !== targetLabel) {
      edgeSet.add(key)
      edges.push({ sourceLabel: srcLabel, targetLabel })
    }
  }

  // Import-based edges for JS/TS files
  for (const src of nodes) {
    if (!src.filePath) continue
    const srcFile = files.find((f) => f.path === src.filePath)
    if (!srcFile) continue

    for (const imp of extractRelativeImports(srcFile.content)) {
      const dir = path.dirname(src.filePath)
      const resolved = path.normalize(path.join(dir, imp)).replace(/\\/g, '/')
      const suffixes = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx']
      for (const suffix of suffixes) {
        const targetLabel = pathToLabel.get(resolved + suffix)
        if (targetLabel) { addEdge(src.label, targetLabel); break }
      }
    }
  }

  // Fallback: Rails controller/service → model references
  if (edges.length === 0) {
    const modelNodes = nodes.filter((n) => n.type === 'MODEL')
    const sourceNodes = nodes.filter((n) => n.type === 'CONTROLLER' || n.type === 'SERVICE')
    for (const src of sourceNodes) {
      const srcFile = files.find((f) => f.path === src.filePath)
      if (!srcFile) continue
      for (const model of modelNodes) {
        const modelName = path.basename(model.filePath ?? '', path.extname(model.filePath ?? ''))
        const pascal = modelName.replace(/(^|_)([a-z])/g, (_, _a, c: string) => c.toUpperCase())
        if (srcFile.content.includes(pascal) || srcFile.content.includes(modelName)) {
          addEdge(src.label, model.label)
        }
      }
    }
  }

  return { nodes, edges }
}
