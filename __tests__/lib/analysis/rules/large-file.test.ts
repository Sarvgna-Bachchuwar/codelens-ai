import { describe, it, expect } from 'vitest'
import { run } from '@/lib/analysis/rules/large-file'

const file = (content: string) => ({ path: 'src/app.ts', content })

describe('large-file rule', () => {
  it('returns no findings for a file with 300 lines or fewer', () => {
    expect(run(file('line\n'.repeat(300)))).toEqual([])
  })

  it('returns a MEDIUM finding for a file with more than 300 lines', () => {
    const findings = run(file('line\n'.repeat(301)))
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('MEDIUM')
    expect(findings[0].category).toBe('LARGE_FILE')
    expect(findings[0].filePath).toBe('src/app.ts')
  })

  it('includes the actual line count in the description', () => {
    const findings = run(file('line\n'.repeat(350)))
    expect(findings[0].description).toMatch(/350/)
  })
})
