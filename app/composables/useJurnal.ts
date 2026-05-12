import { ref, computed } from 'vue'
import { mockSyncLogs, type SyncLog } from '@/components/finance/data/jurnal'
import { recentReservations } from '@/components/finance/data/revenue'
import { useCosts } from '@/composables/useCosts'

export function useJurnal() {
  const isConnected = ref(true)
  const apiKey = ref('sk-jurnal-••••••••••••••••••••••••')
  const apiKeyInput = ref('')
  const companyName = ref('Elev8 Suite Bali')
  const lastConnected = ref('2026-05-01')
  const isTesting = ref(false)
  const isSaving = ref(false)
  const isPushingCosts = ref(false)
  const isPushingRevenue = ref(false)

  const syncLogs = useState<SyncLog[]>('jurnal-sync-logs', () => mockSyncLogs)

  const { costs, markSynced } = useCosts()

  const unsyncedCosts = computed(() => costs.value.filter(c => !c.synced))

  const pendingCostEntries = computed(() => unsyncedCosts.value.length)

  const pendingRevenueEntries = computed(() => recentReservations.length)

  const lastCostSync = computed(() => {
    const last = syncLogs.value.find(l => l.type === 'Cost' && l.status === 'Success')
    return last?.date ?? null
  })

  const lastRevenueSync = computed(() => {
    const last = syncLogs.value.find(l => l.type === 'Revenue' && l.status === 'Success')
    return last?.date ?? null
  })

  async function testConnection() {
    isTesting.value = true
    await new Promise(r => setTimeout(r, 1500))
    isTesting.value = false
    return true
  }

  async function saveApiKey() {
    if (!apiKeyInput.value.trim()) return
    isSaving.value = true
    await new Promise(r => setTimeout(r, 1200))
    apiKey.value = apiKeyInput.value.replace(/.(?=.{4})/g, '•')
    apiKeyInput.value = ''
    isConnected.value = true
    lastConnected.value = new Date().toISOString().slice(0, 10)
    isSaving.value = false
  }

  function disconnect() {
    isConnected.value = false
    apiKey.value = ''
  }

  async function pushCosts() {
    if (unsyncedCosts.value.length === 0) return
    isPushingCosts.value = true
    const count = unsyncedCosts.value.length
    const ids = unsyncedCosts.value.map(c => c.id)
    await new Promise(r => setTimeout(r, 2000))
    ids.forEach(id => markSynced(id))
    const newLog: SyncLog = {
      id: `sync-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'Cost',
      entriesTotal: count,
      entriesSuccess: count,
      status: 'Success',
      jurnalReference: `JRN-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      pushedBy: 'Komang Juliantara',
    }
    syncLogs.value = [newLog, ...syncLogs.value]
    isPushingCosts.value = false
  }

  async function pushRevenue() {
    isPushingRevenue.value = true
    await new Promise(r => setTimeout(r, 2000))
    const newLog: SyncLog = {
      id: `sync-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'Revenue',
      entriesTotal: pendingRevenueEntries.value,
      entriesSuccess: pendingRevenueEntries.value,
      status: 'Success',
      jurnalReference: `JRN-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      pushedBy: 'Komang Juliantara',
    }
    syncLogs.value = [newLog, ...syncLogs.value]
    isPushingRevenue.value = false
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return {
    isConnected,
    apiKey,
    apiKeyInput,
    companyName,
    lastConnected,
    isTesting,
    isSaving,
    isPushingCosts,
    isPushingRevenue,
    syncLogs,
    pendingCostEntries,
    pendingRevenueEntries,
    lastCostSync,
    lastRevenueSync,
    testConnection,
    saveApiKey,
    disconnect,
    pushCosts,
    pushRevenue,
    formatDate,
  }
}
