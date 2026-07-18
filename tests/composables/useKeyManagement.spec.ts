import { describe, expect, it } from 'vitest'
import { useKeyManagement } from '~/composables/useKeyManagement'
import { useNotifications } from '~/composables/useNotifications'

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

  it('handoverKey transfers a checked-out key to another staff member', () => {
    const { handoverKey, getKeyById, getEventsForKey } = useKeyManagement()
    const result = handoverKey('key-004', 'staff-2', 'Shift change')
    expect(result.success).toBe(true)
    const key = getKeyById('key-004')!
    expect(key.status).toBe('checked_out')
    expect(key.holderStaffId).toBe('staff-2')
    const event = getEventsForKey('key-004')[0]
    expect(event.action).toBe('handover')
    expect(event.staffId).toBe('staff-2')
    expect(event.previousStaffId).toBe('staff-4')
    expect(event.note).toBe('Shift change')
  })

  it('handoverKey rejects invalid transitions', () => {
    const { handoverKey } = useKeyManagement()
    expect(handoverKey('key-003', 'staff-3').success).toBe(false) // available
    expect(handoverKey('key-006', 'staff-3').success).toBe(false) // lost
    expect(handoverKey('key-004', '').success).toBe(false) // no staff
    expect(handoverKey('key-004', 'staff-4').success).toBe(false) // same holder
  })

  it('markKeyLost marks a key as lost and clears custody', () => {
    const { markKeyLost, getKeyById, getEventsForKey } = useKeyManagement()
    const result = markKeyLost('key-009', 'Did not come back from maintenance')
    expect(result.success).toBe(true)
    const key = getKeyById('key-009')!
    expect(key.status).toBe('lost')
    expect(key.holderStaffId).toBeUndefined()
    expect(getEventsForKey('key-009')[0].action).toBe('mark_lost')
    expect(markKeyLost('key-009').success).toBe(false) // already lost
  })

  it('replaceKey creates a linked replacement copy and rejects double replace', () => {
    const { replaceKey, getKeyById, getEventsForKey } = useKeyManagement()
    const result = replaceKey('key-011')
    expect(result.success).toBe(true)
    const newKey = result.key!
    expect(newKey.type).toBe('storage')
    expect(newKey.listingId).toBe('lst-10')
    expect(newKey.copyNumber).toBe(2)
    expect(newKey.status).toBe('available')
    expect(getKeyById('key-011')!.replacedByKeyId).toBe(newKey.id)
    expect(getEventsForKey(newKey.id)[0].action).toBe('replace')
    expect(replaceKey('key-011').success).toBe(false) // already replaced
    expect(replaceKey('key-003').success).toBe(false) // not lost
  })

  it('overdueKeys contains only checked-out keys past expected return', () => {
    const { overdueKeys } = useKeyManagement()
    const ids = overdueKeys.value.map(k => k.id)
    expect(ids).toContain('key-001') // expected back 6h ago
    expect(ids).not.toContain('key-004') // due in 20h
    expect(ids).not.toContain('key-009') // due in 5h
  })

  it('stats counts match mock data', () => {
    const { stats } = useKeyManagement()
    expect(stats.value.total).toBe(12)
    expect(stats.value.available).toBe(7)
    expect(stats.value.checkedOut).toBe(3)
    expect(stats.value.lost).toBe(2)
    expect(stats.value.overdue).toBe(1)
  })

  it('filteredKeys applies status, type, listing, and search filters', () => {
    const { filteredKeys, filters } = useKeyManagement()
    filters.value.status = 'lost'
    expect(filteredKeys.value.map(k => k.id).sort()).toEqual(['key-006', 'key-011'])
    filters.value.status = 'all'
    filters.value.type = 'main_door'
    // NOTE: brief says 5, but mock data has 6 main_door keys
    // (key-001, key-002, key-005, key-006, key-007, key-010) — corrected to match data.
    expect(filteredKeys.value).toHaveLength(6)
    filters.value.type = 'all'
    filters.value.listings = ['lst-1']
    expect(filteredKeys.value).toHaveLength(4)
    filters.value.listings = []
    filters.value.search = 'scoopy'
    expect(filteredKeys.value.map(k => k.id)).toEqual(['key-004'])
  })

  it('removeKeyBox refuses to remove a box that still holds keys', () => {
    const { removeKeyBox, checkoutKey, keyBoxes } = useKeyManagement()
    expect(removeKeyBox('kb-1').success).toBe(false) // holds key-002
    expect(removeKeyBox('kb-2').success).toBe(false) // holds key-005
    expect(removeKeyBox('kb-3').success).toBe(false) // holds key-010
    checkoutKey('key-010', 'staff-4') // moves the key out of the box
    expect(removeKeyBox('kb-3').success).toBe(true)
    expect(keyBoxes.value.map(b => b.id)).not.toContain('kb-3')
  })

  it('addKeyBox validates required fields and updateKeyBox patches a box', () => {
    const { addKeyBox, updateKeyBox, keyBoxes } = useKeyManagement()
    expect(addKeyBox({ listingId: 'lst-9', name: '', location: 'x', pin: '1' }).success).toBe(false)
    expect(addKeyBox({ listingId: 'lst-9', name: 'x', location: 'x', pin: '' }).success).toBe(false)
    const added = addKeyBox({ listingId: 'lst-9', name: 'Treehouse lockbox', location: 'On the stair railing', pin: '9031' })
    expect(added.success).toBe(true)
    expect(keyBoxes.value).toHaveLength(4)
    const updated = updateKeyBox(added.keyBox!.id, { pin: '4410' })
    expect(updated.success).toBe(true)
    expect(keyBoxes.value.find(b => b.id === added.keyBox!.id)!.pin).toBe('4410')
    expect(updateKeyBox('kb-missing', { pin: '1' }).success).toBe(false)
  })

  it('checkOverdueKeys creates one deduped KEY_NOT_RETURNED alert per overdue key', () => {
    const { checkOverdueKeys } = useKeyManagement()
    const notifications = useNotifications()
    checkOverdueKeys()
    checkOverdueKeys() // second call must not duplicate
    const keyAlerts = notifications.alerts.value.filter(a => a.type === 'KEY_NOT_RETURNED' && a.status === 'ACTIVE')
    expect(keyAlerts).toHaveLength(1)
    expect(keyAlerts[0].context.key_id).toBe('key-001')
    expect(keyAlerts[0].severity).toBe('WARNING')
  })

  it('returnKey resolves the active KEY_NOT_RETURNED alert for that key', () => {
    const { checkOverdueKeys, returnKey } = useKeyManagement()
    const notifications = useNotifications()
    checkOverdueKeys()
    expect(notifications.alerts.value.some(a => a.type === 'KEY_NOT_RETURNED' && a.status === 'ACTIVE')).toBe(true)
    returnKey('key-001')
    expect(notifications.alerts.value.filter(a => a.type === 'KEY_NOT_RETURNED' && a.status === 'ACTIVE')).toHaveLength(0)
  })
})
