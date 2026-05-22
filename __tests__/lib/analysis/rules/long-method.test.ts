import { describe, it, expect } from 'vitest'
import { run } from '@/lib/analysis/rules/long-method'

const shortFn = ['function short() {', '  return 1', '}'].join('\n')

const longFnContent = (lines = 32) => {
  const body = Array.from({ length: lines }, (_, i) => `  const x${i} = ${i}`)
  return ['function longFn() {', ...body, '}'].join('\n')
}

describe('long-method rule', () => {
  it('returns no findings for a short function', () => {
    expect(run({ path: 'src/app.ts', content: shortFn })).toEqual([])
  })

  it('returns a LOW finding for a function body exceeding 30 lines', () => {
    const findings = run({ path: 'src/app.ts', content: longFnContent(32) })
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('LOW')
    expect(findings[0].category).toBe('LONG_METHOD')
    expect(findings[0].filePath).toBe('src/app.ts')
  })

  it('reports the line number where the function is defined', () => {
    const content = ['// preamble', longFnContent(32)].join('\n')
    const findings = run({ path: 'src/app.ts', content })
    expect(findings[0].line).toBe(2)
  })

  it('detects a long Ruby method using def/end', () => {
    const body = Array.from({ length: 32 }, (_, i) => `  x = ${i}`)
    const content = ['def long_method', ...body, 'end'].join('\n')
    const findings = run({ path: 'app/models/user.rb', content })
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('LOW')
  })

  it('returns no findings for a Ruby method under 30 lines', () => {
    const content = ['def short_method', '  x = 1', 'end'].join('\n')
    expect(run({ path: 'app/models/user.rb', content })).toEqual([])
  })
})
