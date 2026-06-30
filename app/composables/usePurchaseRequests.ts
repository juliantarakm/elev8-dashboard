import type { PurchaseRequest, PurchaseRequestStatus } from '@/components/procurement/data/purchase-requests'
import { computed, ref } from 'vue'
import { mockPurchaseRequests } from '@/components/procurement/data/purchase-requests'

export function usePurchaseRequests() {
  const requests = useState<PurchaseRequest[]>('purchase-requests', () =>
    mockPurchaseRequests.map(r => ({ ...r, items: r.items.map(i => ({ ...i })) })))

  const searchValue = ref('')
  const activeStatusFilter = ref<PurchaseRequestStatus | 'all'>('all')

  const filteredRequests = computed(() => {
    return requests.value.filter((req) => {
      if (activeStatusFilter.value !== 'all' && req.status !== activeStatusFilter.value)
        return false
      if (searchValue.value) {
        const q = searchValue.value.toLowerCase()
        return req.title.toLowerCase().includes(q)
          || req.requestNumber.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  const pendingApprovalCount = computed(() =>
    requests.value.filter(r => r.status === 'pending_approval').length)

  function addRequest(data: Omit<PurchaseRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'>) {
    const id = `pr-${String(requests.value.length + 1).padStart(3, '0')}`
    const num = `PR-${String(requests.value.length + 1).padStart(3, '0')}`
    const now = new Date().toISOString()
    requests.value = [...requests.value, { ...data, id, requestNumber: num, createdAt: now, updatedAt: now }]
  }

  function updateRequest(id: string, updates: Partial<PurchaseRequest>) {
    requests.value = requests.value.map(r =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)
  }

  function submitForApproval(id: string) {
    updateRequest(id, { status: 'pending_approval' })
  }

  function approveRequest(id: string, approverId: string) {
    updateRequest(id, { status: 'approved', approvedBy: approverId })
  }

  function rejectRequest(id: string, approverId: string) {
    updateRequest(id, { status: 'rejected', approvedBy: approverId })
  }

  function markConvertedToPo(id: string) {
    updateRequest(id, { status: 'converted_to_po' })
  }

  function getRequestById(id: string): PurchaseRequest | undefined {
    return requests.value.find(r => r.id === id)
  }

  function deleteRequest(id: string) {
    requests.value = requests.value.filter(r => r.id !== id)
  }

  function clearFilters() {
    searchValue.value = ''
    activeStatusFilter.value = 'all'
  }

  return {
    requests,
    filteredRequests,
    searchValue,
    activeStatusFilter,
    pendingApprovalCount,
    addRequest,
    updateRequest,
    submitForApproval,
    approveRequest,
    rejectRequest,
    markConvertedToPo,
    getRequestById,
    deleteRequest,
    clearFilters,
  }
}
