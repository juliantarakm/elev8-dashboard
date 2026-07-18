import { describe, expect, it } from 'vitest'
import { useKeyManagement } from '~/composables/useKeyManagement'

describe('useKeyManagement', () => {
  it('initializes with mock data', () => {
    const { keys, keyBoxes, keyEvents } = useKeyManagement()
    expect(keys.value).toHaveLength(12)
    expect(keyBoxes.value).toHaveLength(3)
    expect(keyEvents.value.length).toBeGreaterThanOrEqual(15)
  })

  it('registerKey creates N copies with sequential copy numbers and register events', () => {
    const { registerKey, keys, getEventsForKey } = useKeyManagement()
    const result = registerKey({ listingId: 'lst-1', type: 'main_door', copies: 2, location: 'office' })
    expect(result.success).toBe(true)
    const created = result.keys!
    expect(created).toHaveLength(2)
    // lst-1 already has main_door #1 and #2
    expect(created[0].copyNumber).toBe(3)
    expect(created[1].copyNumber).toBe(4)
    expect(created[0].status).toBe('available')
    expect(getEventsForKey(created[0].id)[0].action).toBe('register')
    expect(keys.value).toHaveLength(14)
  })

  it('registerKey rejects invalid input', () => {
    const { registerKey } = useKeyManagement()
    expect(registerKey({ listingId: '', type: 'gate', copies: 1, location: 'office' }).success).toBe(false)
    expect(registerKey({ listingId: 'lst-1', type: 'gate', copies: 0, location: 'office' }).success).toBe(false)
    expect(registerKey({ listingId: 'lst-1', type: 'gate', copies: 1, location: 'key_box' }).success).toBe(false)
  })

  it('checkoutKey checks out an available key with default +24h expected return', () => {
    const { checkoutKey, getKeyById, getEventsForKey } = useKeyManagement()
    const before = Date.now()
    const result = checkoutKey('key-003', 'staff-3')
    expect(result.success).toBe(true)
    const key = getKeyById('key-003')!
    expect(key.status).toBe('checked_out')
    expect(key.holderStaffId).toBe('staff-3')
    const expectedMs = new Date(key.expectedReturnAt!).getTime()
    expect(expectedMs - before).toBeGreaterThan(23 * 60 * 60 * 1000)
    expect(expectedMs - before).toBeLessThan(25 * 60 * 60 * 1000)
    expect(getEventsForKey('key-003')[0].action).toBe('checkout')
  })

  it('checkoutKey rejects non-available keys and missing staff', () => {
    const { checkoutKey } = useKeyManagement()
    expect(checkoutKey('key-001', 'staff-3').success).toBe(false) // already checked_out
    expect(checkoutKey('key-006', 'staff-3').success).toBe(false) // lost
    expect(checkoutKey('key-003', '').success).toBe(false) // no staff
  })

  it('returnKey returns a checked-out key to the office', () => {
    const { returnKey, getKeyById, getEventsForKey } = useKeyManagement()
    const result = returnKey('key-001')
    expect(result.success).toBe(true)
    const key = getKeyById('key-001')!
    expect(key.status).toBe('available')
    expect(key.holderStaffId).toBeUndefined()
    expect(key.location).toBe('office')
    expect(getEventsForKey('key-001')[0].action).toBe('return')
    expect(returnKey('key-003').success).toBe(false) // available keys cannot be returned
  })
})
