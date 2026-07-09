import { computed } from 'vue'
import { useNotifications } from '~/composables/useNotifications'

export type SeamProvider = 'seam' | 'igloohome' | 'august' | 'yale' | 'nuki' | 'schlage'

export type SeamConnectionStatus = 'connected' | 'disconnected' | 'pending' | 'error'

export interface SeamConnection {
  id: string
  apiKey: string
  workspaceName: string
  status: SeamConnectionStatus
  webhookToken: string
  webhookUrl: string
  deviceCount: number
  connectedAt: string
  lastSyncAt: string | null
}

export interface SeamDevice {
  deviceId: string
  name: string
  deviceType: string
  provider: SeamProvider
  model: string
  batteryLevel: number
  online: boolean
  paired: boolean
}

export interface SmartLock {
  id: string
  seamDeviceId: string
  name: string
  assignment: 'property' | 'room'
  listingId: string
  unitId?: string
  isMain: boolean
  batteryLevel: number
  online: boolean
  lastSeen?: string
  status: 'active' | 'inactive' | 'error'
  createdAt: string
}

export interface AccessCode {
  id: string
  lockId: string
  code: string
  startsAt: string
  endsAt: string
  guestName?: string
  reservationId?: string
  status: 'active' | 'expired' | 'revoked'
  seamCodeId: string
}

const CONNECTION_KEY = 'elev8-seam-connection'
const LOCKS_KEY = 'elev8-smart-locks'
const CODES_KEY = 'elev8-smart-lock-codes'

const MOCK_DEVICES: SeamDevice[] = [
  { deviceId: 'seam-dev-001', name: 'Front Door', deviceType: 'lock', provider: 'august', model: 'August Wi-Fi Smart Lock (4th Gen)', batteryLevel: 87, online: true, paired: false },
  { deviceId: 'seam-dev-002', name: 'Back Gate', deviceType: 'lock', provider: 'igloohome', model: 'igloohome Smart Deadbolt 2S', batteryLevel: 62, online: true, paired: false },
  { deviceId: 'seam-dev-003', name: 'Pool Gate', deviceType: 'lock', provider: 'yale', model: 'Yale Assure Lock 2', batteryLevel: 12, online: false, paired: false },
  { deviceId: 'seam-dev-004', name: 'Side Door', deviceType: 'lock', provider: 'nuki', model: 'Nuki Smart Lock 4.0', batteryLevel: 95, online: true, paired: false },
  { deviceId: 'seam-dev-005', name: 'Safe', deviceType: 'lock', provider: 'schlage', model: 'Schlage Encode Plus', batteryLevel: 78, online: true, paired: false },
]

function loadFromStorage<T>(key: string, fallback: T): T {
  if (import.meta.client) {
    try {
      const raw = localStorage.getItem(key)
      if (raw)
        return JSON.parse(raw) as T
    }
    catch { /* ignore */ }
  }
  return fallback
}

function saveToStorage<T>(key: string, value: T) {
  if (import.meta.client) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    }
    catch { /* ignore */ }
  }
}

function randomCode(): string {
  return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('')
}

function generateWebhookToken(): string {
  return `whsec_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`
}

export function useSmartLock() {
  const connection = useState<SeamConnection | null>('seam-connection', () => loadFromStorage<SeamConnection | null>(CONNECTION_KEY, null))
  const locks = useState<SmartLock[]>('smart-locks', () => loadFromStorage<SmartLock[]>(LOCKS_KEY, []))
  const codes = useState<AccessCode[]>('smart-lock-codes', () => loadFromStorage<AccessCode[]>(CODES_KEY, []))

  watch(connection, (val) => {
    if (val) saveToStorage(CONNECTION_KEY, val)
    else if (import.meta.client) localStorage.removeItem(CONNECTION_KEY)
  }, { deep: true })

  watch(locks, (val) => { saveToStorage(LOCKS_KEY, val) }, { deep: true })
  watch(codes, (val) => { saveToStorage(CODES_KEY, val) }, { deep: true })

  const isConnected = computed(() => connection.value?.status === 'connected')

  const allDevices = computed<SeamDevice[]>(() => {
    if (!isConnected.value) return []
    return MOCK_DEVICES.map((d) => {
      const paired = locks.value.some(l => l.seamDeviceId === d.deviceId)
      return { ...d, paired }
    })
  })

  const availableDevices = computed(() => allDevices.value.filter(d => !d.paired))

  // --- Connection management ---

  async function validateAndConnect(apiKey: string, workspaceName: string): Promise<{ success: boolean, error?: string }> {
    await new Promise(r => setTimeout(r, 1500))
    if (!apiKey.trim()) return { success: false, error: 'API key is required.' }
    if (!apiKey.startsWith('seam_') && !apiKey.startsWith('sk_')) {
      return { success: false, error: 'Invalid API key format. Seam API keys start with "seam_" or "sk_".' }
    }
    const webhookToken = generateWebhookToken()
    connection.value = {
      id: `seam-${Date.now()}`,
      apiKey,
      workspaceName: workspaceName.trim() || 'My Workspace',
      status: 'connected',
      webhookToken,
      webhookUrl: `https://api.elev8.app/webhooks/seam/${webhookToken.slice(6)}`,
      deviceCount: MOCK_DEVICES.length,
      connectedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
    }
    return { success: true }
  }

  function disconnect() {
    connection.value = null
    locks.value = []
    codes.value = []
    if (import.meta.client) {
      localStorage.removeItem(CONNECTION_KEY)
      localStorage.removeItem(LOCKS_KEY)
      localStorage.removeItem(CODES_KEY)
    }
  }

  function syncDevices() {
    if (!connection.value) return
    connection.value = { ...connection.value, lastSyncAt: new Date().toISOString() }
    // Randomly nudge battery + online for realism
    locks.value = locks.value.map((l) => {
      const delta = Math.random() < 0.3 ? -1 : 0
      return {
        ...l,
        batteryLevel: Math.max(0, Math.min(100, l.batteryLevel + delta)),
        lastSeen: new Date().toISOString(),
      }
    })
  }

  // --- Lock CRUD ---

  function getLocksForListing(listingId: string): SmartLock[] {
    return locks.value.filter(l => l.listingId === listingId)
  }

  function getLocksForUnit(listingId: string, unitId: string): SmartLock[] {
    return locks.value.filter(l => l.listingId === listingId && l.unitId === unitId)
  }

  function getLockCount(listingId: string, unitId?: string): number {
    if (unitId) return getLocksForUnit(listingId, unitId).length
    return getLocksForListing(listingId).length
  }

  function getMainLock(listingId: string, unitId?: string): SmartLock | undefined {
    const candidates = unitId
      ? getLocksForUnit(listingId, unitId)
      : getLocksForListing(listingId).filter(l => l.assignment === 'property' || !l.unitId)
    return candidates.find(l => l.isMain) ?? candidates[0]
  }

  function pairLock(opts: {
    seamDeviceId: string
    name: string
    assignment: 'property' | 'room'
    listingId: string
    unitId?: string
    isMain?: boolean
  }): { success: boolean, error?: string, lock?: SmartLock } {
    const device = MOCK_DEVICES.find(d => d.deviceId === opts.seamDeviceId)
    if (!device) return { success: false, error: 'Device not found.' }
    if (locks.value.some(l => l.seamDeviceId === opts.seamDeviceId)) {
      return { success: false, error: 'This lock is already paired.' }
    }
    if (opts.isMain) {
      // Demote existing main in this scope
      locks.value = locks.value.map((l) => {
        if (l.listingId !== opts.listingId) return l
        if (opts.unitId ? l.unitId !== opts.unitId : l.assignment === 'property') {
          return { ...l, isMain: false }
        }
        return l
      })
    }
    const newLock: SmartLock = {
      id: `lock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      seamDeviceId: device.deviceId,
      name: opts.name || device.name,
      assignment: opts.assignment,
      listingId: opts.listingId,
      unitId: opts.assignment === 'room' ? opts.unitId : undefined,
      isMain: opts.isMain ?? false,
      batteryLevel: device.batteryLevel,
      online: device.online,
      lastSeen: new Date().toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    locks.value = [...locks.value, newLock]
    return { success: true, lock: newLock }
  }

  function unpairLock(lockId: string) {
    locks.value = locks.value.filter(l => l.id !== lockId)
    codes.value = codes.value.filter(c => c.lockId !== lockId)
  }

  function setMainLock(lockId: string) {
    const target = locks.value.find(l => l.id === lockId)
    if (!target) return
    locks.value = locks.value.map((l) => {
      const inScope = l.listingId === target.listingId
        && (target.unitId ? l.unitId === target.unitId : l.assignment === 'property' || !l.unitId)
      return inScope ? { ...l, isMain: l.id === lockId } : l
    })
  }

  function renameLock(lockId: string, name: string) {
    locks.value = locks.value.map(l => l.id === lockId ? { ...l, name } : l)
  }

  // --- Access codes ---

  function getCodesForLock(lockId: string): AccessCode[] {
    return codes.value.filter(c => c.lockId === lockId)
  }

  function getActiveCodeForLock(lockId: string): AccessCode | undefined {
    return codes.value.find(c => c.lockId === lockId && c.status === 'active')
  }

  function generateAccessCode(opts: {
    lockId: string
    startsAt?: string
    endsAt?: string
    guestName?: string
    reservationId?: string
  }): { success: boolean, error?: string, code?: AccessCode } {
    const lock = locks.value.find(l => l.id === opts.lockId)
    if (!lock) return { success: false, error: 'Lock not found.' }
    const startsAt = opts.startsAt ?? new Date().toISOString()
    const endsAt = opts.endsAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    // Revoke any existing active code on this lock
    codes.value = codes.value.map(c => c.lockId === opts.lockId && c.status === 'active'
      ? { ...c, status: 'revoked' }
      : c,
    )
    const newCode: AccessCode = {
      id: `code-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      lockId: opts.lockId,
      code: randomCode(),
      startsAt,
      endsAt,
      guestName: opts.guestName,
      reservationId: opts.reservationId,
      status: 'active',
      seamCodeId: `seam-code-${Math.random().toString(36).slice(2, 10)}`,
    }
    codes.value = [newCode, ...codes.value]
    return { success: true, code: newCode }
  }

  function revokeAccessCode(codeId: string) {
    codes.value = codes.value.map(c => c.id === codeId ? { ...c, status: 'revoked' } : c)
  }

  // --- Mock alert generator (for the 5 SMART_LOCK_* alert types) ---

  function emitMockAlerts() {
    if (!isConnected.value) return
    const notif = useNotifications()
    locks.value.forEach((lock) => {
      if (lock.batteryLevel <= 5) {
        notif.createAlert('SMART_LOCK_BATTERY_CRITICAL', 'CRITICAL', {
          listing_id: lock.listingId,
          lock_name: lock.name,
          battery: lock.batteryLevel,
        })
      }
      else if (lock.batteryLevel <= 20) {
        notif.createAlert('SMART_LOCK_BATTERY_LOW', 'WARNING', {
          listing_id: lock.listingId,
          lock_name: lock.name,
          battery: lock.batteryLevel,
        })
      }
      if (!lock.online) {
        notif.createAlert('SMART_LOCK_OFFLINE', 'CRITICAL', {
          listing_id: lock.listingId,
          lock_name: lock.name,
        })
      }
    })
  }

  return {
    connection,
    isConnected,
    locks,
    codes,
    allDevices,
    availableDevices,
    validateAndConnect,
    disconnect,
    syncDevices,
    getLocksForListing,
    getLocksForUnit,
    getLockCount,
    getMainLock,
    pairLock,
    unpairLock,
    setMainLock,
    renameLock,
    getCodesForLock,
    getActiveCodeForLock,
    generateAccessCode,
    revokeAccessCode,
    emitMockAlerts,
  }
}
