import type { Supplier, SupplierCategory } from '@/components/procurement/data/suppliers'
import { computed, ref } from 'vue'
import { mockSuppliers } from '@/components/procurement/data/suppliers'

export function useSuppliers() {
  const suppliers = useState<Supplier[]>('suppliers', () =>
    mockSuppliers.map(s => ({ ...s })))

  const searchValue = ref('')
  const activeCategoryFilter = ref<SupplierCategory | 'all'>('all')

  const filteredSuppliers = computed(() => {
    return suppliers.value.filter((sup) => {
      if (activeCategoryFilter.value !== 'all' && sup.category !== activeCategoryFilter.value)
        return false
      if (searchValue.value) {
        const q = searchValue.value.toLowerCase()
        return sup.name.toLowerCase().includes(q)
          || sup.contact.toLowerCase().includes(q)
          || (sup.email?.toLowerCase().includes(q) ?? false)
      }
      return true
    }).sort((a, b) => a.name.localeCompare(b.name))
  })

  function addSupplier(data: Omit<Supplier, 'id'>) {
    const id = `sup-${String(suppliers.value.length + 1).padStart(3, '0')}`
    suppliers.value = [...suppliers.value, { ...data, id }]
  }

  function updateSupplier(id: string, updates: Partial<Supplier>) {
    suppliers.value = suppliers.value.map(s =>
      s.id === id ? { ...s, ...updates } : s)
  }

  function deleteSupplier(id: string) {
    suppliers.value = suppliers.value.filter(s => s.id !== id)
  }

  function getSupplierById(id: string): Supplier | undefined {
    return suppliers.value.find(s => s.id === id)
  }

  function clearFilters() {
    searchValue.value = ''
    activeCategoryFilter.value = 'all'
  }

  return {
    suppliers,
    filteredSuppliers,
    searchValue,
    activeCategoryFilter,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierById,
    clearFilters,
  }
}
