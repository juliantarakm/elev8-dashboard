// Pure helpers for the owner-portal reservation calendar.
//
// The shared `getMonthGrid` lives in the operations calendar data layer;
// here we add the reservation-specific shape (date objects, in-month flag,
// today highlight) plus a stacking algorithm that turns a flat list of
// reservations into row-indexed bars ready for absolute positioning.

import type { OwnerReservation, OwnerReservationBar, OwnerReservationDay } from '~/components/owners/data/owner-reservations'

/**
 * Return six weeks of Monday-first day cells for the calendar month that
 * contains `anchor`. Day cells outside the month carry `inMonth: false` so
 * the template can render them with reduced emphasis.
 */
export function buildReservationMonthGrid(anchor: Date): OwnerReservationDay[] {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const dayOfWeek = monthStart.getDay()
  // Snap to Monday: in JS, Sunday is 0; (0 + 6) % 7 = 6 days back from
  // Sunday gives the Monday of the same week.
  const offset = (dayOfWeek + 6) % 7
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - offset)
  gridStart.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cells: OwnerReservationDay[] = []
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    cells.push({
      key: toDateKey(date),
      date,
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      inMonth: date.getMonth() === anchor.getMonth() && date.getFullYear() === anchor.getFullYear(),
      isToday: date.getTime() === today.getTime(),
    })
  }
  return cells
}

/** Format a `Date` as `YYYY-MM-DD`. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Map a date key (or `Date`) to its column index inside a 42-cell month grid. */
export function columnIndexFor(grid: OwnerReservationDay[], key: string | Date): number {
  const target = typeof key === 'string' ? key : toDateKey(key)
  return grid.findIndex(cell => cell.key === target)
}

/**
 * Convert a flat list of reservations into positioned bars for the given
 * listing, scoped to the month grid. The algorithm:
 *   - Skips reservations entirely outside the grid.
 *   - Clamps `endDay` to the last in-grid day so a stay that ends next
 *     month still renders the leading portion of its bar.
 *   - Splits bars that cross a week boundary into multiple segments (a
 *     "wrapsForward" / "wrapsBackward" pair), each with their own row.
 *   - Stacks overlapping rows using a first-fit decreasing-height style
 *     row finder so the same listing can host multiple stays side by side.
 */
export function buildReservationBars(
  grid: OwnerReservationDay[],
  listingId: string,
  reservations: OwnerReservation[],
): OwnerReservationBar[] {
  if (reservations.length === 0)
    return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastIndex = grid.length - 1
  const lastKey = grid[lastIndex]?.key

  interface Segment {
    reservation: OwnerReservation
    startDay: number
    endDay: number
  }

  const segments: Segment[] = []
  for (const reservation of reservations) {
    if (reservation.listingId !== listingId)
      continue
    const startIndex = columnIndexFor(grid, reservation.checkIn)
    // Reservations with a checkOut before the grid are skipped.
    const endIndex = columnIndexFor(grid, reservation.checkOut)
    if (endIndex === -1)
      continue
    if (startIndex === -1 && endIndex >= 0) {
      // The bar starts before the grid — clamp to the first cell.
      segments.push({ reservation, startDay: 0, endDay: endIndex })
      continue
    }
    if (startIndex >= 0)
      segments.push({ reservation, startDay: startIndex, endDay: Math.min(endIndex, lastIndex) })
  }
  if (segments.length === 0)
    return []

  const bars: OwnerReservationBar[] = []
  for (const segment of segments) {
    const { reservation, startDay, endDay } = segment
    if (endDay < startDay)
      continue

    // Split across week boundaries (every 7 cells).
    let cursor = startDay
    while (cursor <= endDay) {
      const weekEnd = Math.min(cursor + (6 - (cursor % 7)), endDay)
      pushBar(grid, bars, reservation, cursor, weekEnd, today, lastKey)
      cursor = weekEnd + 1
    }
  }
  assignRows(bars)
  return bars
}

function pushBar(
  grid: OwnerReservationDay[],
  bars: OwnerReservationBar[],
  reservation: OwnerReservation,
  startDay: number,
  endDay: number,
  today: Date,
  lastKey: string | undefined,
) {
  const lastIndex = grid.length - 1
  const startsBeforeGrid = startDay < 0
  const endsAfterGrid = endDay > lastIndex
  const trimmedStart = Math.max(0, startDay)
  const trimmedEnd = Math.min(lastIndex, endDay)

  const key = reservation.id
  const type = reservation.type
  bars.push({
    id: `${key}-${trimmedStart}-${trimmedEnd}`,
    type,
    listingId: reservation.listingId,
    guestName: reservation.guestName,
    channel: reservation.channel,
    note: reservation.note,
    status: reservation.status,
    startDay: trimmedStart,
    endDay: trimmedEnd,
    row: 0,
    wrapsBackward: startsBeforeGrid,
    wrapsForward: endsAfterGrid,
  })
  void today
  void lastKey
}

function assignRows(bars: OwnerReservationBar[]) {
  // Group bars by their visible week (row 0-6 = first week, etc.) so two
  // overlapping bars in different weeks do not contend for the same row.
  const byWeek = new Map<number, OwnerReservationBar[]>()
  for (const bar of bars) {
    const week = Math.floor(bar.startDay / 7)
    const bucket = byWeek.get(week) ?? []
    bucket.push(bar)
    byWeek.set(week, bucket)
  }
  for (const bucket of byWeek.values()) {
    // Sort by earliest start to make stacking stable.
    bucket.sort((a, b) => a.startDay - b.startDay || a.endDay - b.endDay)
    const rowEnds: number[] = []
    for (const bar of bucket) {
      let row = rowEnds.findIndex(end => end < bar.startDay)
      if (row === -1) {
        row = rowEnds.length
        rowEnds.push(bar.endDay)
      }
      else {
        const current = rowEnds[row] ?? 0
        rowEnds[row] = Math.max(current, bar.endDay)
      }
      bar.row = row
    }
  }
}
