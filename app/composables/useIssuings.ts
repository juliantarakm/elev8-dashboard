import type { IssueStatus, Issuing } from '@/components/procurement/data/issuings'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { mockIssuings } from '@/components/procurement/data/issuings'
import { useInventoryListings } from './useInventoryListings'

export function useIssuings() {
  const issuings = useState<Issuing[]>('issuings', () =>
    mockIssuings.map(i => ({ ...i, items: i.items.map(j => ({ ...j })) })))

  const searchValue = ref('')
  const activeStatusFilter = ref<IssueStatus | 'all'>('all')

  const filteredIssuings = computed(() => {
    return issuings.value.filter((iss) => {
      if (activeStatusFilter.value !== 'all' && iss.status !== activeStatusFilter.value)
        return false
      if (searchValue.value) {
        const q = searchValue.value.toLowerCase()
        return iss.issueNumber.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
  })

  function addIssuing(data: Omit<Issuing, 'id' | 'issueNumber'>) {
    const id = `iss-${String(issuings.value.length + 1).padStart(3, '0')}`
    const num = `ISS-${String(issuings.value.length + 1).padStart(3, '0')}`
    issuings.value = [...issuings.value, { ...data, id, issueNumber: num }]
    return id
  }

  function updateIssuing(id: string, updates: Partial<Issuing>) {
    issuings.value = issuings.value.map(i =>
      i.id === id ? { ...i, ...updates } : i)
  }

  function completeIssuing(id: string) {
    const issuing = issuings.value.find(i => i.id === id)
    if (!issuing)
      return

    const { entries, addEntry, updateEntry } = useInventoryListings()

    for (const item of issuing.items) {
      const existing = entries.value.find(
        e => e.itemId === item.itemId && e.listingName === item.toListing,
      )
      if (existing) {
        updateEntry(existing.id, { quantity: existing.quantity + item.quantity })
      }
      else {
        addEntry({
          itemId: item.itemId,
          listingName: item.toListing,
          quantity: item.quantity,
          condition: 'good',
        })
      }
    }

    updateIssuing(id, { status: 'completed' })
    toast.success('Items issued to listings')
  }

  function getIssuingById(id: string): Issuing | undefined {
    return issuings.value.find(i => i.id === id)
  }

  function clearFilters() {
    searchValue.value = ''
    activeStatusFilter.value = 'all'
  }

  return {
    issuings,
    filteredIssuings,
    searchValue,
    activeStatusFilter,
    addIssuing,
    updateIssuing,
    completeIssuing,
    getIssuingById,
    clearFilters,
  }
}
