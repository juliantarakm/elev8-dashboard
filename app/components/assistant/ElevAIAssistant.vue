<script setup lang="ts">
import { useAssistant } from '~/composables/useAssistant'

const { messages, clear } = useAssistant()

function onApprove(messageId: string) {
  // Update the message's approvalState so it persists across re-renders
  messages.value = messages.value.map(m =>
    m.id === messageId ? { ...m, approvalState: 'approved' as const } : m,
  )
}

function onReject(messageId: string) {
  messages.value = messages.value.map(m =>
    m.id === messageId ? { ...m, approvalState: 'rejected' as const } : m,
  )
}
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0">
    <ElevAIConversation v-if="messages.length > 0" :messages="messages">
      <ElevAIMessage
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        @approve="onApprove"
        @reject="onReject"
      />
    </ElevAIConversation>

    <ElevAIEmptyState v-else />

    <ElevAIPromptInput />
  </div>
</template>