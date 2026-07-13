import { describe, expect, it } from 'vitest'
import {
  emptyVisibilityConditions,
  getConditionDefault,
  getConditionEmpty,
  summarizeCondition,
  type VisibilityConditionKey,
} from '~/components/upsells/data/upsell-services'

describe('emptyVisibilityConditions', () => {
  it('returns all fields as null', () => {
    const v = emptyVisibilityConditions()
    expect(v).toEqual({
      hoursBeforeCheckIn: null,
      hoursBeforeCheckOut: null,
      bookingStatuses: null,
      guestCountMin: null,
      guestCountMax: null,
      lengthOfStayMin: null,
      lengthOfStayMax: null,
      excludeIfUpsellPurchased: null,
      channels: null,
    })
  })

  it('returns a fresh object on each call (no shared reference)', () => {
    const a = emptyVisibilityConditions()
    const b = emptyVisibilityConditions()
    expect(a).not.toBe(b)
    expect(a.channels).not.toBe(b.channels)
  })
})

describe('getConditionDefault', () => {
  it('returns 24 hours for time conditions', () => {
    expect(getConditionDefault('hoursBeforeCheckIn')).toBe(24)
    expect(getConditionDefault('hoursBeforeCheckOut')).toBe(24)
  })

  it('returns common statuses for bookingStatuses', () => {
    expect(getConditionDefault('bookingStatuses')).toEqual(['confirmed', 'checked_in'])
  })

  it('returns 1 for min count fields', () => {
    expect(getConditionDefault('guestCountMin')).toBe(1)
    expect(getConditionDefault('lengthOfStayMin')).toBe(1)
  })

  it('returns 10 for max count fields', () => {
    expect(getConditionDefault('guestCountMax')).toBe(10)
    expect(getConditionDefault('lengthOfStayMax')).toBe(10)
  })

  it('returns empty array for excludeIfUpsellPurchased', () => {
    expect(getConditionDefault('excludeIfUpsellPurchased')).toEqual([])
  })

  it('returns Airbnb as default channel', () => {
    expect(getConditionDefault('channels')).toEqual(['airbnb'])
  })
})

describe('getConditionEmpty', () => {
  it('returns null for every condition key', () => {
    const keys: VisibilityConditionKey[] = [
      'hoursBeforeCheckIn',
      'hoursBeforeCheckOut',
      'bookingStatuses',
      'guestCountMin',
      'guestCountMax',
      'lengthOfStayMin',
      'lengthOfStayMax',
      'excludeIfUpsellPurchased',
      'channels',
    ]
    for (const key of keys) {
      expect(getConditionEmpty(key)).toBeNull()
    }
  })
})

describe('summarizeCondition', () => {
  it('returns empty string for null value', () => {
    expect(summarizeCondition('hoursBeforeCheckIn', null)).toBe('')
    expect(summarizeCondition('channels', null)).toBe('')
  })

  it('formats time conditions with hours', () => {
    expect(summarizeCondition('hoursBeforeCheckIn', 24)).toBe('Time before Check-in (within 24h)')
    expect(summarizeCondition('hoursBeforeCheckOut', 48)).toBe('Time before Check-out (within 48h)')
  })

  it('formats booking statuses with human labels', () => {
    expect(summarizeCondition('bookingStatuses', ['confirmed', 'checked_in']))
      .toBe('Booking Status (Confirmed, Checked-in)')
  })

  it('formats guest count min/max', () => {
    expect(summarizeCondition('guestCountMin', 2)).toBe('Guest Count min (2)')
    expect(summarizeCondition('guestCountMax', 8)).toBe('Guest Count max (8)')
  })

  it('formats length of stay in nights', () => {
    expect(summarizeCondition('lengthOfStayMin', 3)).toBe('Length of Stay min (3 nights)')
    expect(summarizeCondition('lengthOfStayMax', 14)).toBe('Length of Stay max (14 nights)')
  })

  it('formats related upsell count', () => {
    expect(summarizeCondition('excludeIfUpsellPurchased', ['svc-001', 'svc-002']))
      .toBe('Related Upsell (2 selected)')
  })

  it('formats channels with human labels', () => {
    expect(summarizeCondition('channels', ['airbnb', 'booking_com']))
      .toBe('Channels (Airbnb, Booking.com)')
  })
})