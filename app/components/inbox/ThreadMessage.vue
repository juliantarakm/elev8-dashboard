<script lang="ts" setup>
import type { Message } from '~/components/inbox/data/conversations'
import { format } from 'date-fns'
import { cn } from '~/lib/utils'

interface ThreadMessageProps {
  message: Message
}

const props = defineProps<ThreadMessageProps>()

const senderTypeLabel: Record<string, string> = {
  guest: 'Guest',
  host: 'You',
  system: 'System',
  ai: 'ElevAI',
}

const bubbleClass = computed(() => {
  if (props.message.sender === 'guest') {
    return 'bg-muted'
  }
  if (props.message.sender === 'host') {
    return 'bg-muted'
  }
  return ''
})

const alignClass = computed(() => {
  if (props.message.sender === 'system' || props.message.sender === 'ai') return 'justify-center'
  if (props.message.sender === 'host') return 'justify-end'
  return 'justify-start'
})

const isSystemMessage = computed(() => props.message.sender === 'system' || props.message.sender === 'ai')

const systemBubbleClass = 'bg-muted/50 text-muted-foreground'
</script>

<template>
  <div :class="cn('flex gap-2.5', alignClass)">
    <template v-if="!isSystemMessage">
      <Avatar v-if="message.sender === 'guest'" class="size-8 shrink-0 mt-1">
        <AvatarFallback class="text-xs">
          {{ message.senderName.split(' ').map(n => n[0]).join('') }}
        </AvatarFallback>
      </Avatar>

      <div class="flex flex-col gap-1 max-w-[75%]">
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium">{{ message.senderName }}</span>
          <span class="text-[10px] text-muted-foreground">{{ senderTypeLabel[message.sender] }}</span>
          <span class="text-[10px] text-muted-foreground">{{ format(new Date(message.timestamp), 'h:mm a') }}</span>
        </div>
        <div :class="cn('rounded-2xl px-3 py-2 text-sm', bubbleClass)">
          {{ message.content }}
        </div>
      </div>
    </template>

    <template v-else>
      <div class="text-xs italic text-center max-w-[75%] bg-muted/50 text-muted-foreground rounded-lg px-3 py-2">
        {{ message.content }}
      </div>
    </template>
  </div>
</template>