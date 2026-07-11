<script setup lang="ts">
import type { ToolCallDisplay } from '~/composables/useAssistant'

defineProps<{
  toolCalls: ToolCallDisplay[]
}>()
</script>

<template>
  <ChainOfThought
    v-if="toolCalls.length > 0"
    class="ml-2 w-full max-w-[90%]"
    data-testid="chain-of-thought"
  >
    <ChainOfThoughtHeader>
      <ChainOfThoughtStep
        v-for="(tool, i) in toolCalls"
        :key="tool.id"
        :label="tool.displayName"
        :description="Object.entries(tool.args).map(([k, v]) => `${k}: ${String(v)}`).join(', ')"
        :status="tool.status === 'running' ? 'active' : 'complete'"
      >
        <ElevAIToolBadge :tool-call="tool" />
      </ChainOfThoughtStep>
    </ChainOfThoughtHeader>
    <ChainOfThoughtContent>
      <div class="flex flex-col gap-2 pl-6 text-xs text-muted-foreground">
        <p>{{ toolCalls.length }} step{{ toolCalls.length === 1 ? '' : 's' }} completed</p>
      </div>
    </ChainOfThoughtContent>
  </ChainOfThought>
</template>