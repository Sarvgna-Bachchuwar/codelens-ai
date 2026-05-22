import { describe, it, expect } from 'vitest'
import { run } from '@/lib/analysis/rules/n-plus-one'

describe('n-plus-one rule', () => {
  it('returns no findings for clean code', () => {
    const f = { path: 'app/controllers/users.rb', content: 'users = User.all' }
    expect(run(f)).toEqual([])
  })

  it('returns a HIGH finding for Ruby .each block with a DB query inside', () => {
    const content = [
      'users.each do |user|',
      '  Post.where(user_id: user.id).count',
      'end',
    ].join('\n')
    const findings = run({ path: 'app/controllers/users.rb', content })
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('HIGH')
    expect(findings[0].category).toBe('N_PLUS_ONE')
  })

  it('returns a HIGH finding for JS forEach with an async prisma query inside', () => {
    const content = [
      'items.forEach(async (item) => {',
      '  await prisma.post.findFirst({ where: { id: item.id } })',
      '})',
    ].join('\n')
    const findings = run({ path: 'src/service.ts', content })
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('HIGH')
    expect(findings[0].category).toBe('N_PLUS_ONE')
  })

  it('returns a HIGH finding for JS .map with an async DB call inside', () => {
    const content = [
      'const results = items.map(async (item) => {',
      '  return await db.query("SELECT * FROM posts WHERE id = ?", [item.id])',
      '})',
    ].join('\n')
    const findings = run({ path: 'src/service.ts', content })
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('HIGH')
  })

  it('returns no findings for a forEach with no DB query inside', () => {
    const content = 'items.forEach(item => { console.log(item.name) })'
    expect(run({ path: 'src/app.ts', content })).toEqual([])
  })
})
