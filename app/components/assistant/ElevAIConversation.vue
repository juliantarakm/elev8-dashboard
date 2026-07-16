<script setup lang="ts">
import type { AssistantMessage } from '~/composables/useAssistant'

defineProps<{
  messages: AssistantMessage[]
}>()
</script>

<template>
  <Conversation
    class="flex-1 min-h-0"
    data-testid="elev-ai-conversation"
  >
    <ConversationContent class="flex flex-col gap-4 p-4">
      <slot />
    </ConversationContent>
    <ConversationScrollButton />
  </Conversation>
</template>