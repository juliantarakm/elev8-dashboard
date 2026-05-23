<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useUpsellOrders } from '@/composables/useUpsellOrders'
import { useUpsellNotifications } from '@/composables/useUpsellNotifications'
import type { UpsellOrder } from '@/components/upsells/data/upsell-orders'

const props = defineProps<{
  order: UpsellOrder | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { cancelOrder } = useUpsellOrders()
const { createNotification } = useUpsellNotifications()

const cancelReason = ref('')
const cancelledBy = ref<'guest' | 'staff'>('staff')

function onOpenChange(value: boolean) {
  emit('update:open', value)
  if (!value) {
    cancelReason.value = ''
    cancelledBy.value = 'staff'
  }
}

function handleCancel() {
  if (!props.order || !cancelReason.value.trim()) {
    toast.error('Cancellation reason is required.')
    return
  }

  const refund = cancelOrder(props.order.id, cancelReason.value.trim(), cancelledBy.value)
  if (refund) {
    createNotification(
      { ...props.order, status: 'cancelled' },
      cancelledBy.value === 'guest' && refund.lateFee > 0 ? 'order_late_cancel' : 'order_cancelled',
    )
    toast.success(`Order cancelled. ${refund.reason}`)
  }

  onOpenChange(false)
}
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogDescription>
          {{ order?.id }} — {{ order?.guestName }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-2">
          <Label>Cancellation Reason <span class="text-destructive">*</span></Label>
          <Textarea
            v-model="cancelReason"
            placeholder="Why is this order being cancelled?"
            rows="3"
          />
        </div>

        <div class="flex flex-col gap-2">
          <Label>Cancelled By</Label>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-md border p-2 text-sm text-center transition-colors"
              :class="cancelledBy === 'staff' ? 'border-primary bg-primary/5 font-medium' : 'border-border'"
              @click="cancelledBy = 'staff'"
            >
              Staff
            </button>
            <button
              type="button"
              class="flex-1 rounded-md border p-2 text-sm text-center transition-colors"
              :class="cancelledBy === 'guest' ? 'border-primary bg-primary/5 font-medium' : 'border-border'"
              @click="cancelledBy = 'guest'"
            >
              Guest
            </button>
          </div>
        </div>

        <div class="rounded-md bg-muted p-3 text-sm">
          <p class="text-muted-foreground">
            Refund will be calculated based on cancellation policy and timing.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="onOpenChange(false)">
          Keep Order
        </Button>
        <Button variant="destructive" @click="handleCancel">
          <Icon name="lucide:x-circle" class="mr-2 h-4 w-4" />
          Confirm Cancel
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
