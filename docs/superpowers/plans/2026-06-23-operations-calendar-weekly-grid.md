# Operations Calendar Weekly Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Operations Calendar Week view into a multi-listing weekly grid (listing rows × day columns) while keeping Day view unchanged.

**Architecture:** Add a pure helper to group events by `(listingId, dayKey)`, expose the grouped data from `useOperationsCalendar`, and render a new grid layout in `OperationsCalendarBoard`. A small event chip component keeps the board template readable. Day view remains untouched.

**Tech Stack:** Nuxt 3, Vue 3, TypeScript, Tailwind CSS v4, shadcn-vue.

---

## Files

| File | Responsibility |
|---|---|
| `app/components/operations-calendar/data/operations-calendar.ts` | Add pure grouping helper `groupEventsByListingAndDay`. |
| `app/composables/useOperationsCalendar.ts` | Expose `eventsByListingAndDay` computed from the helper. |
| `app/components/operations-calendar/OperationsCalendarEventChip.vue` | Small chip component for a single calendar event. |
| `app/components/operations-calendar/OperationsCalendarBoard.vue` | Replace Week view rendering with weekly grid; emit `update:view` when a cell is clicked. |
| `app/pages/operations-calendar.vue` | Handle `update:view` to switch between Week and Day tabs. |
| `tests/components/operations-calendar/data/operations-calendar.test.ts` | Add regression test for `groupEventsByListingAndDay`. |

---

### Task 1: Add pure grouping helper

**Files:**
- Modify: `app/components/operations-calendar/data/operations-calendar.ts`
- Test: `tests/components/operations-calendar/data/operations-calendar.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/components/operations-calendar/data/operations-calendar.test.ts`:

```ts
import { buildAllEvents, eventsForDay, getCalendarListings, getWeekDays, groupEventsByListingAndDay } from '~/components/operations-calendar/data/operations-calendar'

it('groups events by listing and day', () => {
  const events = buildAllEvents()
  const listings = getCalendarListings()
  const weekDays = getWeekDays(new Date('2026-06-23'))
  const grouped = groupEventsByListingAndDay(listings, events, weekDays)

  // Every listing should have a row
  expect(grouped.size).toBe(listings.length)

  // lst-1 has bookings, so it should have entries
  expect(grouped.has('lst-1')).toBe(true)

  // Each day key for lst-1 should map to an array
  const listingMap = grouped.get('lst-1')
  expect(listingMap).toBeDefined()
  for (const day of weekDays) {
    expect(listingMap!.has(day.key)).toBe(true)
    expect(Array.isArray(listingMap!.get(day.key))).toBe(true)
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/components/operations-calendar/data/operations-calendar.test.ts`

Expected: FAIL — `groupEventsByListingAndDay` is not exported.

- [ ] **Step 3: Add the helper**

Add to `app/components/operations-calendar/data/operations-calendar.ts` after `eventsForDay`:

```ts
export interface WeekDay {
  key: string
  label: string
  date: Date
}

export function groupEventsByListingAndDay(
  listings: CalendarListing[],
  events: CalendarEvent[],
  weekDays: WeekDay[],
): Map<string, Map<string, CalendarEvent[]>> {
  const map = new Map<string, Map<string, CalendarEvent[]>>()

  // Ensure every listing has a row, even if no events all week
  for (const listing of listings) {
    const dayMap = new Map<string, CalendarEvent[]>()
    for (const day of weekDays) {
      dayMap.set(day.key, [])
    }
    map.set(listing.id, dayMap)
  }

  for (const day of weekDays) {
    const dayEvents = eventsForDay(events, day.key)
    for (const event of dayEvents) {
      const listingMap = map.get(event.listingId)
      if (!listingMap)
        continue
      const list = listingMap.get(day.key) ?? []
      list.push(event)
      listingMap.set(day.key, list)
    }
  }

  return map
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/components/operations-calendar/data/operations-calendar.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/components/operations-calendar/data/operations-calendar.ts tests/components/operations-calendar/data/operations-calendar.test.ts
git commit -m "feat(operations-calendar): add groupEventsByListingAndDay helper"
```

---

### Task 2: Expose grouped events from composable

**Files:**
- Modify: `app/composables/useOperationsCalendar.ts`

- [ ] **Step 1: Import helper and add computed**

Modify imports in `app/composables/useOperationsCalendar.ts`:

```ts
import { buildAllEvents, eventsForDay, getCalendarListings, getWeekDays, groupEventsByListingAndDay } from '~/components/operations-calendar/data/operations-calendar'
```

Add after `eventsByDay` computed:

```ts
const eventsByListingAndDay = computed(() => {
  return groupEventsByListingAndDay(getCalendarListings(), filteredEvents.value, weekDays.value)
})
```

Add `eventsByListingAndDay` to the return object.

- [ ] **Step 2: Verify TypeScript**

Run: `pnpm typecheck 2>&1 | grep -E "operations-calendar|useOperationsCalendar" || echo "No operations-calendar type errors"`

Expected: Only pre-existing errors, no new ones.

- [ ] **Step 3: Commit**

```bash
git add app/composables/useOperationsCalendar.ts
git commit -m "feat(operations-calendar): expose eventsByListingAndDay from composable"
```

---

### Task 3: Create event chip component

**Files:**
- Create: `app/components/operations-calendar/OperationsCalendarEventChip.vue`

- [ ] **Step 1: Create component file**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEvent } from '~/components/operations-calendar/data/operations-calendar'
import { formatTime } from '~/components/operations-calendar/data/operations-calendar'

const props = defineProps<{
  event: CalendarEvent
}>()

const emit = defineEmits<{
  click: [event: CalendarEvent]
}>()

const chipClasses = computed(() => {
  const base = 'w-full rounded-md border px-2 py-1 text-left text-[11px] leading-tight shadow-sm transition-shadow hover:shadow-md'
  if (props.event.type === 'guest_stay') {
    return `${base} bg-primary/10 border-primary/20 text-foreground`
  }
  if (props.event.type === 'arrival' || props.event.type === 'checkout') {
    return `${base} bg-background border-l-4 border-l-slate-500 text-foreground`
  }
  return `${base} bg-card border-border text-foreground`
})

const displayTitle = computed(() => {
  if (props.event.type === 'guest_stay')
    return props.event.guestName ?? props.event.title
  return props.event.title
})

const timeRange = computed(() => {
  if (props.event.type === 'guest_stay')
    return ''
  return `${formatTime(props.event.start)} - ${formatTime(props.event.end)}`
})
</script>

<template>
  <button type="button" :class="chipClasses" @click.stop="emit('click', event)">
    <p class="truncate font-semibold">
      {{ displayTitle }}
    </p>
    <p v-if="timeRange" class="truncate text-[10px] text-muted-foreground">
      {{ timeRange }}
    </p>
  </button>
</template>
```

- [ ] **Step 2: Lint new file**

Run: `pnpm exec eslint app/components/operations-calendar/OperationsCalendarEventChip.vue`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/operations-calendar/OperationsCalendarEventChip.vue
git commit -m "feat(operations-calendar): add event chip component"
```

---

### Task 4: Render weekly grid in board

**Files:**
- Modify: `app/components/operations-calendar/OperationsCalendarBoard.vue`

- [ ] **Step 1: Add prop and emit**

Add to props:

```ts
eventsByListingAndDay: Map<string, Map<string, CalendarEvent[]>>
```

Add to emits:

```ts
'update:view': [view: 'week' | 'day']
```

- [ ] **Step 2: Add computed sorted listings**

After `allListings`:

```ts
const sortedListings = computed(() => {
  return [...allListings].sort((a, b) => a.name.localeCompare(b.name))
})
```

- [ ] **Step 3: Add helper to count weekly events per listing**

```ts
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
```

- [ ] **Step 4: Add cell click handler**

```ts
function handleCellClick(dayKey: string) {
  emit('update:selectedDay', dayKey)
  emit('update:view', 'day')
}
```

- [ ] **Step 5: Replace week view template**

Replace the current `<!-- Week view -->` block with:

```vue
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
```

- [ ] **Step 6: Remove unused week view code**

Remove the old `eventStyle` and `eventClasses` helpers if they are no longer used by Week view. Verify Day view still uses them before removing.

- [ ] **Step 7: Verify lint**

Run: `pnpm exec eslint app/components/operations-calendar/OperationsCalendarBoard.vue`

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add app/components/operations-calendar/OperationsCalendarBoard.vue
git commit -m "feat(operations-calendar): render weekly grid view"
```

---

### Task 5: Wire board to parent page

**Files:**
- Modify: `app/pages/operations-calendar.vue`

- [ ] **Step 1: Destructure eventsByListingAndDay and pass it down**

Update destructuring:

```ts
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
```

- [ ] **Step 2: Pass prop and handle update:view**

Add prop to `LazyOperationsCalendarBoard`:

```vue
:events-by-listing-and-day="eventsByListingAndDay"
@update:view="view = $event"
```

- [ ] **Step 3: Verify lint**

Run: `pnpm exec eslint app/pages/operations-calendar.vue`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/pages/operations-calendar.vue
git commit -m "feat(operations-calendar): wire weekly grid to page"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run tests**

Run: `pnpm vitest run tests/components/operations-calendar/`

Expected: All tests pass.

- [ ] **Step 2: Run lint on changed files**

Run:
```bash
pnpm exec eslint app/components/operations-calendar/data/operations-calendar.ts app/composables/useOperationsCalendar.ts app/components/operations-calendar/OperationsCalendarEventChip.vue app/components/operations-calendar/OperationsCalendarBoard.vue app/pages/operations-calendar.vue tests/components/operations-calendar/data/operations-calendar.test.ts
```

Expected: No errors.

- [ ] **Step 3: Run dev server and verify visually**

```bash
pnpm dev
```

Open `http://localhost:3001/dashboard/operations-calendar`.

Expected:
- Week view shows listings as rows, days as columns.
- Each cell shows event chips.
- Clicking a cell switches to Day view with that date selected.
- Filters still work.
- Day view still works.

- [ ] **Step 4: Commit final state**

```bash
git status --short
git add .
git commit -m "feat(operations-calendar): implement weekly grid view"
```

---

## Self-Review

**Spec coverage:**
- Weekly grid layout → Task 4.
- Listing as rows, days as columns → Task 4.
- Event chips per cell → Task 3 + Task 4.
- Click cell → Day view → Task 4 + Task 5.
- Filters work → unchanged, still consume `filteredEvents`.
- Day view unchanged → Task 4 explicitly keeps Day view template.

**Placeholder scan:** No TBD/TODO/fill-in-details. All code shown.

**Type consistency:** `groupEventsByListingAndDay` returns `Map<string, Map<string, CalendarEvent[]>>`, used consistently in composable and board.
