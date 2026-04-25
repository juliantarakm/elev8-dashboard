<script lang="ts" setup>
import type { GuestSentiment } from '~/components/inbox/data/conversations'
import { cn } from '~/lib/utils'

interface GuestSentimentProps {
  sentiment: GuestSentiment
  note: string
}

const props = defineProps<GuestSentimentProps>()

const sentimentConfig: Record<string, { emoji: string, label: string, border: string, bg: string }> = {
  positive: { emoji: '😊', label: 'Positive', border: 'border-green-500/40', bg: 'bg-green-500/5' },
  neutral: { emoji: '😐', label: 'Neutral', border: 'border-yellow-500/40', bg: 'bg-yellow-500/5' },
  negative: { emoji: '😠', label: 'Negative', border: 'border-red-500/40', bg: 'bg-red-500/5' },
}

const cfg = computed(() => sentimentConfig[props.sentiment] ?? sentimentConfig.neutral!)
</script>

<template>
  <div :class="cn('rounded-lg border p-3', cfg.border, cfg.bg)">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-lg">{{ cfg.emoji }}</span>
        <span class="text-sm font-medium">{{ cfg.label }}</span>
        <span class="text-xs text-muted-foreground">{{ note }}</span>
      </div>
      <span class="text-[10px] font-medium text-[#C8A84B] bg-[#C8A84B]/10 px-1.5 py-0.5 rounded">ElevAI</span>
    </div>
  </div>
</template>