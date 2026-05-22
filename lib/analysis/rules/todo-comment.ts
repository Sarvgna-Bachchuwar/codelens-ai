import type { FileContent, FindingInput } from '../types'

const TODO_RE = /\b(TODO|FIXME)\b[:\s]*(.*)/i

export function run(file: FileContent): FindingInput[] {
  const findings: FindingInput[] = []

  file.content.split('\n').forEach((line, idx) => {
    const match = TODO_RE.exec(line)
    if (!match) return
    findings.push({
      filePath: file.path,
      severity: 'LOW',
      category: 'TODO_COMMENT',
      title: `${match[1].toUpperCase()} comment found`,
      description: match[2]?.trim()
        ? `${match[1].toUpperCase()}: ${match[2].trim()}`
        : `${match[1].toUpperCase()} comment on line ${idx + 1}`,
      suggestion: 'Resolve this TODO/FIXME or create a tracked issue for it.',
      line: idx + 1,
    })
  })

  return findings
}
