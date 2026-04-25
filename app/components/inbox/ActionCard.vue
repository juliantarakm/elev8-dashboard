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

const iconMap: Record<string, string> = {
  late_checkout: 'lucide:clock',
  missing_guide: 'lucide:book-open',
  complaint: 'lucide:alert-triangle',
  extra_item: 'lucide:user-plus',
}

const severityDotColor: Record<string, string> = {
  warning: 'bg-[#C8A84B]',
  urgent: 'bg-red-500',
  info: 'bg-blue-500',
}

const dotColor = computed(() => severityDotColor[props.action.severity] ?? 'bg-muted-foreground')
</script>

<template>
  <div class="rounded-lg border bg-muted p-3">
    <div class="flex items-start gap-2">
      <div class="flex items-center gap-2">
        <Icon :name="iconMap[action.type] ?? 'lucide:alert-circle'" class="size-4 mt-0.5 shrink-0" />
        <div :class="['size-2 rounded-full shrink-0 mt-1.5', dotColor]" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium">{{ action.title }}</div>
        <div class="text-xs text-muted-foreground mt-0.5">{{ action.description }}</div>
        <div class="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            @click="emit('act', action)"
          >
            {{ action.primaryAction }}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            @click="emit('dismiss', action)"
          >
            {{ action.dismissLabel }}
          </Button>
        </div>
        <div class="text-[10px] text-muted-foreground mt-2">
          {{ action.detectedBy === 'elevai' ? 'Detected by ElevAI' : 'Detected by system' }}
        </div>
      </div>
    </div>
  </div>
</template>