<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { AssistantMessage } from '~/composables/useAssistant'

const props = defineProps<{ messages: AssistantMessage[] }>()

const scrollContainer = ref<HTMLElement | null>(null)
const userScrolledUp = ref(false)

function handleScroll() {
  if (!scrollContainer.value) return
  const el = scrollContainer.value
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  userScrolledUp.value = distanceFromBottom > 100
}

async function scrollToBottom() {
  await nextTick()
  if (!scrollContainer.value || userScrolledUp.value) return
  scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
}

watch(() => props.messages.length, scrollToBottom)
watch(() => props.messages[props.messages.length - 1]?.content, scrollToBottom)
</script>

<template>
  <div
    ref="scrollContainer"
    class="flex-1 min-h-0 overflow-y-auto"
    aria-live="polite"
    aria-label="Conversation"
    @scroll="handleScroll"
  >
    <div class="flex flex-col gap-4 p-4">
      <slot />
    </div>
  </div>
</template>