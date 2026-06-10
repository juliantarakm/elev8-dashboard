<script setup lang="ts">
import type { CostEntry } from '@/components/finance/data/costs'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { useCosts } from '@/composables/useCosts'
import { useJurnal } from '@/composables/useJurnal'

const {
  filteredCosts,
  filterListing,
  filterType,
  filterSynced,
  filterStaff,
  filterIntegration,
  filterDateFrom,
  filterDateTo,
  unsyncedCount,
  clearFilters,
} = useCosts()

const {
  isConnected: jurnalConnected,
  isPushingCosts,
  lastCostSync,
  pushCosts,
  formatDate,
} = useJurnal()

const selectedCost = ref<CostEntry | null>(null)
const drawerOpen = ref(false)

function openDetail(cost: CostEntry) {
  selectedCost.value = cost
  drawerOpen.value = true
}

async function handlePushNow() {
  await pushCosts()
  toast.success('All cost entries pushed to Jurnal.')
}

function exportCSV() {
  const headers = ['Date', 'Listing', 'Type', 'Category', 'Amount (IDR)', 'Staff', 'Invoice', 'Synced', 'Note']
  const rows = filteredCosts.value.map(c => [
    c.date,
    c.listing,
    c.type,
    c.category,
    c.amount,
    c.staff,
    c.invoice ?? '',
    c.synced ? 'Yes' : 'No',
    c.note ?? '',
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
    <!-- No integration connected -->
    <div
      v-if="!jurnalConnected"
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

    <!-- Connected but entries unsynced -->
    <div
      v-else-if="unsyncedCount > 0"
      class="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
    >
      <Icon name="i-lucide-cloud-upload" class="h-4 w-4 shrink-0 text-blue-600" />
      <p class="flex-1 text-sm text-blue-800">
        <span class="font-medium">{{ unsyncedCount }} {{ unsyncedCount === 1 ? 'entry' : 'entries' }}</span>
        not yet synced to Jurnal.
        <span v-if="lastCostSync" class="text-blue-600"> Last sync: {{ formatDate(lastCostSync) }}.</span>
      </p>
      <Button
        size="sm"
        class="h-7 bg-blue-600 text-white hover:bg-blue-700"
        :disabled="isPushingCosts"
        @click="handlePushNow"
      >
        <Icon
          v-if="isPushingCosts"
          name="i-lucide-loader-2"
          class="mr-1.5 h-3.5 w-3.5 animate-spin"
        />
        <Icon v-else name="i-lucide-upload" class="mr-1.5 h-3.5 w-3.5" />
        {{ isPushingCosts ? 'Pushing…' : 'Push now' }}
      </Button>
    </div>

    <!-- All synced -->
    <div
      v-else
      class="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3"
    >
      <Icon name="i-lucide-cloud-check" class="h-4 w-4 shrink-0 text-green-600" />
      <p class="flex-1 text-sm text-green-800">
        All entries synced to Jurnal.
        <span v-if="lastCostSync" class="text-green-600"> Last sync: {{ formatDate(lastCostSync) }}.</span>
      </p>
    </div>

    <!-- Filters + Export -->
    <FinanceCostFilters
      v-model:filter-listing="filterListing"
      v-model:filter-type="filterType"
      v-model:filter-synced="filterSynced"
      v-model:filter-integration="filterIntegration"
      v-model:filter-staff="filterStaff"
      v-model:filter-date-from="filterDateFrom"
      v-model:filter-date-to="filterDateTo"
      @clear="clearFilters"
    >
      <Button variant="outline" size="sm" class="h-8" @click="exportCSV">
        <Icon name="i-lucide-download" class="mr-2 h-4 w-4" />
        Export CSV
      </Button>
    </FinanceCostFilters>

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
