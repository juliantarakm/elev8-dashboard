<script setup lang="ts">
import { computed } from 'vue'
import type { ToolCallDisplay } from '~/composables/useAssistant'

const props = defineProps<{
  toolCalls: ToolCallDisplay[]
}>()

// Format args as "key: value, key: value" — shown in ChainOfThoughtStep's
// description slot beneath the tool name.
const argsLabel = (tool: ToolCallDisplay) =>
  Object.entries(tool.args)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(', ')

const stepLabel = (tool: ToolCallDisplay) => tool.displayName

// Stable per-step data — computed once to avoid recomputing in the template
const steps = computed(() =>
  props.toolCalls.map((tool, i) => ({
    id: tool.id,
    label: stepLabel(tool),
    description: argsLabel(tool),
    status: (tool.status === 'running' ? 'active' : 'complete') as 'active' | 'complete',
    delay: `${i * 220}ms`,
  })),
)
</script>

<template>
  <ChainOfThought
    v-if="toolCalls.length > 0"
    class="ml-2 w-full max-w-[90%]"
    data-testid="chain-of-thought"
  >
    <ChainOfThoughtHeader>
      <ChainOfThoughtStep
        v-for="step in steps"
        :key="step.id"
        :class="`animate-in fade-in slide-in-from-left-2 zoom-in-95 fill-mode-backwards duration-700`"
        :style="{ animationDelay: step.delay }"
        :label="step.status === 'active' ? step.label : step.label"
        :description="step.description"
        :status="step.status"
      >
        <!-- Shimmer the active step's label to draw attention while the
             tool_call chunk is fresh — fades to plain text once 'complete'
             when text deltas start arriving. -->
        <Shimmer
          v-if="step.status === 'active'"
          :duration="1.5"
          class="text-sm"
        >
          {{ step.label }}
        </Shimmer>
      </ChainOfThoughtStep>
    </ChainOfThoughtHeader>
    <ChainOfThoughtContent>
      <div class="flex flex-col gap-2 pl-6 text-xs text-muted-foreground">
        <p>{{ toolCalls.length }} step{{ toolCalls.length === 1 ? '' : 's' }} completed</p>
      </div>
    </ChainOfThoughtContent>
  </ChainOfThought>
</template>