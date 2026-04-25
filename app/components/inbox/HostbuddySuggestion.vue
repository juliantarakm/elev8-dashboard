<script lang="ts" setup>
import type { Message } from '~/components/inbox/data/conversations'

interface HostbuddySuggestionEmits {
  use: [content: string]
  dismiss: []
}

defineProps<{ suggestion: Message }>()
const emit = defineEmits<HostbuddySuggestionEmits>()
</script>

<template>
  <div class="rounded-lg border border-border bg-muted/50 p-3">
    <div class="flex items-center gap-2 mb-2">
      <span class="text-sm">&#10024;</span>
      <span class="text-sm font-medium text-[#C8A84B]">ElevAI Suggestion</span>
    </div>
    <p class="text-sm text-foreground mb-3">{{ suggestion.content }}</p>
    <div class="flex items-center gap-2">
      <Button
        size="sm"
        class="bg-[#C8A84B] text-[#0a0a0f] hover:bg-[#C8A84B]/90"
        @click="emit('use', suggestion.content)"
      >
        Use &amp; Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        @click="emit('dismiss')"
      >
        Dismiss
      </Button>
    </div>
  </div>
</template>