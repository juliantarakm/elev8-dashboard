<script lang="ts" setup>
import type { SmartAction } from '~/components/inbox/data/conversations'

interface ActionCardProps {
  action: SmartAction
}

interface ActionCardEmits {
  dismiss: [action: SmartAction]
}

defineProps<ActionCardProps>()
const emit = defineEmits<ActionCardEmits>()
</script>

<template>
  <div class="flex items-center justify-between rounded-lg border p-3 text-sm text-muted-foreground">
    <span>{{ action.description }}</span>
    <Button variant="ghost" size="icon" class="size-7 shrink-0" @click="emit('dismiss', action)">
      <Icon name="lucide:check" class="size-4" />
    </Button>
  </div>
</template>