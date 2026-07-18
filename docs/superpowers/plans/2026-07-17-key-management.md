# Key Management (Physical Keys) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a centralized Key Management module for physical keys — custody tracking, handover history, key boxes, lost & replacement logging, and overdue alerts.

**Architecture:** Standalone Nuxt module following the established pattern: `app/components/key-management/data/keys.ts` (types + mock data), `app/composables/useKeyManagement.ts` (`useState` + actions), `app/pages/key-management/index.vue` (page), components in `app/components/key-management/`. One record per physical key copy. Overdue keys create `KEY_NOT_RETURNED` alerts via the existing notification center. Spec: `docs/superpowers/specs/2026-07-17-key-management-design.md`.

**Tech Stack:** Nuxt 3, Vue 3 `<script setup>`, shadcn-vue (`app/components/ui/`), Tailwind CSS v4, Vitest (config `vitest.config.ts`, setup `tests/setup.ts` with a `useState` shim — no npm test script, run via `npx vitest run`).

**Repo facts an engineer must know:**
- Icons in data files use the `i-lucide-*` format and are rendered with `<Icon :name="...">`. In templates/pages, icons are written `<Icon name="lucide:search" />`.
- `listings` from `~/components/listings/data/listings` is a `ref<Listing[]>` — use `listings.value` in script, plain `listings` in templates. Real listing IDs used in mocks: `lst-1`, `lst-8`, `lst-9`, `lst-10`, `lst-11`.
- Staff: `staffMembers` from `~/components/inbox/data/conversations` (`staff-1` You/Admin, `staff-2` Komang Juliantara, `staff-3` Made Surya, `staff-4` Wayan Adi). Current user is `staff-2`.
- `useNotifications()` exposes `alerts`, `createAlert(type, severity, context)`, `markAsRead(alertId)` (sets status `RESOLVED`). Alert metadata lives in `app/components/notifications/data/alerts.ts`.
- Toast: `import { toast } from 'vue-sonner'`.
- Dates: `date-fns` is installed (`formatDistanceToNow`).
- State mutations on `useState` arrays: reassign with spread (`state.value = [...state.value, item]`) for reactivity.

---

### Task 1: Data module — types, display maps, mock data

**Files:**
- Create: `app/components/key-management/data/keys.ts`

- [ ] **Step 1: Create the data file**

```ts
export type KeyType
  = | 'main_door' | 'bedroom' | 'gate' | 'pool'
    | 'safe' | 'storage' | 'motorbike' | 'other'

export type KeyStatus = 'available' | 'checked_out' | 'lost'

export type KeyStorageLocation = 'office' | 'key_box'

export interface PhysicalKey {
  id: string
  listingId: string
  type: KeyType
  label?: string
  copyNumber: number
  status: KeyStatus
  holderStaffId?: string
  checkedOutAt?: string
  expectedReturnAt?: string
  location: KeyStorageLocation
  keyBoxId?: string
  replacedByKeyId?: string
  createdAt: string
}

export type KeyEventAction = 'register' | 'checkout' | 'return' | 'mark_lost' | 'replace'

export interface KeyEvent {
  id: string
  keyId: string
  action: KeyEventAction
  staffId?: string
  actorStaffId: string
  at: string
  note?: string
}

export interface KeyBox {
  id: string
  listingId: string
  name: string
  location: string
  pin: string
  notes?: string
}

/** The logged-in dashboard user (Komang Juliantara) — records every key event. */
export const CURRENT_STAFF_ID = 'staff-2'

export const keyTypeLabels: Record<KeyType, string> = {
  main_door: 'Main Door',
  bedroom: 'Bedroom',
  gate: 'Gate',
  pool: 'Pool',
  safe: 'Safe',
  storage: 'Storage',
  motorbike: 'Motorbike',
  other: 'Other',
}

export const keyTypeIcons: Record<KeyType, string> = {
  main_door: 'i-lucide-door-open',
  bedroom: 'i-lucide-bed-double',
  gate: 'i-lucide-fence',
  pool: 'i-lucide-waves',
  safe: 'i-lucide-vault',
  storage: 'i-lucide-archive',
  motorbike: 'i-lucide-bike',
  other: 'i-lucide-key-round',
}

export const keyEventLabels: Record<KeyEventAction, string> = {
  register: 'Registered',
  checkout: 'Checked out',
  return: 'Returned',
  mark_lost: 'Reported lost',
  replace: 'Replaced',
}

export function getKeyDisplayName(key: Pick<PhysicalKey, 'type' | 'copyNumber' | 'label'>): string {
  const base = `${keyTypeLabels[key.type]} #${key.copyNumber}`
  return key.label ? `${base} · ${key.label}` : base
}

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}
export function generateKeyId(): string { return nextId('key') }
export function generateKeyEventId(): string { return nextId('kev') }
export function generateKeyBoxId(): string { return nextId('kb') }

export function nextCopyNumber(keys: PhysicalKey[], listingId: string, type: KeyType): number {
  const nums = keys.filter(k => k.listingId === listingId && k.type === type).map(k => k.copyNumber)
  return nums.length ? Math.max(...nums) + 1 : 1
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
}
function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString()
}

export const mockKeyBoxes: KeyBox[] = [
  { id: 'kb-1', listingId: 'lst-1', name: 'Front gate lockbox', location: 'Mounted on the left pillar of the main entrance gate', pin: '4821' },
  { id: 'kb-2', listingId: 'lst-8', name: 'Villa door lockbox', location: 'Beside the main door, behind the plants', pin: '7390', notes: 'Code changes monthly' },
  { id: 'kb-3', listingId: 'lst-10', name: 'Beach gate lockbox', location: 'On the wooden fence post at the beach access path', pin: '2255' },
]

export const mockKeys: PhysicalKey[] = [
  // lst-1 — one overdue checkout, one copy in the key box
  { id: 'key-001', listingId: 'lst-1', type: 'main_door', copyNumber: 1, status: 'checked_out', holderStaffId: 'staff-3', checkedOutAt: hoursAgo(30), expectedReturnAt: hoursAgo(6), location: 'office', createdAt: hoursAgo(24 * 90) },
  { id: 'key-002', listingId: 'lst-1', type: 'main_door', copyNumber: 2, status: 'available', location: 'key_box', keyBoxId: 'kb-1', createdAt: hoursAgo(24 * 90) },
  { id: 'key-003', listingId: 'lst-1', type: 'pool', copyNumber: 1, status: 'available', location: 'office', createdAt: hoursAgo(24 * 80) },
  { id: 'key-004', listingId: 'lst-1', type: 'motorbike', label: 'Black Scoopy', copyNumber: 1, status: 'checked_out', holderStaffId: 'staff-4', checkedOutAt: hoursAgo(4), expectedReturnAt: hoursFromNow(20), location: 'office', createdAt: hoursAgo(24 * 60) },
  // lst-8 — copy #2 lost and already replaced by #3
  { id: 'key-005', listingId: 'lst-8', type: 'main_door', copyNumber: 1, status: 'available', location: 'key_box', keyBoxId: 'kb-2', createdAt: hoursAgo(24 * 70) },
  { id: 'key-006', listingId: 'lst-8', type: 'main_door', copyNumber: 2, status: 'lost', location: 'office', replacedByKeyId: 'key-007', createdAt: hoursAgo(24 * 70) },
  { id: 'key-007', listingId: 'lst-8', type: 'main_door', copyNumber: 3, status: 'available', location: 'office', createdAt: hoursAgo(24 * 5) },
  { id: 'key-008', listingId: 'lst-8', type: 'safe', copyNumber: 1, status: 'available', location: 'office', createdAt: hoursAgo(24 * 65) },
  // lst-9 — checked out, not yet due
  { id: 'key-009', listingId: 'lst-9', type: 'gate', copyNumber: 1, status: 'checked_out', holderStaffId: 'staff-3', checkedOutAt: hoursAgo(19), expectedReturnAt: hoursFromNow(5), location: 'office', createdAt: hoursAgo(24 * 40) },
  // lst-10 — one in the key box, one lost and not yet replaced
  { id: 'key-010', listingId: 'lst-10', type: 'main_door', copyNumber: 1, status: 'available', location: 'key_box', keyBoxId: 'kb-3', createdAt: hoursAgo(24 * 30) },
  { id: 'key-011', listingId: 'lst-10', type: 'storage', copyNumber: 1, status: 'lost', location: 'office', createdAt: hoursAgo(24 * 30) },
  // lst-11
  { id: 'key-012', listingId: 'lst-11', type: 'bedroom', copyNumber: 1, status: 'available', location: 'office', createdAt: hoursAgo(24 * 20) },
]

export const mockKeyEvents: KeyEvent[] = [
  // Registration history
  { id: 'kev-001', keyId: 'key-001', action: 'register', actorStaffId: 'staff-1', at: hoursAgo(24 * 90) },
  { id: 'kev-002', keyId: 'key-002', action: 'register', actorStaffId: 'staff-1', at: hoursAgo(24 * 90) },
  { id: 'kev-003', keyId: 'key-003', action: 'register', actorStaffId: 'staff-1', at: hoursAgo(24 * 80) },
  { id: 'kev-004', keyId: 'key-004', action: 'register', actorStaffId: 'staff-2', at: hoursAgo(24 * 60) },
  { id: 'kev-005', keyId: 'key-005', action: 'register', actorStaffId: 'staff-1', at: hoursAgo(24 * 70) },
  { id: 'kev-006', keyId: 'key-006', action: 'register', actorStaffId: 'staff-1', at: hoursAgo(24 * 70) },
  { id: 'kev-007', keyId: 'key-008', action: 'register', actorStaffId: 'staff-1', at: hoursAgo(24 * 65) },
  { id: 'kev-008', keyId: 'key-009', action: 'register', actorStaffId: 'staff-2', at: hoursAgo(24 * 40) },
  { id: 'kev-009', keyId: 'key-010', action: 'register', actorStaffId: 'staff-2', at: hoursAgo(24 * 30) },
  { id: 'kev-010', keyId: 'key-011', action: 'register', actorStaffId: 'staff-2', at: hoursAgo(24 * 30) },
  { id: 'kev-011', keyId: 'key-012', action: 'register', actorStaffId: 'staff-2', at: hoursAgo(24 * 20) },
  // key-002 went out and came back
  { id: 'kev-012', keyId: 'key-002', action: 'checkout', staffId: 'staff-4', actorStaffId: 'staff-2', at: hoursAgo(50), note: 'Pool pump inspection' },
  { id: 'kev-013', keyId: 'key-002', action: 'return', staffId: 'staff-4', actorStaffId: 'staff-2', at: hoursAgo(47) },
  // key-001 currently with Made — overdue (expected back 6h ago)
  { id: 'kev-014', keyId: 'key-001', action: 'checkout', staffId: 'staff-3', actorStaffId: 'staff-2', at: hoursAgo(30), note: 'Guest lockout assistance' },
  // key-004 currently with Wayan
  { id: 'kev-015', keyId: 'key-004', action: 'checkout', staffId: 'staff-4', actorStaffId: 'staff-2', at: hoursAgo(4), note: 'Airport pickup' },
  // key-006 lost by Made, replaced by key-007
  { id: 'kev-016', keyId: 'key-006', action: 'checkout', staffId: 'staff-3', actorStaffId: 'staff-2', at: hoursAgo(24 * 6), note: 'Cleaning rounds' },
  { id: 'kev-017', keyId: 'key-006', action: 'mark_lost', staffId: 'staff-3', actorStaffId: 'staff-2', at: hoursAgo(24 * 5), note: 'Lost during cleaning round' },
  { id: 'kev-018', keyId: 'key-007', action: 'replace', actorStaffId: 'staff-2', at: hoursAgo(24 * 5), note: 'Replacement for Main Door #2' },
  // key-009 currently with Made
  { id: 'kev-019', keyId: 'key-009', action: 'checkout', staffId: 'staff-3', actorStaffId: 'staff-2', at: hoursAgo(19), note: 'Gate motor repair access' },
  // key-011 lost in storage
  { id: 'kev-020', keyId: 'key-011', action: 'mark_lost', actorStaffId: 'staff-2', at: hoursAgo(24 * 2), note: 'Not found during inventory check' },
]
```

- [ ] **Step 2: Commit**

```bash
git add app/components/key-management/data/keys.ts
git commit -m "feat(key-management): add data module with types and mock data"
```

---

### Task 2: Composable core — state, computed, register/checkout/return (TDD)

**Files:**
- Create: `app/composables/useKeyManagement.ts`
- Test: `tests/composables/useKeyManagement.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/composables/useKeyManagement.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/composables/useKeyManagement.spec.ts`
Expected: FAIL — `Failed to resolve import "~/composables/useKeyManagement"`

- [ ] **Step 3: Create the composable**

Create `app/composables/useKeyManagement.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/composables/useKeyManagement.spec.ts`
Expected: PASS — 6 tests passed

- [ ] **Step 5: Commit**

```bash
git add app/composables/useKeyManagement.ts tests/composables/useKeyManagement.spec.ts
git commit -m "feat(key-management): add composable with state, filters, register/checkout/return"
```

---

### Task 3: Lifecycle actions — mark lost, replace, key box CRUD, overdue/stats/filters (TDD)

**Files:**
- Modify: `app/composables/useKeyManagement.ts`
- Test: `tests/composables/useKeyManagement.spec.ts`

- [ ] **Step 1: Append the failing tests**

Add these tests inside the existing `describe('useKeyManagement', ...)` block, after the `returnKey` test:

```ts
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
    expect(filteredKeys.value).toHaveLength(5)
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/composables/useKeyManagement.spec.ts`
Expected: FAIL — `markKeyLost is not a function` (and similar for the other new tests)

- [ ] **Step 3: Add the lifecycle actions to the composable**

In `app/composables/useKeyManagement.ts`, first extend the data import block — add `generateKeyBoxId` and `getKeyDisplayName`:

```ts
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
```

Then add these functions inside `useKeyManagement()`, right after `returnKey`:

```ts
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
```

Finally extend the `return { ... }` object to include the new functions:

```ts
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
    markKeyLost,
    replaceKey,
    addKeyBox,
    updateKeyBox,
    removeKeyBox,
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/composables/useKeyManagement.spec.ts`
Expected: PASS — 13 tests passed

- [ ] **Step 5: Commit**

```bash
git add app/composables/useKeyManagement.ts tests/composables/useKeyManagement.spec.ts
git commit -m "feat(key-management): add lost/replace lifecycle and key box CRUD"
```

---

### Task 4: Overdue alerts — KEY_NOT_RETURNED notification type (TDD)

**Files:**
- Modify: `app/components/notifications/data/alerts.ts`
- Modify: `app/composables/useKeyManagement.ts`
- Test: `tests/composables/useKeyManagement.spec.ts`
- Test: `tests/utils/key-alert.spec.ts`

- [ ] **Step 1: Append the failing tests**

Append to `tests/composables/useKeyManagement.spec.ts` — add the import at the top:

```ts
import { useNotifications } from '~/composables/useNotifications'
```

and these tests inside the `describe` block:

```ts
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
```

Create `tests/utils/key-alert.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { alertDisplayLabels, alertIcons, alertRouteMap, getDescription } from '~/components/notifications/data/alerts'

describe('KEY_NOT_RETURNED alert', () => {
  it('has display metadata', () => {
    expect(alertDisplayLabels.KEY_NOT_RETURNED).toBe('Key - Not Returned')
    expect(alertIcons.KEY_NOT_RETURNED).toBe('i-lucide-key-round')
    expect(alertRouteMap.KEY_NOT_RETURNED).toBe('/key-management')
  })

  it('builds a description from context', () => {
    const description = getDescription('KEY_NOT_RETURNED', {
      key_label: 'Main Door #1',
      listing_name: 'Villa Luwa',
      staff_name: 'Made Surya',
      overdue_hours: 6,
    })
    expect(description).toContain('Main Door #1')
    expect(description).toContain('Villa Luwa')
    expect(description).toContain('Made Surya')
    expect(description).toContain('6h')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/composables/useKeyManagement.spec.ts tests/utils/key-alert.spec.ts`
Expected: FAIL — `checkOverdueKeys is not a function`; metadata assertions fail (`KEY_NOT_RETURNED` is `undefined`)

- [ ] **Step 3a: Register the alert type in `app/components/notifications/data/alerts.ts`**

Make four additive edits:

1. Add to the end of the `AlertType` union (after `'GUEST_GUIDE_SUBMITTED'`):

```ts
    | 'GUEST_GUIDE_SUBMITTED'
    | 'KEY_NOT_RETURNED'
```

2. Add to the end of `alertDisplayLabels`:

```ts
  GUEST_GUIDE_SUBMITTED: 'Guest Guide - Form Submitted',
  KEY_NOT_RETURNED: 'Key - Not Returned',
```

3. Add to the end of `alertIcons`:

```ts
  GUEST_GUIDE_SUBMITTED: 'i-lucide-book-open-check',
  KEY_NOT_RETURNED: 'i-lucide-key-round',
```

4. Add to the end of `alertRouteMap`:

```ts
  GUEST_GUIDE_SUBMITTED: '/guest-guides',
  KEY_NOT_RETURNED: '/key-management',
```

5. In `getDescription`, add a case just before `default:`:

```ts
    case 'KEY_NOT_RETURNED':
      return `${context.key_label || 'Key'} at ${context.listing_name || 'property'} held by ${context.staff_name || 'staff'} is ${context.overdue_hours ?? '?'}h overdue.`
    default:
      return ''
```

- [ ] **Step 3b: Add alert logic to the composable**

In `app/composables/useKeyManagement.ts`, add these imports at the top:

```ts
import { staffMembers } from '~/components/inbox/data/conversations'
import { listings } from '~/components/listings/data/listings'
import { useNotifications } from '~/composables/useNotifications'
```

Add these two functions inside `useKeyManagement()`, after `removeKeyBox`:

```ts
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
```

Wire resolution into the two actions that end a custody problem — in `returnKey`, add as the last statement before `return { success: true }`:

```ts
    resolveOverdueAlert(keyId)
```

and in `markKeyLost`, likewise before `return { success: true }`:

```ts
    resolveOverdueAlert(keyId)
```

Add `checkOverdueKeys` to the returned object:

```ts
    removeKeyBox,
    checkOverdueKeys,
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/composables/useKeyManagement.spec.ts tests/utils/key-alert.spec.ts`
Expected: PASS — 15 + 2 tests passed

- [ ] **Step 5: Commit**

```bash
git add app/components/notifications/data/alerts.ts app/composables/useKeyManagement.ts tests/composables/useKeyManagement.spec.ts tests/utils/key-alert.spec.ts
git commit -m "feat(key-management): add KEY_NOT_RETURNED overdue alert integration"
```

---

### Task 5: Sidebar menu item

**Files:**
- Modify: `app/constants/menus.ts`

- [ ] **Step 1: Add the menu item**

In `app/constants/menus.ts`, in the "General" group of `navMenu`, insert this item immediately after the "Inventory" item (which ends with `new: true, },`) and before the "Procurement" item:

```ts
      {
        title: 'Key Management',
        icon: 'i-lucide-key-round',
        link: '/key-management',
        new: true,
      },
```

- [ ] **Step 2: Verify lint**

Run: `npx eslint app/constants/menus.ts`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/constants/menus.ts
git commit -m "feat(key-management): add sidebar menu item"
```

---

### Task 6: KeyTable component

**Files:**
- Create: `app/components/key-management/KeyTable.vue`

Note: this module's UI components are verified via lint + the production build in Task 10 (the repo has no component-test harness for dialogs/tables; core logic is covered by composable tests).

- [ ] **Step 1: Create the component**

```vue
<script setup lang="ts">
import type { PhysicalKey } from './data/keys'
import { formatDistanceToNow } from 'date-fns'
import { staffMembers } from '~/components/inbox/data/conversations'
import { listings } from '~/components/listings/data/listings'
import { keyTypeIcons, keyTypeLabels } from './data/keys'

const { keys, isOverdue } = defineProps<{
  keys: PhysicalKey[]
  isOverdue: (key: PhysicalKey) => boolean
}>()

const emit = defineEmits<{
  checkout: [key: PhysicalKey]
  return: [key: PhysicalKey]
  lost: [key: PhysicalKey]
  replace: [key: PhysicalKey]
  history: [key: PhysicalKey]
}>()

function getListingName(id: string) {
  return listings.value.find(l => l.id === id)?.name ?? id
}

function getHolder(key: PhysicalKey) {
  return staffMembers.find(s => s.id === key.holderStaffId)
}

function statusBadgeVariant(status: PhysicalKey['status']) {
  switch (status) {
    case 'available': return 'secondary'
    case 'checked_out': return 'default'
    case 'lost': return 'destructive'
  }
}

function statusLabel(status: PhysicalKey['status']) {
  switch (status) {
    case 'available': return 'Available'
    case 'checked_out': return 'Checked out'
    case 'lost': return 'Lost'
  }
}

function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}
</script>

<template>
  <div class="rounded-lg border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Listing</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Holder</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Checked out</TableHead>
          <TableHead class="w-[60px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="keyItem in keys" :key="keyItem.id">
          <TableCell>
            <div class="flex items-center gap-2">
              <Icon :name="keyTypeIcons[keyItem.type]" class="size-4 text-muted-foreground" />
              <div class="min-w-0">
                <p class="font-medium">
                  {{ keyTypeLabels[keyItem.type] }} #{{ keyItem.copyNumber }}
                </p>
                <p v-if="keyItem.label" class="truncate text-xs text-muted-foreground">
                  {{ keyItem.label }}
                </p>
              </div>
            </div>
          </TableCell>
          <TableCell class="max-w-[220px]">
            <span class="line-clamp-1">{{ getListingName(keyItem.listingId) }}</span>
          </TableCell>
          <TableCell>
            <div class="flex items-center gap-1.5">
              <Badge :variant="statusBadgeVariant(keyItem.status)">
                {{ statusLabel(keyItem.status) }}
              </Badge>
              <Badge v-if="isOverdue(keyItem)" variant="destructive">
                Overdue
              </Badge>
            </div>
          </TableCell>
          <TableCell>
            <div v-if="getHolder(keyItem)" class="flex items-center gap-1.5">
              <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                {{ getHolder(keyItem)!.initials }}
              </span>
              <span class="text-sm">{{ getHolder(keyItem)!.name }}</span>
            </div>
            <span v-else class="text-muted-foreground">—</span>
          </TableCell>
          <TableCell>
            <span v-if="keyItem.status === 'available'" class="text-sm">
              {{ keyItem.location === 'key_box' ? 'Key box' : 'Office' }}
            </span>
            <span v-else class="text-muted-foreground">—</span>
          </TableCell>
          <TableCell class="text-muted-foreground">
            <span v-if="keyItem.checkedOutAt">{{ timeAgo(keyItem.checkedOutAt) }}</span>
            <span v-else>—</span>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" class="h-8 w-8">
                  <Icon name="lucide:more-horizontal" class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-44">
                <DropdownMenuItem v-if="keyItem.status === 'available'" class="gap-2" @click="emit('checkout', keyItem)">
                  <Icon name="lucide:log-out" class="size-4" /> Check out
                </DropdownMenuItem>
                <DropdownMenuItem v-if="keyItem.status === 'checked_out'" class="gap-2" @click="emit('return', keyItem)">
                  <Icon name="lucide:undo-2" class="size-4" /> Return
                </DropdownMenuItem>
                <DropdownMenuItem v-if="keyItem.status !== 'lost'" class="gap-2" @click="emit('lost', keyItem)">
                  <Icon name="lucide:triangle-alert" class="size-4" /> Mark lost
                </DropdownMenuItem>
                <DropdownMenuItem v-if="keyItem.status === 'lost'" class="gap-2" :disabled="!!keyItem.replacedByKeyId" @click="emit('replace', keyItem)">
                  <Icon name="lucide:refresh-ccw" class="size-4" /> {{ keyItem.replacedByKeyId ? 'Replaced' : 'Replace' }}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="gap-2" @click="emit('history', keyItem)">
                  <Icon name="lucide:history" class="size-4" /> View history
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        <TableRow v-if="!keys.length">
          <TableCell :colspan="7" class="h-24 text-center text-muted-foreground">
            No keys found.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
```

- [ ] **Step 2: Verify lint**

Run: `npx eslint app/components/key-management/KeyTable.vue`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/components/key-management/KeyTable.vue
git commit -m "feat(key-management): add key table with row actions"
```

---

### Task 7: Dialogs and history sheet

**Files:**
- Create: `app/components/key-management/KeyRegisterDialog.vue`
- Create: `app/components/key-management/KeyCheckoutDialog.vue`
- Create: `app/components/key-management/KeyLostDialog.vue`
- Create: `app/components/key-management/KeyHistorySheet.vue`

- [ ] **Step 1: Create `KeyRegisterDialog.vue`**

```vue
<script setup lang="ts">
import type { KeyType } from './data/keys'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { listings } from '~/components/listings/data/listings'
import { useKeyManagement } from '~/composables/useKeyManagement'
import { keyTypeLabels } from './data/keys'

const { open } = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { registerKey, keyBoxes } = useKeyManagement()

const listingId = ref('')
const type = ref<KeyType | ''>('')
const label = ref('')
const copies = ref(1)
const location = ref<'office' | 'key_box'>('office')
const keyBoxId = ref('')

watch(() => open, (val) => {
  if (val) {
    listingId.value = ''
    type.value = ''
    label.value = ''
    copies.value = 1
    location.value = 'office'
    keyBoxId.value = ''
  }
})

const typeOptions = computed(() =>
  Object.entries(keyTypeLabels).map(([value, label]) => ({ value, label })),
)

const boxesForListing = computed(() =>
  keyBoxes.value.filter(b => b.listingId === listingId.value),
)

const canSubmit = computed(() => {
  if (!listingId.value || !type.value || copies.value < 1)
    return false
  if (location.value === 'key_box' && !keyBoxId.value)
    return false
  return true
})

function handleSubmit() {
  if (!canSubmit.value)
    return
  const result = registerKey({
    listingId: listingId.value,
    type: type.value as KeyType,
    label: label.value.trim() || undefined,
    copies: copies.value,
    location: location.value,
    keyBoxId: location.value === 'key_box' ? keyBoxId.value : undefined,
  })
  if (!result.success) {
    toast.error(result.error ?? 'Failed to register key.')
    return
  }
  const count = result.keys!.length
  toast.success(`${count} key ${count > 1 ? 'copies' : 'copy'} registered.`)
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Register keys</DialogTitle>
        <DialogDescription>
          Add physical key copies for a listing.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="reg-listing">Listing</Label>
          <Select v-model="listingId">
            <SelectTrigger id="reg-listing">
              <SelectValue placeholder="Select listing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="l in listings" :key="l.id" :value="l.id">
                {{ l.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="reg-type">Key type</Label>
          <Select v-model="type">
            <SelectTrigger id="reg-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="reg-label">Label (optional)</Label>
          <Input id="reg-label" v-model="label" placeholder="e.g. Kitchen door" />
        </div>

        <div class="space-y-2">
          <Label for="reg-copies">Copies</Label>
          <Input id="reg-copies" v-model.number="copies" type="number" min="1" max="20" />
        </div>

        <div class="space-y-2">
          <Label>Storage location</Label>
          <RadioGroup v-model="location" class="space-y-2">
            <div class="flex items-center gap-2">
              <RadioGroupItem id="loc-office" value="office" />
              <Label for="loc-office" class="cursor-pointer text-sm font-normal">Office / storage</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem id="loc-keybox" value="key_box" />
              <Label for="loc-keybox" class="cursor-pointer text-sm font-normal">Key box at the property</Label>
            </div>
          </RadioGroup>
        </div>

        <div v-if="location === 'key_box'" class="space-y-2">
          <Label for="reg-keybox">Key box</Label>
          <Select v-if="boxesForListing.length" v-model="keyBoxId">
            <SelectTrigger id="reg-keybox">
              <SelectValue placeholder="Select key box" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="box in boxesForListing" :key="box.id" :value="box.id">
                {{ box.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-else class="text-sm text-muted-foreground">
            No key boxes for this listing yet — add one in the Key Boxes tab.
          </p>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button :disabled="!canSubmit" @click="handleSubmit">
          Register
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

- [ ] **Step 2: Create `KeyCheckoutDialog.vue`**

```vue
<script setup lang="ts">
import type { PhysicalKey } from './data/keys'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { staffMembers } from '~/components/inbox/data/conversations'
import { useKeyManagement } from '~/composables/useKeyManagement'
import { getKeyDisplayName } from './data/keys'

const { open, keyItem } = defineProps<{
  open: boolean
  keyItem: PhysicalKey | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { checkoutKey, checkOverdueKeys } = useKeyManagement()

const staffId = ref('')
const expectedReturn = ref('')
const note = ref('')

watch(() => open, (val) => {
  if (val) {
    staffId.value = ''
    expectedReturn.value = ''
    note.value = ''
  }
})

const canSubmit = computed(() => !!staffId.value)

const keyName = computed(() => keyItem ? getKeyDisplayName(keyItem) : '')

function handleSubmit() {
  if (!keyItem || !canSubmit.value)
    return
  const iso = expectedReturn.value ? new Date(expectedReturn.value).toISOString() : undefined
  const result = checkoutKey(keyItem.id, staffId.value, iso, note.value.trim() || undefined)
  if (!result.success) {
    toast.error(result.error ?? 'Checkout failed.')
    return
  }
  checkOverdueKeys()
  const staffName = staffMembers.find(s => s.id === staffId.value)?.name
  toast.success(`${keyName.value} checked out to ${staffName}.`)
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Check out key</DialogTitle>
        <DialogDescription>
          {{ keyName }} — assign it to a staff member.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="checkout-staff">Staff member</Label>
          <Select v-model="staffId">
            <SelectTrigger id="checkout-staff">
              <SelectValue placeholder="Select staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="s in staffMembers" :key="s.id" :value="s.id">
                {{ s.name }} · {{ s.role }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="checkout-expected">Expected return (optional)</Label>
          <Input id="checkout-expected" v-model="expectedReturn" type="datetime-local" />
          <p class="text-xs text-muted-foreground">
            Leave empty for 24 hours from now. Overdue keys trigger an alert.
          </p>
        </div>

        <div class="space-y-2">
          <Label for="checkout-note">Note (optional)</Label>
          <Textarea id="checkout-note" v-model="note" placeholder="e.g. Guest lockout assistance" class="min-h-[80px] text-sm" />
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button :disabled="!canSubmit" @click="handleSubmit">
          Check out
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

- [ ] **Step 3: Create `KeyLostDialog.vue`**

```vue
<script setup lang="ts">
import type { PhysicalKey } from './data/keys'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { useKeyManagement } from '~/composables/useKeyManagement'
import { getKeyDisplayName } from './data/keys'

const { open, keyItem } = defineProps<{
  open: boolean
  keyItem: PhysicalKey | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { markKeyLost, replaceKey } = useKeyManagement()

const note = ref('')
const replaceNow = ref(true)

watch(() => open, (val) => {
  if (val) {
    note.value = ''
    replaceNow.value = true
  }
})

const keyName = computed(() => keyItem ? getKeyDisplayName(keyItem) : '')

function handleSubmit() {
  if (!keyItem)
    return
  const lostResult = markKeyLost(keyItem.id, note.value.trim() || undefined)
  if (!lostResult.success) {
    toast.error(lostResult.error ?? 'Failed to mark key as lost.')
    return
  }
  if (replaceNow.value) {
    const replaceResult = replaceKey(keyItem.id)
    if (replaceResult.success)
      toast.success(`${keyName.value} marked lost — replacement registered.`)
    else
      toast.error(replaceResult.error ?? 'Key marked lost, but replacement failed.')
  }
  else {
    toast.success(`${keyName.value} marked as lost.`)
  }
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Mark key as lost</DialogTitle>
        <DialogDescription>
          {{ keyName }} — this ends its custody. You can register a replacement right away.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="lost-note">Note (optional)</Label>
          <Textarea id="lost-note" v-model="note" placeholder="e.g. Lost during cleaning round" class="min-h-[80px] text-sm" />
        </div>

        <label class="flex cursor-pointer items-center gap-2">
          <Checkbox v-model="replaceNow" />
          <span class="text-sm">Register a replacement copy now</span>
        </label>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button variant="destructive" @click="handleSubmit">
          Mark lost
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

- [ ] **Step 4: Create `KeyHistorySheet.vue`**

```vue
<script setup lang="ts">
import type { KeyEventAction, PhysicalKey } from './data/keys'
import { formatDistanceToNow } from 'date-fns'
import { computed } from 'vue'
import { staffMembers } from '~/components/inbox/data/conversations'
import { useKeyManagement } from '~/composables/useKeyManagement'
import { getKeyDisplayName, keyEventLabels } from './data/keys'

const { open, keyItem } = defineProps<{
  open: boolean
  keyItem: PhysicalKey | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { getEventsForKey } = useKeyManagement()

const events = computed(() => (keyItem ? getEventsForKey(keyItem.id) : []))

const keyName = computed(() => keyItem ? getKeyDisplayName(keyItem) : '')

function staffName(id?: string) {
  if (!id)
    return null
  return staffMembers.find(s => s.id === id)?.name ?? id
}

function actionBadgeVariant(action: KeyEventAction) {
  switch (action) {
    case 'register': return 'secondary'
    case 'checkout': return 'default'
    case 'return': return 'outline'
    case 'mark_lost': return 'destructive'
    case 'replace': return 'secondary'
  }
}

function timeAgo(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}
</script>

<template>
  <Sheet :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <SheetContent side="right" class="w-full sm:max-w-md">
      <SheetHeader>
        <SheetTitle>Key history</SheetTitle>
        <SheetDescription>
          {{ keyName }}
        </SheetDescription>
      </SheetHeader>

      <div class="mt-6 space-y-4 overflow-y-auto">
        <div v-for="event in events" :key="event.id" class="flex gap-3">
          <div class="mt-0.5">
            <Badge :variant="actionBadgeVariant(event.action)">
              {{ keyEventLabels[event.action] }}
            </Badge>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm">
              <template v-if="staffName(event.staffId)">
                {{ staffName(event.staffId) }}
                <span class="text-muted-foreground">· recorded by {{ staffName(event.actorStaffId) }}</span>
              </template>
              <template v-else>
                Recorded by {{ staffName(event.actorStaffId) }}
              </template>
            </p>
            <p v-if="event.note" class="mt-0.5 text-sm text-muted-foreground">
              {{ event.note }}
            </p>
            <p class="mt-0.5 text-xs text-muted-foreground">
              {{ timeAgo(event.at) }}
            </p>
          </div>
        </div>
        <p v-if="!events.length" class="text-sm text-muted-foreground">
          No events yet.
        </p>
      </div>
    </SheetContent>
  </Sheet>
</template>
```

- [ ] **Step 5: Verify lint**

Run: `npx eslint app/components/key-management/`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add app/components/key-management/
git commit -m "feat(key-management): add register/checkout/lost dialogs and history sheet"
```

---

### Task 8: Key box components and activity timeline

**Files:**
- Create: `app/components/key-management/KeyBoxCard.vue`
- Create: `app/components/key-management/KeyBoxDialog.vue`
- Create: `app/components/key-management/KeyActivityTimeline.vue`

- [ ] **Step 1: Create `KeyBoxCard.vue`**

```vue
<script setup lang="ts">
import type { KeyBox } from './data/keys'
import { computed, ref } from 'vue'
import { listings } from '~/components/listings/data/listings'
import { useKeyManagement } from '~/composables/useKeyManagement'

const { keyBox } = defineProps<{
  keyBox: KeyBox
}>()

const emit = defineEmits<{
  edit: [keyBox: KeyBox]
  remove: [keyBox: KeyBox]
}>()

const { getKeysInBox } = useKeyManagement()

const showPin = ref(false)

const storedKeys = computed(() => getKeysInBox(keyBox.id))
const listingName = computed(() =>
  listings.value.find(l => l.id === keyBox.listingId)?.name ?? keyBox.listingId,
)
const maskedPin = computed(() => '•'.repeat(keyBox.pin.length))
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <CardTitle class="text-base">
            {{ keyBox.name }}
          </CardTitle>
          <CardDescription class="line-clamp-1">
            {{ listingName }}
          </CardDescription>
        </div>
        <Badge variant="secondary">
          {{ storedKeys.length }} {{ storedKeys.length === 1 ? 'key' : 'keys' }}
        </Badge>
      </div>
    </CardHeader>
    <CardContent class="space-y-2 text-sm">
      <div class="flex items-start gap-2">
        <Icon name="lucide:map-pin" class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span>{{ keyBox.location }}</span>
      </div>
      <div class="flex items-center gap-2">
        <Icon name="lucide:lock" class="size-4 shrink-0 text-muted-foreground" />
        <span class="font-mono">{{ showPin ? keyBox.pin : maskedPin }}</span>
        <Button variant="ghost" size="icon" class="h-6 w-6" @click="showPin = !showPin">
          <Icon :name="showPin ? 'lucide:eye-off' : 'lucide:eye'" class="size-3.5" />
        </Button>
      </div>
      <p v-if="keyBox.notes" class="text-muted-foreground">
        {{ keyBox.notes }}
      </p>
    </CardContent>
    <CardFooter class="gap-2">
      <Button variant="outline" size="sm" class="gap-1.5" @click="emit('edit', keyBox)">
        <Icon name="lucide:pencil" class="size-3.5" /> Edit
      </Button>
      <Button variant="ghost" size="sm" class="gap-1.5 text-destructive hover:text-destructive" @click="emit('remove', keyBox)">
        <Icon name="lucide:trash-2" class="size-3.5" /> Remove
      </Button>
    </CardFooter>
  </Card>
</template>
```

- [ ] **Step 2: Create `KeyBoxDialog.vue`**

```vue
<script setup lang="ts">
import type { KeyBox } from './data/keys'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { listings } from '~/components/listings/data/listings'
import { useKeyManagement } from '~/composables/useKeyManagement'

const { open, keyBox } = defineProps<{
  open: boolean
  keyBox: KeyBox | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { addKeyBox, updateKeyBox } = useKeyManagement()

const listingId = ref('')
const name = ref('')
const location = ref('')
const pin = ref('')
const notes = ref('')

watch(() => open, (val) => {
  if (val) {
    listingId.value = keyBox?.listingId ?? ''
    name.value = keyBox?.name ?? ''
    location.value = keyBox?.location ?? ''
    pin.value = keyBox?.pin ?? ''
    notes.value = keyBox?.notes ?? ''
  }
})

const isEdit = computed(() => keyBox !== null)

const canSubmit = computed(() =>
  !!listingId.value && !!name.value.trim() && !!location.value.trim() && !!pin.value.trim(),
)

function handleSubmit() {
  if (!canSubmit.value)
    return
  if (isEdit.value) {
    const result = updateKeyBox(keyBox!.id, {
      listingId: listingId.value,
      name: name.value.trim(),
      location: location.value.trim(),
      pin: pin.value.trim(),
      notes: notes.value.trim() || undefined,
    })
    if (!result.success) {
      toast.error(result.error ?? 'Failed to update key box.')
      return
    }
    toast.success('Key box updated.')
  }
  else {
    const result = addKeyBox({
      listingId: listingId.value,
      name: name.value,
      location: location.value,
      pin: pin.value,
      notes: notes.value,
    })
    if (!result.success) {
      toast.error(result.error ?? 'Failed to add key box.')
      return
    }
    toast.success('Key box added.')
  }
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ isEdit ? 'Edit key box' : 'Add key box' }}</DialogTitle>
        <DialogDescription>
          A lockbox at the property for self check-in and key storage.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="kb-listing">Listing</Label>
          <Select v-model="listingId">
            <SelectTrigger id="kb-listing">
              <SelectValue placeholder="Select listing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="l in listings" :key="l.id" :value="l.id">
                {{ l.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="kb-name">Name</Label>
          <Input id="kb-name" v-model="name" placeholder="e.g. Front gate lockbox" />
        </div>

        <div class="space-y-2">
          <Label for="kb-location">Location</Label>
          <Input id="kb-location" v-model="location" placeholder="e.g. Mounted on the left gate pillar" />
        </div>

        <div class="space-y-2">
          <Label for="kb-pin">PIN code</Label>
          <Input id="kb-pin" v-model="pin" placeholder="e.g. 4821" />
        </div>

        <div class="space-y-2">
          <Label for="kb-notes">Notes (optional)</Label>
          <Textarea id="kb-notes" v-model="notes" placeholder="e.g. Code changes monthly" class="min-h-[60px] text-sm" />
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button :disabled="!canSubmit" @click="handleSubmit">
          {{ isEdit ? 'Save changes' : 'Add key box' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

- [ ] **Step 3: Create `KeyActivityTimeline.vue`**

```vue
<script setup lang="ts">
import type { KeyEventAction } from './data/keys'
import { formatDistanceToNow } from 'date-fns'
import { staffMembers } from '~/components/inbox/data/conversations'
import { listings } from '~/components/listings/data/listings'
import { useKeyManagement } from '~/composables/useKeyManagement'
import { getKeyDisplayName, keyEventLabels } from './data/keys'

const { sortedEvents, getKeyById } = useKeyManagement()

function staffName(id?: string) {
  if (!id)
    return null
  return staffMembers.find(s => s.id === id)?.name ?? id
}

function keyName(keyId: string) {
  const key = getKeyById(keyId)
  return key ? getKeyDisplayName(key) : keyId
}

function listingName(keyId: string) {
  const key = getKeyById(keyId)
  if (!key)
    return ''
  return listings.value.find(l => l.id === key.listingId)?.name ?? key.listingId
}

function actionBadgeVariant(action: KeyEventAction) {
  switch (action) {
    case 'register': return 'secondary'
    case 'checkout': return 'default'
    case 'return': return 'outline'
    case 'mark_lost': return 'destructive'
    case 'replace': return 'secondary'
  }
}

function timeAgo(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}
</script>

<template>
  <div class="space-y-4">
    <div v-for="event in sortedEvents" :key="event.id" class="flex gap-3 rounded-lg border p-3">
      <div class="mt-0.5">
        <Badge :variant="actionBadgeVariant(event.action)">
          {{ keyEventLabels[event.action] }}
        </Badge>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium">
          {{ keyName(event.keyId) }}
          <span class="font-normal text-muted-foreground">· {{ listingName(event.keyId) }}</span>
        </p>
        <p class="text-sm text-muted-foreground">
          <template v-if="staffName(event.staffId)">
            {{ staffName(event.staffId) }} · recorded by {{ staffName(event.actorStaffId) }}
          </template>
          <template v-else>
            Recorded by {{ staffName(event.actorStaffId) }}
          </template>
        </p>
        <p v-if="event.note" class="mt-0.5 text-sm">
          {{ event.note }}
        </p>
        <p class="mt-0.5 text-xs text-muted-foreground">
          {{ timeAgo(event.at) }}
        </p>
      </div>
    </div>
    <p v-if="!sortedEvents.length" class="py-8 text-center text-sm text-muted-foreground">
      No activity yet.
    </p>
  </div>
</template>
```

- [ ] **Step 4: Verify lint**

Run: `npx eslint app/components/key-management/`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add app/components/key-management/
git commit -m "feat(key-management): add key box card/dialog and activity timeline"
```

---

### Task 9: Key Management page

**Files:**
- Create: `app/pages/key-management/index.vue`

- [ ] **Step 1: Create the page**

```vue
<script setup lang="ts">
import type { KeyBox, PhysicalKey } from '~/components/key-management/data/keys'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getKeyDisplayName, keyTypeLabels } from '~/components/key-management/data/keys'
import KeyActivityTimeline from '~/components/key-management/KeyActivityTimeline.vue'
import KeyBoxCard from '~/components/key-management/KeyBoxCard.vue'
import KeyBoxDialog from '~/components/key-management/KeyBoxDialog.vue'
import KeyCheckoutDialog from '~/components/key-management/KeyCheckoutDialog.vue'
import KeyHistorySheet from '~/components/key-management/KeyHistorySheet.vue'
import KeyLostDialog from '~/components/key-management/KeyLostDialog.vue'
import KeyRegisterDialog from '~/components/key-management/KeyRegisterDialog.vue'
import KeyTable from '~/components/key-management/KeyTable.vue'
import { listings } from '~/components/listings/data/listings'
import { useKeyManagement } from '~/composables/useKeyManagement'

const {
  filteredKeys,
  stats,
  filters,
  keyBoxes,
  isOverdue,
  returnKey,
  replaceKey,
  removeKeyBox,
  checkOverdueKeys,
} = useKeyManagement()

onMounted(() => {
  checkOverdueKeys()
})

// --- Dialog/sheet targets ---
const registerOpen = ref(false)
const checkoutTarget = ref<PhysicalKey | null>(null)
const lostTarget = ref<PhysicalKey | null>(null)
const historyTarget = ref<PhysicalKey | null>(null)
const keyBoxDialogOpen = ref(false)
const keyBoxEditTarget = ref<KeyBox | null>(null)

const checkoutOpen = computed({
  get: () => checkoutTarget.value !== null,
  set: (val: boolean) => { if (!val) checkoutTarget.value = null },
})
const lostOpen = computed({
  get: () => lostTarget.value !== null,
  set: (val: boolean) => { if (!val) lostTarget.value = null },
})
const historyOpen = computed({
  get: () => historyTarget.value !== null,
  set: (val: boolean) => { if (!val) historyTarget.value = null },
})

// --- Row action handlers ---
function handleReturn(key: PhysicalKey) {
  const result = returnKey(key.id)
  if (result.success)
    toast.success(`${getKeyDisplayName(key)} returned.`)
  else
    toast.error(result.error ?? 'Failed to return key.')
}

function handleReplace(key: PhysicalKey) {
  const result = replaceKey(key.id)
  if (result.success)
    toast.success(`Replacement registered: ${getKeyDisplayName(result.key!)}.`)
  else
    toast.error(result.error ?? 'Failed to replace key.')
}

// --- Key box handlers ---
function openAddKeyBox() {
  keyBoxEditTarget.value = null
  keyBoxDialogOpen.value = true
}

function openEditKeyBox(box: KeyBox) {
  keyBoxEditTarget.value = box
  keyBoxDialogOpen.value = true
}

function handleRemoveKeyBox(box: KeyBox) {
  const result = removeKeyBox(box.id)
  if (result.success)
    toast.success(`Key box "${box.name}" removed.`)
  else
    toast.error(result.error ?? 'Failed to remove key box.')
}

// --- Filters ---
const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Checked out', value: 'checked_out' },
  { label: 'Lost', value: 'lost' },
]

const typeOptions = computed(() => [
  { label: 'All types', value: 'all' },
  ...Object.entries(keyTypeLabels).map(([value, label]) => ({ value, label })),
])

const listingPopoverOpen = ref(false)
const listingSearch = ref('')

const filteredListingsForFilter = computed(() => {
  const query = listingSearch.value.trim().toLowerCase()
  return listings.value.filter(l => !query || l.name.toLowerCase().includes(query))
})

function toggleListing(listingId: string) {
  if (filters.value.listings.includes(listingId))
    filters.value.listings = filters.value.listings.filter(id => id !== listingId)
  else
    filters.value.listings = [...filters.value.listings, listingId]
}

const hasActiveFilters = computed(() =>
  filters.value.search
  || filters.value.status !== 'all'
  || filters.value.type !== 'all'
  || filters.value.listings.length > 0,
)

function clearAllFilters() {
  filters.value.search = ''
  filters.value.status = 'all'
  filters.value.type = 'all'
  filters.value.listings = []
  listingSearch.value = ''
}

const activeTab = ref('keys')
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          Key Management
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ stats.checkedOut }} checked out · {{ stats.overdue }} overdue · {{ stats.lost }} lost
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" class="gap-2" @click="openAddKeyBox">
          <Icon name="lucide:package-plus" class="size-4" />
          Add Key Box
        </Button>
        <Button class="gap-2" @click="registerOpen = true">
          <Icon name="lucide:plus" class="size-4" />
          Register Key
        </Button>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Total Keys</CardDescription>
          <CardTitle class="text-2xl">{{ stats.total }}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Available</CardDescription>
          <CardTitle class="text-2xl">{{ stats.available }}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Checked Out</CardDescription>
          <CardTitle class="text-2xl">
            {{ stats.checkedOut }}
            <span v-if="stats.overdue" class="text-sm font-normal text-destructive">
              {{ stats.overdue }} overdue
            </span>
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Lost</CardDescription>
          <CardTitle class="text-2xl">{{ stats.lost }}</CardTitle>
        </CardHeader>
      </Card>
    </div>

    <Tabs v-model="activeTab">
      <TabsList>
        <TabsTrigger value="keys">
          Keys
        </TabsTrigger>
        <TabsTrigger value="boxes">
          Key Boxes
        </TabsTrigger>
        <TabsTrigger value="activity">
          Activity
        </TabsTrigger>
      </TabsList>

      <TabsContent value="keys" class="mt-6 space-y-4">
        <div class="flex flex-wrap items-center gap-3">
          <!-- Search -->
          <div class="relative min-w-[200px] max-w-xs flex-1">
            <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="filters.search" placeholder="Search keys..." class="pl-9" />
          </div>

          <!-- Status -->
          <Select v-model="filters.status">
            <SelectTrigger class="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- Type -->
          <Select v-model="filters.type">
            <SelectTrigger class="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- Listing filter -->
          <Popover v-model:open="listingPopoverOpen">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="h-9 gap-1.5 px-3"
                :class="filters.listings.length ? 'border-primary text-primary hover:bg-primary/10' : ''"
              >
                <Icon name="lucide:building-2" class="size-4" />
                Listings
                <Badge v-if="filters.listings.length" variant="default" class="ml-0.5 h-4 px-1 text-[10px]">
                  {{ filters.listings.length }}
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-72 p-0" align="start">
              <div class="border-b p-2">
                <Input v-model="listingSearch" placeholder="Search listings..." class="h-8 text-sm" />
              </div>
              <div class="max-h-56 overflow-auto p-1">
                <button
                  v-for="l in filteredListingsForFilter"
                  :key="l.id"
                  type="button"
                  class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  @click="toggleListing(l.id)"
                >
                  <Checkbox :model-value="filters.listings.includes(l.id)" class="size-3.5" />
                  <span class="line-clamp-1">{{ l.name }}</span>
                </button>
                <p v-if="!filteredListingsForFilter.length" class="px-2 py-3 text-sm text-muted-foreground">
                  No listings found.
                </p>
              </div>
              <div v-if="filters.listings.length" class="border-t p-2">
                <Button variant="ghost" size="sm" class="h-6 text-xs text-muted-foreground" @click="filters.listings = []">
                  Clear all
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <!-- Clear all -->
          <Button v-if="hasActiveFilters" variant="ghost" class="h-9 text-xs" @click="clearAllFilters">
            Clear all
          </Button>
        </div>

        <KeyTable
          :keys="filteredKeys"
          :is-overdue="isOverdue"
          @checkout="checkoutTarget = $event"
          @return="handleReturn"
          @lost="lostTarget = $event"
          @replace="handleReplace"
          @history="historyTarget = $event"
        />
      </TabsContent>

      <TabsContent value="boxes" class="mt-6">
        <div v-if="keyBoxes.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KeyBoxCard
            v-for="box in keyBoxes"
            :key="box.id"
            :key-box="box"
            @edit="openEditKeyBox"
            @remove="handleRemoveKeyBox"
          />
        </div>
        <div v-else class="flex flex-col items-center gap-3 rounded-lg border py-12 text-center">
          <Icon name="lucide:package-open" class="size-8 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">
            No key boxes yet. Add one to track lockbox locations and PINs.
          </p>
          <Button variant="outline" class="gap-2" @click="openAddKeyBox">
            <Icon name="lucide:plus" class="size-4" />
            Add Key Box
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="activity" class="mt-6">
        <KeyActivityTimeline />
      </TabsContent>
    </Tabs>

    <KeyRegisterDialog v-model:open="registerOpen" />
    <KeyCheckoutDialog v-model:open="checkoutOpen" :key-item="checkoutTarget" />
    <KeyLostDialog v-model:open="lostOpen" :key-item="lostTarget" />
    <KeyHistorySheet v-model:open="historyOpen" :key-item="historyTarget" />
    <KeyBoxDialog v-model:open="keyBoxDialogOpen" :key-box="keyBoxEditTarget" />
  </div>
</template>
```

- [ ] **Step 2: Verify lint**

Run: `npx eslint app/pages/key-management/index.vue`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/pages/key-management/index.vue
git commit -m "feat(key-management): add key management page"
```

---

### Task 10: Final verification and docs

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass, including 17 key-management tests (15 in `tests/composables/useKeyManagement.spec.ts` + 2 in `tests/utils/key-alert.spec.ts`)

- [ ] **Step 2: Run lint on the whole repo**

Run: `npm run lint`
Expected: no errors (fix any in files touched by this feature only — do not fix pre-existing issues elsewhere)

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: build succeeds. Known pre-existing type issues (`JourneyStatus` 'draft' in `pages/journeys/index.vue`) do not block the build.

- [ ] **Step 4: Update `AGENTS.md`**

Insert this section into `AGENTS.md` right after the "### Payment Request Module" section:

```md
### Key Management Module (`app/components/key-management/`)

- **Data + types**: `app/components/key-management/data/keys.ts`
  - `PhysicalKey` — one record per key copy (`status: 'available' | 'checked_out' | 'lost'`, `holderStaffId`, `expectedReturnAt`, `location: 'office' | 'key_box'`, `replacedByKeyId`)
  - `KeyEvent` — handover/lifecycle log (`action: 'register' | 'checkout' | 'return' | 'mark_lost' | 'replace'`, `staffId`, `actorStaffId` = current user `staff-2`)
  - `KeyBox` — lockbox per listing (`name`, `location`, `pin`, `notes`)
  - Display maps: `keyTypeLabels`, `keyTypeIcons`, `keyEventLabels`; helpers `getKeyDisplayName()`, `nextCopyNumber()`
- **State**: `app/composables/useKeyManagement.ts`
  - `keys`, `keyEvents`, `keyBoxes` use `useState` — mutations use spread syntax
  - Actions: `registerKey()` (N copies), `checkoutKey()` (default +24h expected return), `returnKey()`, `markKeyLost()`, `replaceKey()` (links `replacedByKeyId`), key box CRUD, `checkOverdueKeys()`
  - Overdue keys (checked out past `expectedReturnAt`) → `KEY_NOT_RETURNED` alert (WARNING, deduped per key, resolved on return/mark-lost)
- **Page**: `app/pages/key-management/index.vue` — stats cards, filter bar (search, status, type, listing popover), tabs: Keys | Key Boxes | Activity
- **Components**: `KeyTable.vue` (row per copy + row actions), `KeyRegisterDialog.vue`, `KeyCheckoutDialog.vue`, `KeyLostDialog.vue` (with replace option), `KeyHistorySheet.vue`, `KeyBoxCard.vue` + `KeyBoxDialog.vue`, `KeyActivityTimeline.vue`
```

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md
git commit -m "docs: document key management module in AGENTS.md"
```

---

## Manual smoke checklist (after Task 10)

1. `npm run dev`, open `/key-management` via the new sidebar item (General group, key icon, "New" badge).
2. Keys tab: 12 rows; "Main Door #1" shows a red Overdue badge; notification center (bell in header) has a "Key - Not Returned" warning that navigates to `/key-management`.
3. Check out an available key without an expected return → toast success, status flips to Checked out, stats update.
4. Return "Main Door #1" → Overdue badge disappears, the KEY_NOT_RETURNED alert resolves (no longer unread in the bell).
5. Mark a key lost with "Register a replacement copy now" checked → new copy appears with the next copy number; old copy shows "Replaced" (disabled) in its row menu.
6. View history on "Main Door #2" (lst-8) → register → checkout → lost chain visible.
7. Key Boxes tab: 3 cards, PIN masked with eye toggle; remove "Front gate lockbox" → error toast (holds a key).
8. Activity tab: global feed newest-first.
