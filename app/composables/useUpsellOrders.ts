import { computed } from 'vue'
import type { OrderStatus, UpsellOrder } from '@/components/upsells/data/upsell-orders'
import { mockUpsellOrders } from '@/components/upsells/data/upsell-orders'
import { getPolicyForService, calculateRefund } from '@/components/upsells/data/cancellation-policies'

export function useUpsellOrders() {
  const orders = useState<UpsellOrder[]>('upsell-orders', () =>
    mockUpsellOrders.map(o => ({ ...o })),
  )

  const filterStatus = ref<OrderStatus | 'all'>('all')
  const filterService = ref<string>('all')
  const filterDateFrom = ref('')
  const filterDateTo = ref('')
  const searchValue = ref('')

  const filteredOrders = computed(() => {
    return orders.value.filter((o) => {
      if (filterStatus.value !== 'all' && o.status !== filterStatus.value) return false
      if (filterService.value !== 'all' && o.serviceId !== filterService.value) return false
      if (filterDateFrom.value && o.orderDate < filterDateFrom.value) return false
      if (filterDateTo.value && o.orderDate > filterDateTo.value) return false
      if (searchValue.value) {
        const q = searchValue.value.toLowerCase()
        const match =
          o.guestName.toLowerCase().includes(q) ||
          o.serviceName.toLowerCase().includes(q) ||
          o.reservationId.includes(q) ||
          o.listing.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  })

  const statusCounts = computed(() => ({
    all: orders.value.length,
    pending: orders.value.filter(o => o.status === 'pending').length,
    confirmed: orders.value.filter(o => o.status === 'confirmed').length,
    completed: orders.value.filter(o => o.status === 'completed').length,
    cancelled: orders.value.filter(o => o.status === 'cancelled').length,
  }))

  const totalRevenue = computed(() => {
    return orders.value
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.grandTotal, 0)
  })

  function updateStatus(id: string, status: OrderStatus) {
    orders.value = orders.value.map(o =>
      o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
    )
  }

  function addOrder(data: Omit<UpsellOrder, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const id = `ord-${String(orders.value.length + 1).padStart(3, '0')}`
    orders.value = [...orders.value, {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    }]
  }

  function cancelOrder(id: string, reason: string, cancelledBy: 'guest' | 'staff') {
    const order = orders.value.find(o => o.id === id)
    if (!order) return null

    const policy = getPolicyForService(order.serviceId)
    const refund = policy
      ? calculateRefund(order.grandTotal, order.serviceDate, new Date().toISOString(), policy, cancelledBy)
      : { refundAmount: order.grandTotal, refundPercent: 100, lateFee: 0, reason: 'No policy — full refund' }

    orders.value = orders.value.map(o =>
      o.id === id
        ? {
            ...o,
            status: 'cancelled',
            cancellationReason: reason,
            cancellationBy: cancelledBy,
            updatedAt: new Date().toISOString(),
          }
        : o,
    )

    return refund
  }

  function clearFilters() {
    filterStatus.value = 'all'
    filterService.value = 'all'
    filterDateFrom.value = ''
    filterDateTo.value = ''
    searchValue.value = ''
  }

  return {
    orders,
    filteredOrders,
    statusCounts,
    totalRevenue,
    filterStatus,
    filterService,
    filterDateFrom,
    filterDateTo,
    searchValue,
    updateStatus,
    addOrder,
    cancelOrder,
    clearFilters,
  }
}
