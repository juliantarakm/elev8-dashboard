<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import type { CostEntry } from '@/components/finance/data/costs'
import { useCosts } from '@/composables/useCosts'

const {
  filteredCosts,
  filterListing,
  filterType,
  filterStatus,
  filterStaff,
  filterDateFrom,
  filterDateTo,
  pendingCount,
  totalApproved,
  approve,
  reject,
  clearFilters,
} = useCosts()

const selectedCost = ref<CostEntry | null>(null)
const drawerOpen = ref(false)

function openDetail(cost: CostEntry) {
  selectedCost.value = cost
  drawerOpen.value = true
}

function handleApprove(id: string) {
  approve(id)
  toast.success('Cost entry approved')
  drawerOpen.value = false
}

function handleRejectFromTable(id: string) {
  const cost = filteredCosts.value.find(c => c.id === id)
  if (cost) openDetail(cost)
}

function handleReject(id: string, reason: string) {
  reject(id, reason)
}

function formatIDR(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function exportCSV() {
  const headers = ['Date', 'Listing', 'Type', 'Source', 'Category', 'Amount (IDR)', 'Staff', 'Invoice', 'Status', 'Note']
  const rows = filteredCosts.value.map(c => [
    c.date, c.listing, c.type, c.source, c.category,
    c.amount, c.staff, c.invoice ?? '', c.status, c.note ?? '',
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'costs-export.csv'
  a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV exported')
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Compact stat row + export -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-amber-500" />
          <span class="text-sm text-muted-foreground">Pending review</span>
          <span class="text-sm font-semibold">{{ pendingCount }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-green-500" />
          <span class="text-sm text-muted-foreground">Total approved (month)</span>
          <span class="text-sm font-semibold">{{ formatIDR(totalApproved) }}</span>
        </div>
      </div>
      <Button variant="outline" size="sm" @click="exportCSV">
        <Icon name="i-lucide-download" class="mr-2 h-4 w-4" />
        Export CSV
      </Button>
    </div>

    <!-- Filters -->
    <FinanceCostFilters
      v-model:filter-listing="filterListing"
      v-model:filter-type="filterType"
      v-model:filter-status="filterStatus"
      v-model:filter-staff="filterStaff"
      v-model:filter-date-from="filterDateFrom"
      v-model:filter-date-to="filterDateTo"
      @clear="clearFilters"
    />

    <!-- Table -->
    <FinanceCostTable
      :costs="filteredCosts"
      @select="openDetail"
      @approve="handleApprove"
      @reject="handleRejectFromTable"
    />

    <!-- Detail drawer -->
    <FinanceCostDetailDrawer
      v-model:open="drawerOpen"
      :cost="selectedCost"
      @approve="handleApprove"
      @reject="handleReject"
    />
  </div>
</template>
