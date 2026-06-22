<script setup lang="ts">
import type { CalendarEventType, OperationsFilters } from '~/components/operations-calendar/data/operations-calendar'
import { eventTypeLabels, getCalendarListings } from '~/components/operations-calendar/data/operations-calendar'

const props = defineProps<{
  filters: OperationsFilters
}>()

const emit = defineEmits<{
  'update:filters': [filters: OperationsFilters]
  'clear': []
}>()

const calendarListings = computed(() => getCalendarListings())

const eventTypes: CalendarEventType[] = ['guest_stay', 'arrival', 'checkout', 'cleaning', 'maintenance', 'inspection']

function toggleListing(listingId: string) {
  const current = props.filters.listingIds
  const next = current.includes(listingId)
    ? current.filter(id => id !== listingId)
    : [...current, listingId]
  emit('update:filters', { ...props.filters, listingIds: next })
}

function toggleEventType(type: CalendarEventType) {
  const current = props.filters.eventTypes
  const next = current.includes(type)
    ? current.filter(t => t !== type)
    : [...current, type]
  emit('update:filters', { ...props.filters, eventTypes: next })
}

function clear() {
  emit('clear')
}
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <Popover>
      <PopoverTrigger as-child>
        <Button variant="outline" size="sm">
          <Icon name="lucide:building" class="mr-2 h-4 w-4" />
          Listings
          <span v-if="filters.listingIds.length" class="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
            {{ filters.listingIds.length }}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-64 p-0" align="start">
        <div class="border-b px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Filter by listing
        </div>
        <div class="max-h-64 overflow-y-auto p-2">
          <div
            v-for="listing in calendarListings"
            :key="listing.id"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
          >
            <Checkbox
              :id="`listing-${listing.id}`"
              :checked="filters.listingIds.includes(listing.id)"
              @update:checked="toggleListing(listing.id)"
            />
            <label :for="`listing-${listing.id}`" class="flex-1 cursor-pointer truncate text-sm">
              {{ listing.name }}
            </label>
          </div>
        </div>
      </PopoverContent>
    </Popover>

    <Popover>
      <PopoverTrigger as-child>
        <Button variant="outline" size="sm">
          <Icon name="lucide:filter" class="mr-2 h-4 w-4" />
          Event types
          <span v-if="filters.eventTypes.length" class="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
            {{ filters.eventTypes.length }}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-56 p-0" align="start">
        <div class="border-b px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Filter by event type
        </div>
        <div class="p-2">
          <div
            v-for="type in eventTypes"
            :key="type"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
          >
            <Checkbox
              :id="`type-${type}`"
              :checked="filters.eventTypes.includes(type)"
              @update:checked="toggleEventType(type)"
            />
            <label :for="`type-${type}`" class="flex-1 cursor-pointer text-sm">
              {{ eventTypeLabels[type] }}
            </label>
          </div>
        </div>
      </PopoverContent>
    </Popover>

    <Button variant="ghost" size="sm" @click="clear">
      <Icon name="lucide:x" class="mr-2 h-4 w-4" />
      Clear filters
    </Button>
  </div>
</template>
