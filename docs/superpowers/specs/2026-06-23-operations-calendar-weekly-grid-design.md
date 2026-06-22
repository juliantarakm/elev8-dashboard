# Operations Calendar — Weekly Grid View Design

> **Goal:** Replace the current Operations Calendar Week view with a multi-listing weekly grid (listings as rows, days as columns) so staff can scan operations across all listings for the week.

## Background

The current Operations Calendar has two modes:

- **Week view:** days as columns, events stacked by time of day. With multiple listings, events overlap in the same day column and become hard to read.
- **Day view:** listings as columns for one selected day.

User feedback indicates the page is more useful as a **multi-listing overview**. The weekly grid layout used by Cleaning Calendar (listing rows × day columns) is the established pattern for this in the app.

## Scope

This design covers only the **Week view** of Operations Calendar.

- Convert Week view to a weekly grid: listings as rows, Monday–Sunday as columns.
- Keep Day view untouched for now (future work can add single-listing drill-down).
- Keep existing filters: listing and event type.
- Keep existing event sources: bookings (guest stay / arrival / checkout), cleaning jobs, maintenance/inspection placeholders.

## Layout

```
+-------------------------------------------------------------+
|  Operations Calendar                              Week | Day |
+-------------------------------------------------------------+
|  [Listings ▼]  [Event types ▼]          <  Today  >        |
+-------------------------------------------------------------+
|                     Mon 22   Tue 23   Wed 24   ...         |
|  Listing A          [events] [events]  [events]             |
|  Listing B          [events] [events]  empty                |
|  Listing C          [events] [events]  [events]             |
+-------------------------------------------------------------+
```

### Header row

- Sticky top row showing day name (short) and date number.
- First column is the listing name header.

### Listing rows

- One row per listing (all listings by default, or filtered by the listing filter).
- Leftmost cell: listing name + color dot + small badge with event count for the week.
- Remaining cells: events for that listing on that day.

### Event chips in cells

Events rendered as compact chips, stacked vertically in the cell:

| Event type | Display |
|---|---|
| `guest_stay` | "Guest name" badge, occupancy indicator |
| `arrival` | "Check-in: Guest" with time |
| `checkout` | "Check-out: Guest" with time |
| `cleaning` | "Cleaning · Staff" with time |
| `maintenance` | "Maintenance title" with time |
| `inspection` | "Inspection title" with time |

Use the existing color index per listing for the left border or dot.

### Cell actions

- Click a day cell: switch to Day view with that date selected (listing is not filtered; Day view still shows all listings for the selected day).
- Click an event chip: open event detail (placeholder; real detail dialog is future work).
- Hover an event chip: show tooltip with full title, time, and assigned staff.

## Event grouping logic

For the weekly grid, events must be grouped by `(listingId, dayKey)`.

Reuse `eventsByDayAndListing` from `useOperationsCalendar` or compute an equivalent 2D map:

```
Map<listingId, Map<dayKey, CalendarEvent[]>>
```

Use `eventsForDay()` for day-boundary matching so overnight stays appear on every day they span.

## Filters

- **Listing filter:** only show rows for selected listings; if none selected, show all.
- **Event type filter:** only show chips for selected event types; if none selected, show all.

If a cell has no matching events, show empty state (not hidden) to keep grid stable.

## Row ordering

Listings sorted by name alphabetically by default.

Future: allow sort by occupancy or property group.

## Responsive behavior

- Minimum width: `min-w-[1100px]` (same as current) with horizontal scroll.
- Listing name column sticky on the left.
- Day columns equal width, `minmax(140px, 1fr)`.

## Empty states

- No listings: show empty state with clear filters action.
- Listing row with no events for the week: still show the row, cells empty.
- All filters result in no visible events: show "No events match filters" with clear action.

## Files to change

- `app/components/operations-calendar/OperationsCalendarBoard.vue`
  - Replace Week view rendering with weekly grid.
  - Keep Day view as-is.
- `app/composables/useOperationsCalendar.ts`
  - Add or reuse `eventsByDayAndListing` for grid grouping.
- `app/components/operations-calendar/data/operations-calendar.ts`
  - No data model changes; reuse existing `CalendarEvent` and helpers.

## Out of scope

- Month view
- Agenda view
- Event detail modal
- Create/edit events from calendar
- Drag-and-drop reschedule
- Real maintenance/inspection data (still placeholders)
- Single-listing detail page

## Acceptance criteria

- Operations Calendar Week view shows listings as rows and days as columns.
- Each cell shows the matching events for that listing/day.
- Filters still work (listing and event type).
- Clicking a cell switches to Day view for that listing and date.
- Day view remains functional.
- No crash or infinite loop on load (related bug already fixed).
