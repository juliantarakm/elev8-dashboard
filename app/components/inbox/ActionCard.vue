<script lang="ts" setup>
import type { SmartAction } from '~/components/inbox/data/conversations'

interface ActionCardProps {
  action: SmartAction
}

interface ActionCardEmits {
  act: [action: SmartAction]
  dismiss: [action: SmartAction]
}

const props = defineProps<ActionCardProps>()
const emit = defineEmits<ActionCardEmits>()
</script>

<template>
  <div class="rounded-lg border p-3 flex items-start justify-between gap-2">
    <p class="text-sm text-muted-foreground">{{ action.description }}</p>
    <Button variant="ghost" size="icon" class="size-7 shrink-0" @click="emit('act', action)">
      <Icon name="lucide:check" class="size-4" />
    </Button>
  </div>
</template>