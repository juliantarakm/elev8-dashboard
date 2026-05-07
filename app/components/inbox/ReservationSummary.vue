<script lang="ts" setup>
import type { SmartAction, GuestSentiment } from '~/components/inbox/data/conversations'

interface ReservationSummaryProps {
  sentiment: GuestSentiment
  sentimentNote: string
  lastMessage: string
  smartActions: SmartAction[]
}

const props = defineProps<ReservationSummaryProps>()

const sentimentConfig: Record<string, { emoji: string, label: string, class: string }> = {
  positive: { emoji: '😊', label: 'Positive', class: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  neutral: { emoji: '😐', label: 'Neutral', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  negative: { emoji: '😠', label: 'Negative', class: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

const sentimentCfg = computed(() => sentimentConfig[props.sentiment] ?? sentimentConfig.neutral!)
</script>

<template>
  <div class="space-y-4">
    <!-- Conversation Summary -->
    <div class="rounded-lg border bg-muted/50 p-3 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">Conversation Summary</span>
        <Badge class="text-[10px] bg-[#C8A84B]/10 text-[#C8A84B] border-[#C8A84B]/30">ElevAI</Badge>
      </div>
      <p class="text-xs text-muted-foreground leading-relaxed">{{ sentimentNote }}</p>
      <div class="flex items-center gap-2">
        <span class="text-xs leading-none">{{ sentimentCfg.emoji }}</span>
        <span :class="['inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', sentimentCfg.class]">
          {{ sentimentCfg.label }}
        </span>
      </div>
    </div>

    <div v-if="smartActions.length > 0" class="space-y-2">
      <div class="flex items-center gap-2 text-sm font-medium">
        Action Needed
        <Badge variant="destructive" class="text-[10px]">{{ smartActions.length }}</Badge>
      </div>
      <InboxActionCard
        v-for="action of smartActions"
        :key="action.id"
        :action="action"
        @dismiss="$props.smartActions.splice($props.smartActions.findIndex(a => a.id === action.id), 1)"
      />
    </div>

    <div class="space-y-2">
      <div class="text-sm font-medium">Quick Actions</div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          <Icon name="lucide:pencil" class="size-4" />
          Edit Reservation
        </Button>
        <Button variant="outline" size="sm">
          <Icon name="lucide:external-link" class="size-4" />
          Detail Reservation
        </Button>
      </div>
    </div>
  </div>
</template>