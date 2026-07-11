<script setup lang="ts">
import { ref, watch } from 'vue'
import { CopyIcon, RefreshCcwIcon } from '@lucide/vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { AssistantMessage } from '~/composables/useAssistant'
import type { AssistantAttachment } from '~/components/assistant/ElevAIAttachments.vue'

const props = defineProps<{
  message: AssistantMessage
  isLast?: boolean
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

async function copyToClipboard() {
  try { await navigator.clipboard.writeText(props.message.content) }
  catch { /* ignore */ }
}
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
      <ElevAIChainOfThought
        v-if="message.toolCalls && message.toolCalls.length > 0"
        :tool-calls="message.toolCalls"
      />

      <MessageResponse v-if="message.content" :content="message.content" />
      <Loader v-else />

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