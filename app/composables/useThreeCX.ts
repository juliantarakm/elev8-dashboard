import { computed } from 'vue'

export type ThreeCxConnectionStatus = 'connected' | 'disconnected' | 'pending' | 'error'

export interface ExtensionMapping {
  staffId: string
  extensionNumber: string
}

export interface ThreeCxAccount {
  id: string
  fqdn: string
  displayName: string
  pbxVersion: string
  accessToken: string
  refreshToken?: string
  status: ThreeCxConnectionStatus
  connectedAt: string
  extensionMappings: ExtensionMapping[]
  webhookSubscriptions: string[]
}

export interface UnmatchedCall {
  id: string
  fromNumber: string
  toExtension: string
  timestamp: string
  status: 'completed' | 'missed' | 'voicemail'
  duration: number
  recording_url?: string
}

const STORAGE_KEY = 'elev8-threecx-accounts'
const UNMATCHED_KEY = 'elev8-threecx-unmatched-calls'

function loadFromStorage<T>(key: string, fallback: T): T {
  if (import.meta.client) {
    try {
      const raw = localStorage.getItem(key)
      if (raw)
        return JSON.parse(raw) as T
    } catch { /* ignore */ }
  }
  return fallback
}

function saveToStorage<T>(key: string, value: T) {
  if (import.meta.client) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch { /* ignore */ }
  }
}

export function useThreeCX() {
  const accounts = useState<ThreeCxAccount[]>('threecx-accounts', () => loadFromStorage<ThreeCxAccount[]>(STORAGE_KEY, []))
  const unmatchedCalls = useState<UnmatchedCall[]>('threecx-unmatched-calls', () => loadFromStorage<UnmatchedCall[]>(UNMATCHED_KEY, []))

  watch(accounts, (val) => {
    saveToStorage(STORAGE_KEY, val)
  }, { deep: true })

  watch(unmatchedCalls, (val) => {
    saveToStorage(UNMATCHED_KEY, val)
  }, { deep: true })

  const activeAccount = computed<ThreeCxAccount | undefined>(() => accounts.value.find(a => a.status === 'connected'))
  const isConnected = computed(() => !!activeAccount.value)

  function getExtensionForStaff(staffId: string): string | undefined {
    return activeAccount.value?.extensionMappings.find(m => m.staffId === staffId)?.extensionNumber
  }

  function getStaffForExtension(extensionNumber: string): string | undefined {
    return activeAccount.value?.extensionMappings.find(m => m.extensionNumber === extensionNumber)?.staffId
  }

  async function startOAuthFlow(fqdn: string): Promise<{ redirectUrl: string }> {
    await new Promise(resolve => setTimeout(resolve, 200))
    const state = crypto.randomUUID()
    const redirectUri = `${window.location.origin}/settings/integrations/3cx/callback`
    const redirectUrl = `https://${fqdn}/connect/authorize?response_type=code&client_id=elev8-suite&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
    return { redirectUrl }
  }

  async function completeOAuthCallback(code: string, fqdn: string): Promise<{ success: true, account: ThreeCxAccount } | { success: false, error: string }> {
    await new Promise(resolve => setTimeout(resolve, 600))

    if (!code) {
      return { success: false, error: 'Authorization code missing.' }
    }

    const newAccount: ThreeCxAccount = {
      id: `threecx-${Date.now()}`,
      fqdn,
      displayName: `3CX ${fqdn}`,
      pbxVersion: 'V20',
      accessToken: `at_${crypto.randomUUID().replace(/-/g, '')}`,
      refreshToken: `rt_${crypto.randomUUID().replace(/-/g, '')}`,
      status: 'connected',
      connectedAt: new Date().toISOString(),
      extensionMappings: [],
      webhookSubscriptions: [
        'call.ringing',
        'call.answered',
        'call.ended',
        'call.missed',
        'call.voicemail',
      ],
    }

    accounts.value = [newAccount]
    return { success: true, account: newAccount }
  }

  function assignExtension(staffId: string, extensionNumber: string) {
    if (!activeAccount.value)
      return
    const updated = { ...activeAccount.value }
    const existing = updated.extensionMappings.find(m => m.staffId === staffId)
    if (existing) {
      updated.extensionMappings = updated.extensionMappings.map(m =>
        m.staffId === staffId ? { ...m, extensionNumber } : m,
      )
    }
    else {
      updated.extensionMappings = [...updated.extensionMappings, { staffId, extensionNumber }]
    }
    accounts.value = accounts.value.map(a => a.id === updated.id ? updated : a)
  }

  function unassignExtension(staffId: string) {
    if (!activeAccount.value)
      return
    const updated = {
      ...activeAccount.value,
      extensionMappings: activeAccount.value.extensionMappings.filter(m => m.staffId !== staffId),
    }
    accounts.value = accounts.value.map(a => a.id === updated.id ? updated : a)
  }

  function disconnect() {
    accounts.value = []
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  function addUnmatchedCall(call: UnmatchedCall) {
    unmatchedCalls.value = [call, ...unmatchedCalls.value]
  }

  function dismissUnmatchedCall(id: string) {
    unmatchedCalls.value = unmatchedCalls.value.filter(c => c.id !== id)
  }

  function matchUnmatchedCall(id: string) {
    dismissUnmatchedCall(id)
  }

  return {
    accounts,
    activeAccount,
    isConnected,
    unmatchedCalls,
    getExtensionForStaff,
    getStaffForExtension,
    startOAuthFlow,
    completeOAuthCallback,
    assignExtension,
    unassignExtension,
    disconnect,
    addUnmatchedCall,
    dismissUnmatchedCall,
    matchUnmatchedCall,
  }
}
