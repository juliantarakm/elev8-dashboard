<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import type { CostEntry } from '@/components/finance/data/costs'
import { useCosts } from '@/composables/useCosts'
import { useJurnal } from '@/composables/useJurnal'

const {
  filteredCosts,
  filterListing,
  filterType,
  filterSynced,
  filterStaff,
  filterDateFrom,
  filterDateTo,
  unsyncedCount,
  clearFilters,
} = useCosts()

const { isConnected: jurnalConnected } = useJurnal()

const hasAccountingIntegration = computed(() => jurnalConnected.value)

const selectedCost = ref<CostEntry | null>(null)
const drawerOpen = ref(false)

function openDetail(cost: CostEntry) {
  selectedCost.value = cost
  drawerOpen.value = true
}

function exportCSV() {
  const headers = ['Date', 'Listing', 'Type', 'Category', 'Amount (IDR)', 'Staff', 'Invoice', 'Synced', 'Note']
  const rows = filteredCosts.value.map(c => [
    c.date, c.listing, c.type, c.category,
    c.amount, c.staff, c.invoice ?? '', c.synced ? 'Yes' : 'No', c.note ?? '',
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
    <!-- Sync banner when no accounting integration connected -->
    <div
      v-if="!hasAccountingIntegration"
      class="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <Icon name="i-lucide-cloud-off" class="h-4 w-4 shrink-0 text-amber-600" />
      <p class="flex-1 text-sm text-amber-800">
        No accounting integration connected. Cost entries won't be synced until you connect Jurnal or another accounting system.
      </p>
      <NuxtLink to="/finance?tab=integrations">
        <Button variant="outline" size="sm" class="h-7 border-amber-300 bg-white text-amber-800 hover:bg-amber-100">
          Connect
        </Button>
      </NuxtLink>
    </div>

    <!-- Unsynced count + export -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <Icon name="i-lucide-cloud-off" class="h-4 w-4 text-muted-foreground" />
        <span class="text-sm text-muted-foreground">Not synced</span>
        <span class="text-sm font-semibold">{{ unsyncedCount }}</span>
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
      v-model:filter-synced="filterSynced"
      v-model:filter-staff="filterStaff"
      v-model:filter-date-from="filterDateFrom"
      v-model:filter-date-to="filterDateTo"
      @clear="clearFilters"
    />

    <!-- Table -->
    <FinanceCostTable
      :costs="filteredCosts"
      @select="openDetail"
    />

    <!-- Detail drawer -->
    <FinanceCostDetailDrawer
      v-model:open="drawerOpen"
      :cost="selectedCost"
    />
  </div>
</template>
