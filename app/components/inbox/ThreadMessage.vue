<script lang="ts" setup>
import type { Message } from '~/components/inbox/data/conversations'
import { format, isToday, isYesterday, differenceInDays, formatDistanceToNow } from 'date-fns'
import { cn } from '~/lib/utils'

interface ThreadMessageProps {
  message: Message
}

const props = defineProps<ThreadMessageProps>()

const senderTypeLabel: Record<string, string> = {
  guest: 'Guest',
  host: 'Staff',
  system: 'System',
  ai: 'ElevAI',
}

const { retryMessage } = useInbox()

const isRetrying = ref(false)

function handleRetry() {
  if (props.message.conversationId && props.message.sendStatus === 'failed') {
    isRetrying.value = true
    retryMessage(props.message.conversationId, props.message.id)
  }
}

watch(() => props.message.sendStatus, (status) => {
  if (status !== 'sending') {
    isRetrying.value = false
  }
})

const isFromMe = computed(() => props.message.sender === 'host' && props.message.senderName === 'You')

const isAiWritten = computed(() => props.message.aiWritten === true)

const displayName = computed(() => {
  if (isAiWritten.value) return 'ElevAI'
  return props.message.senderName
})

const displayLabel = computed(() => {
  if (isAiWritten.value) return null
  if (isFromMe.value) return 'You'
  if (props.message.senderRole) return props.message.senderRole
  return senderTypeLabel[props.message.sender]
})

const bubbleClass = computed(() => {
  if (props.message.sender === 'guest') {
    return 'bg-muted'
  }
  if (props.message.sender === 'host') {
    return 'bg-warning text-warning-foreground'
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

const timeLabel = computed(() => {
  const date = new Date(props.message.timestamp)
  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true })
  }
  return format(date, 'h:mm a')
})

const dateLabel = computed(() => {
  const date = new Date(props.message.timestamp)
  if (isToday(date)) return ''
  if (isYesterday(date)) return 'Yesterday'
  const daysAgo = differenceInDays(new Date(), date)
  if (daysAgo <= 3) return `${daysAgo} days ago`
  return format(date, 'EEEE, d MMM yyyy')
})
</script>

<template>
  <div :class="cn('flex gap-2.5', alignClass)">
    <template v-if="!isSystemMessage">
      <Avatar v-if="message.sender === 'guest'" class="size-8 shrink-0 mt-1">
        <AvatarFallback class="text-xs">
          {{ message.senderName.split(' ').map(n => n[0]).join('') }}
        </AvatarFallback>
      </Avatar>
      <div v-if="isAiWritten" class="flex size-8 shrink-0 mt-1 items-center justify-center rounded-full bg-[#FBC800]/10">
        <Icon name="lucide:sparkles" class="size-4 text-[#FBC800]" />
      </div>

      <div class="flex flex-col gap-1 max-w-[75%]">
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium">{{ displayName }}</span>
          <span v-if="displayLabel" class="text-[10px] text-muted-foreground">{{ displayLabel }}</span>
          <span v-if="isAiWritten" class="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Icon name="lucide:sparkles" class="size-3" />
            AI
          </span>
          <span v-if="message.channel" class="text-[10px] text-muted-foreground">via {{ message.channel }}</span>
          <span v-if="dateLabel" class="text-[10px] text-muted-foreground">· {{ dateLabel }}</span>
          <span class="text-[10px] text-muted-foreground">{{ timeLabel }}</span>
        </div>
        <div :class="cn('rounded-2xl px-3 py-2 text-sm', bubbleClass)">
          {{ message.content }}
        </div>
        <InboxUpsellOfferCard
          v-if="message.upsellOffer"
          :offer="message.upsellOffer"
          :conversation-id="message.conversationId"
        />
        <div v-if="message.sendStatus === 'sending'" class="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Icon name="lucide:loader-2" class="size-2.5 animate-spin" />
          {{ isRetrying ? 'Retrying...' : 'Sending...' }}
        </div>
        <div v-else-if="message.sendStatus === 'failed'" class="flex items-center gap-1 text-[10px] text-destructive">
          <Icon name="lucide:alert-circle" class="size-2.5" />
          Failed to send
          <button :disabled="isRetrying" class="underline ml-1 hover:text-destructive/80 disabled:opacity-50 disabled:no-underline" @click="handleRetry">{{ isRetrying ? 'Retrying...' : 'Retry' }}</button>
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