import type { KeyBox, KeyEvent, KeyEventAction, KeyStatus, KeyType, PhysicalKey } from '~/components/key-management/data/keys'
import {
  CURRENT_STAFF_ID,
  generateKeyEventId,
  generateKeyId,
  keyTypeLabels,
  mockKeyBoxes,
  mockKeyEvents,
  mockKeys,
  nextCopyNumber,
} from '~/components/key-management/data/keys'

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

  function appendEvent(keyId: string, action: KeyEventAction, staffId?: string, note?: string) {
    const event: KeyEvent = {
      id: generateKeyEventId(),
      keyId,
      action,
      staffId,
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
    return { success: true }
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
    registerKey,
    checkoutKey,
    returnKey,
  }
}
