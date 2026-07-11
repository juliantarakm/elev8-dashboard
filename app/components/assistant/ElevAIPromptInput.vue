<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useAssistant } from '~/composables/useAssistant'
import type { AssistantAttachment } from '~/components/assistant/ElevAIAttachments.vue'

const { submit, stop, isStreaming } = useAssistant()

const text = ref('')
const textarea = ref<HTMLTextAreaElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const attachments = ref<AssistantAttachment[]>([])

const canSend = computed(() => (text.value.trim().length > 0 || attachments.value.length > 0) && !isStreaming.value)

async function autoResize() {
  await nextTick()
  if (!textarea.value) return
  textarea.value.style.height = 'auto'
  textarea.value.style.height = `${Math.min(textarea.value.scrollHeight, 200)}px`
}

watch(text, autoResize)

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
      // For image previews, create a blob URL. Revoked on remove.
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    })
  }
  // Clear the input so the same file can be picked again later
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
  await nextTick()
  autoResize()
  await submit(value, atts)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}
</script>

<template>
  <div class="border-t p-3">
    <ElevAIAttachments
      :attachments="attachments"
      @remove="removeAttachment"
    />
    <div class="flex items-end gap-2 rounded-lg border bg-background p-2">
      <Button
        v-if="!isStreaming"
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Attach files"
        data-testid="prompt-attach"
        @click="openFilePicker"
      >
        <Icon name="lucide:paperclip" class="size-4" />
      </Button>
      <textarea
        ref="textarea"
        v-model="text"
        rows="1"
        placeholder="Ask about your properties..."
        aria-label="Ask the AI assistant"
        :maxlength="2000"
        class="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        data-testid="prompt-input"
        @keydown="handleKeydown"
      />
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*,application/pdf,.txt,.doc,.docx"
        class="hidden"
        data-testid="prompt-file-input"
        @change="handleFiles"
      />
      <Button
        v-if="!isStreaming"
        type="button"
        size="icon"
        variant="default"
        :disabled="!canSend"
        aria-label="Send message"
        data-testid="prompt-send"
        @click="handleSubmit"
      >
        <Icon name="lucide:arrow-up" class="size-4" />
      </Button>
      <Button
        v-else
        type="button"
        size="icon"
        variant="outline"
        aria-label="Stop generating"
        data-testid="prompt-stop"
        @click="stop"
      >
        <Icon name="lucide:square" class="size-3" />
      </Button>
    </div>
  </div>
</template>