import { describe, expect, it } from 'vitest'
import {
  emptyVisibilityConditions,
  getConditionDefault,
  getConditionEmpty,
  summarizeCondition,
  summarizeVisibility,
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

  it('returns a fresh outer object on each call', () => {
    const a = emptyVisibilityConditions()
    const b = emptyVisibilityConditions()
    expect(a).not.toBe(b)
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

describe('summarizeVisibility', () => {
  it('returns an empty array for empty conditions', () => {
    expect(summarizeVisibility(emptyVisibilityConditions())).toEqual([])
  })

  it('summarises time conditions individually', () => {
    const v = emptyVisibilityConditions()
    v.hoursBeforeCheckIn = 24
    v.hoursBeforeCheckOut = 48
    const result = summarizeVisibility(v)
    expect(result).toEqual([
      { key: 'hoursBeforeCheckIn', label: 'Time before Check-in (within 24h)' },
      { key: 'hoursBeforeCheckOut', label: 'Time before Check-out (within 48h)' },
    ])
  })

  it('summarises booking statuses with human labels', () => {
    const v = emptyVisibilityConditions()
    v.bookingStatuses = ['confirmed', 'checked_in']
    expect(summarizeVisibility(v)).toEqual([
      { key: 'bookingStatuses', label: 'Booking Status (Confirmed, Checked-in)' },
    ])
  })

  it('combines guest count min and max into a single entry', () => {
    const v = emptyVisibilityConditions()
    v.guestCountMin = 2
    v.guestCountMax = 4
    const result = summarizeVisibility(v)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      key: 'guestCountMin',
      label: 'Guest Count (2–4 guests)',
    })
  })

  it('uses "any" when only one of guest count min or max is set', () => {
    const v = emptyVisibilityConditions()
    v.guestCountMin = 2
    expect(summarizeVisibility(v)).toEqual([
      { key: 'guestCountMin', label: 'Guest Count (2–any guests)' },
    ])
    v.guestCountMin = null
    v.guestCountMax = 8
    expect(summarizeVisibility(v)).toEqual([
      { key: 'guestCountMin', label: 'Guest Count (any–8 guests)' },
    ])
  })

  it('combines length of stay min and max into a single entry', () => {
    const v = emptyVisibilityConditions()
    v.lengthOfStayMin = 3
    v.lengthOfStayMax = 14
    const result = summarizeVisibility(v)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      key: 'lengthOfStayMin',
      label: 'Length of Stay (3–14 nights)',
    })
  })

  it('uses "any" when only one of length of stay min or max is set', () => {
    const v = emptyVisibilityConditions()
    v.lengthOfStayMin = 3
    expect(summarizeVisibility(v)).toEqual([
      { key: 'lengthOfStayMin', label: 'Length of Stay (3–any nights)' },
    ])
    v.lengthOfStayMin = null
    v.lengthOfStayMax = 14
    expect(summarizeVisibility(v)).toEqual([
      { key: 'lengthOfStayMin', label: 'Length of Stay (any–14 nights)' },
    ])
  })

  it('summarises related upsell count', () => {
    const v = emptyVisibilityConditions()
    v.excludeIfUpsellPurchased = ['svc-001', 'svc-002']
    expect(summarizeVisibility(v)).toEqual([
      { key: 'excludeIfUpsellPurchased', label: 'Related Upsell (2 selected)' },
    ])
  })

  it('summarises channels with human labels', () => {
    const v = emptyVisibilityConditions()
    v.channels = ['airbnb', 'booking_com']
    expect(summarizeVisibility(v)).toEqual([
      { key: 'channels', label: 'Channels (Airbnb, Booking.com)' },
    ])
  })

  it('preserves spec example: paired guest count counts as 1 condition', () => {
    const v = emptyVisibilityConditions()
    v.guestCountMin = 2
    v.guestCountMax = 4
    expect(summarizeVisibility(v)).toHaveLength(1)
  })

  it('preserves spec example: paired length of stay counts as 1 condition', () => {
    const v = emptyVisibilityConditions()
    v.lengthOfStayMin = 3
    v.lengthOfStayMax = 14
    expect(summarizeVisibility(v)).toHaveLength(1)
  })

  it('combines all active conditions in a single array', () => {
    const v = emptyVisibilityConditions()
    v.hoursBeforeCheckIn = 24
    v.guestCountMin = 2
    v.guestCountMax = 4
    v.channels = ['airbnb']
    const result = summarizeVisibility(v)
    expect(result).toHaveLength(3)
    expect(result.map(e => e.label)).toEqual([
      'Time before Check-in (within 24h)',
      'Guest Count (2–4 guests)',
      'Channels (Airbnb)',
    ])
  })
})
