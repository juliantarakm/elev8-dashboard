<script setup lang="ts">
// Owner Portal — Reservation Calendar.
//
// Layout: listing names run vertically as column headers; the week runs
// horizontally as day columns. Each row is a single listing; each cell
// contains stacked reservation bars (guest stays in emerald, owner
// blocks in amber) that span their date range. The "New owner
// reservation" button emits a date-range payload for the parent to
// drive the create flow.

import type { OwnerReservation } from '~/components/owners/data/owner-reservations'
import { computed, ref } from 'vue'
import { listings } from '~/components/listings/data/listings'
import { mockOwnerReservations } from '~/components/owners/data/owner-reservations-seed'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  buildReservationBars,
  buildReservationMonthGrid,
} from '~/lib/owner-reservations-layout'
import PortalOwnerReservationPopover from './PortalOwnerReservationPopover.vue'

const props = defineProps<{
  anchor?: Date
  reservations?: OwnerReservation[]
}>()

const emit = defineEmits<{
  'update:anchor': [value: Date]
  'createOwnerReservation': [value: { checkIn: string, checkOut: string, listingId?: string }]
  'editOwnerReservation': [value: OwnerReservation]
  'removeOwnerReservation': [value: OwnerReservation]
}>()

const anchor = computed({
  get: () => props.anchor ?? new Date(),
  set: value => emit('update:anchor', value),
})

const reservations = computed<OwnerReservation[]>(() => props.reservations ?? mockOwnerReservations)

const ROW_HEIGHT_PX = 140
const BAR_TOP_OFFSET_PX = 36
const BAR_ROW_GAP_PX = 28

const monthGrid = computed(() => buildReservationMonthGrid(anchor.value))
const monthLabel = computed(() => anchor.value.toLocaleDateString('en-US', { month: 'long' }))
const yearLabel = computed(() => anchor.value.toLocaleDateString('en-US', { year: 'numeric' }))

const ownerListings = computed(() => {
  const ids = new Set<string>()
  for (const reservation of reservations.value)
    ids.add(reservation.listingId)
  return listings.value.filter((l): l is NonNullable<typeof l> => ids.has(l.id))
})

interface BarWithCoords {
  id: string
  type: 'guest' | 'owner_block'
  listingId: string
  guestName?: string
  channel?: string
  note?: string
  status: string
  startDay: number
  endDay: number
  row: number
  wrapsForward: boolean
  wrapsBackward: boolean
  topPx: number
  leftPct: number
  widthPct: number
}

const barsByListing = computed<Record<string, BarWithCoords[]>>(() => {
  const out: Record<string, BarWithCoords[]> = {}
  for (const listing of ownerListings.value) {
    const listingReservations = reservations.value.filter(r => r.listingId === listing.id)
    const bars = buildReservationBars(monthGrid.value, listing.id, listingReservations)
    out[listing.id] = bars.map((bar) => {
      const totalCells = 42
      return {
        ...bar,
        topPx: BAR_TOP_OFFSET_PX + bar.row * BAR_ROW_GAP_PX,
        leftPct: (bar.startDay / totalCells) * 100,
        widthPct: ((bar.endDay - bar.startDay + 1) / totalCells) * 100,
      }
    })
  }
  return out
})

function shiftMonth(months: number) {
  const next = new Date(anchor.value)
  next.setDate(1)
  next.setMonth(next.getMonth() + months)
  anchor.value = next
}

function goToToday() {
  const next = new Date()
  next.setHours(0, 0, 0, 0)
  anchor.value = next
}

const selectedReservation = ref<OwnerReservation | null>(null)
const popoverOpen = ref(false)

function openBar(bar: BarWithCoords) {
  const reservationId = bar.id.split('-').slice(0, -2).join('-')
  const found = reservations.value.find(r => r.id === reservationId)
  if (!found)
    return
  selectedReservation.value = found
  popoverOpen.value = true
}

function newOwnerReservation() {
  const listingId = ownerListings.value[0]?.id
  emit('createOwnerReservation', { checkIn: '', checkOut: '', listingId })
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col space-y-4">
    <header class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous month"
          @click="shiftMonth(-1)"
        >
          <Icon name="lucide:chevron-left" class="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next month"
          @click="shiftMonth(1)"
        >
          <Icon name="lucide:chevron-right" class="size-4" />
        </Button>
        <Badge variant="outline" class="ml-2">
          {{ monthLabel }}
        </Badge>
        <Badge variant="outline">
          {{ yearLabel }}
        </Badge>
        <Button variant="ghost" size="sm" @click="goToToday">
          Today
        </Button>
      </div>
      <Button
        class="rounded-full bg-emerald-100 px-4 text-emerald-900 hover:bg-emerald-200"
        @click="newOwnerReservation"
      >
        <Icon name="lucide:plus" class="mr-1.5 size-4" />
        New owner reservation
      </Button>
    </header>

    <div class="min-h-0 flex-1 overflow-auto rounded-md border bg-background">
      <table class="w-full border-collapse text-xs">
        <thead>
          <tr class="border-b bg-muted/30">
            <th class="sticky left-0 z-10 min-w-44 border-r bg-muted/30 px-3 py-3 text-left font-medium">
              Listing
            </th>
            <th
              v-for="cell in monthGrid"
              :key="cell.key"
              class="min-w-12 border-r px-1 py-2 text-center font-normal"
              :class="cell.inMonth ? 'text-foreground' : 'text-muted-foreground/60'"
            >
              <div class="text-[10px] uppercase tracking-wide">
                {{ cell.weekday }}
              </div>
              <div class="text-sm font-semibold" :class="cell.isToday ? 'text-primary' : ''">
                {{ cell.date.getDate() }}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="listing in ownerListings"
            :key="listing.id"
            class="border-b"
          >
            <th class="sticky left-0 z-10 min-w-44 border-r bg-background px-3 py-4 text-left align-top text-sm font-medium">
              <div class="font-medium">
                {{ listing.name }}
              </div>
              <div class="text-[10px] font-normal text-muted-foreground">
                {{ listing.location }}
              </div>
            </th>
            <td
              v-for="cell in monthGrid"
              :key="`${listing.id}-${cell.key}`"
              class="relative min-w-14 border-r border-b p-0 align-top"
              :style="{ height: `${ROW_HEIGHT_PX}px` }"
              :class="cell.inMonth ? (cell.isToday ? 'bg-primary/5' : '') : 'bg-muted/10'"
            />
          </tr>
        </tbody>
      </table>
      <!-- Bar overlay layer: positioned absolutely on top of the table cells
           so the listing/date alignment stays in the grid while bars span
           their date range. -->
      <div
        v-for="(listing, listingIndex) in ownerListings"
        :key="`bars-${listing.id}`"
        class="pointer-events-none relative"
        :style="{
          marginTop: `-${(ownerListings.length - listingIndex) * ROW_HEIGHT_PX}px`,
        }"
      >
        <div
          v-for="bar in (barsByListing[listing.id] ?? [])"
          :key="bar.id"
          class="pointer-events-auto absolute"
          :style="{
            top: `${bar.topPx}px`,
            left: `calc(128px + ${bar.leftPct * (100 - 9.4) / 100}%)`,
            width: `${bar.widthPct * (100 - 9.4) / 100}%`,
            height: '20px',
          }"
        >
          <button
            type="button"
            class="flex h-full w-full items-center gap-1 overflow-hidden rounded-sm px-1.5 text-[10px] text-white"
            :class="bar.type === 'guest'
              ? (bar.status === 'cancelled' ? 'bg-emerald-900/40 line-through' : 'bg-emerald-800')
              : 'bg-amber-400 text-amber-950'"
            :style="{
              clipPath: bar.wrapsBackward && bar.wrapsForward
                ? 'polygon(6px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 6px 100%, 0 calc(100% - 10px), 0 10px)'
                : bar.wrapsBackward
                  ? 'polygon(6px 0, 100% 0, 100% 100%, 6px 100%, 0 calc(100% - 10px), 0 10px)'
                  : bar.wrapsForward
                    ? 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%, 0 10px)'
                    : 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%, 0 10px)',
            }"
            :aria-label="bar.type === 'guest' ? `Guest stay for ${bar.guestName}` : 'Owner block'"
            @click="openBar(bar)"
          >
            <span
              v-if="bar.type === 'guest' && bar.channel"
              class="flex size-4 shrink-0 items-center justify-center rounded-full bg-white/90 text-[9px] font-bold text-emerald-900"
            >
              {{ bar.channel.charAt(0).toUpperCase() }}
            </span>
            <span class="truncate font-medium">
              {{ bar.type === 'guest' ? bar.guestName : (bar.note || 'Owner stay') }}
            </span>
          </button>
        </div>
      </div>
    </div>
    <PortalOwnerReservationPopover
      v-model:open="popoverOpen"
      :reservation="selectedReservation"
      @edit="(value) => emit('editOwnerReservation', value)"
      @remove="(value) => emit('removeOwnerReservation', value)"
    />
  </div>
</template>
