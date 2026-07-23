<script setup lang="ts">
// Owner-stay calendar.
//
// The shared OperationsCalendarBoard was built around guest/cleaning/task
// events and would render 16 columns for every listing (most empty) without
// surfacing the owner-specific stay info (guest, dates, sync state). The
// owner experience is simpler — a week grid of the owner's own listings
// with the stay event rendered as a clickable card that opens the dialog
// and shows the guest, dates, and per-target sync status.
import type { OwnerStay, OwnerStaySyncTarget } from '~/components/owners/data/owner-stays'
import { computed } from 'vue'
import { listings } from '~/components/listings/data/listings'
import { getWeekDays } from '~/components/operations-calendar/data/operations-calendar'
import { useOwnerPortal } from '~/composables/useOwnerPortal'
import PortalSyncStatus from './PortalSyncStatus.vue'

const props = defineProps<{
  anchor?: Date
}>()
const emit = defineEmits<{
  edit: [value: OwnerStay]
  retry: [value: { stay: OwnerStay, target: OwnerStaySyncTarget }]
}>()
const { myStays } = useOwnerPortal()
const weekDays = computed(() => getWeekDays(props.anchor))
const listingsById = computed(() => new Map(listings.value.map(l => [l.id, l])))
const stays = computed<OwnerStay[]>(() => myStays.value.filter(s => s.status === 'active'))
const ownerListingIds = computed(() => Array.from(new Set(stays.value.map(s => s.listingId))))
const ownerListings = computed(() => ownerListingIds.value
  .map(id => listingsById.value.get(id))
  .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing)))
const eventsByListingAndDay = computed(() => {
  const result = new Map<string, Map<string, OwnerStay>>()
  for (const stay of stays.value) {
    let inner = result.get(stay.listingId)
    if (!inner) {
      inner = new Map()
      result.set(stay.listingId, inner)
    }
    inner.set(stay.checkIn, stay)
  }
  return result
})
const todayKey = computed(() => weekDays.value[0]?.key ?? new Date().toISOString().slice(0, 10))
function stayFor(listingId: string, dayKey: string) {
  return eventsByListingAndDay.value.get(listingId)?.get(dayKey) ?? null
}
function edit(stay: OwnerStay) {
  emit('edit', stay)
}
function retry(target: OwnerStaySyncTarget, stay: OwnerStay) {
  emit('retry', { stay, target })
}
</script>

<template>
  <div class="space-y-3">
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="listing in ownerListings"
        :key="listing.id"
        class="rounded-md border bg-card p-3"
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
        <div
          v-for="day in weekDays"
          :key="`${listing.id}-${day.key}`"
          class="flex items-center justify-between border-t py-1.5 text-xs first:border-t-0"
        >
          <span
            class="w-20 shrink-0"
            :class="day.key === todayKey ? 'font-semibold text-foreground' : 'text-muted-foreground'"
          >
            {{ day.label }}
          </span>
          <button
            v-if="stayFor(listing.id, day.key)"
            type="button"
            class="flex flex-1 items-center justify-end gap-1 rounded bg-primary/10 px-2 py-1 text-right text-primary-foreground/90 transition-colors hover:bg-primary/15"
            @click="edit(stayFor(listing.id, day.key)!)"
          >
            <span class="truncate text-left text-[11px]">
              <span class="font-medium text-foreground">
                {{ stayFor(listing.id, day.key)!.guestName }}
              </span>
              <span class="text-muted-foreground"> · {{ stayFor(listing.id, day.key)!.nights }}n</span>
            </span>
            <PortalSyncStatus
              v-if="stayFor(listing.id, day.key)"
              :stay="stayFor(listing.id, day.key)!"
              class="ml-1"
              @retry="(target: OwnerStaySyncTarget) => retry(target, stayFor(listing.id, day.key)!)"
            />
          </button>
          <span
            v-else
            class="flex-1 text-right text-[11px] text-muted-foreground"
          >
            Available
          </span>
        </div>
      </div>
    </div>
    <p v-if="!ownerListings.length" class="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
      No active properties for this account.
    </p>
  </div>
</template>
