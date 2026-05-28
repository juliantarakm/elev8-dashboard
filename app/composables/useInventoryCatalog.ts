import { computed, ref } from 'vue'
import type { InventoryCategory, InventoryItem, InventoryItemType } from '@/components/inventory/data/catalog'
import { mockInventoryItems } from '@/components/inventory/data/catalog'

export function useInventoryCatalog() {
  const items = useState<InventoryItem[]>('inventory-catalog', () =>
    mockInventoryItems.map(i => ({ ...i })),
  )

  const searchValue = ref('')
  const activeCategoryFilter = ref<InventoryCategory | 'all'>('all')
  const activeTypeFilter = ref<InventoryItemType | 'all'>('all')

  const filteredItems = computed(() => {
    return items.value.filter((item) => {
      if (activeCategoryFilter.value !== 'all' && item.category !== activeCategoryFilter.value) return false
      if (activeTypeFilter.value !== 'all' && item.type !== activeTypeFilter.value) return false
      if (searchValue.value && !item.name.toLowerCase().includes(searchValue.value.toLowerCase())) return false
      return true
    })
  })

  function addItem(data: Omit<InventoryItem, 'id'>) {
    const id = `inv-${String(items.value.length + 1).padStart(3, '0')}`
    items.value = [...items.value, { ...data, id }]
  }

  function updateItem(id: string, updates: Partial<InventoryItem>) {
    items.value = items.value.map(i => i.id === id ? { ...i, ...updates } : i)
  }

  function deleteItem(id: string) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function getItemById(id: string): InventoryItem | undefined {
    return items.value.find(i => i.id === id)
  }

  function clearFilters() {
    searchValue.value = ''
    activeCategoryFilter.value = 'all'
    activeTypeFilter.value = 'all'
  }

  return {
    items,
    filteredItems,
    searchValue,
    activeCategoryFilter,
    activeTypeFilter,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    clearFilters,
  }
}
