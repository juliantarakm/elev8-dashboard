import type { Receiving, ReceivingStatus } from '@/components/procurement/data/receivings'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { mockReceivings } from '@/components/procurement/data/receivings'
import { usePurchaseOrders } from './usePurchaseOrders'

export function useReceivings() {
  const receivings = useState<Receiving[]>('receivings', () =>
    mockReceivings.map(r => ({ ...r, items: r.items.map(i => ({ ...i })) })))

  const searchValue = ref('')
  const activeStatusFilter = ref<ReceivingStatus | 'all'>('all')

  const filteredReceivings = computed(() => {
    return receivings.value.filter((rcv) => {
      if (activeStatusFilter.value !== 'all' && rcv.status !== activeStatusFilter.value)
        return false
      if (searchValue.value) {
        const q = searchValue.value.toLowerCase()
        return rcv.receivingNumber.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
  })

  const pendingCount = computed(() =>
    receivings.value.filter(r => r.status === 'draft').length)

  function addReceiving(data: Omit<Receiving, 'id' | 'receivingNumber'>) {
    const id = `rcv-${String(receivings.value.length + 1).padStart(3, '0')}`
    const num = `RCV-${String(receivings.value.length + 1).padStart(3, '0')}`
    receivings.value = [...receivings.value, { ...data, id, receivingNumber: num }]
    return id
  }

  function updateReceiving(id: string, updates: Partial<Receiving>) {
    receivings.value = receivings.value.map(r =>
      r.id === id ? { ...r, ...updates } : r)
  }

  function completeReceiving(id: string) {
    const receiving = receivings.value.find(r => r.id === id)
    if (!receiving)
      return

    // Only update PO if linked to one
    if (receiving.purchaseOrderId) {
      const { updateReceivedQuantity } = usePurchaseOrders()
      for (const item of receiving.items) {
        if (item.purchaseOrderItemId) {
          updateReceivedQuantity(receiving.purchaseOrderId, item.purchaseOrderItemId, item.quantityReceived)
        }
      }
    }

    // Update catalog stock for consumable items
    const { getItemById, updateItem } = useInventoryCatalog()
    for (const item of receiving.items) {
      const catalogItem = getItemById(item.itemId)
      if (catalogItem?.type === 'consumable' && catalogItem.stockLevel !== undefined) {
        updateItem(item.itemId, { stockLevel: catalogItem.stockLevel + item.quantityReceived })
      }
    }

    updateReceiving(id, { status: 'completed' })
    toast.success('Receiving completed')
  }

  function getReceivingById(id: string): Receiving | undefined {
    return receivings.value.find(r => r.id === id)
  }

  function getReceivingsByPoId(poId: string): Receiving[] {
    return receivings.value.filter(r => r.purchaseOrderId === poId)
  }

  function clearFilters() {
    searchValue.value = ''
    activeStatusFilter.value = 'all'
  }

  return {
    receivings,
    filteredReceivings,
    searchValue,
    activeStatusFilter,
    pendingCount,
    addReceiving,
    updateReceiving,
    completeReceiving,
    getReceivingById,
    getReceivingsByPoId,
    clearFilters,
  }
}
