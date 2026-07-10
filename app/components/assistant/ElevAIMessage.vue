<script setup lang="ts">
import type { AssistantMessage } from '~/composables/useAssistant'
import ElevAIResponse from '~/components/assistant/ElevAIResponse.vue'
import ElevAILoader from '~/components/assistant/ElevAILoader.vue'
import ElevAIToolBadge from '~/components/assistant/ElevAIToolBadge.vue'

defineProps<{
  message: AssistantMessage
}>()
</script>

<template>
  <div
    v-if="message.role === 'user'"
    class="flex justify-end"
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
    <div class="max-w-[90%] rounded-lg bg-muted px-4 py-2 text-sm text-foreground">
      <ElevAIResponse v-if="message.content" :content="message.content" />
      <ElevAILoader v-else />
    </div>
    <div
      v-if="message.toolCalls && message.toolCalls.length > 0"
      class="ml-2 flex flex-col gap-1 w-full max-w-[90%]"
    >
      <ElevAIToolBadge
        v-for="tool in message.toolCalls"
        :key="tool.id"
        :tool-call="tool"
      />
    </div>
  </div>
</template>