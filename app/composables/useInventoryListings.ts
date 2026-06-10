import type { ItemCondition, ListingInventoryEntry } from '@/components/inventory/data/listing-entries'
import { computed, ref } from 'vue'
import { mockListingEntries } from '@/components/inventory/data/listing-entries'
import { useInventoryTimeline } from './useInventoryTimeline'

export function useInventoryListings() {
  const entries = useState<ListingInventoryEntry[]>('inventory-listings', () =>
    mockListingEntries.map(e => ({ ...e })))

  const { addEvent } = useInventoryTimeline()

  const LOW_STOCK_THRESHOLD = 5

  const lowStockCount = computed(() =>
    entries.value.filter(e => e.stockLevel !== undefined && e.stockLevel <= LOW_STOCK_THRESHOLD).length,
  )

  const filterListing = ref<string>('all')
  const filterCategory = ref<string>('all')
  const filterCondition = ref<ItemCondition | 'all'>('all')

  const filteredEntries = computed(() => {
    return entries.value.filter((entry) => {
      if (filterListing.value !== 'all' && entry.listingName !== filterListing.value)
        return false
      if (filterCondition.value !== 'all' && entry.condition !== filterCondition.value)
        return false
      return true
    })
  })

  function addEntry(data: Omit<ListingInventoryEntry, 'id' | 'lastUpdated'>) {
    const id = `entry-${String(entries.value.length + 1).padStart(3, '0')}`
    entries.value = [...entries.value, { ...data, id, lastUpdated: new Date().toISOString() }]
    addEvent({ entryId: id, type: 'entry_created', actor: 'staff', details: {} })
  }

  function updateEntry(
    id: string,
    updates: Partial<ListingInventoryEntry>,
    source: 'manual' | 'hostbuddy' = 'manual',
  ) {
    const old = entries.value.find(e => e.id === id)
    entries.value = entries.value.map(e =>
      e.id === id ? { ...e, ...updates, lastUpdated: new Date().toISOString() } : e,
    )

    if (old && source === 'manual') {
      if (updates.condition !== undefined && updates.condition !== old.condition) {
        addEvent({ entryId: id, type: 'condition_changed', actor: 'staff', details: { from: old.condition, to: updates.condition } })
      }
      if (updates.quantity !== undefined && updates.quantity !== old.quantity) {
        addEvent({ entryId: id, type: 'quantity_changed', actor: 'staff', details: { from: old.quantity, to: updates.quantity } })
      }
      if (updates.stockLevel !== undefined && updates.stockLevel !== old.stockLevel) {
        addEvent({ entryId: id, type: 'stock_changed', actor: 'staff', details: { from: old.stockLevel, to: updates.stockLevel } })
      }
      if (updates.notes !== undefined && updates.notes !== old.notes) {
        addEvent({ entryId: id, type: 'note_updated', actor: 'staff', details: {} })
      }
    }
  }

  function deleteEntry(id: string) {
    entries.value = entries.value.filter(e => e.id !== id)
  }

  function clearFilters() {
    filterListing.value = 'all'
    filterCategory.value = 'all'
    filterCondition.value = 'all'
  }

  return {
    entries,
    filteredEntries,
    lowStockCount,
    filterListing,
    filterCategory,
    filterCondition,
    addEntry,
    updateEntry,
    deleteEntry,
    clearFilters,
  }
}
