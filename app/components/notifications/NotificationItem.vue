<script setup lang="ts">
import type { Alert } from '~/components/notifications/data/alerts'
import { alertDisplayLabels, getDescription as getAlertDescription } from '~/components/notifications/data/alerts'
import { formatDistanceToNow } from 'date-fns'

const props = defineProps<{
  alert: Alert
}>()

const emit = defineEmits<{
  click: [alert: Alert]
  dismiss: [alertId: string]
}>()

const severityClasses = computed(() => {
  return props.alert.severity === 'CRITICAL'
    ? {
        bg: 'bg-red-50/50 hover:bg-red-50',
        border: 'border-l-4 border-red-500',
        dot: 'text-red-500',
      }
    : {
        bg: 'bg-amber-50/50 hover:bg-amber-50',
        border: 'border-l-4 border-amber-500',
        dot: 'text-amber-500',
      }
})

function handleClick() {
  emit('click', props.alert)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    emit('click', props.alert)
  }
}

function handleDismiss(e: MouseEvent) {
  e.stopPropagation()
  emit('dismiss', props.alert.alert_id)
}

const displayLabel = computed(() => alertDisplayLabels[props.alert.type])
const description = computed(() => getAlertDescription(props.alert.type, props.alert.context))

function getTimeAgo(isoString: string): string {
  return formatDistanceToNow(new Date(isoString), { addSuffix: true })
}
</script>

<template>
  <div
    role="button"
    tabindex="0"
    class="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border/50 last:border-b-0"
    :class="[severityClasses.bg, severityClasses.border]"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <Icon
      name="i-lucide-circle"
      :class="['mt-0.5 size-2.5 shrink-0 fill-current', severityClasses.dot]"
    />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium truncate">
        {{ displayLabel }}
      </p>
      <p class="text-xs text-muted-foreground truncate mt-0.5">
        {{ description }}
      </p>
      <p class="text-xs text-muted-foreground/70 mt-0.5">
        {{ getTimeAgo(props.alert.triggered_at) }}
      </p>
    </div>
    <button
      aria-label="Dismiss alert"
      class="shrink-0 size-5 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      @click="handleDismiss"
    >
      <Icon name="i-lucide-x" class="size-3" />
    </button>
  </div>
</template>
