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

export async function generateRecommendations(
  findings: FindingInput[],
): Promise<RecommendationInput[]> {
  const highFindings = findings.filter((f) => f.severity === 'HIGH')
  if (highFindings.length === 0) return []

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
  if (content.type !== 'text') return []

  // Strip markdown code fences if present
  const raw = content.text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidRecommendation)
  } catch {
    return []
  }
}
