import { computed, ref } from 'vue'
import { mockCosts, type CostEntry, type CostStatus, type CostType } from '@/components/finance/data/costs'

export function useCosts() {
  const costs = useState<CostEntry[]>('costs', () => mockCosts)

  const filterListing = ref<string>('all')
  const filterType = ref<'all' | CostType>('all')
  const filterStatus = ref<'all' | CostStatus>('all')
  const filterStaff = ref<string>('all')
  const filterDateFrom = ref<string>('')
  const filterDateTo = ref<string>('')

  const filteredCosts = computed(() => {
    return costs.value.filter((c) => {
      if (filterListing.value !== 'all' && c.listing !== filterListing.value) return false
      if (filterType.value !== 'all' && c.type !== filterType.value) return false
      if (filterStatus.value !== 'all' && c.status !== filterStatus.value) return false
      if (filterStaff.value !== 'all' && c.staffId !== filterStaff.value) return false
      if (filterDateFrom.value && c.date < filterDateFrom.value) return false
      if (filterDateTo.value && c.date > filterDateTo.value) return false
      return true
    })
  })

  const currentMonth = new Date().toISOString().slice(0, 7)

  const totalThisMonth = computed(() =>
    costs.value
      .filter(c => c.date.startsWith(currentMonth))
      .reduce((sum, c) => sum + c.amount, 0),
  )

  const pendingCount = computed(() =>
    costs.value.filter(c => c.status === 'Pending').length,
  )

  const totalApproved = computed(() =>
    costs.value
      .filter(c => c.status === 'Approved')
      .reduce((sum, c) => sum + c.amount, 0),
  )

  function approve(id: string) {
    costs.value = costs.value.map(c =>
      c.id === id ? { ...c, status: 'Approved' as CostStatus } : c,
    )
  }

  function reject(id: string, reason: string) {
    costs.value = costs.value.map(c =>
      c.id === id ? { ...c, status: 'Rejected' as CostStatus, rejectionReason: reason } : c,
    )
  }

  function formatAmount(amount: number, currency: string) {
    if (currency === 'IDR') {
      return `Rp ${amount.toLocaleString('id-ID')}`
    }
    return `${currency} ${amount.toLocaleString()}`
  }

  function clearFilters() {
    filterListing.value = 'all'
    filterType.value = 'all'
    filterStatus.value = 'all'
    filterStaff.value = 'all'
    filterDateFrom.value = ''
    filterDateTo.value = ''
  }

  const hasActiveFilters = computed(() =>
    filterListing.value !== 'all'
    || filterType.value !== 'all'
    || filterStatus.value !== 'all'
    || filterStaff.value !== 'all'
    || !!filterDateFrom.value
    || !!filterDateTo.value,
  )

  return {
    costs,
    filteredCosts,
    filterListing,
    filterType,
    filterStatus,
    filterStaff,
    filterDateFrom,
    filterDateTo,
    totalThisMonth,
    pendingCount,
    totalApproved,
    approve,
    reject,
    formatAmount,
    clearFilters,
    hasActiveFilters,
  }
}
