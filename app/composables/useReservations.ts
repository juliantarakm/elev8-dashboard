import { computed, ref } from 'vue'
import type { ReservationEntry } from '@/components/finance/data/revenue'
import { recentReservations as initialData } from '@/components/finance/data/revenue'

export function useReservations() {
  const reservations = useState<ReservationEntry[]>('reservations', () =>
    initialData.map(r => ({ ...r })),
  )

  const unsyncedCount = computed(() => reservations.value.filter(r => !r.synced).length)

  const isPushingReservations = ref(false)
  const lastReservationSync = useState<string | null>('reservations-last-sync', () => null)

  function markSynced(id: string, checkIn: string) {
    reservations.value = reservations.value.map(r =>
      r.id === id && r.checkIn === checkIn
        ? { ...r, synced: true, syncedAt: new Date().toISOString() }
        : r,
    )
  }

  async function pushReservations() {
    const unsynced = reservations.value.filter(r => !r.synced)
    if (unsynced.length === 0) return
    isPushingReservations.value = true
    await new Promise(r => setTimeout(r, 1800))
    unsynced.forEach(r => markSynced(r.id, r.checkIn))
    lastReservationSync.value = new Date().toISOString()
    isPushingReservations.value = false
  }

  return {
    reservations,
    unsyncedCount,
    isPushingReservations,
    lastReservationSync,
    markSynced,
    pushReservations,
  }
}
