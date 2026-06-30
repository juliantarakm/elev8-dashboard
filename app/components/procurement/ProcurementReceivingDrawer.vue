<script setup lang="ts">
import type { Receiving } from '@/components/procurement/data/receivings'
import type { ItemCondition } from '@/components/inventory/data/listing-entries'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { staffMembers } from '@/components/inbox/data/conversations'
import { useReceivings } from '@/composables/useReceivings'
import { usePurchaseOrders } from '@/composables/usePurchaseOrders'
import { useInventoryCatalog } from '@/composables/useInventoryCatalog'

const props = defineProps<{
  open: boolean
  receiving?: Receiving | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { updateReceiving, completeReceiving } = useReceivings()
const { getOrderById } = usePurchaseOrders()
const { getItemById } = useInventoryCatalog()

const isOpen = computed({
  get: () => props.open,
  set: val => emit('update:open', val),
})

// Editable item quantities and conditions
const editItems = ref<{ quantityReceived: number, condition: ItemCondition, notes?: string }[]>([])

function populateForm(rcv: Receiving) {
  editItems.value = rcv.items.map(i => ({
    quantityReceived: i.quantityReceived,
    condition: i.condition,
    notes: i.notes,
  }))
}

watch(() => props.open, (val) => {
  if (val && props.receiving)
    populateForm(props.receiving)
})

function getItemName(itemId: string): string {
  return getItemById(itemId)?.name ?? itemId
}

function getPo() {
  if (!props.receiving)
    return null
  return getOrderById(props.receiving.purchaseOrderId)
}

function getPoItemOrderedQty(poItemId: string): number {
  const po = getPo()
  if (!po)
    return 0
  return po.items.find(i => i.id === poItemId)?.quantity ?? 0
}

function getStaffName(staffId: string): string {
  return staffMembers.find(s => s.id === staffId)?.name ?? staffId
}

function formatDate(d?: string) {
  if (!d)
    return '-'
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

const CONDITIONS: { value: ItemCondition, label: string }[] = [
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'missing', label: 'Missing' },
]

function handleSave() {
  if (!props.receiving)
    return
  updateReceiving(props.receiving.id, {
    items: props.receiving.items.map((item, idx) => ({
      ...item,
      quantityReceived: editItems.value[idx]?.quantityReceived ?? item.quantityReceived,
      condition: editItems.value[idx]?.condition ?? item.condition,
      notes: editItems.value[idx]?.notes ?? item.notes,
    })),
  })
  toast.success('Receiving updated')
  isOpen.value = false
}

function handleComplete() {
  if (!props.receiving)
    return
  // Save edits first
  updateReceiving(props.receiving.id, {
    items: props.receiving.items.map((item, idx) => ({
      ...item,
      quantityReceived: editItems.value[idx]?.quantityReceived ?? item.quantityReceived,
      condition: editItems.value[idx]?.condition ?? item.condition,
      notes: editItems.value[idx]?.notes ?? item.notes,
    })),
  })
  completeReceiving(props.receiving.id)
  isOpen.value = false
}
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{{ receiving?.receivingNumber ?? 'Receiving' }}</SheetTitle>
        <SheetDescription>
          Receiving details and item inspection.
        </SheetDescription>
      </SheetHeader>

      <div v-if="receiving" class="flex flex-col gap-4 px-4 py-4">
        <!-- PO Info -->
        <div class="rounded-md bg-muted/50 border p-3">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <p class="text-xs text-muted-foreground">
                Purchase Order
              </p>
              <p class="text-sm font-medium">
                {{ getPo()?.poNumber ?? receiving.purchaseOrderId }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">
                Supplier
              </p>
              <p class="text-sm font-medium">
                {{ getPo()?.supplier.name ?? '-' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">
                Received By
              </p>
              <p class="text-sm font-medium">
                {{ getStaffName(receiving.receivedBy) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">
                Date
              </p>
              <p class="text-sm font-medium">
                {{ formatDate(receiving.receivedAt) }}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Items -->
        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium">
            Items
          </p>
          <div
            v-for="(item, idx) in receiving.items"
            :key="item.id"
            class="rounded-md border p-3"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium">
                  {{ getItemName(item.itemId) }}
                </p>
                <p class="text-xs text-muted-foreground">
                  Ordered: {{ getPoItemOrderedQty(item.purchaseOrderItemId) }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-2">
              <div class="flex flex-col gap-1">
                <Label class="text-xs">Received Qty</Label>
                <Input
                  v-model.number="editItems[idx].quantityReceived"
                  type="number"
                  min="0"
                  class="h-8 text-sm"
                  :disabled="receiving.status === 'completed'"
                />
              </div>
              <div class="flex flex-col gap-1">
                <Label class="text-xs">Condition</Label>
                <Select v-model="editItems[idx].condition" :disabled="receiving.status === 'completed'">
                  <SelectTrigger class="h-8 text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="c in CONDITIONS" :key="c.value" :value="c.value">
                      {{ c.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div class="flex flex-col gap-1.5">
          <Label>Notes</Label>
          <Textarea :model-value="receiving.notes ?? ''" disabled placeholder="Notes..." rows="2" />
        </div>
      </div>

      <SheetFooter v-if="receiving">
        <Button variant="outline" @click="isOpen = false">
          Close
        </Button>
        <Button v-if="receiving.status === 'draft'" variant="secondary" @click="handleSave">
          Save
        </Button>
        <Button v-if="receiving.status === 'draft'" @click="handleComplete">
          <Icon name="lucide:check" class="mr-2 h-4 w-4" />
          Complete Receiving
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
