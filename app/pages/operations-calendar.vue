<script setup lang="ts">
import OperationsCalendarFilters from '~/components/operations-calendar/OperationsCalendarFilters.vue'
import { useOperationsCalendar } from '~/composables/useOperationsCalendar'

const {
  view,
  selectedDay,
  showAllListingsInDay,
  filters,
  weekDays,
  filteredEvents,
  eventsByDay,
  eventsByDayAndListing,
  eventsByListingAndDay,
  previousWeek,
  nextWeek,
  goToToday,
  clearFilters,
} = useOperationsCalendar()

function handleEventClick(_event: any) {
  // TODO: open event detail dialog
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Operations Calendar
        </h2>
        <p class="text-muted-foreground">
          Time-based view of guest stays, cleaning, and maintenance tasks.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Tabs v-model="view">
          <TabsList>
            <TabsTrigger value="week">
              Week
            </TabsTrigger>
            <TabsTrigger value="day">
              Day
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" @click="previousWeek">
          <Icon name="lucide:chevron-left" class="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" @click="goToToday">
          Today
        </Button>
        <Button variant="outline" size="sm" @click="nextWeek">
          <Icon name="lucide:chevron-right" class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <ClientOnly>
      <div class="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm">
        <OperationsCalendarFilters
          :filters="filters"
          @update:filters="filters = $event"
          @clear="clearFilters"
        />
      </div>

      <LazyOperationsCalendarBoard
        :events="filteredEvents"
        :events-by-day="eventsByDay"
        :events-by-day-and-listing="eventsByDayAndListing"
        :events-by-listing-and-day="eventsByListingAndDay"
        :week-days="weekDays"
        :view="view"
        :selected-day="selectedDay"
        :show-all-listings="showAllListingsInDay"
        @update:selected-day="selectedDay = $event"
        @update:show-all-listings="showAllListingsInDay = $event"
        @update:view="view = $event"
        @event-click="handleEventClick"
      />

      <template #fallback>
        <div class="flex h-96 items-center justify-center rounded-2xl border bg-card text-sm text-muted-foreground">
          Loading operations calendar…
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
