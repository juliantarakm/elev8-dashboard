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

const severityColor: Record<string, string> = {
  warning: 'text-amber-600 dark:text-amber-400',
  urgent: 'text-red-500 dark:text-red-400',
  info: 'text-blue-500 dark:text-blue-400',
}

const iconMap: Record<string, string> = {
  late_checkout: 'lucide:clock',
  missing_guide: 'lucide:book-open',
  complaint: 'lucide:alert-triangle',
  extra_item: 'lucide:user-plus',
}
</script>

<template>
  <div class="rounded-lg border bg-muted/50 p-3">
    <div class="flex items-start gap-2.5">
      <Icon :name="iconMap[action.type] ?? 'lucide:alert-circle'" :class="cn('size-4 mt-0.5 shrink-0', severityColor[action.severity] ?? 'text-muted-foreground')" />
      <div class="flex-1 min-w-0 space-y-1.5">
        <p class="text-sm">{{ action.description }}</p>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" @click="emit('act', action)">
            <Icon name="lucide:check" class="size-3.5 mr-1" />
            Mark as Done
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>