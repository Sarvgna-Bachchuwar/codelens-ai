import { describe, it, expect } from 'vitest'
import { run } from '@/lib/analysis/rules/todo-comment'

const file = (content: string) => ({ path: 'src/app.ts', content })

describe('todo-comment rule', () => {
  it('returns no findings for code with no TODOs or FIXMEs', () => {
    expect(run(file('const x = 1'))).toEqual([])
  })

  it('returns a LOW finding for a TODO comment', () => {
    const findings = run(file('// TODO: fix this later'))
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('LOW')
    expect(findings[0].category).toBe('TODO_COMMENT')
  })

  it('returns a LOW finding for a FIXME comment', () => {
    const findings = run(file('// FIXME: broken logic here'))
    expect(findings).toHaveLength(1)
    expect(findings[0].category).toBe('TODO_COMMENT')
  })

  it('returns one finding per occurrence', () => {
    const content = '// TODO: one\nconst x = 1\n// FIXME: two\n// TODO: three'
    expect(run(file(content))).toHaveLength(3)
  })

  it('includes the correct line number', () => {
    const content = 'const x = 1\n// TODO: fix me\nconst y = 2'
    expect(run(file(content))[0].line).toBe(2)
  })

  it('includes the todo text in the description', () => {
    const findings = run(file('// TODO: refactor this mess'))
    expect(findings[0].description).toMatch(/refactor this mess/)
  })

  it('is case-insensitive for todo/fixme', () => {
    expect(run(file('// todo: lowercase'))).toHaveLength(1)
    expect(run(file('// fixme: lowercase'))).toHaveLength(1)
  })
})
