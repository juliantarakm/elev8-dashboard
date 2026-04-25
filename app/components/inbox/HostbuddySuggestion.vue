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
  <button
    class="group flex items-center gap-2 rounded-full border border-[#C8A84B]/30 bg-[#C8A84B]/10 px-3 py-1.5 text-sm transition-all hover:border-[#C8A84B]/50 hover:bg-[#C8A84B]/20"
    @click="emit('use', suggestion.content)"
  >
    <span class="text-sm">&#10024;</span>
    <span class="text-[#C8A84B] font-medium truncate max-w-[300px]">ElevAI Suggestion</span>
    <span class="text-muted-foreground truncate">{{ suggestion.content }}</span>
    <Icon name="lucide:arrow-down" class="size-3.5 text-[#C8A84B] shrink-0 group-hover:translate-y-0.5 transition-transform" />
    <button
      class="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
      @click.stop="emit('dismiss')"
    >
      <Icon name="lucide:x" class="size-3" />
    </button>
  </button>
</template>