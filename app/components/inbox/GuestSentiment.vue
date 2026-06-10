<script lang="ts" setup>
import type { GuestSentiment } from '~/components/inbox/data/conversations'

interface GuestSentimentProps {
  sentiment: GuestSentiment
  note: string
}

const props = defineProps<GuestSentimentProps>()

const sentimentConfig: Record<string, { emoji: string, label: string, class: string }> = {
  positive: {
    emoji: '😊',
    label: 'Positive',
    class: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  neutral: {
    emoji: '😐',
    label: 'Neutral',
    class: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
  negative: {
    emoji: '😠',
    label: 'Negative',
    class: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
}

const cfg = computed(() => sentimentConfig[props.sentiment] ?? sentimentConfig.neutral!)
</script>

<template>
  <div class="rounded-lg border bg-muted/50 p-3 space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">Sentiment</span>
      <Badge class="text-[10px] bg-[#FBC800]/10 text-[#FBC800] border-[#FBC800]/30">
        ElevAI
      </Badge>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-base leading-none">{{ cfg.emoji }}</span>
      <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" :class="[cfg.class]">
        {{ cfg.label }}
      </span>
    </div>
    <p class="text-xs text-muted-foreground">
      {{ note }}
    </p>
  </div>
</template>
