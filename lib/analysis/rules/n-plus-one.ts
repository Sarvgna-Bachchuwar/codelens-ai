import type { FileContent, FindingInput } from '../types'

const RUBY_ITERATION = /\.(each|map|select|collect|flat_map)\s+do\s+\|/
const RUBY_DB_QUERY = /\.(find|where|first|last|count|pluck|create|update|destroy)\b/

const JS_ITERATION = /\.(forEach|map)\s*\(\s*async\s+/
const JS_DB_QUERY = /await\s+(?:prisma|db|knex|sequelize|mongoose)\.\w+\.\w+|await\s+\w+\.query\s*\(/

const WINDOW = 5

export function run(file: FileContent): FindingInput[] {
  const lines = file.content.split('\n')
  const findings: FindingInput[] = []
  const seen = new Set<number>()

  for (let i = 0; i < lines.length; i++) {
    if (seen.has(i)) continue
    const line = lines[i]
    const isRuby = file.path.endsWith('.rb')

    if (isRuby && RUBY_ITERATION.test(line)) {
      const end = Math.min(i + WINDOW, lines.length)
      for (let j = i + 1; j < end; j++) {
        if (RUBY_DB_QUERY.test(lines[j])) {
          seen.add(i)
          findings.push(finding(file.path, i + 1))
          break
        }
      }
    } else if (!isRuby && JS_ITERATION.test(line)) {
      const end = Math.min(i + WINDOW, lines.length)
      for (let j = i + 1; j < end; j++) {
        if (JS_DB_QUERY.test(lines[j])) {
          seen.add(i)
          findings.push(finding(file.path, i + 1))
          break
        }
      }
    }
  }

  return findings
}

function finding(filePath: string, line: number): import('../types').FindingInput {
  return {
    filePath,
    severity: 'HIGH',
    category: 'N_PLUS_ONE',
    title: 'Potential N+1 query',
    description: `Database query inside an iteration loop detected at line ${line}`,
    suggestion:
      'Use eager loading (includes/preload in Rails) or batch fetching to avoid N+1 queries.',
    line,
  }
}
