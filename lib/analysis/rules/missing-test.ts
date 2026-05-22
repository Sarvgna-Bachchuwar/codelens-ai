import path from 'path'
import type { FileContent, FindingInput } from '../types'

const SOURCE_EXTS = new Set(['.rb', '.js', '.ts', '.jsx', '.tsx'])

const isTestFile = (p: string) =>
  /\.(test|spec)\.[jt]sx?$/.test(p) ||
  p.includes('spec/') ||
  p.includes('__tests__/') ||
  p.endsWith('_spec.rb')

export function run(file: FileContent, allPaths: string[]): FindingInput[] {
  if (isTestFile(file.path)) return []
  if (!SOURCE_EXTS.has(path.extname(file.path))) return []

  const base = path.basename(file.path, path.extname(file.path))

  const hasTest = allPaths.some((p) => {
    const b = path.basename(p)
    return (
      b === `${base}.test.ts` ||
      b === `${base}.test.tsx` ||
      b === `${base}.test.js` ||
      b === `${base}.test.jsx` ||
      b === `${base}.spec.ts` ||
      b === `${base}.spec.tsx` ||
      b === `${base}.spec.js` ||
      b === `${base}_spec.rb`
    )
  })

  if (hasTest) return []

  return [
    {
      filePath: file.path,
      severity: 'MEDIUM',
      category: 'MISSING_TEST',
      title: 'Missing test file',
      description: `No test or spec file found for ${file.path}`,
      suggestion: 'Add a test file to ensure this code is covered.',
    },
  ]
}
