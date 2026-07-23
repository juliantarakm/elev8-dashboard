<script setup lang="ts">
// Owner-stay calendar wrapper.
//
// Reuses the staff OperationsCalendarBoard grid (week + day views) and the
// shared CalendarEvent shape, but feeds it only this owner's data so the
// view is owner-scoped: see `events` and the eventsBy* maps below.

import type { CalendarEvent, CalendarListing, OperationsFilters } from '~/components/operations-calendar/data/operations-calendar'
import type { OwnerStay, OwnerStaySyncTarget } from '~/components/owners/data/owner-stays'
import { computed, ref } from 'vue'
import { listings } from '~/components/listings/data/listings'
import {
  buildOwnerStayEvents,
  getWeekDays,
} from '~/components/operations-calendar/data/operations-calendar'
import OperationsCalendarBoard from '~/components/operations-calendar/OperationsCalendarBoard.vue'
import { useOwnerPortal } from '~/composables/useOwnerPortal'

const props = defineProps<{
  anchor?: Date
  view?: 'week' | 'day'
}>()

const emit = defineEmits<{
  edit: [value: OwnerStay]
  cancel: [value: OwnerStay]
  retry: [value: { stay: OwnerStay, target: OwnerStaySyncTarget }]
}>()

const { myStays, currentOwner } = useOwnerPortal()

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

const ownerStays = computed<OwnerStay[]>(() => myStays.value)

const events = computed<CalendarEvent[]>(() => {
  const owner = currentOwner.value
  if (!owner)
    return []
  // Scope the listings array to the properties the owner owns so the
  // calendar only renders columns the current owner can act on.
  const ownerListingIds = new Set(myStays.value.map(s => s.listingId))
  return buildOwnerStayEvents(ownerStays.value)
    .filter(event => ownerListingIds.has(event.listingId))
    .map((event) => {
      const listing = listingsById.value.get(event.listingId)
      return { ...event, listingName: listing?.name ?? event.listingId, colorIndex: listing?.colorIndex ?? 0 }
    })
})

const eventsByDay = computed(() => groupEventsByKey(events.value, event => event.start.slice(0, 10)))
const eventsByDayAndListing = computed(() => groupEventsByKey(events.value, event => `${event.start.slice(0, 10)}::${event.listingId}`))
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

function groupEventsByKey(
  values: CalendarEvent[],
  key: (event: CalendarEvent) => string,
) {
  const map = new Map<string, CalendarEvent[]>()
  for (const event of values) {
    const k = key(event)
    const bucket = map.get(k) ?? []
    bucket.push(event)
    map.set(k, bucket)
  }
  return map
}

function findStay(event: CalendarEvent): OwnerStay | null {
  return ownerStays.value.find(s => `owner-stay-${s.id}` === event.id) ?? null
}

function onEventClick(event: CalendarEvent) {
  const stay = findStay(event)
  if (stay)
    emit('edit', stay)
}
</script>

<template>
  <OperationsCalendarBoard
    :events="events"
    :events-by-day="eventsByDay"
    :events-by-day-and-listing="eventsByDayAndListing"
    :events-by-listing-and-day="eventsByListingAndDay"
    :week-days="weekDays"
    :view="props.view ?? 'week'"
    :selected-day="selectedDay"
    :show-all-listings="showAllListings"
    :filters="filters"
    @event-click="onEventClick"
    @update:selected-day="selectedDay = $event"
    @update:show-all-listings="showAllListings = $event"
  />
</template>
