<script lang="ts" setup>
import type { GuestSentiment } from '~/components/inbox/data/conversations'
import { cn } from '~/lib/utils'

interface GuestSentimentProps {
  sentiment: GuestSentiment
  note: string
}

const props = defineProps<GuestSentimentProps>()

const sentimentConfig: Record<string, { emoji: string, label: string }> = {
  positive: { emoji: '😊', label: 'Positive' },
  neutral: { emoji: '😐', label: 'Neutral' },
  negative: { emoji: '😠', label: 'Negative' },
}

const cfg = computed(() => sentimentConfig[props.sentiment] ?? sentimentConfig.neutral!)
</script>

<template>
  <div class="rounded-lg border bg-muted p-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-lg">{{ cfg.emoji }}</span>
        <span class="text-sm font-medium">{{ cfg.label }}</span>
        <span class="text-xs text-muted-foreground">{{ note }}</span>
      </div>
      <Badge class="text-[10px] bg-[#C8A84B]/10 text-[#C8A84B] border-[#C8A84B]/30">
        ElevAI
      </Badge>
    </div>
  </div>
</template>