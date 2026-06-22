import type { Booking } from '~/components/listings/data/listings'
import { cleaningJobs } from '~/components/cleaning/data/cleaning-jobs'
import { listings } from '~/components/listings/data/listings'

export type CalendarEventType = 'guest_stay' | 'arrival' | 'checkout' | 'cleaning' | 'maintenance' | 'inspection'

export interface CalendarEvent {
  id: string
  listingId: string
  listingName: string
  type: CalendarEventType
  title: string
  start: string // ISO datetime
  end: string // ISO datetime
  guestName?: string
  status?: string
  assignedTo?: string
  notes?: string
  source?: string
  colorIndex: number
}

export interface OperationsFilters {
  listingIds: string[]
  eventTypes: CalendarEventType[]
}

export const HOUR_HEIGHT = 64
export const DAY_START_HOUR = 8
export const DAY_END_HOUR = 20
export const TIME_SLOT_INTERVAL = 2 // 2-hour labels keep the grid light

export const eventTypeLabels: Record<CalendarEventType, string> = {
  guest_stay: 'Guest stay',
  arrival: 'Arrival',
  checkout: 'Checkout',
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
  inspection: 'Inspection',
}

export const eventTypeTones: Record<CalendarEventType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  guest_stay: 'default',
  arrival: 'secondary',
  checkout: 'secondary',
  cleaning: 'default',
  maintenance: 'outline',
  inspection: 'outline',
}

export interface CalendarListing {
  id: string
  name: string
  colorIndex: number
}

export function getListingColorIndex(listingId: string) {
  const sum = listingId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return sum % 5
}

export function getListingName(listingId: string) {
  return listings.value.find(listing => listing.id === listingId)?.name ?? listingId
}

export function getCalendarListings(): CalendarListing[] {
  return listings.value.map(listing => ({
    id: listing.id,
    name: listing.name,
    colorIndex: getListingColorIndex(listing.id),
  }))
}

export function getWeekDays(anchorDate = new Date()) {
  const start = new Date(anchorDate)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1)
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      date,
    }
  })
}

export function formatWeekRange(days: Array<{ date: Date }>) {
  if (!days.length)
    return ''
  const start = days[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const end = days[days.length - 1]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${start} - ${end}`
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function getTimeSlots() {
  const slots = []
  for (let hour = DAY_START_HOUR; hour <= DAY_END_HOUR; hour += TIME_SLOT_INTERVAL) {
    slots.push({
      hour,
      label: new Date(0, 0, 0, hour).toLocaleTimeString('en-US', { hour: 'numeric' }),
    })
  }
  return slots
}

export function toLocalDateTime(date: string, time: string, tzOffset = '+08:00') {
  return `${date}T${time}:00${tzOffset}`
}

export function getDefaultCheckInTime(listingId: string) {
  return listings.value.find(listing => listing.id === listingId)?.resources.basics.checkInTime ?? '14:00'
}

export function getDefaultCheckOutTime(listingId: string) {
  return listings.value.find(listing => listing.id === listingId)?.resources.basics.checkOutTime ?? '11:00'
}

function addDays(dateStr: string, days: number) {
  const parts = dateStr.split('-')
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function buildGuestStayEvents(booking: Booking, listing: CalendarListing, checkInTime: string, checkOutTime: string): CalendarEvent[] {
  const events: CalendarEvent[] = []

  // Arrival event at check-in time
  events.push({
    id: `arrival-${booking.id}`,
    listingId: listing.id,
    listingName: listing.name,
    type: 'arrival',
    title: `Check-in: ${booking.guestName}`,
    start: toLocalDateTime(booking.checkIn, checkInTime),
    end: toLocalDateTime(booking.checkIn, checkInTime),
    guestName: booking.guestName,
    source: booking.source,
    colorIndex: listing.colorIndex,
  })

  // Checkout event at check-out time
  events.push({
    id: `checkout-${booking.id}`,
    listingId: listing.id,
    listingName: listing.name,
    type: 'checkout',
    title: `Check-out: ${booking.guestName}`,
    start: toLocalDateTime(booking.checkOut, checkOutTime),
    end: toLocalDateTime(booking.checkOut, checkOutTime),
    guestName: booking.guestName,
    source: booking.source,
    colorIndex: listing.colorIndex,
  })

  // Overnight guest stay blocks for each night between check-in and check-out
  let nightDate = booking.checkIn
  while (nightDate < booking.checkOut) {
    events.push({
      id: `stay-${booking.id}-${nightDate}`,
      listingId: listing.id,
      listingName: listing.name,
      type: 'guest_stay',
      title: booking.guestName,
      start: toLocalDateTime(nightDate, '00:00'),
      end: toLocalDateTime(addDays(nightDate, 1), '00:00'),
      guestName: booking.guestName,
      source: booking.source,
      colorIndex: listing.colorIndex,
    })
    nightDate = addDays(nightDate, 1)
  }

  return events
}

export function buildCleaningEvents(listingMap?: Map<string, CalendarListing>) {
  return cleaningJobs.value.map(job => ({
    id: job.id,
    listingId: job.listingId,
    listingName: listingMap?.get(job.listingId)?.name ?? job.listingName,
    type: 'cleaning' as CalendarEventType,
    title: `Cleaning${job.cleanerName ? ` · ${job.cleanerName}` : ''}`,
    start: job.scheduledAt,
    end: new Date(new Date(job.scheduledAt).getTime() + job.durationMinutes * 60000).toISOString(),
    assignedTo: job.cleanerName ?? undefined,
    notes: job.notes,
    source: job.source,
    colorIndex: listingMap?.get(job.listingId)?.colorIndex ?? getListingColorIndex(job.listingId),
  }))
}

export function buildMaintenanceEvents(listingMap?: Map<string, CalendarListing>): CalendarEvent[] {
  // Placeholder maintenance/inspection events scheduled around the current week
  const baseDate = new Date()
  const monday = getWeekDays(baseDate)[0]?.date ?? baseDate
  const dateKey = monday.toISOString().slice(0, 10)

  const getListing = (id: string) => listingMap?.get(id) ?? { id, name: getListingName(id), colorIndex: getListingColorIndex(id) }

  return [
    {
      id: 'ops-maint-1',
      listingId: 'lst-1',
      listingName: getListing('lst-1').name,
      type: 'maintenance',
      title: 'Pool pump check',
      start: toLocalDateTime(dateKey, '09:00'),
      end: toLocalDateTime(dateKey, '11:00'),
      assignedTo: 'Wayan Adi',
      notes: 'Routine pool pump inspection.',
      colorIndex: getListing('lst-1').colorIndex,
    },
    {
      id: 'ops-insp-1',
      listingId: 'lst-4',
      listingName: getListing('lst-4').name,
      type: 'inspection',
      title: 'Pre-arrival inspection',
      start: toLocalDateTime(addDays(dateKey, 2), '10:00'),
      end: toLocalDateTime(addDays(dateKey, 2), '11:30'),
      assignedTo: 'Made Surya',
      notes: 'Inspect before next guest arrival.',
      colorIndex: getListing('lst-4').colorIndex,
    },
  ]
}

export function buildAllEvents(): CalendarEvent[] {
  const calendarListings = getCalendarListings()
  const listingMap = new Map(calendarListings.map(l => [l.id, l]))
  const events: CalendarEvent[] = []

  for (const listing of calendarListings) {
    const fullListing = listings.value.find(l => l.id === listing.id)
    if (!fullListing || !fullListing.bookings.length)
      continue
    const checkInTime = getDefaultCheckInTime(listing.id)
    const checkOutTime = getDefaultCheckOutTime(listing.id)
    for (const booking of fullListing.bookings) {
      events.push(...buildGuestStayEvents(booking, listing, checkInTime, checkOutTime))
    }
  }

  events.push(...buildCleaningEvents(listingMap))
  events.push(...buildMaintenanceEvents(listingMap))
  return Object.freeze(events)
}

export function eventsForDay(events: CalendarEvent[], dayKey: string) {
  const dayStart = `${dayKey}T00:00:00+08:00`
  const dayEnd = `${dayKey}T23:59:59+08:00`
  return events.filter((event) => {
    const start = new Date(event.start).getTime()
    const end = new Date(event.end).getTime()
    const dayStartMs = new Date(dayStart).getTime()
    const dayEndMs = new Date(dayEnd).getTime()
    return start < dayEndMs && end > dayStartMs
  })
}

export function eventStyle(event: CalendarEvent, dayKey: string) {
  const dayStart = new Date(`${dayKey}T00:00:00+08:00`).getTime()
  const slotStart = new Date(`${dayKey}T${String(DAY_START_HOUR).padStart(2, '0')}:00:00+08:00`).getTime()
  const startMs = Math.max(new Date(event.start).getTime(), dayStart)
  const endMs = Math.min(new Date(event.end).getTime(), dayStart + 24 * 60 * 60 * 1000)

  const offsetMinutes = (startMs - slotStart) / 60000
  const durationMinutes = Math.max((endMs - startMs) / 60000, 15)

  const top = (offsetMinutes / 60) * HOUR_HEIGHT
  const height = (durationMinutes / 60) * HOUR_HEIGHT

  return {
    top: `${top}px`,
    height: `${height}px`,
  }
}

export function isDayOccupied(events: CalendarEvent[], dayKey: string) {
  return eventsForDay(events, dayKey).some(event => event.type === 'guest_stay')
}

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
