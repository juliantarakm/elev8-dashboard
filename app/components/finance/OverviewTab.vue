<script setup lang="ts">
import { computed } from 'vue'
import { recentReservations } from '@/components/finance/data/revenue'
import { mockCosts } from '@/components/finance/data/costs'

const unsyncedEntries = computed(() => mockCosts.filter(c => !c.synced))

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
  Task: 'text-orange-700 bg-orange-50',
}

const statusClass: Record<string, string> = {
  Confirmed: 'text-green-700 bg-green-50',
  'In Progress': 'text-blue-700 bg-blue-50',
  Pending: 'text-amber-700 bg-amber-50',
}

const channelIcon: Record<string, string> = {
  'Booking.com': 'i-lucide-globe',
  'Airbnb': 'i-lucide-home',
  'Direct': 'i-lucide-link',
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Recent Reservations -->
    <div class="rounded-md border">
      <div class="border-b bg-muted/40 px-5 py-2.5">
        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Reservations — May 2026</p>
      </div>
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead class="text-center">Nights</TableHead>
              <TableHead class="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="res in recentReservations" :key="res.id">
              <TableCell class="font-medium">{{ res.guest }}</TableCell>
              <TableCell class="max-w-48 truncate text-muted-foreground" :title="res.listing">{{ res.listing }}</TableCell>
              <TableCell>
                <span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Icon :name="channelIcon[res.channel] ?? 'i-lucide-link'" class="h-3.5 w-3.5" />
                  {{ res.channel }}
                </span>
              </TableCell>
              <TableCell class="tabular-nums text-muted-foreground">{{ res.checkIn }}</TableCell>
              <TableCell class="tabular-nums text-muted-foreground">{{ res.checkOut }}</TableCell>
              <TableCell class="text-center tabular-nums">{{ res.nights }}</TableCell>
              <TableCell class="text-right font-semibold tabular-nums">{{ formatCHF(res.amount) }}</TableCell>
              <TableCell>
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="statusClass[res.status]">
                  {{ res.status }}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- Unsynced Cost Entries -->
    <div class="rounded-md border">
      <div class="border-b bg-muted/40 px-5 py-2.5 flex items-center justify-between">
        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unsynced Cost Entries</p>
        <span v-if="unsyncedEntries.length > 0" class="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
          {{ unsyncedEntries.length }} pending
        </span>
      </div>
      <Table v-if="unsyncedEntries.length > 0">
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Staff</TableHead>
            <TableHead>Listing</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead class="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="entry in unsyncedEntries" :key="entry.id">
            <TableCell class="tabular-nums text-muted-foreground">{{ entry.date }}</TableCell>
            <TableCell class="font-medium">{{ entry.staff }}</TableCell>
            <TableCell class="text-muted-foreground">{{ entry.listing }}</TableCell>
            <TableCell class="text-muted-foreground">{{ entry.category }}</TableCell>
            <TableCell>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="typeBgClass[entry.type]">
                {{ entry.type }}
              </span>
            </TableCell>
            <TableCell class="text-right font-semibold tabular-nums">{{ formatIDR(entry.amount) }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <div v-else class="px-5 py-8 text-center text-sm text-muted-foreground">
        All entries synced.
      </div>
    </div>
  </div>
</template>
