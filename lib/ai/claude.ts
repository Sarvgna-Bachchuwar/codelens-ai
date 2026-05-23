import Anthropic from '@anthropic-ai/sdk'
import type { FindingInput, RecommendationInput } from '@/lib/analysis/types'

const MODEL = 'claude-haiku-4-5-20251001'

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }
  return new Anthropic({ apiKey })
}

export async function generateFindingSummary(finding: FindingInput): Promise<string> {
  const client = getClient()
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `You are a code review assistant. Summarize this code finding in 2-3 plain English sentences for a developer. Be concise and actionable.

Finding:
- File: ${finding.filePath}
- Category: ${finding.category}
- Severity: ${finding.severity}
- Title: ${finding.title}
- Description: ${finding.description}
- Suggestion: ${finding.suggestion}${finding.line != null ? `\n- Line: ${finding.line}` : ''}

Respond with only the summary, no headers or labels.`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') return finding.description
  return content.text
}

function isValidRecommendation(r: unknown): r is RecommendationInput {
  if (typeof r !== 'object' || r === null) return false
  const obj = r as Record<string, unknown>
  return (
    typeof obj.title === 'string' &&
    typeof obj.reason === 'string' &&
    typeof obj.suggestion === 'string' &&
    (obj.priority === 'HIGH' || obj.priority === 'MEDIUM' || obj.priority === 'LOW')
  )
}

const FALLBACK_RECOMMENDATIONS: Record<string, RecommendationInput> = {
  HARDCODED_ENV: {
    title: 'Remove hardcoded secrets from source code',
    reason:
      'Hardcoded credentials in source code are a critical security risk — they can be exposed via git history, logs, or error messages.',
    suggestion:
      'Move all secrets to environment variables (process.env) and use a secrets manager like Vercel env vars, AWS Secrets Manager, or Doppler in production.',
    priority: 'HIGH',
  },
  N_PLUS_ONE: {
    title: 'Fix N+1 query patterns',
    reason:
      'N+1 queries execute one DB query per record in a loop, causing severe performance degradation as data grows.',
    suggestion:
      'Use eager loading (includes/joins) to fetch related records in a single query, or batch queries with a dataloader pattern.',
    priority: 'HIGH',
  },
  LARGE_FILE: {
    title: 'Break up large files into focused modules',
    reason:
      'Files over 300 lines are harder to review, test, and maintain, and often indicate a violation of single-responsibility.',
    suggestion:
      'Extract cohesive groups of functions into separate modules. Aim for files under 200 lines with a single clear purpose.',
    priority: 'MEDIUM',
  },
  MISSING_TEST: {
    title: 'Add test coverage for untested files',
    reason:
      'Files without tests are high-risk change surfaces — bugs introduced there will not be caught before production.',
    suggestion:
      'Add unit tests for all business logic files. Target 80% line coverage. Start with the highest-risk, most-changed files.',
    priority: 'HIGH',
  },
}

function generateFallbackRecommendations(highFindings: FindingInput[]): RecommendationInput[] {
  const seen = new Set<string>()
  const recs: RecommendationInput[] = []
  for (const f of highFindings) {
    const rec = FALLBACK_RECOMMENDATIONS[f.category]
    if (rec && !seen.has(f.category)) {
      seen.add(f.category)
      recs.push(rec)
    }
  }
  // Generic fallback if no category matched
  if (recs.length === 0) {
    recs.push({
      title: 'Address all HIGH severity findings',
      reason: 'HIGH severity issues pose immediate security or reliability risks.',
      suggestion: 'Review each HIGH finding and resolve it before shipping to production.',
      priority: 'HIGH',
    })
  }
  return recs
}

export async function generateRecommendations(
  findings: FindingInput[],
): Promise<RecommendationInput[]> {
  const highFindings = findings.filter((f) => f.severity === 'HIGH')
  if (highFindings.length === 0) return []

  try {
    const client = getClient()
    const findingsSummary = highFindings
      .map((f) => `- ${f.category}: ${f.title} in ${f.filePath}`)
      .join('\n')

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a code review assistant. Based on these HIGH severity findings, generate 3-5 actionable modernization recommendations.

Findings:
${findingsSummary}

Respond with a JSON array only — no other text, no markdown fences:
[{"title":"...","reason":"...","suggestion":"...","priority":"HIGH"|"MEDIUM"|"LOW"}]`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') return generateFallbackRecommendations(highFindings)

    // Strip markdown code fences if present
    const raw = content.text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return generateFallbackRecommendations(highFindings)
    const valid = parsed.filter(isValidRecommendation)
    return valid.length > 0 ? valid : generateFallbackRecommendations(highFindings)
  } catch {
    return generateFallbackRecommendations(highFindings)
  }
}
