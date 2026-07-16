<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { CopyIcon, RefreshCcwIcon } from '@lucide/vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { AssistantMessage, ToolCallDisplay } from '~/composables/useAssistant'
import type { AssistantAttachment } from '~/components/assistant/ElevAIAttachments.vue'

const props = defineProps<{
  message: AssistantMessage
  isLast?: boolean
  reasoningText?: string
}>()

const emit = defineEmits<{
  approve: [messageId: string]
  reject: [messageId: string]
  retry: [messageId: string]
}>()

function onApprove() { emit('approve', props.message.id) }
function onReject() { emit('reject', props.message.id) }
function onRetry() { emit('retry', props.message.id) }

// Flash the assistant bubble background briefly each time new text
// arrives from the stream.
const flashing = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => props.message.content,
  (newContent, oldContent) => {
    if (newContent.length > (oldContent ?? '').length && props.message.role === 'assistant') {
      flashing.value = true
      if (flashTimer) clearTimeout(flashTimer)
      flashTimer = setTimeout(() => {
        flashing.value = false
      }, 350)
    }
  },
)

// Reasoning panel open state — manage manually because the ai-elements
// Reasoning primitive has a hardcoded 1000ms auto-close that ignores
// the duration prop. We want it open for a few seconds after streaming
// completes so the user can actually read it.
const reasoningOpen = ref(true)
let closeTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => props.message.content,
  (newContent) => {
    // Open while content is empty (still streaming/thinking)
    if (!newContent) {
      reasoningOpen.value = true
      if (closeTimer) clearTimeout(closeTimer)
      return
    }
    // Content arrived → keep open for 10 seconds, then auto-close
    reasoningOpen.value = true
    if (closeTimer) clearTimeout(closeTimer)
    closeTimer = setTimeout(() => {
      reasoningOpen.value = false
    }, 5_000)
  },
  { immediate: true },
)
onUnmounted(() => {
  if (closeTimer) clearTimeout(closeTimer)
})

async function copyToClipboard() {
  try { await navigator.clipboard.writeText(props.message.content) }
  catch { /* ignore */ }
}

// Context-aware follow-up suggestions based on the tool calls the AI made.
// Hardcoded for v1 (real AI would generate these dynamically).
const followUps = computed<string[]>(() => {
  if (!props.message.toolCalls || props.message.toolCalls.length === 0) return []
  const names = props.message.toolCalls.map((t: ToolCallDisplay) => t.name)

  if (names.includes('get_upcoming_checkins')) {
    return [
      "What about today's check-outs?",
      'Any VIP guests arriving?',
      'Which villa has the most arrivals?',
    ]
  }
  if (names.includes('get_cleaning_schedule') || names.includes('get_cleaning_schedule_by_date_range')) {
    return [
      'Who is cleaning tomorrow?',
      'Any deep cleans this week?',
      'Are there any maintenance issues?',
    ]
  }
  if (names.includes('get_revenue_summary') || names.includes('get_revenue_by_listing')) {
    return [
      'What about last month?',
      'Which listing earns the most?',
      'Any pending payouts?',
    ]
  }
  if (names.includes('get_occupancy_rate')) {
    return [
      'Which villa has lowest occupancy?',
      'Compare to last month',
      'Show me upcoming gaps',
    ]
  }
  if (names.includes('get_listings_overview')) {
    return [
      'Show me active listings only',
      'Which has the best rating?',
      'Any inactive listings?',
    ]
  }
  if (names.includes('get_repeat_guests') || names.includes('get_current_bookings')) {
    return [
      'Tell me more about Anna Schmidt',
      'Any special requests?',
      "What's the average stay length?",
    ]
  }
  return ['Tell me more', 'What about last week?', 'Any issues?']
})
</script>

<template>
  <!-- USER MESSAGE — primary-colored chat bubble -->
  <Message
    v-if="message.role === 'user'"
    from="user"
    class="animate-in fade-in slide-in-from-right-4 duration-200"
    data-testid="message-user"
  >
    <MessageContent class="!bg-primary !text-primary-foreground !px-4 !py-2 rounded-lg gap-1.5">
      <ElevAIAttachments
        v-if="message.attachments && message.attachments.length > 0"
        :attachments="(message.attachments as AssistantAttachment[])"
      />
      <div v-if="message.content" class="whitespace-pre-wrap">{{ message.content }}</div>
    </MessageContent>
    <Avatar class="size-8 ring-1 ring-border bg-primary text-primary-foreground overflow-hidden">
      <AvatarImage src="/avatars/avatartion.png" :alt="'Komang'" />
      <AvatarFallback class="bg-primary text-primary-foreground text-xs font-medium">
        KO
      </AvatarFallback>
    </Avatar>
  </Message>

  <!-- ASSISTANT MESSAGE — no background bubble, just text -->
  <Message
    v-else
    from="assistant"
    class="animate-in fade-in slide-in-from-left-4 duration-300"
    data-testid="message-assistant"
  >
    <Avatar class="size-8 ring-1 ring-border bg-primary text-primary-foreground shrink-0">
      <AvatarFallback class="bg-primary text-primary-foreground">
        <SharedAiIcon custom-class="size-4" />
      </AvatarFallback>
    </Avatar>
    <MessageContent
      :class="[
        'gap-2 px-0 py-0 transition-colors duration-300',
        flashing ? 'rounded-lg bg-primary/15 px-4 py-3 ring-1 ring-primary/30' : '',
      ]"
    >
      <Reasoning
        v-if="reasoningText"
        :is-streaming="!message.content && isLast"
        :duration="250"
        :default-open="false"
        :open="reasoningOpen"
        @update:open="(v: boolean) => reasoningOpen = v"
        class="ml-2 mt-1 w-fit"
        data-testid="elev-ai-reasoning"
      >
        <ReasoningTrigger />
        <ReasoningContent>{{ reasoningText }}</ReasoningContent>
      </Reasoning>

      <MessageResponse v-if="message.content" :content="message.content" />
      <div v-else class="flex items-center gap-2">
        <Shimmer class="text-sm">
          Thinking...
        </Shimmer>
      </div>

      <MessageActions v-if="message.content && isLast">
        <MessageAction label="Copy" @click="copyToClipboard">
          <CopyIcon class="size-3" />
        </MessageAction>
        <MessageAction label="Retry" @click="onRetry">
          <RefreshCcwIcon class="size-3" />
        </MessageAction>
      </MessageActions>

      <ElevAIContext
        v-if="message.content && !flashing"
        :content="message.content"
        :tool-call-count="message.toolCalls?.length ?? 0"
      />

      <ElevAIConfirmation
        v-if="message.confirmation"
        :title="message.confirmation.title"
        :description="message.confirmation.description"
        :action-label="message.confirmation.actionLabel"
        :details="message.confirmation.details"
        @approve="onApprove"
        @reject="onReject"
      />
    </MessageContent>
  </Message>
</template>