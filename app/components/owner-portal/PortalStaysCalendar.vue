<script setup lang="ts">
// Owner-stay calendar.
//
// Renders a property × day grid where each cell with an active stay
// becomes a clickable button. The shared OperationsCalendarBoard would
// have been the natural fit, but its event-chip click handling depends
// on internal event bubbling that did not translate reliably into the
// owner-portal context, so we render a focused owner grid here instead.

import type { OwnerStay } from '~/components/owners/data/owner-stays'
import { computed } from 'vue'
import { listings } from '~/components/listings/data/listings'
import { getWeekDays } from '~/components/operations-calendar/data/operations-calendar'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { useOwnerPortal } from '~/composables/useOwnerPortal'
import PortalSyncStatus from './PortalSyncStatus.vue'

const props = defineProps<{
  anchor?: Date
}>()

const emit = defineEmits<{
  edit: [value: OwnerStay]
}>()

const { myStays } = useOwnerPortal()

const weekDays = computed(() => getWeekDays(props.anchor))

const listingsById = computed(() => new Map(listings.value.map(l => [l.id, l])))

const ownerStays = computed<OwnerStay[]>(() => myStays.value.filter(s => s.status === 'active'))

const ownerListings = computed(() => Array.from(new Set(ownerStays.value.map(s => s.listingId)))
  .map(id => listingsById.value.get(id))
  .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing)))

const staysByListingAndDay = computed(() => {
  const result: Record<string, Record<string, OwnerStay>> = {}
  for (const stay of ownerStays.value) {
    if (!result[stay.listingId])
      result[stay.listingId] = {}
    result[stay.listingId]![stay.checkIn] = stay
  }
  return result
})

const todayKey = computed(() => weekDays.value[0]?.key ?? new Date().toISOString().slice(0, 10))

function stayFor(listingId: string, dayKey: string) {
  return staysByListingAndDay.value[listingId]?.[dayKey] ?? null
}

function edit(stay: OwnerStay) {
  emit('edit', stay)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">
        {{ ownerStays.length }} active stay{{ ownerStays.length === 1 ? '' : 's' }}
      </Badge>
      <span class="text-xs text-muted-foreground">
        Click a chip to edit the stay.
      </span>
    </div>
    <div
      v-if="ownerListings.length"
      class="space-y-3"
    >
      <div
        v-for="listing in ownerListings"
        :key="listing.id"
        class="rounded-lg border bg-card p-3"
      >
        <div class="mb-2 flex items-center justify-between">
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
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="day in weekDays"
            :key="`${listing.id}-${day.key}`"
            class="min-h-16 rounded border border-dashed p-1 text-center"
            :class="day.key === todayKey ? 'border-primary/40 bg-primary/5' : 'border-muted'"
          >
            <p class="text-[10px] uppercase tracking-wide text-muted-foreground">
              {{ day.label.split(' ')[0] }}
            </p>
            <button
              v-if="stayFor(listing.id, day.key)"
              type="button"
              class="mt-1 w-full rounded bg-primary/10 px-1 py-1 text-left text-[11px] text-foreground transition-colors hover:bg-primary/20"
              @click="edit(stayFor(listing.id, day.key)!)"
            >
              <div class="font-medium">
                {{ stayFor(listing.id, day.key)!.guestName }}
              </div>
              <div class="text-[10px] text-muted-foreground">
                {{ stayFor(listing.id, day.key)!.nights }}n
              </div>
            </button>
            <p
              v-else
              class="mt-2 text-[10px] text-muted-foreground/70"
            >
              —
            </p>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
      No active properties for this account yet.
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
          <div class="mb-2 flex items-start justify-between">
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
          <div class="mt-2 flex justify-end">
            <Button size="sm" variant="outline" @click="edit(stay)">
              Edit
            </Button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
