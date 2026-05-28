<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { ListingInventoryEntry } from '@/components/inventory/data/listing-entries'
import { useInventoryCatalog } from '@/composables/useInventoryCatalog'
import { useInventoryListings } from '@/composables/useInventoryListings'
import { BALI_LISTINGS } from '@/components/upsells/data/upsell-services'

const props = defineProps<{
  open: boolean
  entry?: ListingInventoryEntry | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { items, getItemById } = useInventoryCatalog()
const { addEntry, updateEntry } = useInventoryListings()

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
})

const isEditing = computed(() => !!props.entry)

const selectedItemId = ref('')
const selectedListing = ref('')
const quantity = ref(1)
const condition = ref<ListingInventoryEntry['condition']>('good')
const stockLevel = ref<number | undefined>(undefined)
const notes = ref('')
const itemSearch = ref('')
const itemPickerOpen = ref(false)

const selectedItem = computed(() => {
  if (!selectedItemId.value) return null
  return getItemById(selectedItemId.value)
})

const isConsumable = computed(() => selectedItem.value?.type === 'consumable')

const filteredItems = computed(() => {
  if (!itemSearch.value) return items.value
  return items.value.filter(i =>
    i.name.toLowerCase().includes(itemSearch.value.toLowerCase()),
  )
})

function resetForm() {
  selectedItemId.value = ''
  selectedListing.value = ''
  quantity.value = 1
  condition.value = 'good'
  stockLevel.value = undefined
  notes.value = ''
  itemSearch.value = ''
  itemPickerOpen.value = false
}

function populateForm(entry: ListingInventoryEntry) {
  selectedItemId.value = entry.itemId
  selectedListing.value = entry.listingName
  quantity.value = entry.quantity
  condition.value = entry.condition
  stockLevel.value = entry.stockLevel
  notes.value = entry.notes ?? ''
}

watch(() => props.open, (val) => {
  if (val) {
    if (props.entry) populateForm(props.entry)
    else resetForm()
  }
})

function handleSave() {
  if (!selectedItemId.value || !selectedListing.value) return

  const payload: Omit<ListingInventoryEntry, 'id' | 'lastUpdated'> = {
    itemId: selectedItemId.value,
    listingName: selectedListing.value,
    quantity: quantity.value,
    condition: condition.value,
    stockLevel: isConsumable.value ? stockLevel.value : undefined,
    notes: notes.value.trim() || undefined,
  }

  if (isEditing.value && props.entry) {
    updateEntry(props.entry.id, payload)
    toast.success('Entry updated')
  }
  else {
    addEntry(payload)
    toast.success('Item added to listing')
  }
  isOpen.value = false
}
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="w-full sm:max-w-md overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{{ isEditing ? 'Edit Entry' : 'Add Item to Listing' }}</SheetTitle>
        <SheetDescription>
          {{ isEditing ? 'Update inventory entry for this listing.' : 'Assign a catalog item to a specific listing.' }}
        </SheetDescription>
      </SheetHeader>

      <div class="flex flex-col gap-4 px-4 py-4">
        <div class="flex flex-col gap-1.5">
          <Label>Item <span class="text-destructive">*</span></Label>
          <Popover v-model:open="itemPickerOpen">
            <PopoverTrigger as-child>
              <Button variant="outline" class="justify-between w-full font-normal">
                {{ selectedItem ? selectedItem.name : 'Select item from catalog...' }}
                <Icon name="lucide:chevrons-up-down" class="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-72 p-0">
              <Command>
                <CommandInput v-model="itemSearch" placeholder="Search items..." />
                <CommandList>
                  <CommandEmpty>No items found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      v-for="item in filteredItems"
                      :key="item.id"
                      :value="item.id"
                      @select="() => { selectedItemId = item.id; itemPickerOpen = false }"
                    >
                      <Icon
                        name="lucide:check"
                        class="mr-2 h-4 w-4"
                        :class="selectedItemId === item.id ? 'opacity-100' : 'opacity-0'"
                      />
                      <div class="flex flex-col">
                        <span class="text-sm">{{ item.name }}</span>
                        <span class="text-xs text-muted-foreground">{{ item.category }} · {{ item.unit }}</span>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label>Listing <span class="text-destructive">*</span></Label>
          <Select v-model="selectedListing">
            <SelectTrigger>
              <SelectValue placeholder="Select listing..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="listing in BALI_LISTINGS" :key="listing" :value="listing">
                {{ listing }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label>Quantity ({{ selectedItem?.unit || 'pcs' }})</Label>
          <Input v-model.number="quantity" type="number" min="1" />
        </div>

        <div v-if="!isConsumable" class="flex flex-col gap-1.5">
          <Label>Condition</Label>
          <RadioGroup v-model="condition" class="flex flex-wrap gap-3">
            <div v-for="cond in ['good', 'fair', 'damaged', 'missing']" :key="cond" class="flex items-center gap-2">
              <RadioGroupItem :id="`cond-${cond}`" :value="cond" />
              <Label :for="`cond-${cond}`" class="capitalize">{{ cond }}</Label>
            </div>
          </RadioGroup>
        </div>

        <div v-if="isConsumable" class="flex flex-col gap-1.5">
          <Label>Current Stock ({{ selectedItem?.unit || 'pcs' }})</Label>
          <Input v-model.number="stockLevel" type="number" min="0" placeholder="0" />
        </div>

        <div class="flex flex-col gap-1.5">
          <Label>Notes</Label>
          <Textarea v-model="notes" placeholder="Condition details, location in property, etc." rows="3" />
        </div>
      </div>

      <SheetFooter>
        <Button variant="outline" @click="isOpen = false">
          Cancel
        </Button>
        <Button :disabled="!selectedItemId || !selectedListing" @click="handleSave">
          {{ isEditing ? 'Save Changes' : 'Add Entry' }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
