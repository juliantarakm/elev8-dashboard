<script setup lang="ts">
import type { PurchaseRequest, PurchaseRequestItem } from '@/components/procurement/data/purchase-requests'
import type { InventoryItem } from '@/components/inventory/data/catalog'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { CURRENCY_OPTIONS } from '@/components/procurement/data/purchase-requests'
import { usePurchaseRequests } from '@/composables/usePurchaseRequests'
import { useInventoryCatalog } from '@/composables/useInventoryCatalog'

const props = defineProps<{
  open: boolean
  request?: PurchaseRequest | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { addRequest, updateRequest, submitForApproval } = usePurchaseRequests()
const { items: catalogItems } = useInventoryCatalog()

const isOpen = computed({
  get: () => props.open,
  set: val => emit('update:open', val),
})

const isEditing = computed(() => !!props.request)

// Form state
const title = ref('')
const currency = ref('IDR')
const notes = ref('')
const lineItems = ref<(PurchaseRequestItem & { itemName?: string })[]>([])

// Item picker
const itemPickerOpen = ref(false)
const itemSearchValue = ref('')

const filteredCatalogItems = computed(() => {
  if (!itemSearchValue.value)
    return catalogItems.value
  const q = itemSearchValue.value.toLowerCase()
  return catalogItems.value.filter(i => i.name.toLowerCase().includes(q))
})

function resetForm() {
  title.value = ''
  currency.value = 'IDR'
  notes.value = ''
  lineItems.value = []
}

function populateForm(req: PurchaseRequest) {
  title.value = req.title
  currency.value = req.currency
  notes.value = req.notes ?? ''
  lineItems.value = req.items.map(i => ({
    ...i,
    itemName: catalogItems.value.find(c => c.id === i.itemId)?.name ?? i.itemId,
  }))
}

watch(() => props.open, (val) => {
  if (val) {
    if (props.request)
      populateForm(props.request)
    else resetForm()
  }
})

function addItemToLine(item: InventoryItem) {
  const existing = lineItems.value.find(l => l.itemId === item.id)
  if (existing) {
    existing.quantity += 1
    lineItems.value = [...lineItems.value]
  }
  else {
    lineItems.value = [
      ...lineItems.value,
      {
        id: `pri-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        itemId: item.id,
        quantity: 1,
        estimatedPrice: item.purchaseValue,
        itemName: item.name,
      },
    ]
  }
  itemPickerOpen.value = false
  itemSearchValue.value = ''
}

function removeLineItem(index: number) {
  lineItems.value = lineItems.value.filter((_, i) => i !== index)
}

function updateLineQuantity(index: number, qty: number) {
  lineItems.value = lineItems.value.map((l, i) => i === index ? { ...l, quantity: Math.max(1, qty) } : l)
}

function updateLinePrice(index: number, price: number | undefined) {
  lineItems.value = lineItems.value.map((l, i) => i === index ? { ...l, estimatedPrice: price } : l)
}

function handleSave(asDraft: boolean) {
  if (!title.value.trim() || lineItems.value.length === 0)
    return

  const payload = {
    title: title.value.trim(),
    status: 'draft' as const,
    requestedBy: 'staff-2',
    items: lineItems.value.map(l => ({
      id: l.id,
      itemId: l.itemId,
      quantity: l.quantity,
      estimatedPrice: l.estimatedPrice,
      notes: l.notes,
    })),
    currency: currency.value,
    notes: notes.value.trim() || undefined,
  }

  if (isEditing.value && props.request) {
    updateRequest(props.request.id, payload)
    if (!asDraft) {
      submitForApproval(props.request.id)
      toast.success('Submitted for approval')
    }
    else {
      toast.success('PR updated')
    }
  }
  else {
    addRequest(payload)
    if (!asDraft) {
      const { requests } = usePurchaseRequests()
      const latest = requests.value[requests.value.length - 1]
      if (latest)
        submitForApproval(latest.id)
      toast.success('PR submitted for approval')
    }
    else {
      toast.success('PR saved as draft')
    }
  }
  isOpen.value = false
}

function formatAmount(amount: number) {
  if (currency.value === 'IDR')
    return `IDR ${amount.toLocaleString('id-ID')}`
  return `${currency.value} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

const lineTotal = computed(() =>
  lineItems.value.reduce((s, l) => s + (l.estimatedPrice ?? 0) * l.quantity, 0))
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{{ isEditing ? 'Edit Purchase Request' : 'New Purchase Request' }}</SheetTitle>
        <SheetDescription>
          {{ isEditing ? 'Update purchase request details.' : 'Create a new purchase request for inventory items.' }}
        </SheetDescription>
      </SheetHeader>

      <div class="flex flex-col gap-4 px-4 py-4">
        <div class="flex flex-col gap-1.5">
          <Label for="pr-title">Title <span class="text-destructive">*</span></Label>
          <Input id="pr-title" v-model="title" placeholder="e.g. Restock consumables - Villa Merapi" />
        </div>

        <div class="flex flex-col gap-1.5">
          <Label>Currency</Label>
          <Select v-model="currency">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="c in CURRENCY_OPTIONS" :key="c" :value="c">
                {{ c }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <!-- Line Items -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium">
              Items <span class="text-destructive">*</span>
            </p>
            <Popover v-model:open="itemPickerOpen">
              <PopoverTrigger as-child>
                <Button variant="outline" size="sm" class="h-7 text-xs">
                  <Icon name="lucide:plus" class="mr-1 h-3 w-3" />
                  Add Item
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-80 p-0" align="end">
                <Command>
                  <CommandInput v-model="itemSearchValue" placeholder="Search catalog items..." />
                  <CommandEmpty>No items found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      v-for="item in filteredCatalogItems"
                      :key="item.id"
                      :value="item.id"
                      @select="addItemToLine(item)"
                    >
                      <Icon name="lucide:package" class="mr-2 h-4 w-4 text-muted-foreground" />
                      <div class="flex-1">
                        <p class="text-sm">
                          {{ item.name }}
                        </p>
                        <p class="text-xs text-muted-foreground">
                          {{ item.category }} · {{ item.unit }}
                        </p>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div v-if="lineItems.length === 0" class="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No items added yet. Click "Add Item" to select from the catalog.
          </div>

          <div v-for="(line, idx) in lineItems" :key="line.id" class="rounded-md border p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium">
                  {{ line.itemName ?? line.itemId }}
                </p>
              </div>
              <Button variant="ghost" size="icon" class="h-6 w-6 shrink-0" @click="removeLineItem(idx)">
                <Icon name="lucide:x" class="h-3.5 w-3.5" />
              </Button>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-2">
              <div class="flex flex-col gap-1">
                <Label class="text-xs">Quantity</Label>
                <Input
                  :model-value="line.quantity"
                  type="number"
                  min="1"
                  class="h-8 text-sm"
                  @update:model-value="(v: string) => updateLineQuantity(idx, Number(v))"
                />
              </div>
              <div class="flex flex-col gap-1">
                <Label class="text-xs">Est. Unit Price</Label>
                <Input
                  :model-value="line.estimatedPrice"
                  type="number"
                  min="0"
                  class="h-8 text-sm"
                  placeholder="0"
                  @update:model-value="(v: string) => updateLinePrice(idx, v ? Number(v) : undefined)"
                />
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-2 text-right">
              Subtotal: {{ formatAmount((line.estimatedPrice ?? 0) * line.quantity) }}
            </p>
          </div>

          <div v-if="lineItems.length > 0" class="flex justify-end">
            <p class="text-sm font-medium">
              Total Est: {{ formatAmount(lineTotal) }}
            </p>
          </div>
        </div>

        <Separator />

        <div class="flex flex-col gap-1.5">
          <Label>Notes</Label>
          <Textarea v-model="notes" placeholder="Additional notes..." rows="3" />
        </div>
      </div>

      <SheetFooter>
        <Button variant="outline" @click="isOpen = false">
          Cancel
        </Button>
        <Button
          variant="secondary"
          :disabled="!title.trim() || lineItems.length === 0"
          @click="handleSave(true)"
        >
          Save Draft
        </Button>
        <Button :disabled="!title.trim() || lineItems.length === 0" @click="handleSave(false)">
          <Icon name="lucide:send" class="mr-2 h-4 w-4" />
          Submit
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
