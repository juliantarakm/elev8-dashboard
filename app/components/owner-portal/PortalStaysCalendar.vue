<script setup lang="ts">
// Owner-stay calendar.
//
// Reuses the shared OperationsCalendarBoard grid for visual context, then
// listens to its `eventClick` and `create` emits to drive the dialog:
// chip clicks edit an existing stay, day cell clicks open a new stay
// dialog pre-filled with the chosen listing and check-in date.

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
    const stay = staysByListing.value[event.listingId]?.find(s => `owner-stay-${s.id}` === event.id)
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

function findStayForEvent(event: CalendarEvent): OwnerStay | null {
  return staysByListing.value[event.listingId]?.find(s => `owner-stay-${s.id}` === event.id) ?? null
}

function onEventClick(event: CalendarEvent) {
  const stay = findStayForEvent(event)
  if (stay)
    emit('edit', stay)
}

function onCreate(payload: { listingId: string, dayKey: string }) {
  emit('create', payload)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">
        {{ ownerStays.length }} active stay{{ ownerStays.length === 1 ? '' : 's' }}
      </Badge>
      <span class="text-xs text-muted-foreground">
        Click a chip to edit. Click any empty day cell to create a new stay for that listing.
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
      @event-click="onEventClick"
      @create="onCreate"
      @update:selected-day="selectedDay = $event"
      @update:show-all-listings="showAllListings = $event"
    />
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
