<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ToolCallDisplay } from '~/composables/useAssistant'

const props = defineProps<{ toolCall: ToolCallDisplay }>()

const expanded = ref(false)

const argsSummary = computed(() => {
  const args = props.toolCall.args
  const entries = Object.entries(args)
  if (entries.length === 0) return ''
  return entries.map(([k, v]) => `${k}: "${String(v)}"`).join(', ')
})
</script>

<template>
  <button
    type="button"
    class="flex w-fit items-center gap-2 rounded-md border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
    :aria-expanded="expanded"
    :data-testid="`tool-badge-${toolCall.name}`"
    @click="expanded = !expanded"
  >
    <Icon name="lucide:search" class="size-3 shrink-0" />
    <span class="font-mono">
      {{ toolCall.displayName }}<span v-if="argsSummary"> ({{ argsSummary }})</span>
    </span>
    <Icon
      :name="expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'"
      class="size-3 shrink-0"
    />
  </button>
  <div
    v-if="expanded"
    class="ml-2 mt-1 rounded-md border border-dashed border-border bg-background p-2 text-xs text-muted-foreground"
  >
    <div><strong>Tool:</strong> <code class="font-mono">{{ toolCall.name }}</code></div>
    <div><strong>Args:</strong> <code class="font-mono">{{ JSON.stringify(toolCall.args) }}</code></div>
    <div><strong>Status:</strong> {{ toolCall.status }}</div>
  </div>
</template>