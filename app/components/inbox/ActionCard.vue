<script lang="ts" setup>
import type { SmartAction } from '~/components/inbox/data/conversations'
import { cn } from '~/lib/utils'

interface ActionCardProps {
  action: SmartAction
}

interface ActionCardEmits {
  act: [action: SmartAction]
  dismiss: [action: SmartAction]
}

const props = defineProps<ActionCardProps>()
const emit = defineEmits<ActionCardEmits>()

const severityConfig: Record<string, { border: string, bg: string, badge: string, badgeText: string }> = {
  warning: { border: 'border-amber-300 dark:border-amber-700', bg: 'bg-amber-50 dark:bg-amber-950/40', badge: 'bg-amber-100 dark:bg-amber-900', badgeText: 'text-amber-700 dark:text-amber-300' },
  urgent: { border: 'border-red-300 dark:border-red-700', bg: 'bg-red-50 dark:bg-red-950/40', badge: 'bg-red-100 dark:bg-red-900', badgeText: 'text-red-700 dark:text-red-300' },
  info: { border: 'border-blue-300 dark:border-blue-700', bg: 'bg-blue-50 dark:bg-blue-950/40', badge: 'bg-blue-100 dark:bg-blue-900', badgeText: 'text-blue-700 dark:text-blue-300' },
}

const severityLabel: Record<string, string> = {
  warning: 'Warning',
  urgent: 'Urgent',
  info: 'Info',
}
</script>

<template>
  <div :class="cn('rounded-lg border p-3', severityConfig[action.severity]?.border ?? 'border-border', severityConfig[action.severity]?.bg ?? 'bg-muted/50')">
    <div class="flex items-start gap-3">
      <div class="flex-1 min-w-0 space-y-2">
        <div class="flex items-center gap-2">
          <span :class="cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', severityConfig[action.severity]?.badge ?? 'bg-muted', severityConfig[action.severity]?.badgeText ?? 'text-muted-foreground')">
            {{ severityLabel[action.severity] ?? 'Action' }}
          </span>
          <span class="text-sm font-medium">{{ action.title }}</span>
        </div>
        <p class="text-xs text-muted-foreground">{{ action.description }}</p>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" @click="emit('act', action)">
            {{ action.primaryAction }}
          </Button>
          <Button variant="ghost" size="sm" class="text-muted-foreground" @click="emit('dismiss', action)">
            {{ action.dismissLabel }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>