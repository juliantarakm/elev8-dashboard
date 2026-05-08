<script lang="ts" setup>
import type { ActivityEvent, PhoneCall, Reservation } from '~/components/inbox/data/conversations'
import { format, isToday } from 'date-fns'

interface ReservationActivityProps {
  activity: ActivityEvent[]
  reservation: Reservation
  phoneCalls?: PhoneCall[]
}

const props = defineProps<ReservationActivityProps>()

const dotColorMap: Record<string, string> = {
  gold: 'bg-foreground',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  gray: 'bg-muted-foreground',
}

function formatTimestamp(ts: string) {
  const date = new Date(ts)
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`
  }
  return format(date, 'EEEE, d MMM yyyy, h:mm a')
}

const reversedActivity = computed(() =>
  props.activity
    .filter(e => e.type !== 'message' && e.type !== 'reply')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
)

const callActivities = computed(() =>
  (props.phoneCalls ?? [])
    .filter(c => c.summary)
    .map(c => ({
      id: c.id,
      title: 'Phone call',
      description: c.summary!,
      timestamp: c.timestamp,
      type: 'phone_call' as const,
      colorDot: 'green' as const,
      channel: 'Phone' as const,
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
)

const allActivities = computed(() =>
  [...reversedActivity.value, ...callActivities.value]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
)
</script>

<template>
  <div>
    <h3 class="text-sm font-medium mb-3">Timeline</h3>

    <div class="space-y-0">
      <div
        v-for="(event, i) of allActivities"
        :key="event.id"
        class="flex gap-3 pb-4"
      >
        <div class="flex flex-col items-center">
          <div :class="['size-2.5 shrink-0 rounded-full mt-1.5', event.type === 'phone_call' ? 'bg-green-500' : dotColorMap[event.colorDot] ?? 'bg-muted-foreground']" />
          <div v-if="i < allActivities.length - 1" class="w-px flex-1 bg-border" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <div class="text-sm font-medium">{{ event.title }}</div>
            <span v-if="event.type === 'phone_call'" class="inline-flex items-center gap-0.5 text-[10px] text-[#FBC800]">
              <Icon name="lucide:sparkles" class="size-3" />
              ElevAI
            </span>
          </div>
          <div class="text-xs text-muted-foreground">{{ event.description }}</div>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-[10px] text-muted-foreground">{{ formatTimestamp(event.timestamp) }}</span>
            <span v-if="event.channel" class="text-[10px] text-muted-foreground">via {{ event.channel }}</span>
          </div>
        </div>
      </div>

      <div v-if="allActivities.length === 0" class="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
        <Icon name="lucide:activity" class="size-8" />
        <p class="text-sm">No activity yet</p>
      </div>
    </div>
  </div>
</template>
