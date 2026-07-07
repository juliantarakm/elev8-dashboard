<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Progress } from '~/components/ui/progress'
import type { Tenant } from './data/tenants'
import { usePlatformAudit } from '~/composables/usePlatformAudit'

const props = defineProps<{ tenant: Tenant }>()
const { log } = usePlatformAudit()

onMounted(() => {
  log('view_billing', 'tenant', props.tenant.id)
})

const invoices = computed(() => [
  { id: 'inv-1', date: '2026-06-15', amount: props.tenant.mrrUsd ?? 0, status: 'paid' },
  { id: 'inv-2', date: '2026-05-15', amount: props.tenant.mrrUsd ?? 0, status: 'paid' },
  { id: 'inv-3', date: '2026-04-15', amount: props.tenant.mrrUsd ?? 0, status: 'paid' },
])
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <Card v-if="tenant.plan === 'per_property'">
      <CardHeader><CardTitle>Subscription</CardTitle></CardHeader>
      <CardContent class="space-y-3">
        <div class="flex justify-between text-sm"><span class="text-muted-foreground">Tier</span><span class="font-medium">{{ tenant.packageTier }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-muted-foreground">Monthly</span><span class="font-medium">${{ tenant.mrrUsd }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-muted-foreground">Contract ends</span><span class="font-medium">{{ tenant.contractEndDate?.slice(0, 10) ?? '—' }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-muted-foreground">Channel Manager</span><span class="font-medium">{{ tenant.hasChannelManager ? 'Yes' : 'No' }}</span></div>
      </CardContent>
    </Card>
    <Card v-else>
      <CardHeader><CardTitle>Booking quota</CardTitle></CardHeader>
      <CardContent class="space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-muted-foreground">Remaining</span>
          <span class="font-medium">{{ tenant.quotaRemaining }} / {{ tenant.quotaTotal }}</span>
        </div>
        <Progress :model-value="((tenant.quotaRemaining ?? 0) / (tenant.quotaTotal ?? 1)) * 100" />
        <p class="text-xs text-muted-foreground">Auto-refill at 10% remaining</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Recent invoices</CardTitle></CardHeader>
      <CardContent class="space-y-2">
        <div v-for="inv in invoices" :key="inv.id" class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ inv.date }}</span>
          <span class="font-medium">${{ inv.amount }}</span>
          <span class="text-xs text-green-600">{{ inv.status }}</span>
        </div>
      </CardContent>
    </Card>
  </div>
</template>