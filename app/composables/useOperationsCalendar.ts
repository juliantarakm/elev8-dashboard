import type { CalendarEvent, CalendarEventType, OperationsFilters } from '~/components/operations-calendar/data/operations-calendar'
import { buildAllEvents, eventsForDay, getCalendarListings, getWeekDays, groupEventsByListingAndDay } from '~/components/operations-calendar/data/operations-calendar'

export function useOperationsCalendar() {
  const events = shallowRef<CalendarEvent[]>([])

  const view = ref<'week' | 'day'>('week')
  const weekAnchor = ref(new Date())
  const selectedDay = ref<string>(new Date().toISOString().slice(0, 10))
  const showAllListingsInDay = ref(false)

  const filters = ref<OperationsFilters>({
    listingIds: [],
    eventTypes: [],
  })

  onMounted(() => {
    events.value = buildAllEvents()
  })

  const weekDays = computed(() => getWeekDays(weekAnchor.value))

  const filteredEvents = computed(() => {
    const { listingIds, eventTypes } = filters.value
    if (!listingIds.length && !eventTypes.length)
      return events.value
    return events.value.filter((event) => {
      if (listingIds.length && !listingIds.includes(event.listingId))
        return false
      if (eventTypes.length && !eventTypes.includes(event.type))
        return false
      return true
    })
  })

  const eventsByDay = computed(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const day of weekDays.value) {
      map.set(day.key, eventsForDay(filteredEvents.value, day.key))
    }
    return map
  })

  const eventsByListingAndDay = computed(() => {
    return groupEventsByListingAndDay(getCalendarListings(), filteredEvents.value, weekDays.value)
  })

  const eventsByDayAndListing = computed(() => {
    const dayKey = selectedDay.value || weekDays.value[0]?.key || ''
    const dayEvents = eventsByDay.value.get(dayKey) ?? []
    const map = new Map<string, CalendarEvent[]>()
    for (const event of dayEvents) {
      const list = map.get(event.listingId)
      if (list) {
        list.push(event)
      }
      else {
        map.set(event.listingId, [event])
      }
    }
    return map
  })

  function setFilters(next: OperationsFilters) {
    filters.value = { ...next }
  }

  function clearFilters() {
    filters.value = { listingIds: [], eventTypes: [] }
  }

  function previousWeek() {
    const date = new Date(weekAnchor.value)
    date.setDate(date.getDate() - 7)
    weekAnchor.value = date
  }

  function nextWeek() {
    const date = new Date(weekAnchor.value)
    date.setDate(date.getDate() + 7)
    weekAnchor.value = date
  }

  function goToToday() {
    weekAnchor.value = new Date()
    selectedDay.value = new Date().toISOString().slice(0, 10)
  }

  function toggleEventType(type: CalendarEventType) {
    const current = filters.value.eventTypes
    filters.value.eventTypes = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
  }

  function toggleListing(listingId: string) {
    const current = filters.value.listingIds
    filters.value.listingIds = current.includes(listingId)
      ? current.filter(id => id !== listingId)
      : [...current, listingId]
  }

  return {
    events,
    view,
    weekAnchor,
    selectedDay,
    showAllListingsInDay,
    filters,
    weekDays,
    filteredEvents,
    eventsByDay,
    eventsByDayAndListing,
    eventsByListingAndDay,
    setFilters,
    clearFilters,
    previousWeek,
    nextWeek,
    goToToday,
    toggleEventType,
    toggleListing,
  }
}
