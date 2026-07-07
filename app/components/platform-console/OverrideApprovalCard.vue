<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import type { PricingOverride } from './data/pricing-overrides'
import { usePricingOverrides } from '~/composables/usePricingOverrides'
import { useTenants } from '~/composables/useTenants'
import { useStaffAuth } from '~/composables/useStaffAuth'

const props = defineProps<{ override: PricingOverride | null; open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const { byId: tenantById } = useTenants()
const { approve, reject } = usePricingOverrides()
const { currentRole } = useStaffAuth()

const rejectMode = ref(false)
const rejectNote = ref('')
const submitting = ref(false)

const tenant = computed(() => props.override ? tenantById(props.override.tenantId) : null)

const isOwnProposal = computed(() => props.override?.proposedByStaffId === 'staff-3' && currentRole.value === 'finance')

async function doApprove() {
  if (!props.override) return
  submitting.value = true
  try {
    approve(props.override.id, 'staff-2')
    toast.success('Override approved.')
    emit('update:open', false)
  } catch (e: any) {
    toast.error(e.message ?? 'Failed')
  } finally {
    submitting.value = false
    rejectMode.value = false
  }
}

async function doReject() {
  if (!props.override || rejectNote.value.length < 5) {
    toast.error('Rejection note must be at least 5 characters')
    return
  }
  submitting.value = true
  try {
    reject(props.override.id, 'staff-2', rejectNote.value)
    toast.info('Override rejected. Proposer has been notified.')
    emit('update:open', false)
  } catch (e: any) {
    toast.error(e.message ?? 'Failed')
  } finally {
    submitting.value = false
    rejectMode.value = false
    rejectNote.value = ''
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent v-if="override" class="w-[520px]">
      <SheetHeader>
        <SheetTitle>Override review</SheetTitle>
      </SheetHeader>
      <div class="space-y-3 p-4 text-sm">
        <div v-if="tenant" class="rounded-md border bg-muted/30 p-3">
          <div class="text-xs text-muted-foreground">Tenant</div>
          <div class="font-medium">{{ tenant.name }}</div>
        </div>
        <div class="flex justify-between"><span class="text-muted-foreground">Discount</span><strong>{{ override.discountType === 'percent' ? `${override.value}%` : `$${override.value}/mo` }}</strong></div>
        <div class="flex justify-between"><span class="text-muted-foreground">Effective</span>{{ override.effectiveDate.slice(0, 10) }}</div>
        <div class="flex justify-between"><span class="text-muted-foreground">Expires</span>{{ override.expiryDate?.slice(0, 10) ?? '—' }}</div>
        <div><span class="text-muted-foreground">Reason:</span> {{ override.reason }}</div>
        <div class="text-xs text-muted-foreground">Proposed {{ override.proposedAt.slice(0, 10) }} by {{ override.proposedByStaffId }}</div>

        <div v-if="rejectMode" class="space-y-2 pt-3 border-t">
          <label class="text-sm font-medium">Rejection note (required)</label>
          <Textarea v-model="rejectNote" :rows="3" placeholder="Explain why this proposal is rejected" />
        </div>
      </div>
      <div class="border-t p-4 flex items-center justify-end gap-2">
        <Button variant="outline" @click="emit('update:open', false)">Close</Button>
        <template v-if="!rejectMode">
          <Button variant="outline" :disabled="submitting || isOwnProposal" @click="rejectMode = true">Reject</Button>
          <Button :disabled="submitting || isOwnProposal" @click="doApprove">Approve</Button>
        </template>
        <template v-else>
          <Button variant="outline" @click="rejectMode = false; rejectNote = ''">Back</Button>
          <Button variant="destructive" :disabled="submitting || rejectNote.length < 5" @click="doReject">Confirm reject</Button>
        </template>
      </div>
      <p v-if="isOwnProposal" class="px-4 pb-4 text-xs text-amber-700">
        You cannot approve your own proposal. Switch role to Approver.
      </p>
    </SheetContent>
  </Sheet>
</template>