<script setup lang="ts">
import type { PurchaseOrder } from '@/components/procurement/data/purchase-orders'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { usePurchaseOrders } from '@/composables/usePurchaseOrders'
import { useInventoryCatalog } from '@/composables/useInventoryCatalog'

const props = defineProps<{
  open: boolean
  order?: PurchaseOrder | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'createReceiving': [order: PurchaseOrder]
}>()

const { updateOrder, markSent } = usePurchaseOrders()
const { getItemById } = useInventoryCatalog()

const isOpen = computed({
  get: () => props.open,
  set: val => emit('update:open', val),
})

// Form state
const supplierName = ref('')
const supplierContact = ref('')
const expectedDeliveryDate = ref('')
const notes = ref('')

function populateForm(order: PurchaseOrder) {
  supplierName.value = order.supplier.name
  supplierContact.value = order.supplier.contact
  expectedDeliveryDate.value = order.expectedDeliveryDate ?? ''
  notes.value = order.notes ?? ''
}

watch(() => props.open, (val) => {
  if (val && props.order)
    populateForm(props.order)
})

function handleSave() {
  if (!props.order)
    return
  updateOrder(props.order.id, {
    supplier: { name: supplierName.value.trim(), contact: supplierContact.value.trim() },
    expectedDeliveryDate: expectedDeliveryDate.value || undefined,
    notes: notes.value.trim() || undefined,
  })
  toast.success('PO updated')
  isOpen.value = false
}

function handleMarkSent() {
  if (!props.order)
    return
  markSent(props.order.id)
  toast.success(`${props.order.poNumber} marked as sent`)
  isOpen.value = false
}

function handleCreateReceiving() {
  if (!props.order)
    return
  emit('createReceiving', props.order)
  isOpen.value = false
}

function getItemName(itemId: string): string {
  return getItemById(itemId)?.name ?? itemId
}

function formatDate(d?: string) {
  if (!d)
    return '-'
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatAmount(amount: number, currency: string) {
  if (currency === 'IDR')
    return `IDR ${amount.toLocaleString('id-ID')}`
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{{ order?.poNumber ?? 'Purchase Order' }}</SheetTitle>
        <SheetDescription>
          {{ order ? 'View and edit purchase order details.' : 'Purchase order details.' }}
        </SheetDescription>
      </SheetHeader>

      <div v-if="order" class="flex flex-col gap-4 px-4 py-4">
        <!-- Linked PR info -->
        <div class="rounded-md bg-muted/50 border p-3">
          <p class="text-xs text-muted-foreground">
            Linked Purchase Request
          </p>
          <p class="text-sm font-medium">
            {{ order.purchaseRequestId }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <Label>Supplier Name</Label>
            <Input v-model="supplierName" :disabled="order.status !== 'draft'" placeholder="Supplier name" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Contact</Label>
            <Input v-model="supplierContact" :disabled="order.status !== 'draft'" placeholder="Phone or email" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <Label>Currency</Label>
            <Input :model-value="order.currency" disabled />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Expected Delivery</Label>
            <Input v-model="expectedDeliveryDate" type="date" :disabled="order.status === 'received' || order.status === 'cancelled'" />
          </div>
        </div>

        <Separator />

        <!-- Line Items -->
        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium">
            Items
          </p>
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead class="text-right">Qty</TableHead>
                  <TableHead class="text-right">Unit Price</TableHead>
                  <TableHead class="text-right">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in order.items" :key="item.id">
                  <TableCell>
                    <p class="text-sm font-medium">
                      {{ getItemName(item.itemId) }}
                    </p>
                    <p v-if="item.notes" class="text-xs text-muted-foreground">
                      {{ item.notes }}
                    </p>
                  </TableCell>
                  <TableCell class="text-right">
                    {{ item.quantity }}
                  </TableCell>
                  <TableCell class="text-right">
                    {{ formatAmount(item.unitPrice, order.currency) }}
                  </TableCell>
                  <TableCell class="text-right">
                    <span :class="item.receivedQuantity >= item.quantity ? 'text-green-600' : 'text-amber-600'">
                      {{ item.receivedQuantity }}
                    </span>
                    / {{ item.quantity }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div class="flex justify-end">
            <p class="text-sm font-medium">
              Total: {{ formatAmount(order.totalAmount, order.currency) }}
            </p>
          </div>
        </div>

        <Separator />

        <div class="flex flex-col gap-1.5">
          <Label>Notes</Label>
          <Textarea v-model="notes" :disabled="order.status === 'received' || order.status === 'cancelled'" placeholder="Notes..." rows="3" />
        </div>
      </div>

      <SheetFooter v-if="order">
        <Button variant="outline" @click="isOpen = false">
          Close
        </Button>
        <Button v-if="order.status === 'draft'" variant="secondary" @click="handleSave">
          Save
        </Button>
        <Button v-if="order.status === 'draft'" @click="handleMarkSent">
          <Icon name="lucide:send" class="mr-2 h-4 w-4" />
          Mark as Sent
        </Button>
        <Button v-if="order.status === 'sent' || order.status === 'partially_received'" @click="handleCreateReceiving">
          <Icon name="lucide:package-check" class="mr-2 h-4 w-4" />
          Create Receiving
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
