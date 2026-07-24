<script setup lang="ts">
// Owner Portal — Reservation Calendar.
//
// Vertical listing rows (per room type) with horizontal day cells. Each
// reservation is rendered as a bar that spans its date range, with
// overlapping stays in the same room stacked vertically. Guest stays are
// emerald, owner blocks are amber. The "New owner reservation" button
// emits a date-range payload for the parent to drive the create flow.

import type { OwnerReservation } from '~/components/owners/data/owner-reservations'
import { computed, ref } from 'vue'
import { listings } from '~/components/listings/data/listings'
import {
  mockOwnerReservations,
  mockOwnerRoomTypes,
  mockOwnerRooms,
} from '~/components/owners/data/owner-reservations-seed'
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
  'createOwnerReservation': [value: { checkIn: string, checkOut: string, listingId?: string, roomTypeId?: string }]
  'editOwnerReservation': [value: OwnerReservation]
  'removeOwnerReservation': [value: OwnerReservation]
}>()

const anchor = computed({
  get: () => props.anchor ?? new Date(),
  set: value => emit('update:anchor', value),
})

const reservations = computed<OwnerReservation[]>(() => props.reservations ?? mockOwnerReservations)

const monthGrid = computed(() => buildReservationMonthGrid(anchor.value))
const monthLabel = computed(() => anchor.value.toLocaleDateString('en-US', { month: 'long' }))
const yearLabel = computed(() => anchor.value.toLocaleDateString('en-US', { year: 'numeric' }))

const ROW_HEIGHT_PX = 110
const BAR_TOP_OFFSET_PX = 32
const BAR_ROW_GAP_PX = 24

const ownerListings = computed(() => {
  const ids = new Set<string>()
  for (const reservation of reservations.value)
    ids.add(reservation.listingId)
  return listings.value.filter((l): l is NonNullable<typeof l> => ids.has(l.id))
})

interface RoomRow {
  key: string
  label: string
  type: 'room' | 'unassigned'
  roomTypeId?: string
  capacity?: number
}

const roomRowsByListing = computed<Record<string, RoomRow[]>>(() => {
  const out: Record<string, RoomRow[]> = {}
  for (const listing of ownerListings.value) {
    const roomTypes = mockOwnerRoomTypes
      .filter(rt => rt.listingId === listing.id)
      .sort((a, b) => a.name.localeCompare(b.name))
    const rows: RoomRow[] = roomTypes.map(rt => ({
      key: rt.id,
      label: rt.name,
      type: 'room',
      roomTypeId: rt.id,
      capacity: rt.capacity,
    }))
    rows.push({ key: `__listing__${listing.id}`, label: 'Unassigned', type: 'unassigned' })
    out[listing.id] = rows
  }
  return out
})

const roomTypeById = computed(() => new Map(mockOwnerRoomTypes.map(rt => [rt.id, rt])))
const roomById = computed(() => new Map(mockOwnerRooms.map(r => [r.id, r])))

interface BarWithCoords {
  id: string
  type: 'guest' | 'owner_block'
  listingId: string
  roomTypeId?: string
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

interface PlacedBar extends BarWithCoords {
  roomRow: number
}

const barsByListingRow = computed<Record<string, PlacedBar[]>>(() => {
  const out: Record<string, PlacedBar[]> = {}
  for (const listing of ownerListings.value) {
    const listingReservations = reservations.value.filter(r => r.listingId === listing.id)
    const bars = buildReservationBars(monthGrid.value, listing.id, listingReservations)
    const roomRows = roomRowsByListing.value[listing.id] ?? []
    for (const bar of bars) {
      const roomKey = bar.roomTypeId ?? `__listing__${listing.id}`
      const roomIndex = roomRows.findIndex(r => r.key === roomKey)
      const safeRoomIndex = roomIndex === -1 ? Math.max(0, roomRows.length - 1) : roomIndex
      const totalCells = 42
      out[`${listing.id}:${bar.id}`] = [{
        ...bar,
        topPx: BAR_TOP_OFFSET_PX + bar.row * BAR_ROW_GAP_PX,
        leftPct: (bar.startDay / totalCells) * 100,
        widthPct: ((bar.endDay - bar.startDay + 1) / totalCells) * 100,
        roomRow: safeRoomIndex,
      }]
    }
  }
  return out
})

const totalRows = computed(() => {
  let total = 1 // header
  for (const listing of ownerListings.value) {
    const rows = roomRowsByListing.value[listing.id] ?? []
    total += rows.length
  }
  return total
})

const rowOffsets = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {}
  let offset = 1
  for (const listing of ownerListings.value) {
    const rows = roomRowsByListing.value[listing.id] ?? []
    for (const row of rows) {
      map[`${listing.id}:${row.key}`] = offset
      offset += 1
    }
  }
  map.__total__ = offset
  return map
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

function openBar(bar: PlacedBar) {
  const reservationId = bar.id.split('-').slice(0, -2).join('-')
  const found = reservations.value.find(r => r.id === reservationId)
  if (!found)
    return
  selectedReservation.value = found
  popoverOpen.value = true
}

function newOwnerReservation() {
  const listingId = ownerListings.value[0]?.id
  const roomTypeId = listingId ? roomRowsByListing.value[listingId]?.[0]?.roomTypeId : undefined
  emit('createOwnerReservation', { checkIn: '', checkOut: '', listingId, roomTypeId })
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
            <th class="sticky left-0 z-10 min-w-56 border-r bg-muted/30 px-3 py-3 text-left font-medium">
              Listing / room
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
          <template
            v-for="listing in ownerListings"
            :key="listing.id"
          >
            <tr
              v-for="(room, roomIndex) in (roomRowsByListing[listing.id] ?? [])"
              :key="`${listing.id}-${room.key}`"
              class="border-b"
              :class="roomIndex === 0 ? 'border-t' : ''"
            >
              <th
                v-if="roomIndex === 0"
                rowspan="(roomRowsByListing[listing.id] ?? []).length"
                class="sticky left-0 z-10 min-w-56 border-r bg-background px-3 text-left align-top text-sm font-medium"
              >
                <div class="font-medium">
                  {{ listing.name }}
                </div>
                <div class="text-[10px] font-normal text-muted-foreground">
                  {{ listing.location }}
                </div>
              </th>
              <th
                v-else
                class="hidden"
              />
              <th
                class="border-r border-b bg-muted/20 px-3 py-2 text-left align-middle text-[11px] font-medium whitespace-nowrap"
              >
                <div class="flex items-center justify-between">
                  <span>{{ room.label }}</span>
                  <span
                    v-if="room.type === 'room'"
                    class="text-[10px] font-normal text-muted-foreground"
                  >
                    {{ room.capacity }} room
                  </span>
                </div>
              </th>
              <td
                v-for="cell in monthGrid"
                :key="`${listing.id}-${room.key}-${cell.key}`"
                class="relative min-w-14 border-r border-b p-0 align-top"
                :style="{ height: `${ROW_HEIGHT_PX}px` }"
                :class="cell.inMonth ? (cell.isToday ? 'bg-primary/5' : '') : 'bg-muted/10'"
              />
            </tr>
          </template>
        </tbody>
      </table>
      <!-- Bar overlay layer: positioned absolutely per (listing, room) row
           so bars align with their respective room-type row. -->
      <div
        v-for="(listing, listingIndex) in ownerListings"
        :key="`bars-${listing.id}`"
        class="pointer-events-none relative"
        :style="{ marginTop: `-${(totalRows - 1) * ROW_HEIGHT_PX}px` }"
      >
        <div
          v-for="(barEntry, barKey) in barsByListingRow"
          :key="`${barKey}-${barEntry[0]?.id}`"
        >
          <div
            v-for="bar in barEntry"
            :key="`overlay-${bar.id}`"
            class="pointer-events-auto absolute"
            :style="{
              top: `${(rowOffsets[`${listing.id}:${bar.roomTypeId ?? `__listing__${listing.id}`}`] ?? 0) * ROW_HEIGHT_PX + bar.topPx}px`,
              left: `calc(224px + ${bar.leftPct * (100 - 14) / 100}%)`,
              width: `${bar.widthPct * (100 - 14) / 100}%`,
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
    </div>
    <PortalOwnerReservationPopover
      v-model:open="popoverOpen"
      :reservation="selectedReservation"
      @edit="(value) => emit('editOwnerReservation', value)"
      @remove="(value) => emit('removeOwnerReservation', value)"
    />
  </div>
</template>
