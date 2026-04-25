<script lang="ts" setup>
import type { SmartAction } from '~/components/inbox/data/conversations'

interface ActionCardProps {
  action: SmartAction
}

defineProps<ActionCardProps>()
</script>

<template>
  <div class="rounded-lg border p-3 text-sm text-muted-foreground">
    {{ action.description }}
  </div>
</template>