<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useUpsellNotifications } from '@/composables/useUpsellNotifications'
import type { UpsellOrder } from '@/components/upsells/data/upsell-orders'
import { useUpsellOrders } from '@/composables/useUpsellOrders'

const props = defineProps<{
  order: UpsellOrder | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { declineOrder } = useUpsellOrders()
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

  declineOrder(props.order.id, cancelReason.value.trim(), cancelledBy.value)
  createNotification(props.order, 'UPSELL_ORDER_DECLINED')
  toast.success('Request declined.')

  onOpenChange(false)
}
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
      <DialogTitle>Decline Request</DialogTitle>
        <DialogDescription>
          {{ order?.id }} — {{ order?.guestName }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-2">
          <Label>Cancellation Reason <span class="text-destructive">*</span></Label>
          <Textarea
            v-model="cancelReason"
            placeholder="Why is this request being declined?"
            rows="3"
          />
        </div>

        <div class="flex flex-col gap-2">
          <Label>Handled By</Label>
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
            This marks the request as declined and keeps a reason for the audit trail.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="onOpenChange(false)">
          Keep Request
        </Button>
        <Button variant="destructive" @click="handleCancel">
          <Icon name="lucide:x-circle" class="mr-2 h-4 w-4" />
          Confirm Decline
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
