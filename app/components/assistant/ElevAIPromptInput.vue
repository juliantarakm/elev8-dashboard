<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAssistant } from '~/composables/useAssistant'
import type { AssistantAttachment } from '~/components/assistant/ElevAIAttachments.vue'

const { submit, stop, isStreaming } = useAssistant()

const text = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const attachments = ref<AssistantAttachment[]>([])

// Map our isStreaming boolean to ChatStatus used by ai-elements components.
const chatStatus = computed<'ready' | 'streaming' | 'submitted' | 'error'>(
  () => isStreaming.value ? 'streaming' : 'ready',
)

const canSend = computed(
  () => (text.value.trim().length > 0 || attachments.value.length > 0) && !isStreaming.value,
)

function openFilePicker() {
  fileInput.value?.click()
}

function handleFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  for (const f of files) {
    attachments.value.push({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      type: f.type || 'application/octet-stream',
      size: f.size,
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    })
  }
  input.value = ''
}

function removeAttachment(id: string) {
  const idx = attachments.value.findIndex(a => a.id === id)
  if (idx >= 0) {
    const att = attachments.value[idx]
    if (att?.url) URL.revokeObjectURL(att.url)
    attachments.value.splice(idx, 1)
  }
}

async function handleSubmit() {
  if (!canSend.value) return
  const value = text.value
  const atts = attachments.value
  text.value = ''
  attachments.value = []
  await submit(value, atts)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}

function handleStop() {
  stop()
}

watch(text, () => {
  // ai-elements PromptInputTextarea auto-resizes internally
})
</script>

<template>
  <div class="border-t p-3">
    <ElevAIAttachments
      :attachments="attachments"
      @remove="removeAttachment"
    />
    <PromptInput
      class="w-full"
      @submit="handleSubmit"
    >
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Attach files"
        data-testid="prompt-attach"
        @click="openFilePicker"
      >
        <Icon name="lucide:paperclip" class="size-4" />
      </Button>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*,application/pdf,.txt,.doc,.docx"
        class="hidden"
        data-testid="prompt-file-input"
        @change="handleFiles"
      />
      <PromptInputTextarea
        v-model="text"
        placeholder="Ask about your properties..."
        :maxlength="2000"
        data-testid="prompt-input"
        @keydown="handleKeydown"
      />
      <PromptInputSubmit
        v-if="!isStreaming"
        :status="chatStatus"
        :disabled="!canSend"
        data-testid="prompt-send"
      />
      <PromptInputSubmit
        v-else
        :status="chatStatus"
        data-testid="prompt-stop"
        @click="handleStop"
      />
    </PromptInput>
  </div>
</template>