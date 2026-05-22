import { describe, it, expect } from 'vitest'
import { run } from '@/lib/analysis/rules/hardcoded-env'

const file = (content: string, path = 'src/config.ts') => ({ path, content })

describe('hardcoded-env rule', () => {
  it('returns no findings for clean code using process.env', () => {
    expect(run(file('const key = process.env.API_KEY'))).toEqual([])
  })

  it('returns a HIGH finding for a hardcoded password', () => {
    const findings = run(file('const password = "mysecretpass"'))
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('HIGH')
    expect(findings[0].category).toBe('HARDCODED_ENV')
  })

  it('returns a HIGH finding for a hardcoded API key', () => {
    expect(run(file('const apiKey = "sk-abc123xyz"'))).toHaveLength(1)
  })

  it('returns a HIGH finding for a hardcoded secret', () => {
    expect(run(file('config.secret = "super_secret_value"'))).toHaveLength(1)
  })

  it('returns a HIGH finding for a hardcoded token', () => {
    expect(run(file('const token = "ghp_abcdefghijkl"'))).toHaveLength(1)
  })

  it('includes the correct line number in the finding', () => {
    const content = 'const x = 1\nconst password = "secret"\nconst y = 2'
    const findings = run(file(content))
    expect(findings[0].line).toBe(2)
  })

  it('skips lines that assign via process.env', () => {
    expect(run(file('const password = process.env.DB_PASSWORD'))).toEqual([])
  })

  it('skips Ruby ENV[] references', () => {
    expect(run(file('password = ENV["DB_PASSWORD"]', 'config.rb'))).toEqual([])
  })

  it('returns multiple findings for multiple violations', () => {
    const content = 'const apiKey = "key123"\nconst token = "tok456"'
    expect(run(file(content))).toHaveLength(2)
  })
})
