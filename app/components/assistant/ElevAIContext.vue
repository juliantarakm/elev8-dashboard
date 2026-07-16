<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: string
  toolCallCount?: number
}>()

// Mock token estimation for v1 — in real AI swap, this comes from the
// streamText usage callback. ~1 token per 4 chars is a rough approximation.
const inputTokens = computed(() => Math.max(50, Math.floor(props.content.length / 4)))
const outputTokens = computed(() => Math.floor(props.content.length / 4))
const usedTokens = computed(() => inputTokens.value + outputTokens.value)
const maxTokens = 8000

// Mock cost: $0.000015 per token (Sonnet-class rate, rounded)
const costUsd = computed(() => (usedTokens.value * 0.000015).toFixed(4))
</script>

<template>
  <Context
    :used-tokens="usedTokens"
    :max-tokens="maxTokens"
    model-id="mock-elev8-assistant"
    class="ml-2 mt-1 w-fit"
    data-testid="elev-ai-context"
  >
    <ContextContent>
      <ContextContentBody class="gap-1 px-2 py-1 text-[10px] text-muted-foreground">
        <span>{{ usedTokens }} / {{ maxTokens }} tokens</span>
        <span class="text-muted-foreground/60">·</span>
        <span>${{ costUsd }}</span>
        <template v-if="toolCallCount">
          <span class="text-muted-foreground/60">·</span>
          <span>{{ toolCallCount }} tool{{ toolCallCount === 1 ? '' : 's' }}</span>
        </template>
      </ContextContentBody>
    </ContextContent>
  </Context>
</template>