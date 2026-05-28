import type { InventoryTimelineEvent, TimelineEventType, TimelineActor } from '@/components/inventory/data/timeline-events'
import { mockTimelineEvents } from '@/components/inventory/data/timeline-events'

export function useInventoryTimeline() {
  const events = useState<InventoryTimelineEvent[]>('inventory-timeline', () =>
    mockTimelineEvents.map(e => ({ ...e })),
  )

  function addEvent(data: {
    entryId: string
    type: TimelineEventType
    actor: TimelineActor
    details: InventoryTimelineEvent['details']
  }) {
    const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    events.value = [...events.value, { ...data, id, timestamp: new Date().toISOString() }]
  }

  return { events, addEvent }
}
