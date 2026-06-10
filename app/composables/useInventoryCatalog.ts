import type { AssetStatus, InventoryCategory, InventoryItem, InventoryItemType, MaintenanceSchedule } from '@/components/inventory/data/catalog'
import { computed, ref } from 'vue'
import { mockInventoryItems } from '@/components/inventory/data/catalog'
import { useInventoryTimeline } from './useInventoryTimeline'

export interface NextServiceInfo {
  scheduleId: string
  name: string
  nextDueDate: Date
  status: 'overdue' | 'due_soon' | 'ok'
}

export function useInventoryCatalog() {
  const items = useState<InventoryItem[]>('inventory-catalog', () =>
    mockInventoryItems.map(i => ({ ...i })))

  const { addEvent } = useInventoryTimeline()

  const searchValue = ref('')
  const activeCategoryFilter = ref<InventoryCategory | 'all'>('all')
  const activeTypeFilter = ref<InventoryItemType | 'all'>('all')
  const activeStatusFilter = ref<AssetStatus | 'all'>('all')

  const filteredItems = computed(() => {
    return items.value.filter((item) => {
      if (activeCategoryFilter.value !== 'all' && item.category !== activeCategoryFilter.value)
        return false
      if (activeTypeFilter.value !== 'all' && item.type !== activeTypeFilter.value)
        return false
      if (activeStatusFilter.value !== 'all' && item.assetStatus !== activeStatusFilter.value)
        return false
      if (searchValue.value && !item.name.toLowerCase().includes(searchValue.value.toLowerCase()))
        return false
      return true
    })
  })

  function getBookValue(item: InventoryItem): number | undefined {
    if (!item.purchaseValue || !item.purchaseDate || !item.usefulLifeYears)
      return undefined
    const yearsOwned = (Date.now() - new Date(item.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    const salvage = item.salvageValue ?? 0
    const annual = (item.purchaseValue - salvage) / item.usefulLifeYears
    const value = item.purchaseValue - annual * yearsOwned
    return Math.max(salvage, Math.round(value))
  }

  function getDepreciationPct(item: InventoryItem): number | undefined {
    if (!item.purchaseValue || !item.purchaseDate || !item.usefulLifeYears)
      return undefined
    const bookValue = getBookValue(item)
    if (bookValue === undefined)
      return undefined
    return Math.round(((item.purchaseValue - bookValue) / item.purchaseValue) * 100)
  }

  function getNextServiceInfo(item: InventoryItem): NextServiceInfo | null {
    if (!item.maintenanceSchedules?.length)
      return null
    const now = Date.now()
    let earliest: NextServiceInfo | null = null

    for (const s of item.maintenanceSchedules) {
      if (!s.lastServicedDate)
        continue
      const nextDueDate = new Date(new Date(s.lastServicedDate).getTime() + s.intervalDays * 86400000)
      const diff = nextDueDate.getTime() - now
      const status: NextServiceInfo['status'] = diff < 0 ? 'overdue' : diff <= 14 * 86400000 ? 'due_soon' : 'ok'
      if (!earliest || nextDueDate < earliest.nextDueDate) {
        earliest = { scheduleId: s.id, name: s.name, nextDueDate, status }
      }
    }
    return earliest
  }

  function getMaintenanceStatus(item: InventoryItem): 'overdue' | 'due_soon' | 'ok' | 'none' {
    const info = getNextServiceInfo(item)
    if (!info)
      return 'none'
    return info.status
  }

  const totalBookValue = computed(() =>
    items.value
      .filter(i => i.type === 'permanent' && i.assetStatus !== 'disposed' && i.assetStatus !== 'replaced')
      .reduce((sum, i) => sum + (getBookValue(i) ?? i.purchaseValue ?? 0), 0),
  )

  const activeAssetCount = computed(() =>
    items.value.filter(i => i.type === 'permanent' && i.assetStatus === 'active').length,
  )

  const underMaintenanceCount = computed(() =>
    items.value.filter(i => i.assetStatus === 'under_maintenance').length,
  )

  const maintenanceAlertCount = computed(() =>
    items.value.filter((i) => {
      const status = getMaintenanceStatus(i)
      return status === 'overdue' || status === 'due_soon'
    }).length,
  )

  function addItem(data: Omit<InventoryItem, 'id'>) {
    const id = `inv-${String(items.value.length + 1).padStart(3, '0')}`
    items.value = [...items.value, { ...data, id }]
  }

  function updateItem(id: string, updates: Partial<InventoryItem>) {
    items.value = items.value.map(i => i.id === id ? { ...i, ...updates } : i)
  }

  function updateItemStatus(id: string, status: AssetStatus, actor: 'staff' | 'hostbuddy' = 'staff', taskTitle?: string) {
    const old = items.value.find(i => i.id === id)
    if (!old || old.assetStatus === status)
      return
    items.value = items.value.map(i => i.id === id ? { ...i, assetStatus: status } : i)
    addEvent({
      itemId: id,
      type: 'status_changed',
      actor,
      details: { from: old.assetStatus, to: status, taskTitle },
    })
  }

  function markServiced(itemId: string, scheduleId: string) {
    const item = items.value.find(i => i.id === itemId)
    if (!item?.maintenanceSchedules)
      return
    const schedule = item.maintenanceSchedules.find(s => s.id === scheduleId)
    if (!schedule)
      return
    const today = new Date().toISOString().split('T')[0]
    items.value = items.value.map(i =>
      i.id === itemId
        ? {
            ...i,
            maintenanceSchedules: i.maintenanceSchedules!.map(s =>
              s.id === scheduleId ? { ...s, lastServicedDate: today } : s,
            ),
          }
        : i,
    )
    addEvent({
      itemId,
      type: 'maintenance_completed',
      actor: 'staff',
      details: { scheduleName: schedule.name },
    })
  }

  function addMaintenanceSchedule(itemId: string, schedule: Omit<MaintenanceSchedule, 'id'>) {
    const item = items.value.find(i => i.id === itemId)
    if (!item)
      return
    const id = `ms-${itemId}-${Date.now()}`
    const existing = item.maintenanceSchedules ?? []
    items.value = items.value.map(i =>
      i.id === itemId
        ? { ...i, maintenanceSchedules: [...existing, { ...schedule, id }] }
        : i,
    )
  }

  function removeMaintenanceSchedule(itemId: string, scheduleId: string) {
    items.value = items.value.map(i =>
      i.id === itemId
        ? { ...i, maintenanceSchedules: i.maintenanceSchedules?.filter(s => s.id !== scheduleId) }
        : i,
    )
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
    activeStatusFilter.value = 'all'
  }

  return {
    items,
    filteredItems,
    searchValue,
    activeCategoryFilter,
    activeTypeFilter,
    activeStatusFilter,
    totalBookValue,
    activeAssetCount,
    underMaintenanceCount,
    maintenanceAlertCount,
    getBookValue,
    getDepreciationPct,
    getNextServiceInfo,
    getMaintenanceStatus,
    addItem,
    updateItem,
    updateItemStatus,
    markServiced,
    addMaintenanceSchedule,
    removeMaintenanceSchedule,
    deleteItem,
    getItemById,
    clearFilters,
  }
}
