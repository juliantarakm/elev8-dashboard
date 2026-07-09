<script setup lang="ts">
import type { GuideStatus } from './data/types'
import { Badge } from '~/components/ui/badge'

const props = defineProps<{ status: GuideStatus }>()

const labelMap: Record<GuideStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
}

const variantMap: Record<GuideStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  active: 'default',
  archived: 'secondary',
}
</script>

<template>
  <Badge :variant="variantMap[props.status]">
    {{ labelMap[props.status] }}
  </Badge>
</template>