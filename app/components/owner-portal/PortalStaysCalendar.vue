<script setup lang="ts">
// Owner-stay calendar.
//
// Renders a property × month grid where each active stay is drawn as a
// bar that spans its date range. Bars belonging to overlapping stays in
// the same listing are stacked vertically (rows of a nested mini-grid),
// so the user can see exactly which dates each stay occupies and which
// nights are still free.
//
// Click a bar to edit. Click an empty day cell to create a new stay for
// that listing (board's `create` event is relayed to the parent).

import type { OwnerStay } from '~/components/owners/data/owner-stays'
import { computed, ref } from 'vue'
import { listings } from '~/components/listings/data/listings'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { getMonthGrid } from '~/components/operations-calendar/data/operations-calendar'
import { useOwnerPortal } from '~/composables/useOwnerPortal'
import PortalSyncStatus from './PortalSyncStatus.vue'

const props = defineProps<{
  anchor?: Date
}>()

const emit = defineEmits<{
  edit: [value: OwnerStay]
  create: [value: { listingId: string, dayKey: string }]
}>()

const { myStays } = useOwnerPortal()

const anchor = computed(() => props.anchor ?? new Date())

const monthGrid = computed(() => getMonthGrid(anchor.value))

const listingsById = computed(() => new Map(listings.value.map(l => [l.id, l])))

const ownerStays = computed<OwnerStay[]>(() => myStays.value.filter(s => s.status === 'active'))

const ownerListings = computed(() => Array.from(new Set(ownerStays.value.map(s => s.listingId)))
  .map(id => listingsById.value.get(id))
  .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing)))

interface StayBar {
  stay: OwnerStay
  startIndex: number
  endIndex: number
  row: number
}

function dateKeyToIndex(key: string): number {
  return monthGrid.value.findIndex(cell => cell.key === key)
}

function dayIndex(key: string): number {
  return dateKeyToIndex(key) + 1
}

function buildBarsForListing(listingId: string): StayBar[] {
  const listingStays = ownerStays.value
    .filter(s => s.listingId === listingId)
    .slice()
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))

  const bars: StayBar[] = []
  const rowEnd: number[] = []
  for (const stay of listingStays) {
    const startIndex = dateKeyToIndex(stay.checkIn)
    const checkOutIndex = dateKeyToIndex(stay.checkOut)
    // Cap endIndex at the visible grid range so stays outside the month
    // still render in the first/last week they overlap.
    const endIndex = checkOutIndex === -1
      ? monthGrid.value.findLastIndex(cell => cell.key < stay.checkOut)
      : checkOutIndex
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex)
      continue

    let row = rowEnd.findIndex(end => end <= startIndex)
    if (row === -1) {
      row = rowEnd.length
      rowEnd.push(endIndex)
    }
    else {
      rowEnd[row] = endIndex
    }
    bars.push({ stay, startIndex, endIndex, row })
  }
  return bars
}

const barsByListing = computed<Record<string, StayBar[]>>(() => {
  const out: Record<string, StayBar[]> = {}
  for (const listing of ownerListings.value)
    out[listing.id] = buildBarsForListing(listing.id)
  return out
})

function edit(stay: OwnerStay) {
  emit('edit', stay)
}

function onCellClick(cell: { key: string, inMonth: boolean }) {
  if (!cell.inMonth)
    return
  const firstListing = ownerListings.value[0]
  if (!firstListing)
    return
  emit('create', { listingId: firstListing.id, dayKey: cell.key })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">
        {{ ownerStays.length }} active stay{{ ownerStays.length === 1 ? '' : 's' }}
      </Badge>
      <span class="text-xs text-muted-foreground">
        Click a bar to edit. Bars span the stay's date range; overlapping bars stack.
      </span>
    </div>
    <div v-if="ownerListings.length" class="space-y-4">
      <div
        v-for="listing in ownerListings"
        :key="listing.id"
        class="rounded-lg border bg-card"
      >
        <div class="flex items-center justify-between border-b px-4 py-2">
          <div>
            <p class="text-sm font-medium">
              {{ listing.name }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ listing.location }}
            </p>
          </div>
          <Badge variant="outline">
            {{ listing.property }}
          </Badge>
        </div>
        <div
          class="grid grid-cols-7 border-b bg-muted/30 text-[10px] uppercase tracking-wide text-muted-foreground"
        >
          <div
            v-for="cell in monthGrid.slice(0, 7)"
            :key="cell.key"
            class="border-r px-2 py-1 last:border-r-0"
          >
            {{ cell.weekday }}
          </div>
        </div>
        <div class="relative grid grid-cols-7">
          <button
            v-for="cell in monthGrid"
            :key="`cell-${cell.key}`"
            type="button"
            class="relative h-20 min-h-20 border-b border-r px-1.5 py-1 text-left text-xs transition-colors last:border-r-0 hover:bg-muted/40"
            :class="cell.inMonth ? 'bg-background' : 'bg-muted/10 text-muted-foreground'"
            @click="onCellClick(cell)"
          >
            <span
              class="text-[10px] font-semibold"
              :class="cell.inMonth ? 'text-foreground' : 'text-muted-foreground/60'"
            >
              {{ cell.label }}
            </span>
          </button>
          <div
            v-for="bar in (barsByListing[listing.id] ?? [])"
            :key="bar.stay.id"
            class="pointer-events-none absolute"
            :style="{
              top: `calc(1.25rem + ${bar.row} * 1.45rem + ${bar.row * 2}px + 0.25rem)`,
              left: `calc(((${bar.startIndex} % 7) / 7) * 100% + 2px)`,
              width: `calc(((${bar.endIndex} - ${bar.startIndex} + 1) / 7) * 100% - 4px)`,
              height: '1.25rem',
            }"
          >
            <button
              type="button"
              class="pointer-events-auto flex h-full w-full items-center gap-1 truncate rounded bg-primary/15 px-1.5 text-[11px] text-foreground transition-colors hover:bg-primary/25"
              @click="edit(bar.stay)"
            >
              <span class="truncate font-medium">
                {{ bar.stay.guestName }}
              </span>
              <span class="ml-auto text-[10px] text-muted-foreground">
                {{ bar.stay.nights }}n
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
      No active properties for this account yet. Use Create stay above to add a stay.
    </div>
    <section v-if="ownerStays.length" class="space-y-3">
      <h3 class="text-sm font-semibold">
        Sync status
      </h3>
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="stay in ownerStays"
          :key="`status-${stay.id}`"
          class="rounded-md border bg-card p-3"
        >
          <div class="mb-2 flex items-start justify-between gap-2">
            <div>
              <p class="text-sm font-medium">
                {{ stay.guestName }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ listingsById.get(stay.listingId)?.name ?? stay.listingId }}
              </p>
            </div>
            <Badge variant="outline">
              {{ stay.nights }}n
            </Badge>
          </div>
          <PortalSyncStatus :stay="stay" />
        </div>
      </div>
    </section>
  </div>
</template>
