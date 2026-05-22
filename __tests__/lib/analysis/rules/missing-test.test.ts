import { describe, it, expect } from 'vitest'
import { run } from '@/lib/analysis/rules/missing-test'

describe('missing-test rule', () => {
  it('returns no findings when a Ruby spec file exists', () => {
    const f = { path: 'app/models/user.rb', content: '' }
    expect(run(f, ['app/models/user.rb', 'spec/models/user_spec.rb'])).toEqual([])
  })

  it('returns a MEDIUM finding when no Ruby spec exists', () => {
    const f = { path: 'app/models/user.rb', content: '' }
    const findings = run(f, ['app/models/user.rb'])
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('MEDIUM')
    expect(findings[0].category).toBe('MISSING_TEST')
  })

  it('returns no findings when a .test.ts file exists', () => {
    const f = { path: 'src/utils.ts', content: '' }
    expect(run(f, ['src/utils.ts', 'src/utils.test.ts'])).toEqual([])
  })

  it('returns no findings when a .spec.ts file exists', () => {
    const f = { path: 'src/utils.ts', content: '' }
    expect(run(f, ['src/utils.ts', '__tests__/utils.spec.ts'])).toEqual([])
  })

  it('returns a MEDIUM finding when no TypeScript test exists', () => {
    const f = { path: 'src/utils.ts', content: '' }
    const findings = run(f, ['src/utils.ts'])
    expect(findings).toHaveLength(1)
    expect(findings[0].category).toBe('MISSING_TEST')
  })

  it('skips files that are already test files (.test.ts)', () => {
    const f = { path: 'src/utils.test.ts', content: '' }
    expect(run(f, ['src/utils.test.ts'])).toEqual([])
  })

  it('skips files that are already spec files (_spec.rb)', () => {
    const f = { path: 'spec/models/user_spec.rb', content: '' }
    expect(run(f, ['spec/models/user_spec.rb'])).toEqual([])
  })

  it('skips non-source file extensions like .json', () => {
    const f = { path: 'config/database.json', content: '' }
    expect(run(f, ['config/database.json'])).toEqual([])
  })
})
