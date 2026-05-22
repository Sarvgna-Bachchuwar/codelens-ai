import type { FileContent, FindingInput } from '../types'

const JS_FN_DEF = /^\s*(?:export\s+)?(?:async\s+)?function\s+\w+|^\s*(?:async\s+)?\w+\s*[:=]\s*(?:async\s+)?(?:function|\()/
const RUBY_METHOD_DEF = /^\s*def\s+\w+/
const RUBY_END = /^\s*end\s*$/

export function run(file: FileContent): FindingInput[] {
  const lines = file.content.split('\n')
  const isRuby = file.path.endsWith('.rb')
  const findings: FindingInput[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (isRuby) {
      if (!RUBY_METHOD_DEF.test(line)) continue
      let depth = 0
      let endLine = i
      for (let j = i + 1; j < lines.length; j++) {
        if (/\bdo\b|\bdef\b|\bif\b|\bwhile\b|\bcase\b|\bbegin\b/.test(lines[j])) depth++
        if (RUBY_END.test(lines[j])) {
          if (depth === 0) { endLine = j; break }
          depth--
        }
      }
      if (endLine - i > 30) {
        findings.push(finding(file.path, i + 1, endLine - i))
      }
    } else {
      if (!JS_FN_DEF.test(line)) continue
      let braces = 0
      let endLine = i
      let started = false
      for (let j = i; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') { braces++; started = true }
          if (ch === '}') braces--
        }
        if (started && braces === 0) { endLine = j; break }
      }
      if (endLine - i > 30) {
        findings.push(finding(file.path, i + 1, endLine - i))
      }
    }
  }

  return findings
}

function finding(filePath: string, line: number, length: number): import('../types').FindingInput {
  return {
    filePath,
    severity: 'LOW',
    category: 'LONG_METHOD',
    title: 'Long method',
    description: `Method at line ${line} is ${length} lines long (limit: 30)`,
    suggestion: 'Break this method into smaller, focused functions.',
    line,
  }
}
