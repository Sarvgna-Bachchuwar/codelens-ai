import type { FileContent, FindingInput } from '../types'

const ENV_REF = /process\.env\.|ENV\[|ENV\.fetch|ENV\.get/

const PATTERNS: RegExp[] = [
  /\b(?:password|passwd)\s*[=:]\s*['"][^'"]{3,}['"]/i,
  /\bapi[_-]?key\s*[=:]\s*['"][^'"]{3,}['"]/i,
  /\bsecret(?:[_-]key)?\s*[=:]\s*['"][^'"]{3,}['"]/i,
  /\btoken\s*[=:]\s*['"][^'"]{3,}['"]/i,
  /\bprivate[_-]?key\s*[=:]\s*['"][^'"]{3,}['"]/i,
]

export function run(file: FileContent): FindingInput[] {
  const findings: FindingInput[] = []

  file.content.split('\n').forEach((line, idx) => {
    if (ENV_REF.test(line)) return
    for (const pattern of PATTERNS) {
      if (pattern.test(line)) {
        findings.push({
          filePath: file.path,
          severity: 'HIGH',
          category: 'HARDCODED_ENV',
          title: 'Hardcoded secret detected',
          description: `Possible hardcoded credential on line ${idx + 1}: ${line.trim()}`,
          suggestion:
            'Move this value to an environment variable and access it via process.env.',
          line: idx + 1,
        })
        break
      }
    }
  })

  return findings
}
