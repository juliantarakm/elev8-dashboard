<script setup lang="ts">
import { useAssistant } from '~/composables/useAssistant'

const { isOpen, togglePanel, isStreaming } = useAssistant()
</script>

<template>
  <Button
    variant="default"
    size="sm"
    class="gap-2"
    :aria-label="isOpen ? 'Close AI assistant' : 'Open AI assistant'"
    :aria-expanded="isOpen"
    data-testid="elev-ai-button"
    @click="togglePanel"
  >
    <Icon
      name="lucide:sparkles"
      class="size-4"
      :class="isStreaming ? 'animate-pulse' : ''"
    />
    <span class="hidden sm:inline">Ask AI</span>
  </Button>
</template>