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

/** Format a `Date` as `YYYY-MM-DD` using the *local* date components.
 *
 * `Date#toISOString` always returns UTC, which is one calendar day behind
 * the user's intent for any time zone east of UTC (e.g. Bali is UTC+8,
 * midnight local is 16:00 the previous day in UTC). The reservation
 * grid is keyed by the user's local calendar day, so we must format from
 * the local getters.
 */
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
 * listing, scoped to the month grid. Bars are grouped by `roomTypeId`
 * (with a fallback for reservations that don't specify a room type) so
 * overlapping stays in the same room stack on their own row, but
 * different rooms can be displayed side-by-side.
 *
 *   - Skips reservations entirely outside the grid.
 *   - Clamps `endDay` to the last in-grid day so a stay that ends next
 *     month still renders the leading portion of its bar.
 *   - Splits bars that cross a week boundary into multiple segments (a
 *     "wrapsForward" / "wrapsBackward" pair), each with their own row.
 *   - Stacks overlapping rows using a first-fit decreasing-height style
 *     row finder within each room group.
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

  // Group segments by their room bucket so the row stacker never mixes
  // bars from different rooms onto the same row. A reservation without a
  // roomTypeId shares a single fallback bucket per listing.
  const byRoom = new Map<string, Segment[]>()
  for (const segment of segments) {
    const key = segment.reservation.roomTypeId ?? `__listing__${listingId}`
    const bucket = byRoom.get(key) ?? []
    bucket.push(segment)
    byRoom.set(key, bucket)
  }

  const bars: OwnerReservationBar[] = []
  let rowOffset = 0
  // Stable order: bucket by room type name so layout doesn't shift when
  // the mock data is regenerated.
  for (const [roomKey, group] of [...byRoom.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const groupBars: OwnerReservationBar[] = []
    for (const segment of group) {
      const { reservation, startDay, endDay } = segment
      if (endDay < startDay)
        continue

      let cursor = startDay
      while (cursor <= endDay) {
        const weekEnd = Math.min(cursor + (6 - (cursor % 7)), endDay)
        pushBar(grid, groupBars, reservation, cursor, weekEnd, today, lastKey)
        cursor = weekEnd + 1
      }
    }
    assignRows(groupBars, rowOffset)
    bars.push(...groupBars)
    rowOffset += groupBars.reduce((max, b) => Math.max(max, b.row + 1), 0)
  }
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

function assignRows(bars: OwnerReservationBar[], rowOffset = 0) {
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
      bar.row = row + rowOffset
    }
  }
}
