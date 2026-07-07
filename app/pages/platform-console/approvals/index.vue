<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { STAFF_USERS } from '~/components/platform-console/data/staff'
import type { PricingOverride } from '~/components/platform-console/data/pricing-overrides'
import { usePricingOverrides } from '~/composables/usePricingOverrides'
import { useStaffAuth } from '~/composables/useStaffAuth'
import { useTenants } from '~/composables/useTenants'

definePageMeta({ layout: 'platform-console' })

const { can } = useStaffAuth()
const { pendingApprovals } = usePricingOverrides()
const { byId } = useTenants()

const selected = ref<PricingOverride | null>(null)
const sheetOpen = ref(false)

function open(id: string) {
  selected.value = pendingApprovals.value.find(o => o.id === id) ?? null
  sheetOpen.value = true
}

function staffName(id: string) {
  return STAFF_USERS.find(s => s.id === id)?.name ?? id
}
</script>

<template>
  <div class="space-y-4 p-6">
    <div>
      <h2 class="text-2xl font-semibold">Approval queue</h2>
      <p class="text-sm text-muted-foreground">Pricing override proposals over the auto-apply threshold</p>
    </div>

    <div v-if="!can('approve_override')" class="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      Switch to Platform Approver or Platform Admin to review and act on override proposals.
    </div>

    <template v-else>
      <div class="grid grid-cols-3 gap-4">
        <Card><CardContent class="p-4"><div class="text-xs text-muted-foreground">Pending</div><div class="text-2xl font-semibold">{{ pendingApprovals.length }}</div></CardContent></Card>
        <Card><CardContent class="p-4"><div class="text-xs text-muted-foreground">Approved this month</div><div class="text-2xl font-semibold">—</div></CardContent></Card>
        <Card><CardContent class="p-4"><div class="text-xs text-muted-foreground">Rejected this month</div><div class="text-2xl font-semibold">—</div></CardContent></Card>
      </div>

      <Card v-if="!pendingApprovals.length">
        <CardContent class="p-8 text-center text-sm text-muted-foreground">
          No pending overrides 🎉
        </CardContent>
      </Card>
      <Card v-else>
        <CardContent class="p-0">
          <div class="divide-y">
            <div v-for="o in pendingApprovals" :key="o.id" class="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50" @click="open(o.id)">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">{{ byId(o.tenantId)?.name }}</span>
                  <Badge variant="outline">{{ o.discountType === 'percent' ? `${o.value}%` : `$${o.value}/mo` }}</Badge>
                </div>
                <div class="text-xs text-muted-foreground mt-0.5">{{ o.reason.slice(0, 80) }}{{ o.reason.length > 80 ? '…' : '' }}</div>
                <div class="text-xs text-muted-foreground mt-1">Proposed by {{ staffName(o.proposedByStaffId) }} · {{ o.proposedAt.slice(0, 10) }}</div>
              </div>
              <Button variant="ghost" size="sm">View →</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <OverrideApprovalCard :override="selected" v-model:open="sheetOpen" />
    </template>
  </div>
</template>