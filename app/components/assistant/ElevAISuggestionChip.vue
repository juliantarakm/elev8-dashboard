<script setup lang="ts">
const { prompt } = defineProps<{
  emoji: string
  label: string
  prompt: string
}>()

const emit = defineEmits<{
  select: [prompt: string]
}>()

function handleClick() {
  emit('select', prompt)
}
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground transition-colors hover:bg-secondary/80 text-left"
    :data-prompt="prompt"
    data-testid="suggestion-chip"
    @click="handleClick"
  >
    <span class="shrink-0">{{ emoji }}</span>
    <span class="truncate">{{ label }}</span>
  </button>
</template>
