<script setup lang="ts">
import { recentReservations, revenueByChannel, revenueByListing, revenueStats } from '@/components/finance/data/revenue'

function formatCHF(amount: number) {
  return `CHF ${amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatCHFShort(amount: number) {
  if (amount >= 1000) return `CHF ${(amount / 1000).toFixed(1)}k`
  return `CHF ${amount.toFixed(2)}`
}

const statusClass: Record<string, string> = {
  Confirmed: 'text-green-700 bg-green-50',
  'In Progress': 'text-blue-700 bg-blue-50',
  Pending: 'text-amber-700 bg-amber-50',
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Stat cards -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="rounded-lg border bg-card p-4">
        <p class="text-xs text-muted-foreground">Total Revenue (May)</p>
        <p class="mt-1 text-xl font-bold tracking-tight">{{ formatCHFShort(revenueStats.totalRevenue) }}</p>
        <p class="mt-0.5 text-xs text-muted-foreground">{{ revenueStats.totalReservations }} reservations</p>
      </div>
      <div class="rounded-lg border bg-card p-4">
        <p class="text-xs text-muted-foreground">ADR (last 30 days)</p>
        <p class="mt-1 text-xl font-bold tracking-tight">{{ formatCHFShort(revenueStats.adrLast30Days) }}</p>
        <p class="mt-0.5 text-xs text-muted-foreground">Avg daily rate</p>
      </div>
      <div class="rounded-lg border bg-card p-4">
        <p class="text-xs text-muted-foreground">Occupancy Rate</p>
        <p class="mt-1 text-xl font-bold tracking-tight">{{ revenueStats.occupancyPct }}%</p>
        <p class="mt-0.5 text-xs text-muted-foreground">{{ revenueStats.totalNights }} nights booked</p>
      </div>
      <div class="rounded-lg border bg-card p-4">
        <p class="text-xs text-muted-foreground">Avg Length of Stay</p>
        <p class="mt-1 text-xl font-bold tracking-tight">{{ revenueStats.avgLengthOfStay }} nights</p>
        <p class="mt-0.5 text-xs text-muted-foreground">{{ revenueStats.avgGuestsPerBooking }} guests avg</p>
      </div>
    </div>

    <!-- Channel breakdown -->
    <div class="rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <p class="text-sm font-medium">Revenue by Channel</p>
        <p class="text-xs text-muted-foreground">May 2026</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b bg-muted/40">
              <th class="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Channel</th>
              <th class="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Revenue</th>
              <th class="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground">% Revenue</th>
              <th class="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground">Reservations</th>
              <th class="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground">% Bookings</th>
              <th class="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">ADR</th>
              <th class="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Avg Nights</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="ch in revenueByChannel" :key="ch.channel" class="hover:bg-muted/30">
              <td class="px-5 py-3 font-medium">{{ ch.channel }}</td>
              <td class="px-3 py-3 text-right font-semibold tabular-nums">{{ formatCHF(ch.revenue) }}</td>
              <td class="px-3 py-3 text-center tabular-nums">{{ ch.pctRevenue }}%</td>
              <td class="px-3 py-3 text-center tabular-nums">{{ ch.reservations }}</td>
              <td class="px-3 py-3 text-center tabular-nums">{{ ch.pctBookings }}%</td>
              <td class="px-3 py-3 text-right tabular-nums">{{ formatCHF(ch.adr) }}</td>
              <td class="px-5 py-3 text-right tabular-nums">{{ ch.avgNights }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t bg-muted/40">
              <td class="px-5 py-2.5 text-xs font-medium text-muted-foreground">Total</td>
              <td class="px-3 py-2.5 text-right text-xs font-bold tabular-nums">{{ formatCHF(revenueStats.totalRevenue) }}</td>
              <td class="px-3 py-2.5 text-center text-xs text-muted-foreground">100%</td>
              <td class="px-3 py-2.5 text-center text-xs font-bold tabular-nums">{{ revenueStats.totalReservations }}</td>
              <td class="px-3 py-2.5 text-center text-xs text-muted-foreground">100%</td>
              <td class="px-3 py-2.5 text-right text-xs tabular-nums">{{ formatCHF(revenueStats.adr) }}</td>
              <td class="px-5 py-2.5 text-right text-xs tabular-nums">{{ revenueStats.avgLengthOfStay }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Revenue by listing -->
    <div class="rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <p class="text-sm font-medium">Revenue by Listing</p>
        <p class="text-xs text-muted-foreground">May 2026 — all active listings</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b bg-muted/40">
              <th class="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Listing</th>
              <th class="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">City</th>
              <th class="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Revenue</th>
              <th class="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground">Reservations</th>
              <th class="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground">Nights</th>
              <th class="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">ADR</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="item in revenueByListing" :key="item.listing" class="hover:bg-muted/30">
              <td class="px-5 py-3 font-medium">{{ item.listing }}</td>
              <td class="px-3 py-3 text-muted-foreground">{{ item.city }}</td>
              <td class="px-3 py-3 text-right font-semibold tabular-nums">{{ formatCHF(item.revenue) }}</td>
              <td class="px-3 py-3 text-center tabular-nums">{{ item.reservations }}</td>
              <td class="px-3 py-3 text-center tabular-nums">{{ item.nights }}</td>
              <td class="px-5 py-3 text-right tabular-nums">{{ formatCHF(item.adr) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent reservations -->
    <div class="rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <p class="text-sm font-medium">Recent Reservations</p>
        <p class="text-xs text-muted-foreground">May 2026 — check-in this month</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b bg-muted/40">
              <th class="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Guest</th>
              <th class="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Listing</th>
              <th class="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Channel</th>
              <th class="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Check-in</th>
              <th class="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Check-out</th>
              <th class="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground">Nights</th>
              <th class="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground">Guests</th>
              <th class="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
              <th class="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="res in recentReservations" :key="res.id" class="hover:bg-muted/30">
              <td class="px-5 py-3 font-medium">{{ res.guest }}</td>
              <td class="px-3 py-3 max-w-48 truncate text-muted-foreground" :title="res.listing">{{ res.listing }}</td>
              <td class="px-3 py-3 text-muted-foreground">{{ res.channel }}</td>
              <td class="px-3 py-3 tabular-nums text-muted-foreground">{{ res.checkIn }}</td>
              <td class="px-3 py-3 tabular-nums text-muted-foreground">{{ res.checkOut }}</td>
              <td class="px-3 py-3 text-center tabular-nums">{{ res.nights }}</td>
              <td class="px-3 py-3 text-center tabular-nums">{{ res.guests }}</td>
              <td class="px-3 py-3 text-right font-semibold tabular-nums">{{ formatCHF(res.amount) }}</td>
              <td class="px-5 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="statusClass[res.status]">
                  {{ res.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
