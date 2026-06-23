<script setup lang="ts">
import type { CalendarEvent } from '~/components/operations-calendar/data/operations-calendar'
import { computed } from 'vue'
import { formatTime } from '~/components/operations-calendar/data/operations-calendar'

const props = defineProps<{
  event: CalendarEvent
  draggable?: boolean
}>()

const emit = defineEmits<{
  click: [event: CalendarEvent]
  dragstart: [event: CalendarEvent]
}>()

const chipClasses = computed(() => {
  const base = 'w-full rounded-md border px-2 py-1 text-left text-[11px] leading-tight shadow-sm transition-shadow hover:shadow-md'
  if (props.event.type === 'guest_stay') {
    return `${base} bg-primary/10 border-primary/20 text-foreground`
  }

  if (props.event.type === 'task') {
    return `${base} bg-amber-500/10 border-amber-500/20 text-foreground`
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

const cleaningStatusConfig: Record<string, { label: string, variant: 'outline' | 'default' | 'secondary' | 'destructive', class: string }> = {
  draft: { label: 'Draft', variant: 'outline', class: '' },
  confirmed: { label: 'Confirmed', variant: 'default', class: 'bg-blue-500/80' },
  in_progress: { label: 'In Progress', variant: 'default', class: 'bg-amber-500/80' },
  done: { label: 'Done', variant: 'default', class: 'bg-emerald-500/80' },
  cancelled: { label: 'Cancelled', variant: 'destructive', class: '' },
  missed: { label: 'Missed', variant: 'destructive', class: '' },
}

const statusConfig = computed(() => {
  if (props.event.type !== 'cleaning' || !props.event.status)
    return null
  return cleaningStatusConfig[props.event.status] ?? null
})
</script>

<template>
  <button
    type="button"
    :class="chipClasses"
    :draggable="draggable"
    @click.stop="emit('click', event)"
    @dragstart.stop="emit('dragstart', event)"
  >
    <p class="truncate font-semibold">
      {{ displayTitle }}
    </p>
    <p v-if="timeRange" class="truncate text-[10px] text-muted-foreground">
      {{ timeRange }}
    </p>
    <div v-if="event.type === 'cleaning'" class="mt-0.5 flex flex-wrap items-center gap-1">
      <Badge v-if="!event.assignedTo" variant="destructive" class="text-[9px] font-medium">
        Unassigned
      </Badge>
      <Badge v-if="statusConfig" :variant="statusConfig.variant" class="text-[9px] font-medium" :class="statusConfig.class">
        {{ statusConfig.label }}
      </Badge>
    </div>
  </button>
</template>
