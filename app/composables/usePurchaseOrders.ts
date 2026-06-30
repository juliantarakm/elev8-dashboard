import type { PurchaseOrder, PurchaseOrderStatus } from '@/components/procurement/data/purchase-orders'
import { computed, ref } from 'vue'
import { mockPurchaseOrders } from '@/components/procurement/data/purchase-orders'

export function usePurchaseOrders() {
  const orders = useState<PurchaseOrder[]>('purchase-orders', () =>
    mockPurchaseOrders.map(o => ({ ...o, items: o.items.map(i => ({ ...i })) })))

  const searchValue = ref('')
  const activeStatusFilter = ref<PurchaseOrderStatus | 'all'>('all')

  const filteredOrders = computed(() => {
    return orders.value.filter((order) => {
      if (activeStatusFilter.value !== 'all' && order.status !== activeStatusFilter.value)
        return false
      if (searchValue.value) {
        const q = searchValue.value.toLowerCase()
        return order.poNumber.toLowerCase().includes(q)
          || order.supplier.name.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  const openPoCount = computed(() =>
    orders.value.filter(o => o.status === 'sent' || o.status === 'partially_received').length)

  function addOrder(data: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt' | 'updatedAt'>) {
    const id = `po-${String(orders.value.length + 1).padStart(3, '0')}`
    const num = `PO-${String(orders.value.length + 1).padStart(3, '0')}`
    const now = new Date().toISOString()
    orders.value = [...orders.value, { ...data, id, poNumber: num, createdAt: now, updatedAt: now }]
    return id
  }

  function updateOrder(id: string, updates: Partial<PurchaseOrder>) {
    orders.value = orders.value.map(o =>
      o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o)
  }

  function markSent(id: string) {
    updateOrder(id, { status: 'sent' })
  }

  function cancelOrder(id: string) {
    updateOrder(id, { status: 'cancelled' })
  }

  function updateReceivedQuantity(orderId: string, poItemId: string, qty: number) {
    orders.value = orders.value.map(o => {
      if (o.id !== orderId)
        return o
      const updatedItems = o.items.map(i =>
        i.id === poItemId ? { ...i, receivedQuantity: i.receivedQuantity + qty } : i)
      const allReceived = updatedItems.every(i => i.receivedQuantity >= i.quantity)
      const anyReceived = updatedItems.some(i => i.receivedQuantity > 0)
      return {
        ...o,
        items: updatedItems,
        status: allReceived ? 'received' as const : anyReceived ? 'partially_received' as const : o.status,
        updatedAt: new Date().toISOString(),
      }
    })
  }

  function getOrderById(id: string): PurchaseOrder | undefined {
    return orders.value.find(o => o.id === id)
  }

  function getOrdersByPrId(prId: string): PurchaseOrder[] {
    return orders.value.filter(o => o.purchaseRequestId === prId)
  }

  function clearFilters() {
    searchValue.value = ''
    activeStatusFilter.value = 'all'
  }

  return {
    orders,
    filteredOrders,
    searchValue,
    activeStatusFilter,
    openPoCount,
    addOrder,
    updateOrder,
    markSent,
    cancelOrder,
    updateReceivedQuantity,
    getOrderById,
    getOrdersByPrId,
    clearFilters,
  }
}
