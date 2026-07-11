<script setup lang="ts">
import { useAssistant } from '~/composables/useAssistant'

const SUGGESTIONS = [
  { emoji: '📅', label: "Today's check-ins", prompt: "What are today's check-ins?" },
  { emoji: '🧹', label: 'Cleaning today', prompt: 'What is the cleaning schedule today?' },
  { emoji: '💰', label: 'Revenue this month', prompt: 'How is revenue this month?' },
  { emoji: '📊', label: 'Occupancy this month', prompt: 'What is the occupancy this month?' },
  { emoji: '🏠', label: 'Listings overview', prompt: 'Show me all listings' },
  { emoji: '👥', label: 'Repeat guests', prompt: 'Who are the repeat guests?' },
]

const { submit } = useAssistant()

function handleSelect(prompt: string) {
  // Auto-send immediately
  submit(prompt)
}
</script>

<template>
  <div class="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
    <div class="space-y-2">
      <div class="text-3xl">👋</div>
      <h3 class="text-sm font-medium">
        Hi Komang
      </h3>
      <p class="text-xs text-muted-foreground">
        Ask me about your properties.
      </p>
    </div>

    <div class="w-full max-w-sm space-y-2">
      <p class="text-xs font-medium text-muted-foreground">
        Try asking:
      </p>
      <div class="grid grid-cols-2 gap-2">
        <ElevAISuggestionChip
          v-for="(s, i) in SUGGESTIONS"
          :key="s.prompt"
          :style="{ animationDelay: `${i * 120}ms` }"
          class="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-500"
          :emoji="s.emoji"
          :label="s.label"
          :prompt="s.prompt"
          @select="handleSelect"
        />
      </div>
    </div>
  </div>
</template>
