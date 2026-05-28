import { computed, ref } from 'vue'
import type { ItemCondition, ListingInventoryEntry } from '@/components/inventory/data/listing-entries'
import { mockListingEntries } from '@/components/inventory/data/listing-entries'

export function useInventoryListings() {
  const entries = useState<ListingInventoryEntry[]>('inventory-listings', () =>
    mockListingEntries.map(e => ({ ...e })),
  )

  const filterListing = ref<string>('all')
  const filterCategory = ref<string>('all')
  const filterCondition = ref<ItemCondition | 'all'>('all')

  const LOW_STOCK_THRESHOLD = 5

  const lowStockCount = computed(() =>
    entries.value.filter(e => e.stockLevel !== undefined && e.stockLevel <= LOW_STOCK_THRESHOLD).length,
  )

  const filteredEntries = computed(() => {
    return entries.value.filter((entry) => {
      if (filterListing.value !== 'all' && entry.listingName !== filterListing.value) return false
      if (filterCondition.value !== 'all' && entry.condition !== filterCondition.value) return false
      return true
    })
  })

  function addEntry(data: Omit<ListingInventoryEntry, 'id' | 'lastUpdated'>) {
    const id = `entry-${String(entries.value.length + 1).padStart(3, '0')}`
    entries.value = [...entries.value, { ...data, id, lastUpdated: new Date().toISOString() }]
  }

  function updateEntry(id: string, updates: Partial<ListingInventoryEntry>) {
    entries.value = entries.value.map(e =>
      e.id === id ? { ...e, ...updates, lastUpdated: new Date().toISOString() } : e,
    )
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
