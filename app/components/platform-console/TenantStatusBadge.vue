<script setup lang="ts">
import { Badge } from '~/components/ui/badge'
import type { TenantStatus } from './data/tenants'
import { TENANT_STATUS_LABEL } from './data/tenants'

const props = defineProps<{ status: TenantStatus; switchingToPlan?: 'per_booking' | 'per_property' }>()

const variant = computed(() => {
  if (props.status === 'active') return 'default'
  if (props.status === 'switching') return 'secondary'
  return 'destructive'
})

const className = computed(() => {
  if (props.status === 'switching') return 'bg-amber-100 text-amber-800 border-amber-300'
  return ''
})
</script>

<template>
  <div class="flex items-center gap-1">
    <Badge :variant="variant" :class="className">
      {{ TENANT_STATUS_LABEL[status] }}
    </Badge>
    <Badge v-if="switchingToPlan" variant="outline" class="bg-amber-50 text-amber-700 border-amber-300">
      Switching → {{ switchingToPlan === 'per_property' ? 'Per Property' : 'Per Booking' }}
    </Badge>
  </div>
</template>