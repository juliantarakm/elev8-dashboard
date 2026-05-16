import { computed, ref } from 'vue'
import type { UpsellEntry } from '@/components/finance/data/upsells'
import { mockUpsells } from '@/components/finance/data/upsells'

export function useUpsells() {
  const upsells = useState<UpsellEntry[]>('upsells', () =>
    mockUpsells.map(u => ({ ...u })),
  )

  const unsyncedCount = computed(() => upsells.value.filter(u => !u.synced).length)

  const isPushingUpsells = ref(false)
  const lastUpsellSync = useState<string | null>('upsells-last-sync', () => null)

  function markSynced(id: string) {
    upsells.value = upsells.value.map(u =>
      u.id === id ? { ...u, synced: true, syncedAt: new Date().toISOString() } : u,
    )
  }

  async function pushUpsells() {
    const unsynced = upsells.value.filter(u => !u.synced)
    if (unsynced.length === 0) return
    isPushingUpsells.value = true
    await new Promise(r => setTimeout(r, 1600))
    unsynced.forEach(u => markSynced(u.id))
    lastUpsellSync.value = new Date().toISOString()
    isPushingUpsells.value = false
  }

  return {
    upsells,
    unsyncedCount,
    isPushingUpsells,
    lastUpsellSync,
    markSynced,
    pushUpsells,
  }
}
