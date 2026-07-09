<script setup lang="ts">
import { Badge } from '~/components/ui/badge'
import type { TenantPlan, PackageTier } from './data/tenants'
import { TENANT_PLAN_LABEL, TIER_LABEL } from './data/tenants'

defineProps<{
  plan: TenantPlan
  tier: PackageTier
  hasChannelManager?: boolean
}>()
</script>

<template>
  <div class="flex flex-col items-start gap-1">
    <Badge variant="outline" class="font-normal">
      {{ TENANT_PLAN_LABEL[plan] }} · {{ TIER_LABEL[tier] }}
    </Badge>
    <Badge v-if="hasChannelManager" variant="secondary" class="text-xs">
      + Channel Manager
    </Badge>
  </div>
</template>