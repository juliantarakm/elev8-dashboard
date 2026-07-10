<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useAssistant } from '~/composables/useAssistant'

const { submit, stop, isStreaming } = useAssistant()

const text = ref('')
const textarea = ref<HTMLTextAreaElement | null>(null)

const canSend = computed(() => text.value.trim().length > 0 && !isStreaming.value)

async function autoResize() {
  await nextTick()
  if (!textarea.value) return
  textarea.value.style.height = 'auto'
  textarea.value.style.height = `${Math.min(textarea.value.scrollHeight, 200)}px`
}

watch(text, autoResize)

async function handleSubmit() {
  if (!canSend.value) return
  const value = text.value
  text.value = ''
  await nextTick()
  autoResize()
  await submit(value)
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
    <div class="flex items-end gap-2 rounded-lg border bg-background p-2">
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
