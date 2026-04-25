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

const severityConfig: Record<string, { border: string, bg: string }> = {
  warning: { border: 'border-[#C8A84B]/40', bg: 'bg-[#C8A84B]/5' },
  urgent: { border: 'border-red-500/40', bg: 'bg-red-500/5' },
  info: { border: 'border-blue-500/40', bg: 'bg-blue-500/5' },
}

const severityStyle = computed(() => severityConfig[props.action.severity] ?? severityConfig.info!)
</script>

<template>
  <div :class="cn('rounded-lg border p-3', severityStyle.border, severityStyle.bg)">
    <div class="flex items-start gap-2">
      <Icon :name="iconMap[action.type] ?? 'lucide:alert-circle'" class="size-4 mt-0.5 shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium">{{ action.title }}</div>
        <div class="text-xs text-muted-foreground mt-0.5">{{ action.description }}</div>
        <div class="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            class="bg-[#C8A84B] text-[#0a0a0f] hover:bg-[#C8A84B]/90"
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