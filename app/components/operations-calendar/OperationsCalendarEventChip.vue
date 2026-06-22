<script setup lang="ts">
import type { CalendarEvent } from '~/components/operations-calendar/data/operations-calendar'
import { computed } from 'vue'
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
