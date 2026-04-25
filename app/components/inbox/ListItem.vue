<script lang="ts" setup>
import type { Conversation } from '~/components/inbox/data/conversations'
import { formatDistanceToNow } from 'date-fns'
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

const otaColorMap: Record<string, string> = {
  Airbnb: '#FF5A5F',
  'Booking.com': '#003580',
}

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

const otaColor = computed(() => otaColorMap[props.conversation.otaSource] ?? '#888')
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
      <Badge
        :style="{ backgroundColor: `${otaColor}20`, color: otaColor }"
        class="text-[10px] shrink-0"
      >
        {{ conversation.otaSource }}
      </Badge>
    </div>
  </button>
</template>