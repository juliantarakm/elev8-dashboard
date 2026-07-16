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

const { submit } = useAssistant()

async function onFollowUp(prompt: string) {
  await submit(prompt)
}

// Generate mock reasoning text from the tool calls. In v1 this is hardcoded
// per tool name. v2 (real AI) would emit this as a separate reasoning stream.
function getReasoningText(toolCalls: Array<{ name: string }> | undefined): string {
  if (!toolCalls || toolCalls.length === 0) return ''
  const names = toolCalls.map(t => t.name)
  const parts: string[] = []
  if (names.includes('get_upcoming_checkins')) {
    parts.push('Let me check the reservation system for any guests arriving today.')
  }
  if (names.includes('get_cleaning_schedule') || names.includes('get_cleaning_schedule_by_date_range')) {
    parts.push('Looking at the cleaning roster for today.')
  }
  if (names.includes('get_revenue_summary') || names.includes('get_revenue_by_listing')) {
    parts.push('Pulling revenue numbers from the accounting system.')
  }
  if (names.includes('get_occupancy_rate')) {
    parts.push('Calculating occupancy from the booking calendar.')
  }
  if (names.includes('get_listings_overview')) {
    parts.push('Fetching the current listings portfolio.')
  }
  if (names.includes('get_repeat_guests')) {
    parts.push('Looking up returning guests from the loyalty database.')
  }
  if (parts.length === 0) {
    parts.push('Processing your request.')
  }
  // Combine into flowing reasoning prose
  return parts.join(' ')
}
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0">
    <ElevAIConversation v-if="messages.length > 0" :messages="messages">
      <ElevAIMessage
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        :reasoning-text="getReasoningText(msg.toolCalls)"
        :is-last="msg === messages[messages.length - 1]"
        @approve="onApprove"
        @reject="onReject"
        @follow-up="onFollowUp"
      />
    </ElevAIConversation>

    <ElevAIEmptyState v-else />

    <ElevAIPromptInput />
  </div>
</template>