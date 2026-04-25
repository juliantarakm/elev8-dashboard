<script lang="ts" setup>
import type { SmartAction } from '~/components/inbox/data/conversations'
import { format } from 'date-fns'
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

const severityBg: Record<string, string> = {
  warning: 'bg-amber-50 dark:bg-amber-950/30',
  urgent: 'bg-red-50 dark:bg-red-950/30',
  info: 'bg-blue-50 dark:bg-blue-950/30',
}

const severityBorder: Record<string, string> = {
  warning: 'border-amber-200 dark:border-amber-800',
  urgent: 'border-red-200 dark:border-red-800',
  info: 'border-blue-200 dark:border-blue-800',
}

const severityDot: Record<string, string> = {
  warning: 'bg-amber-500',
  urgent: 'bg-red-500',
  info: 'bg-blue-500',
}
</script>

<template>
  <div :class="cn('rounded-lg border p-3', severityBg[action.severity] ?? 'bg-muted/50', severityBorder[action.severity] ?? 'border-border')">
    <div class="flex items-start justify-between gap-2">
      <div class="flex items-center gap-2">
        <div :class="cn('size-2 rounded-full', severityDot[action.severity] ?? 'bg-muted-foreground')" />
        <span class="text-sm font-medium">{{ action.title }}</span>
      </div>
      <Button variant="ghost" size="icon" class="size-7 shrink-0" @click="emit('act', action)">
        <Icon name="lucide:check" class="size-4" />
      </Button>
    </div>
    <p class="text-xs text-muted-foreground mt-1.5 ml-4">{{ action.description }}</p>
  </div>
</template>