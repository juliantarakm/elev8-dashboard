<script setup lang="ts">
import type { JourneyStep } from './data/journeys'
import { cn } from '@/lib/utils'
import { conditionMeta, triggerMeta } from './data/journeys'

const props = defineProps<{
  step: JourneyStep
  active: boolean
}>()

const emit = defineEmits<{
  select: []
  delete: []
}>()

const stepMeta: Record<string, { icon: string, colorClasses: string, label: string }> = {
  trigger: { icon: 'i-lucide-zap', colorClasses: 'text-purple-500 bg-purple-50 dark:bg-purple-950', label: 'Trigger' },
  wait: { icon: 'i-lucide-clock', colorClasses: 'text-muted-foreground bg-muted', label: 'Wait' },
  message: { icon: 'i-lucide-message-square', colorClasses: 'text-green-600 bg-green-50 dark:bg-green-950', label: 'Message' },
  context_check: { icon: 'i-lucide-git-branch', colorClasses: 'text-amber-500 bg-amber-50 dark:bg-amber-950', label: 'Context Check' },
  action: { icon: 'i-lucide-bolt', colorClasses: 'text-red-500 bg-red-50 dark:bg-red-950', label: 'Action' },
  if_else: { icon: 'i-lucide-git-fork', colorClasses: 'text-blue-500 bg-blue-50 dark:bg-blue-950', label: 'If/Else' },
  hard_requirement: { icon: 'i-lucide-shield', colorClasses: 'text-orange-500 bg-orange-50 dark:bg-orange-950', label: 'Requirement' },
  create_note: { icon: 'i-lucide-file-pen-line', colorClasses: 'text-teal-500 bg-teal-50 dark:bg-teal-950', label: 'Note' },
  toggle_ai: { icon: 'i-lucide-bot', colorClasses: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950', label: 'Toggle AI' },
  integration: { icon: 'i-lucide-plug', colorClasses: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950', label: 'Integration' },
  end_journey: { icon: 'i-lucide-flag', colorClasses: 'text-muted-foreground bg-muted', label: 'End Journey' },
}

const meta = computed(() => stepMeta[props.step.type])

const summaryText = computed(() => {
  const s = props.step
  if (s.type === 'wait') {
    if (s.waitType === 'trigger')
      return `Waiting for: ${s.waitTrigger || 'event'}`
    const rel = s.relativeTo ? ` before ${s.relativeTo}` : ''
    return `${s.duration} ${s.unit}${rel}`
  }
  if (s.type === 'message') {
    const channelLabel: Record<string, string> = { ota: 'OTA Inbox', whatsapp: 'WhatsApp', email: 'Email' }
    const modeLabel = s.messageMode === 'template' ? 'Template' : 'AI Directive'
    return `${modeLabel} · ${channelLabel[s.channel] ?? s.channel}`
  }
  if (s.type === 'context_check')
    return s.condition.length > 50 ? `${s.condition.slice(0, 50)}…` : s.condition
  if (s.type === 'action') {
    const actionLabel: Record<string, string> = { create_task: 'Create Task', flag_reservation: 'Flag Reservation', staff_alert: 'Staff Alert', raise_action_item: 'Raise Action Item' }
    return actionLabel[(s as any).actionType] ?? ''
  }
  if (s.type === 'trigger') {
    const entries = (s as any).triggers ?? []
    if (entries.length === 0)
      return ''
    return entries.map((e: any) => triggerMeta[e.type]?.label ?? e.type).join(' · ')
  }
  if (s.type === 'if_else' || s.type === 'hard_requirement')
    return conditionMeta[(s as any).conditionType] ?? ''
  if (s.type === 'create_note') { const t = (s as any).noteContent as string; return t.length > 50 ? `${t.slice(0, 50)}…` : t }
  if (s.type === 'toggle_ai')
    return (s as any).enable ? 'Enable AI responses' : 'Disable AI responses'
  if (s.type === 'integration')
    return (s as any).integrationName || 'Integration action'
  if (s.type === 'end_journey')
    return 'Terminates flow for this guest'
  return ''
})

const isWhatsApp = computed(() => props.step.type === 'message' && (props.step as any).channel === 'whatsapp')
const isMessage = computed(() => props.step.type === 'message')
</script>

<template>
  <div
    :class="cn(
      'group flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 transition-all hover:border-primary/50',
      active && 'ring-2 ring-primary bg-primary/5 border-primary/30',
    )"
    @click="emit('select')"
  >
    <div :class="cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', meta.colorClasses)">
      <Icon :name="meta.icon" class="h-4 w-4" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm font-medium leading-none">{{ step.name }}</span>
        <span class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{{ meta.label }}</span>
        <span
          v-if="isMessage"
          class="rounded px-1.5 py-0.5 text-xs font-medium"
          :style="{ backgroundColor: '#C8A84B22', color: '#C8A84B' }"
        >HostBuddy AI</span>
      </div>
      <p class="truncate text-xs text-muted-foreground">
        {{ summaryText }}
      </p>
    </div>

    <div class="ml-1 flex shrink-0 items-center gap-1">
      <TooltipProvider v-if="isWhatsApp">
        <Tooltip>
          <TooltipTrigger as-child>
            <Icon name="i-lucide-triangle-alert" class="h-3.5 w-3.5 text-amber-500" />
          </TooltipTrigger>
          <TooltipContent>WhatsApp not configured</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Icon
        v-if="step.type !== 'trigger'"
        name="i-lucide-grip-vertical"
        class="drag-handle h-4 w-4 cursor-grab text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        @click.stop
      />
      <Button
        v-if="step.type !== 'trigger'"
        variant="ghost"
        size="icon"
        class="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        aria-label="Delete step"
        @click.stop="emit('delete')"
      >
        <Icon name="i-lucide-trash-2" class="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>
</template>
