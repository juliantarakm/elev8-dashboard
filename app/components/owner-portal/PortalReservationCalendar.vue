<script setup lang="ts">
// Owner Portal — Reservation Calendar.
//
// Read-mostly view of guest bookings plus the owner's own personal-use
// blocks. Guest bars are read-only and labelled with channel + guest
// name; owner blocks are visually distinct (Elev8 gold) and editable via
// a popover. The only write action is "New owner reservation" which
// emits a date-range payload so the parent can drive the create flow.

import type { OwnerReservation } from '~/components/owners/data/owner-reservations'
import { computed, ref } from 'vue'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  buildReservationBars,
  buildReservationMonthGrid,
} from '~/lib/owner-reservations-layout'
import { mockOwnerReservations } from '~/components/owners/data/owner-reservations-seed'
import PortalOwnerReservationPopover from './PortalOwnerReservationPopover.vue'
import { useOwnerPortal } from '~/composables/useOwnerPortal'

const props = defineProps<{
  anchor?: Date
  reservations?: OwnerReservation[]
}>()

const emit = defineEmits<{
  'update:anchor': [value: Date]
  createOwnerReservation: [value: { checkIn: string, checkOut: string, listingId?: string }]
  editOwnerReservation: [value: OwnerReservation]
  removeOwnerReservation: [value: OwnerReservation]
}>()

const { listings } = useOwnerPortal()

const anchor = computed({
  get: () => props.anchor ?? new Date(),
  set: value => emit('update:anchor', value),
})

const monthGrid = computed(() => buildReservationMonthGrid(anchor.value))
const monthLabel = computed(() => anchor.value.toLocaleDateString('en-US', { month: 'long' }))
const yearLabel = computed(() => anchor.value.toLocaleDateString('en-US', { year: 'numeric' }))

const ownerListings = computed(() => {
  const ids = new Set<string>()
  for (const reservation of reservations.value)
    ids.add(reservation.listingId)
  return listings.value.filter(l => ids.has(l.id))
})

const reservations = computed<OwnerReservation[]>(() => props.reservations ?? mockOwnerReservations)

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
        topPx: 24 + bar.row * 22,
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
  <div class="space-y-4">
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
    <div class="grid grid-cols-7 border-b pb-1 text-xs uppercase tracking-wide text-muted-foreground">
      <div
        v-for="cell in monthGrid.slice(0, 7)"
        :key="cell.key"
        class="px-2"
      >
        {{ cell.weekday }}
      </div>
    </div>
    <div
      v-for="listing in ownerListings"
      :key="listing.id"
      class="space-y-2"
    >
      <div class="text-sm font-medium">
        {{ listing.name }}
      </div>
      <div class="relative grid grid-cols-7 border bg-background">
        <div
          v-for="cell in monthGrid"
          :key="`${listing.id}-${cell.key}`"
          class="relative h-12 min-h-12 border-b border-r px-1 pt-0.5 text-left text-[10px] last:border-r-0"
          :class="cell.inMonth ? (cell.isToday ? 'bg-primary/5' : 'bg-background') : 'bg-muted/10 text-muted-foreground/60'"
        >
          <span
            class="text-[10px] font-semibold"
            :class="cell.inMonth ? 'text-foreground' : 'text-muted-foreground/60'"
          >
            {{ cell.date.getDate() }}
          </span>
        </div>
        <div
          v-for="bar in (barsByListing[listing.id] ?? [])"
          :key="bar.id"
          class="pointer-events-auto absolute"
          :style="{
            top: `${bar.topPx}px`,
            left: `${bar.leftPct}%`,
            width: `${bar.widthPct}%`,
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
