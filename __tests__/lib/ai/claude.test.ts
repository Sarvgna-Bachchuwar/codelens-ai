import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.hoisted(() => vi.fn())

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(function () {
    return { messages: { create: mockCreate } }
  }),
}))

import { generateFindingSummary, generateRecommendations } from '@/lib/ai/claude'
import type { FindingInput } from '@/lib/analysis/types'

const highFinding: FindingInput = {
  filePath: 'app/controllers/users_controller.rb',
  severity: 'HIGH',
  category: 'N_PLUS_ONE',
  title: 'N+1 Query Detected',
  description: 'Loop contains a DB query that runs N times.',
  suggestion: 'Use eager loading.',
  line: 42,
}

describe('generateFindingSummary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns text from Claude API response', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'This is a 2-sentence AI summary.' }],
    })
    const result = await generateFindingSummary(highFinding)
    expect(result).toBe('This is a 2-sentence AI summary.')
  })

  it('calls the API with finding details in the prompt', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Summary.' }],
    })
    await generateFindingSummary(highFinding)
    expect(mockCreate).toHaveBeenCalledOnce()
    const call = mockCreate.mock.calls[0][0]
    expect(call.messages[0].content).toContain('N_PLUS_ONE')
    expect(call.messages[0].content).toContain('users_controller.rb')
  })

  it('falls back to description if API returns non-text content', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'tool_use', id: 'x', name: 'foo', input: {} }],
    })
    const result = await generateFindingSummary(highFinding)
    expect(result).toBe(highFinding.description)
  })
})

describe('generateRecommendations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty array when there are no HIGH findings', async () => {
    const result = await generateRecommendations([
      { ...highFinding, severity: 'MEDIUM' },
    ])
    expect(result).toEqual([])
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns parsed recommendations from Claude JSON response', async () => {
    const recs = [
      {
        title: 'Fix N+1 Queries',
        reason: 'Multiple DB calls per request slow down the app.',
        suggestion: 'Add eager loading using includes().',
        priority: 'HIGH',
      },
    ]
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(recs) }],
    })
    const result = await generateRecommendations([highFinding])
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Fix N+1 Queries')
    expect(result[0].priority).toBe('HIGH')
  })

  it('returns empty array if Claude returns invalid JSON', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Sorry, I cannot help with that.' }],
    })
    const result = await generateRecommendations([highFinding])
    expect(result).toEqual([])
  })

  it('filters out malformed recommendation objects', async () => {
    const mixed = [
      { title: 'Good Rec', reason: 'Valid reason.', suggestion: 'Do this.', priority: 'MEDIUM' },
      { title: 'Bad Rec' }, // missing fields
    ]
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(mixed) }],
    })
    const result = await generateRecommendations([highFinding])
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Good Rec')
  })

  it('strips markdown code fences before parsing JSON', async () => {
    const recs = [
      { title: 'Rec', reason: 'Reason.', suggestion: 'Do it.', priority: 'LOW' },
    ]
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: `\`\`\`json\n${JSON.stringify(recs)}\n\`\`\`` }],
    })
    const result = await generateRecommendations([highFinding])
    expect(result).toHaveLength(1)
  })
})
