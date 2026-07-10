import { describe, expect, it } from 'vitest'
import { matchQuery, type Intent } from '~/server/utils/intents'

describe('matchQuery', () => {
  it('matches "today check-ins" to upcoming_checkins with today param', () => {
    const result = matchQuery('today check-ins')
    expect(result).toEqual({
      domain: 'reservations',
      action: 'upcoming_checkins',
      params: { when: 'today' },
    })
  })

  it('matches "what is cleaning today" to cleaning_schedule with today param', () => {
    const result = matchQuery('what is cleaning today')
    expect(result?.domain).toBe('cleaning')
    expect(result?.params.when).toBe('today')
  })

  it('matches "cleaning schedule this week" to cleaning_schedule with week param', () => {
    const result = matchQuery('cleaning schedule this week')
    expect(result).toEqual({
      domain: 'cleaning',
      action: 'cleaning_schedule',
      params: { when: 'week' },
    })
  })

  it('matches "revenue this month" to revenue_summary with month param', () => {
    const result = matchQuery('revenue this month')
    expect(result).toEqual({
      domain: 'finance',
      action: 'revenue_summary',
      params: { when: 'month' },
    })
  })

  it('matches "show me occupancy" to listings.occupancy with month param', () => {
    const result = matchQuery('show me occupancy')
    expect(result?.domain).toBe('listings')
    expect(result?.action).toBe('occupancy')
    expect(result?.params.when).toBe('month')
  })

  it('matches "in-house guests" to reservations.current_guests with no params', () => {
    const result = matchQuery('who is in-house right now')
    expect(result).toEqual({
      domain: 'reservations',
      action: 'current_guests',
      params: {},
    })
  })

  it('matches "repeat guests" to reservations.repeat_guests', () => {
    const result = matchQuery('show repeat guests')
    expect(result?.action).toBe('repeat_guests')
  })

  it('is case-insensitive ("TODAY CHECK-INS" matches)', () => {
    const result = matchQuery('TODAY CHECK-INS')
    expect(result?.action).toBe('upcoming_checkins')
  })

  it('returns null for unrelated queries like "what is the weather"', () => {
    expect(matchQuery('what is the weather')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(matchQuery('')).toBeNull()
  })

  it('prefers specific intent — "check-out today" → upcoming_checkouts, not upcoming_checkins', () => {
    const result = matchQuery('check-out today')
    expect(result?.action).toBe('upcoming_checkouts')
  })

  it('extracts "tomorrow" as date param', () => {
    const result = matchQuery('check-ins tomorrow')
    expect(result?.params.when).toBe('tomorrow')
  })
})

import { resolveIntent, type ToolCall, type AssistantChunk } from '~/server/utils/intents'

describe('resolveIntent', () => {
  it('resolves upcoming_checkins to tool call + text chunks', () => {
    const result = resolveIntent({
      domain: 'reservations',
      action: 'upcoming_checkins',
      params: { when: 'today' },
    })
    expect(result.toolCalls).toEqual([
      expect.objectContaining({
        name: 'get_upcoming_checkins',
        args: { when: 'today' },
      }),
    ])
    expect(result.chunks.length).toBeGreaterThan(0)
    expect(result.chunks.join('')).toContain('Anna Schmidt')
  })

  it('resolves cleaning_schedule(today) to cleaning data', () => {
    const result = resolveIntent({
      domain: 'cleaning',
      action: 'cleaning_schedule',
      params: { when: 'today' },
    })
    expect(result.toolCalls[0].name).toBe('get_cleaning_schedule')
    expect(result.chunks.join('')).toContain('Villa Bamboo')
  })

  it('resolves revenue_summary(month) to revenue figures', () => {
    const result = resolveIntent({
      domain: 'finance',
      action: 'revenue_summary',
      params: { when: 'month' },
    })
    expect(result.toolCalls[0].name).toBe('get_revenue_summary')
    expect(result.chunks.join('')).toContain('CHF')
  })

  it('chunks split on sentence boundaries (each chunk ≤ 60 chars)', () => {
    const result = resolveIntent({
      domain: 'finance',
      action: 'revenue_summary',
      params: { when: 'month' },
    })
    for (const chunk of result.chunks) {
      expect(chunk.length).toBeLessThanOrEqual(60)
    }
  })

  it('returns friendly fallback for unknown intent', () => {
    const result = resolveIntent({
      domain: 'reservations',
      action: 'unknown_action',
      params: {},
    })
    expect(result.chunks.join('')).toContain('help')
  })
})
