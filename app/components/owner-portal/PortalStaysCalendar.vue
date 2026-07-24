<script setup lang="ts">
// Owner-stay calendar.
//
// Reuses the staff OperationsCalendarBoard grid so the visual rhythm
// (week header, listing rows, day cells, event chips) matches the rest of
// the operations experience, but feeds it only this owner's stays and
// decorates the chip with the guest name and date range.

import type { CalendarEvent, CalendarListing, OperationsFilters } from '~/components/operations-calendar/data/operations-calendar'
import type { OwnerStay, OwnerStaySyncTarget } from '~/components/owners/data/owner-stays'
import { computed, ref } from 'vue'
import { listings } from '~/components/listings/data/listings'
import {
  buildOwnerStayEvents,
  getWeekDays,
} from '~/components/operations-calendar/data/operations-calendar'
import OperationsCalendarBoard from '~/components/operations-calendar/OperationsCalendarBoard.vue'
import { Badge } from '~/components/ui/badge'
import { useOwnerPortal } from '~/composables/useOwnerPortal'

const props = defineProps<{
  anchor?: Date
}>()

const emit = defineEmits<{
  edit: [value: OwnerStay]
  retry: [value: { stay: OwnerStay, target: OwnerStaySyncTarget }]
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

const staysById = computed<Record<string, OwnerStay>>(() =>
  Object.fromEntries(ownerStays.value.map(s => [s.id, s])),
)

const events = computed<CalendarEvent[]>(() => buildOwnerStayEvents(ownerStays.value)
  .map((event) => {
    const listing = listingsById.value.get(event.listingId)
    const stay = staysById.value[event.id.replace('owner-stay-', '')]
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

function stayFor(event: CalendarEvent): OwnerStay | null {
  return staysById.value[event.id.replace('owner-stay-', '')] ?? null
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
    <div class="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">
        {{ ownerStays.length }} active stay{{ ownerStays.length === 1 ? '' : 's' }}
      </Badge>
      <span class="text-xs text-muted-foreground">
        Click a chip to edit.
      </span>
    </div>
    <OperationsCalendarBoard
      :events="events"
      :events-by-day="eventsByDay"
      :events-by-day-and-listing="eventsByDayAndListing"
      :events-by-listing-and-day="eventsByListingAndDay"
      :week-days="weekDays"
      view="week"
      :selected-day="selectedDay"
      :show-all-listings="showAllListings"
      :filters="filters"
      @event-click="(event) => { const stay = stayFor(event); if (stay) edit(stay) }"
      @update:selected-day="selectedDay = $event"
      @update:show-all-listings="showAllListings = $event"
    />
    <div v-if="!ownerListings.length" class="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
      No active properties for this account yet.
    </div>
  </div>
</template>
