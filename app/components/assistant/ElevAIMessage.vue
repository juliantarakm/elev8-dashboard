<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AssistantMessage } from '~/composables/useAssistant'

const props = defineProps<{
  message: AssistantMessage
}>()

const emit = defineEmits<{
  approve: [messageId: string]
  reject: [messageId: string]
}>()

function onApprove() {
  emit('approve', props.message.id)
}

function onReject() {
  emit('reject', props.message.id)
}

// Flash the assistant bubble background briefly each time new text
// arrives from the stream. Listens for content length changes; ignores
// tool-call additions (those have their own pop-in animation).
const flashing = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => props.message.content,
  (newContent, oldContent) => {
    if (newContent.length > (oldContent ?? '').length && !props.message.role.includes('user')) {
      flashing.value = true
      if (flashTimer) clearTimeout(flashTimer)
      flashTimer = setTimeout(() => {
        flashing.value = false
      }, 350)
    }
  },
)
</script>

<template>
  <div
    v-if="message.role === 'user'"
    class="flex justify-end animate-in fade-in slide-in-from-right-4 duration-200"
    data-testid="message-user"
  >
    <div class="max-w-[85%] rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
      {{ message.content }}
    </div>
  </div>
  <div
    v-else
    class="flex flex-col items-start gap-2"
    data-testid="message-assistant"
  >
    <ElevAIChainOfThought
      v-if="message.toolCalls && message.toolCalls.length > 0"
      :tool-calls="message.toolCalls"
    />
    <div
      :class="[
        'max-w-[90%] rounded-lg px-4 py-2 text-sm text-foreground transition-colors duration-300',
        flashing ? 'bg-primary/15 ring-1 ring-primary/30' : 'bg-muted',
      ]"
    >
      <ElevAIResponse v-if="message.content" :content="message.content" />
      <ElevAILoader v-else />
    </div>
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
  </div>
</template>