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
