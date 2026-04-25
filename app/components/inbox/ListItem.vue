<script lang="ts" setup>
import type { Conversation, StayStatus } from '~/components/inbox/data/conversations'
import { otaSources } from '~/components/inbox/data/conversations'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '~/lib/utils'

interface ListItemProps {
  conversation: Conversation
  isSelected: boolean
}

interface ListItemEmits {
  select: []
}

const props = defineProps<ListItemProps>()
const emit = defineEmits<ListItemEmits>()

const statusVariantMap: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  needs_reply: 'default',
  waiting_on_guest: 'secondary',
  done: 'outline',
}

const statusLabelMap: Record<string, string> = {
  needs_reply: 'Needs Reply',
  waiting_on_guest: 'Waiting',
  done: 'Done',
}

const stayStatusConfig: Record<StayStatus, { label: string, class: string }> = {
  inquiry: { label: 'Inquiry', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  current: { label: 'Current', class: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  future: { label: 'Future', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  past: { label: 'Past', class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
}

const otaIconMap: Record<string, string> = Object.fromEntries(otaSources.map(s => [s.name, s.icon]))
const stayConfig = computed(() => stayStatusConfig[props.conversation.stayStatus])
const stayDateLabel = computed(() => {
  const checkIn = new Date(props.conversation.checkIn)
  const checkOut = new Date(props.conversation.checkOut)
  return `${format(checkIn, 'MMM d')} – ${format(checkOut, 'MMM d')}`
})
</script>

<template>
  <button
    :class="cn(
      'flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent',
      isSelected && 'bg-muted',
    )"
    @click="emit('select')"
  >
    <div class="w-full flex items-start justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium"
        >
          {{ conversation.guestInitials }}
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-semibold truncate">{{ conversation.guestName }}</span>
            <div v-if="conversation.unreadCount > 0" class="h-2 w-2 flex rounded-full bg-blue-600" />
          </div>
          <div class="text-xs text-muted-foreground truncate">
            {{ conversation.listingName }}
          </div>
        </div>
      </div>
      <div class="shrink-0 text-right">
        <div class="text-xs text-muted-foreground">
          {{ formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true }) }}
        </div>
        <Badge :variant="statusVariantMap[conversation.status] ?? 'outline'" class="text-[10px]">
          {{ statusLabelMap[conversation.status] ?? conversation.status }}
        </Badge>
      </div>
    </div>

    <div class="w-full flex items-center gap-2">
      <p class="line-clamp-1 text-xs text-muted-foreground flex-1">
        {{ conversation.lastMessage }}
      </p>
    </div>

    <div class="w-full flex items-center gap-1.5">
      <Icon :name="otaIconMap[conversation.otaSource] ?? 'lucide:globe'" class="size-4 shrink-0" />
      <span class="text-[10px] text-muted-foreground">{{ stayDateLabel }}</span>
      <span :class="cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', stayConfig.class)">
        {{ stayConfig.label }}
      </span>
    </div>
  </button>
</template>