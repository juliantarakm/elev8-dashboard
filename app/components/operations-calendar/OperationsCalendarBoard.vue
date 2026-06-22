<script setup lang="ts">
import type { CalendarEvent } from '~/components/operations-calendar/data/operations-calendar'
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  formatTime,
  formatWeekRange,
  getCalendarListings,
  HOUR_HEIGHT,
  isDayOccupied,
} from '~/components/operations-calendar/data/operations-calendar'

interface WeekDay {
  key: string
  label: string
  date: Date
}

const props = defineProps<{
  events: CalendarEvent[]
  eventsByDay: Map<string, CalendarEvent[]>
  eventsByDayAndListing: Map<string, CalendarEvent[]>
  eventsByListingAndDay: Map<string, Map<string, CalendarEvent[]>>
  weekDays: WeekDay[]
  view: 'week' | 'day'
  selectedDay?: string
  showAllListings?: boolean
}>()

const emit = defineEmits<{
  'update:selectedDay': [dayKey: string]
  'update:showAllListings': [value: boolean]
  'update:view': [view: 'week' | 'day']
  'eventClick': [event: CalendarEvent]
}>()

const totalHours = DAY_END_HOUR - DAY_START_HOUR
const totalHeight = totalHours * HOUR_HEIGHT

const allListings = getCalendarListings()
const sortedListings = computed(() => {
  return [...allListings].sort((a, b) => a.name.localeCompare(b.name))
})
const weekRangeLabel = computed(() => formatWeekRange(props.weekDays))

const selectedDayKey = computed(() => props.selectedDay ?? props.weekDays[0]?.key ?? '')

const dayListings = computed(() => {
  if (props.showAllListings)
    return allListings
  const activeIds = Array.from(props.eventsByDayAndListing.keys())
  return allListings.filter(listing => activeIds.includes(listing.id))
})

const timeLabels = computed(() => {
  const labels = []
  for (let hour = DAY_START_HOUR; hour <= DAY_END_HOUR; hour += 2) {
    labels.push({
      hour,
      label: new Date(0, 0, 0, hour).toLocaleTimeString('en-US', { hour: 'numeric' }),
    })
  }
  return labels
})

const listingColors = [
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-slate-500',
]

const listingBorderColors = [
  'border-l-sky-500',
  'border-l-emerald-500',
  'border-l-amber-500',
  'border-l-rose-500',
  'border-l-slate-500',
]

const listingLightColors = [
  'bg-sky-500/10 border-sky-500/20',
  'bg-emerald-500/10 border-emerald-500/20',
  'bg-amber-500/10 border-amber-500/20',
  'bg-rose-500/10 border-rose-500/20',
  'bg-slate-500/10 border-slate-500/20',
]

function eventStyle(event: CalendarEvent, dayKey: string) {
  const dayStart = new Date(`${dayKey}T00:00:00+08:00`).getTime()
  const slotStart = new Date(`${dayKey}T${String(DAY_START_HOUR).padStart(2, '0')}:00:00+08:00`).getTime()
  const startMs = Math.max(new Date(event.start).getTime(), dayStart)
  const endMs = Math.min(new Date(event.end).getTime(), dayStart + 24 * 60 * 60 * 1000)

  const offsetMinutes = (startMs - slotStart) / 60000
  const durationMinutes = Math.max((endMs - startMs) / 60000, 15)

  return {
    top: `${(offsetMinutes / 60) * HOUR_HEIGHT}px`,
    height: `${(durationMinutes / 60) * HOUR_HEIGHT}px`,
  }
}

function eventClasses(event: CalendarEvent) {
  const base = 'absolute inset-x-1 rounded-md border px-2 py-1 text-[11px] leading-tight shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow'
  if (event.type === 'guest_stay') {
    return `${base} ${listingLightColors[event.colorIndex] ?? listingLightColors[0]}`
  }
  if (event.type === 'arrival' || event.type === 'checkout') {
    return `${base} bg-background border-l-4 ${listingBorderColors[event.colorIndex] ?? 'border-l-slate-500'} text-foreground`
  }
  return `${base} bg-card border-border text-foreground`
}

function weeklyEventCount(listingId: string) {
  const listingMap = props.eventsByListingAndDay.get(listingId)
  if (!listingMap)
    return 0
  let count = 0
  for (const events of listingMap.values()) {
    count += events.length
  }
  return count
}

function handleCellClick(dayKey: string) {
  emit('update:selectedDay', dayKey)
  emit('update:view', 'day')
}
</script>

<template>
  <div class="rounded-2xl border bg-background shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {{ view === 'day' ? 'Day operations view' : 'Weekly operations timeline' }}
        </p>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ weekRangeLabel }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-sky-500" />Stay</span>
        <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-emerald-500" />Clean</span>
        <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-amber-500" />Maint</span>
        <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-rose-500" />Insp</span>
      </div>
    </div>

    <!-- Week view -->
    <div v-if="view === 'week'" class="overflow-auto">
      <div class="grid min-w-[1100px] grid-cols-[240px_repeat(7,minmax(140px,1fr))]">
        <!-- Header -->
        <div class="sticky left-0 z-20 border-b bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Listing
        </div>
        <div
          v-for="day in weekDays"
          :key="day.key"
          class="border-b border-l bg-background px-4 py-3"
          :class="selectedDay === day.key && 'bg-muted/30'"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {{ day.label.slice(0, 3) }}
          </p>
          <p class="mt-1 text-sm font-semibold">
            {{ day.key.slice(8, 10) }}
          </p>
        </div>

        <!-- Listing rows -->
        <template v-for="listing in sortedListings" :key="listing.id">
          <div class="sticky left-0 z-10 border-t border-r bg-muted/30 px-4 py-3">
            <div class="flex items-start gap-3">
              <span class="mt-1 size-2.5 rounded-full" :class="[listingColors[listing.colorIndex]]" />
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">
                  {{ listing.name }}
                </p>
                <Badge variant="outline" class="mt-1 text-[10px]">
                  {{ weeklyEventCount(listing.id) }} events
                </Badge>
              </div>
            </div>
          </div>

          <div
            v-for="day in weekDays"
            :key="`${listing.id}-${day.key}`"
            class="min-h-[132px] border-t border-l bg-background/70 p-2"
            :class="selectedDay === day.key && 'bg-muted/30'"
            @click="handleCellClick(day.key)"
          >
            <div class="flex h-full flex-col gap-2">
              <OperationsCalendarEventChip
                v-for="event in eventsByListingAndDay.get(listing.id)?.get(day.key) ?? []"
                :key="`${day.key}-${event.id}`"
                :event="event"
                @click="emit('eventClick', event)"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Day view -->
    <div v-else class="overflow-auto">
      <div class="grid min-w-[900px]" :style="{ gridTemplateColumns: `64px repeat(${dayListings.length}, minmax(180px, 1fr))` }">
        <!-- Header -->
        <div class="sticky left-0 z-20 border-b bg-background px-2 py-3">
          <Button
            v-if="eventsByDayAndListing.size < allListings.length"
            variant="ghost"
            size="sm"
            class="h-auto px-0 text-xs text-muted-foreground"
            @click="emit('update:showAllListings', !showAllListings)"
          >
            {{ showAllListings ? 'Show active' : 'Show all' }}
          </Button>
        </div>
        <div
          v-for="listing in dayListings"
          :key="listing.id"
          class="border-b border-l bg-background px-3 py-3"
        >
          <div class="flex items-center gap-2">
            <span class="size-2.5 rounded-full" :class="[listingColors[listing.colorIndex]]" />
            <p class="truncate text-sm font-semibold">
              {{ listing.name }}
            </p>
          </div>
          <Badge
            :variant="isDayOccupied(eventsByDayAndListing.get(listing.id) ?? [], selectedDayKey) ? 'default' : 'outline'"
            class="mt-1.5 text-[10px]"
          >
            {{ isDayOccupied(eventsByDayAndListing.get(listing.id) ?? [], selectedDayKey) ? 'Occupied' : 'Empty' }}
          </Badge>
        </div>

        <!-- Time labels -->
        <div class="sticky left-0 z-10 border-r bg-background">
          <div
            v-for="slot in timeLabels"
            :key="slot.hour"
            class="flex items-start justify-end border-b pr-2 text-[10px] text-muted-foreground"
            :style="{ height: `${HOUR_HEIGHT * 2}px` }"
          >
            {{ slot.label }}
          </div>
        </div>

        <!-- Listing columns -->
        <div
          v-for="listing in dayListings"
          :key="listing.id"
          class="relative border-l"
          :style="{ height: `${totalHeight}px` }"
        >
          <div
            v-for="event in eventsByDayAndListing.get(listing.id) ?? []"
            :key="`${listing.id}-${event.id}`"
            :class="eventClasses(event)"
            :style="eventStyle(event, selectedDayKey)"
            @click.stop="emit('eventClick', event)"
          >
            <p class="truncate font-semibold">
              {{ event.title }}
            </p>
            <p v-if="event.type !== 'guest_stay'" class="truncate text-[10px] text-muted-foreground">
              {{ formatTime(event.start) }} - {{ formatTime(event.end) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
