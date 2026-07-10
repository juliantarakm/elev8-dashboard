<script setup lang="ts">
import { useAssistant } from '~/composables/useAssistant'
import ElevAIConversation from '~/components/assistant/ElevAIConversation.vue'
import ElevAIMessage from '~/components/assistant/ElevAIMessage.vue'
import ElevAIEmptyState from '~/components/assistant/ElevAIEmptyState.vue'
import ElevAIPromptInput from '~/components/assistant/ElevAIPromptInput.vue'

const { messages } = useAssistant()
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0">
    <ElevAIConversation v-if="messages.length > 0" :messages="messages">
      <ElevAIMessage
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
      />
    </ElevAIConversation>

    <ElevAIEmptyState v-else />

    <ElevAIPromptInput />
  </div>
</template>