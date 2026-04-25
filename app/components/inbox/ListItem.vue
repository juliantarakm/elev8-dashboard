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

const statusConfig: Record<string, { label: string, class: string }> = {
  needs_reply: { label: 'Needs Reply', class: 'bg-[#C8A84B]/20 text-[#C8A84B]' },
  waiting_on_guest: { label: 'Waiting', class: 'bg-green-500/20 text-green-600' },
  done: { label: 'Done', class: 'bg-muted text-muted-foreground' },
}

const statusCfg = computed(() => statusConfig[props.conversation.status] ?? { label: 'Done', class: 'bg-muted text-muted-foreground' })
const otaColor = computed(() => otaColorMap[props.conversation.otaSource] ?? '#888')
</script>

<template>
  <button
    :class="cn(
      'flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent',
      isSelected && 'border-l-2 border-l-[#C8A84B] bg-accent',
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
            <span
              class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              :style="{ backgroundColor: `${otaColor}20`, color: otaColor }"
            >
              {{ conversation.otaSource }}
            </span>
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
        <span
          :class="cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', statusCfg.class)"
        >
          {{ statusCfg.label }}
        </span>
      </div>
    </div>

    <div class="w-full flex items-center gap-2">
      <p class="line-clamp-1 text-xs text-muted-foreground flex-1">
        {{ conversation.lastMessage }}
      </p>
      <span
        v-if="conversation.unreadCount > 0"
        class="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#C8A84B] text-white text-[10px] font-bold shrink-0"
      >
        {{ conversation.unreadCount }}
      </span>
    </div>
  </button>
</template>