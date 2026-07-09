<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import type { Tenant } from './data/tenants'
import { usePricingOverrides } from '~/composables/usePricingOverrides'
import { useStaffAuth } from '~/composables/useStaffAuth'

const props = defineProps<{ tenant: Tenant; open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean]; submitted: [] }>()

const { propose, hasActive, activeFor } = usePricingOverrides()
const { requiresApproval, can } = useStaffAuth()

const discountType = ref<'percent' | 'fixed'>('percent')
const value = ref(10)
const effectiveDate = ref(new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10))
const expiryDate = ref('')
const reason = ref('')
const forceOverride = ref(false)
const submitting = ref(false)

const reasonLength = computed(() => reason.value.length)
const reasonValid = computed(() => reasonLength.value >= 10)

const overContractEnd = computed(() => {
  if (!props.tenant.contractEndDate || !expiryDate.value) return false
  return new Date(expiryDate.value).getTime() < new Date(props.tenant.contractEndDate).getTime()
})

const eligible = computed(() => {
  if (props.tenant.status === 'churned' || props.tenant.status === 'suspended') return false
  if (hasActive(props.tenant.id)) return false
  if (!reasonValid.value) return false
  if (overContractEnd.value && !forceOverride.value) return false
  return true
})

const needsApproval = computed(() => requiresApproval(discountType.value, value.value))

const statusMessage = computed(() => {
  if (props.tenant.status === 'churned') return { tone: 'red' as const, text: 'Tenant is churned — override blocked.' }
  if (props.tenant.status === 'suspended') return { tone: 'red' as const, text: 'Tenant is suspended — override blocked.' }
  if (hasActive(props.tenant.id)) return { tone: 'red' as const, text: 'An active override already exists — revoke first.' }
  if (overContractEnd.value) return { tone: 'amber' as const, text: '⚠ Expiry falls before contract end. Force-override requires Admin confirmation.' }
  if (needsApproval.value) return { tone: 'amber' as const, text: '⚠ Over threshold — approval will be required.' }
  return { tone: 'green' as const, text: '✓ Within threshold — will auto-apply on save.' }
})

async function handleSubmit() {
  if (!eligible.value) return
  submitting.value = true
  try {
    const o = propose({
      tenantId: props.tenant.id,
      discountType: discountType.value,
      value: value.value,
      reason: reason.value,
      effectiveDate: new Date(effectiveDate.value).toISOString(),
      expiryDate: expiryDate.value ? new Date(expiryDate.value).toISOString() : undefined,
      proposedByStaffId: 'staff-3',
    })
    if (o.status === 'pending_approval') {
      toast.info('Sent for approval — Approver will be notified.')
    } else {
      toast.success('Override applied.')
    }
    emit('submitted')
    emit('update:open', false)
  } catch (err: any) {
    toast.error(err.message ?? 'Failed to propose override')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>Apply Custom Pricing</DialogTitle>
        <DialogDescription>Tenant-scoped, non-public promo code. Auto-applies or routes to approval based on threshold.</DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div v-if="activeFor(tenant.id)" class="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          An active override already exists for this tenant. Revoke it before applying a new one.
        </div>

        <div class="space-y-2">
          <Label>Discount type</Label>
          <RadioGroup v-model="discountType" class="flex gap-4">
            <div class="flex items-center gap-2"><RadioGroupItem id="pct" value="percent" /><Label for="pct">Percentage</Label></div>
            <div class="flex items-center gap-2"><RadioGroupItem id="fix" value="fixed" /><Label for="fix">Fixed amount</Label></div>
          </RadioGroup>
        </div>

        <div class="space-y-2">
          <Label>Value</Label>
          <div class="flex items-center gap-2">
            <Input v-model.number="value" type="number" min="1" class="w-32" />
            <span class="text-sm text-muted-foreground">{{ discountType === 'percent' ? '% off' : 'USD off / month' }}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <Label>Effective date</Label>
            <Input v-model="effectiveDate" type="date" />
          </div>
          <div class="space-y-2">
            <Label>Expiry date (optional)</Label>
            <Input v-model="expiryDate" type="date" />
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label>Reason</Label>
            <span class="text-xs" :class="reasonValid ? 'text-muted-foreground' : 'text-destructive'">{{ reasonLength }} / 10 min</span>
          </div>
          <Textarea v-model="reason" placeholder="Explain why this override is being proposed" :rows="3" />
        </div>

        <div v-if="overContractEnd && can('revoke_override')" class="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <input id="force" v-model="forceOverride" type="checkbox" class="mt-0.5" />
          <Label for="force" class="text-amber-900 cursor-pointer">
            Force-override expiry before contract end (Admin only — use with caution)
          </Label>
        </div>

        <div
          class="rounded-md border p-3 text-sm"
          :class="{
            'border-green-300 bg-green-50 text-green-900': statusMessage.tone === 'green',
            'border-amber-300 bg-amber-50 text-amber-900': statusMessage.tone === 'amber',
            'border-destructive/30 bg-destructive/5 text-destructive': statusMessage.tone === 'red',
          }"
        >
          {{ statusMessage.text }}
        </div>
      </div>

      <DialogFooter class="mt-4">
        <Button variant="outline" @click="emit('update:open', false)">Cancel</Button>
        <Button :disabled="!eligible || submitting" @click="handleSubmit">
          {{ needsApproval ? 'Send for approval' : 'Apply override' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>