<script setup lang="ts">
// Owner-stay calendar.
//
// Renders the shared OperationsCalendarBoard grid for visual context, then
// overlays an always-clickable list of the owner's active stays below it.
// Clicking a stay card emits `edit` so the parent dialog opens, regardless
// of the board's internal click handling.

import type { CalendarEvent, CalendarListing, OperationsFilters } from '~/components/operations-calendar/data/operations-calendar'
import type { OwnerStay } from '~/components/owners/data/owner-stays'
import { computed, ref } from 'vue'
import { listings } from '~/components/listings/data/listings'
import {
  buildOwnerStayEvents,
  getWeekDays,
} from '~/components/operations-calendar/data/operations-calendar'
import OperationsCalendarBoard from '~/components/operations-calendar/OperationsCalendarBoard.vue'
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

const selectedDay = ref<string | undefined>(undefined)
const showAllListings = ref(false)
const emptyFilters: OperationsFilters = {
  listingSearch: '',
  listingTags: [],
  eventTypes: [],
}
const filters = ref<OperationsFilters>({ ...emptyFilters })

const listingsById = computed(() => new Map(
  listings.value.map(l => [l.id, { id: l.id, name: l.name, colorIndex: 0, property: l.property, unitTypeLabel: l.room, roomLabel: l.name, isSingleUnit: l.unitType === 'single', tags: l.tags, bookings: l.bookings } satisfies CalendarListing]),
))

const ownerStays = computed<OwnerStay[]>(() => myStays.value.filter(s => s.status === 'active'))

const ownerListingIds = computed(() => Array.from(new Set(ownerStays.value.map(s => s.listingId))))

const ownerListings = computed<CalendarListing[]>(() => ownerListingIds.value
  .map(id => listingsById.value.get(id))
  .filter((listing): listing is CalendarListing => Boolean(listing)))

const staysByListing = computed<Record<string, OwnerStay[]>>(() => {
  const grouped: Record<string, OwnerStay[]> = {}
  for (const stay of ownerStays.value) {
    if (!grouped[stay.listingId])
      grouped[stay.listingId] = []
    grouped[stay.listingId]!.push(stay)
  }
  return grouped
})

const events = computed<CalendarEvent[]>(() => buildOwnerStayEvents(ownerStays.value)
  .map((event) => {
    const listing = listingsById.value.get(event.listingId)
    const stay = staysByListing.value[event.listingId]?.find(s => s.id === event.id.replace('owner-stay-', ''))
    return {
      ...event,
      listingName: listing?.name ?? event.listingId,
      colorIndex: listing?.colorIndex ?? 0,
      title: stay?.guestName ?? event.title,
      notes: stay ? `${stay.checkIn} → ${stay.checkOut} · ${stay.nights}n` : event.notes,
    }
  }))

const eventsByDay = computed(() => groupEventsByKey(events.value, e => e.start.slice(0, 10)))
const eventsByDayAndListing = computed(() => groupEventsByKey(events.value, e => `${e.start.slice(0, 10)}::${e.listingId}`))
const eventsByListingAndDay = computed(() => {
  const result = new Map<string, Map<string, CalendarEvent[]>>()
  for (const event of events.value) {
    const day = event.start.slice(0, 10)
    let inner = result.get(event.listingId)
    if (!inner) {
      inner = new Map()
      result.set(event.listingId, inner)
    }
    const bucket = inner.get(day) ?? []
    bucket.push(event)
    inner.set(day, bucket)
  }
  return result
})

const weekDays = computed(() => getWeekDays(props.anchor))

function groupEventsByKey(values: CalendarEvent[], key: (event: CalendarEvent) => string) {
  const map = new Map<string, CalendarEvent[]>()
  for (const event of values) {
    const k = key(event)
    const bucket = map.get(k) ?? []
    bucket.push(event)
    map.set(k, bucket)
  }
  return map
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
        Click any stay card below to edit.
      </span>
    </div>
    <OperationsCalendarBoard
      v-if="ownerListings.length"
      :events="events"
      :events-by-day="eventsByDay"
      :events-by-day-and-listing="eventsByDayAndListing"
      :events-by-listing-and-day="eventsByListingAndDay"
      :week-days="weekDays"
      view="week"
      :selected-day="selectedDay"
      :show-all-listings="showAllListings"
      :filters="filters"
      @event-click="(event) => { const stay = event && staysByListing[event.listingId]?.find(s => `owner-stay-${s.id}` === event.id); if (stay) edit(stay) }"
      @update:selected-day="selectedDay = $event"
      @update:show-all-listings="showAllListings = $event"
    />
    <div v-else class="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
      No active properties for this account yet.
    </div>
    <section v-if="ownerListings.length" class="space-y-3">
      <h3 class="text-sm font-semibold">
        Active stays
      </h3>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="stay in ownerStays"
          :key="stay.id"
          class="rounded-md border bg-card p-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-sm font-medium">
                {{ stay.guestName }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ listingsById.get(stay.listingId)?.name ?? stay.listingId }}
              </p>
            </div>
            <Badge variant="outline" class="shrink-0">
              {{ stay.nights }}n
            </Badge>
          </div>
          <p class="mt-2 text-xs text-muted-foreground">
            {{ stay.checkIn }} → {{ stay.checkOut }}
          </p>
          <PortalSyncStatus :stay="stay" class="mt-2" />
          <div class="mt-3 flex justify-end">
            <Button size="sm" @click="edit(stay)">
              Edit stay
            </Button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
