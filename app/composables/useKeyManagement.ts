import type { KeyBox, KeyEvent, KeyEventAction, KeyStatus, KeyType, PhysicalKey } from '~/components/key-management/data/keys'
import { staffMembers } from '~/components/inbox/data/conversations'
import {
  CURRENT_STAFF_ID,
  generateKeyBoxId,
  generateKeyEventId,
  generateKeyId,
  getKeyDisplayName,
  keyTypeLabels,
  mockKeyBoxes,
  mockKeyEvents,
  mockKeys,
  nextCopyNumber,
} from '~/components/key-management/data/keys'
import { listings } from '~/components/listings/data/listings'
import { useNotifications } from '~/composables/useNotifications'

export interface KeyManagementFilters {
  search: string
  status: KeyStatus | 'all'
  type: KeyType | 'all'
  listings: string[]
}

export interface RegisterKeyInput {
  listingId: string
  type: KeyType
  label?: string
  copies: number
  location: 'office' | 'key_box'
  keyBoxId?: string
}

export interface KeyBoxInput {
  listingId: string
  name: string
  location: string
  pin: string
  notes?: string
}

const DEFAULT_RETURN_HOURS = 24

export function useKeyManagement() {
  const keys = useState<PhysicalKey[]>('key-management-keys', () => [...mockKeys])
  const keyEvents = useState<KeyEvent[]>('key-management-events', () => [...mockKeyEvents])
  const keyBoxes = useState<KeyBox[]>('key-management-boxes', () => [...mockKeyBoxes])

  const filters = ref<KeyManagementFilters>({
    search: '',
    status: 'all',
    type: 'all',
    listings: [],
  })

  function isOverdue(key: PhysicalKey): boolean {
    return key.status === 'checked_out'
      && !!key.expectedReturnAt
      && key.expectedReturnAt < new Date().toISOString()
  }

  const overdueKeys = computed(() => keys.value.filter(isOverdue))

  const filteredKeys = computed(() => {
    return keys.value.filter((key) => {
      if (filters.value.status !== 'all' && key.status !== filters.value.status)
        return false
      if (filters.value.type !== 'all' && key.type !== filters.value.type)
        return false
      if (filters.value.listings.length > 0 && !filters.value.listings.includes(key.listingId))
        return false
      if (filters.value.search) {
        const query = filters.value.search.toLowerCase()
        const haystack = `${keyTypeLabels[key.type]} ${key.label ?? ''} #${key.copyNumber}`.toLowerCase()
        if (!haystack.includes(query))
          return false
      }
      return true
    })
  })

  const stats = computed(() => ({
    total: keys.value.length,
    available: keys.value.filter(k => k.status === 'available').length,
    checkedOut: keys.value.filter(k => k.status === 'checked_out').length,
    lost: keys.value.filter(k => k.status === 'lost').length,
    overdue: overdueKeys.value.length,
  }))

  const sortedEvents = computed(() =>
    [...keyEvents.value].sort((a, b) => b.at.localeCompare(a.at)),
  )

  function getKeyById(keyId: string): PhysicalKey | undefined {
    return keys.value.find(k => k.id === keyId)
  }

  function getEventsForKey(keyId: string): KeyEvent[] {
    return keyEvents.value
      .filter(e => e.keyId === keyId)
      .sort((a, b) => b.at.localeCompare(a.at))
  }

  function appendEvent(keyId: string, action: KeyEventAction, staffId?: string, note?: string, previousStaffId?: string) {
    const event: KeyEvent = {
      id: generateKeyEventId(),
      keyId,
      action,
      staffId,
      previousStaffId,
      actorStaffId: CURRENT_STAFF_ID,
      at: new Date().toISOString(),
      note,
    }
    keyEvents.value = [event, ...keyEvents.value]
  }

  function registerKey(input: RegisterKeyInput): { success: boolean, error?: string, keys?: PhysicalKey[] } {
    if (!input.listingId || !input.type)
      return { success: false, error: 'Listing and key type are required.' }
    if (!Number.isInteger(input.copies) || input.copies < 1)
      return { success: false, error: 'Copies must be at least 1.' }
    if (input.location === 'key_box' && !input.keyBoxId)
      return { success: false, error: 'Select a key box.' }
    const created: PhysicalKey[] = []
    let copyNumber = nextCopyNumber(keys.value, input.listingId, input.type)
    for (let i = 0; i < input.copies; i += 1) {
      created.push({
        id: generateKeyId(),
        listingId: input.listingId,
        type: input.type,
        label: input.label?.trim() || undefined,
        copyNumber: copyNumber++,
        status: 'available',
        location: input.location,
        keyBoxId: input.location === 'key_box' ? input.keyBoxId : undefined,
        createdAt: new Date().toISOString(),
      })
    }
    keys.value = [...keys.value, ...created]
    created.forEach(k => appendEvent(k.id, 'register'))
    return { success: true, keys: created }
  }

  function checkoutKey(keyId: string, staffId: string, expectedReturnAt?: string, note?: string): { success: boolean, error?: string } {
    const key = getKeyById(keyId)
    if (!key)
      return { success: false, error: 'Key not found.' }
    if (key.status !== 'available')
      return { success: false, error: 'Only available keys can be checked out.' }
    if (!staffId)
      return { success: false, error: 'Select a staff member.' }
    const now = new Date()
    const expected = expectedReturnAt
      ?? new Date(now.getTime() + DEFAULT_RETURN_HOURS * 60 * 60 * 1000).toISOString()
    keys.value = keys.value.map(k => k.id === keyId
      ? {
          ...k,
          status: 'checked_out' as KeyStatus,
          holderStaffId: staffId,
          checkedOutAt: now.toISOString(),
          expectedReturnAt: expected,
          location: 'office' as const,
          keyBoxId: undefined,
        }
      : k)
    appendEvent(keyId, 'checkout', staffId, note)
    return { success: true }
  }

  function returnKey(keyId: string): { success: boolean, error?: string } {
    const key = getKeyById(keyId)
    if (!key)
      return { success: false, error: 'Key not found.' }
    if (key.status !== 'checked_out')
      return { success: false, error: 'Only checked-out keys can be returned.' }
    const holder = key.holderStaffId
    keys.value = keys.value.map(k => k.id === keyId
      ? {
          ...k,
          status: 'available' as KeyStatus,
          holderStaffId: undefined,
          checkedOutAt: undefined,
          expectedReturnAt: undefined,
          location: 'office' as const,
          keyBoxId: undefined,
        }
      : k)
    appendEvent(keyId, 'return', holder)
    resolveOverdueAlert(keyId)
    return { success: true }
  }

  function handoverKey(keyId: string, toStaffId: string, note?: string): { success: boolean, error?: string } {
    const key = getKeyById(keyId)
    if (!key)
      return { success: false, error: 'Key not found.' }
    if (key.status !== 'checked_out')
      return { success: false, error: 'Only checked-out keys can be handed over.' }
    if (!toStaffId)
      return { success: false, error: 'Select a staff member.' }
    if (toStaffId === key.holderStaffId)
      return { success: false, error: 'Key is already held by this staff member.' }
    const fromStaffId = key.holderStaffId
    keys.value = keys.value.map(k => k.id === keyId
      ? {
          ...k,
          holderStaffId: toStaffId,
        }
      : k)
    appendEvent(keyId, 'handover', toStaffId, note, fromStaffId)
    return { success: true }
  }

  function getKeysInBox(keyBoxId: string): PhysicalKey[] {
    return keys.value.filter(k => k.status === 'available' && k.location === 'key_box' && k.keyBoxId === keyBoxId)
  }

  function markKeyLost(keyId: string, note?: string): { success: boolean, error?: string } {
    const key = getKeyById(keyId)
    if (!key)
      return { success: false, error: 'Key not found.' }
    if (key.status === 'lost')
      return { success: false, error: 'Key is already marked as lost.' }
    const holder = key.holderStaffId
    keys.value = keys.value.map(k => k.id === keyId
      ? {
          ...k,
          status: 'lost' as KeyStatus,
          holderStaffId: undefined,
          checkedOutAt: undefined,
          expectedReturnAt: undefined,
          location: 'office' as const,
          keyBoxId: undefined,
        }
      : k)
    appendEvent(keyId, 'mark_lost', holder, note)
    resolveOverdueAlert(keyId)
    return { success: true }
  }

  function replaceKey(lostKeyId: string): { success: boolean, error?: string, key?: PhysicalKey } {
    const lost = getKeyById(lostKeyId)
    if (!lost)
      return { success: false, error: 'Key not found.' }
    if (lost.status !== 'lost')
      return { success: false, error: 'Only lost keys can be replaced.' }
    if (lost.replacedByKeyId)
      return { success: false, error: 'This key was already replaced.' }
    const newKey: PhysicalKey = {
      id: generateKeyId(),
      listingId: lost.listingId,
      type: lost.type,
      label: lost.label,
      copyNumber: nextCopyNumber(keys.value, lost.listingId, lost.type),
      status: 'available',
      location: 'office',
      createdAt: new Date().toISOString(),
    }
    keys.value = [...keys.value, newKey]
    keys.value = keys.value.map(k => k.id === lostKeyId ? { ...k, replacedByKeyId: newKey.id } : k)
    appendEvent(newKey.id, 'replace', undefined, `Replacement for ${getKeyDisplayName(lost)}`)
    return { success: true, key: newKey }
  }

  function addKeyBox(input: KeyBoxInput): { success: boolean, error?: string, keyBox?: KeyBox } {
    if (!input.listingId || !input.name.trim() || !input.location.trim() || !input.pin.trim())
      return { success: false, error: 'Listing, name, location, and PIN are required.' }
    const keyBox: KeyBox = {
      id: generateKeyBoxId(),
      listingId: input.listingId,
      name: input.name.trim(),
      location: input.location.trim(),
      pin: input.pin.trim(),
      notes: input.notes?.trim() || undefined,
    }
    keyBoxes.value = [...keyBoxes.value, keyBox]
    return { success: true, keyBox }
  }

  function updateKeyBox(id: string, patch: Partial<KeyBoxInput>): { success: boolean, error?: string } {
    const box = keyBoxes.value.find(b => b.id === id)
    if (!box)
      return { success: false, error: 'Key box not found.' }
    keyBoxes.value = keyBoxes.value.map(b => b.id === id ? { ...b, ...patch } : b)
    return { success: true }
  }

  function removeKeyBox(id: string): { success: boolean, error?: string } {
    if (getKeysInBox(id).length > 0)
      return { success: false, error: 'Move the stored keys out of this box first.' }
    keyBoxes.value = keyBoxes.value.filter(b => b.id !== id)
    return { success: true }
  }

  function resolveOverdueAlert(keyId: string) {
    const notifications = useNotifications()
    const alert = notifications.alerts.value.find(a =>
      a.type === 'KEY_NOT_RETURNED' && a.status === 'ACTIVE' && a.context?.key_id === keyId,
    )
    if (alert)
      notifications.markAsRead(alert.alert_id)
  }

  function checkOverdueKeys() {
    const notifications = useNotifications()
    overdueKeys.value.forEach((key) => {
      const hasActiveAlert = notifications.alerts.value.some(a =>
        a.type === 'KEY_NOT_RETURNED' && a.status === 'ACTIVE' && a.context?.key_id === key.id,
      )
      if (hasActiveAlert)
        return
      const listing = listings.value.find(l => l.id === key.listingId)
      const staff = staffMembers.find(s => s.id === key.holderStaffId)
      const overdueHours = key.expectedReturnAt
        ? Math.max(1, Math.round((Date.now() - new Date(key.expectedReturnAt).getTime()) / (1000 * 60 * 60)))
        : 0
      notifications.createAlert('KEY_NOT_RETURNED', 'WARNING', {
        key_id: key.id,
        listing_id: key.listingId,
        listing_name: listing?.name ?? key.listingId,
        key_label: getKeyDisplayName(key),
        staff_name: staff?.name ?? 'Unknown staff',
        overdue_hours: overdueHours,
      })
    })
  }

  return {
    keys,
    keyEvents,
    keyBoxes,
    filters,
    filteredKeys,
    stats,
    overdueKeys,
    sortedEvents,
    isOverdue,
    getKeyById,
    getEventsForKey,
    getKeysInBox,
    registerKey,
    checkoutKey,
    returnKey,
    handoverKey,
    markKeyLost,
    replaceKey,
    addKeyBox,
    updateKeyBox,
    removeKeyBox,
    checkOverdueKeys,
  }
}
