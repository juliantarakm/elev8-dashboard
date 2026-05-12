<script setup lang="ts">
import { computed } from 'vue'
import { costByCategory, costByListing, monthlyRevenue } from '@/components/finance/data/overview'
import { mockCosts } from '@/components/finance/data/costs'

const unsyncedEntries = computed(() =>
  mockCosts.filter(c => !c.synced).slice(0, 5),
)

function formatCHF(amount: number) {
  return `CHF ${amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatIDR(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

const typeBgClass: Record<string, string> = {
  Manual: 'text-slate-700 bg-slate-100',
  Cleaning: 'text-teal-700 bg-teal-50',
  Activity: 'text-purple-700 bg-purple-50',
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Monthly revenue trailing -->
    <div class="rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <p class="text-sm font-medium">Monthly Revenue Trend</p>
        <p class="text-xs text-muted-foreground">Trailing data — reservations by check-in month</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b bg-muted/40">
              <th class="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Month</th>
              <th class="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Revenue</th>
              <th class="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground">Reservations</th>
              <th class="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground">Nights</th>
              <th class="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">ADR</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="row in monthlyRevenue" :key="row.month" class="hover:bg-muted/30">
              <td class="px-5 py-3 font-medium">{{ row.month }}</td>
              <td class="px-3 py-3 text-right font-semibold tabular-nums">{{ formatCHF(row.revenue) }}</td>
              <td class="px-3 py-3 text-center tabular-nums">{{ row.reservations }}</td>
              <td class="px-3 py-3 text-center tabular-nums">{{ row.nights }}</td>
              <td class="px-5 py-3 text-right tabular-nums">{{ formatCHF(row.adr) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Cost breakdown side by side -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div class="rounded-lg border bg-card">
        <div class="border-b px-5 py-3.5">
          <p class="text-sm font-medium">Costs by Category</p>
          <p class="text-xs text-muted-foreground">This month (IDR)</p>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b bg-muted/40">
              <th class="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Category</th>
              <th class="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="item in costByCategory" :key="item.category" class="hover:bg-muted/30">
              <td class="px-5 py-3 font-medium">{{ item.category }}</td>
              <td class="px-5 py-3 text-right tabular-nums">{{ formatIDR(item.amount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="rounded-lg border bg-card">
        <div class="border-b px-5 py-3.5">
          <p class="text-sm font-medium">Costs by Listing</p>
          <p class="text-xs text-muted-foreground">This month (IDR)</p>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b bg-muted/40">
              <th class="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Listing</th>
              <th class="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="item in costByListing" :key="item.listing" class="hover:bg-muted/30">
              <td class="px-5 py-3 font-medium">{{ item.listing }}</td>
              <td class="px-5 py-3 text-right tabular-nums">{{ formatIDR(item.amount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Unsynced cost entries -->
    <div class="rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <p class="text-sm font-medium">Unsynced Cost Entries</p>
        <p class="text-xs text-muted-foreground">Not yet pushed to accounting</p>
      </div>
      <div v-if="unsyncedEntries.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b bg-muted/40">
              <th class="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Staff</th>
              <th class="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Listing</th>
              <th class="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Category</th>
              <th class="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Type</th>
              <th class="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="entry in unsyncedEntries" :key="entry.id" class="hover:bg-muted/30">
              <td class="px-5 py-3 font-medium">{{ entry.staff }}</td>
              <td class="px-3 py-3 text-muted-foreground">{{ entry.listing }}</td>
              <td class="px-3 py-3 text-muted-foreground">{{ entry.category }}</td>
              <td class="px-3 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="typeBgClass[entry.type]">
                  {{ entry.type }}
                </span>
              </td>
              <td class="px-5 py-3 text-right font-semibold tabular-nums">{{ formatIDR(entry.amount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="px-5 py-8 text-center text-sm text-muted-foreground">
        All entries are synced.
      </div>
    </div>
  </div>
</template>
