import type { FileContent, FindingInput } from '../types'

export function run(file: FileContent): FindingInput[] {
  const lines = file.content.trimEnd().split('\n').length
  if (lines <= 300) return []
  return [
    {
      filePath: file.path,
      severity: 'MEDIUM',
      category: 'LARGE_FILE',
      title: 'Large file',
      description: `File has ${lines} lines (limit: 300)`,
      suggestion: 'Consider splitting this file into smaller, more focused modules.',
    },
  ]
}
