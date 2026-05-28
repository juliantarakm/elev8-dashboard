<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { toast } from 'vue-sonner'
import { INVENTORY_CATEGORIES } from '@/components/inventory/data/catalog'
import type { InventoryDocument, InventoryItem, InventoryItemType } from '@/components/inventory/data/catalog'
import { useInventoryCatalog } from '@/composables/useInventoryCatalog'

const props = defineProps<{
  open: boolean
  item?: InventoryItem | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { addItem, updateItem } = useInventoryCatalog()

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
})

const isEditing = computed(() => !!props.item)

const name = ref('')
const category = ref<InventoryItem['category']>('Furniture')
const type = ref<InventoryItemType>('permanent')
const unit = ref('')
const photo = ref<string | undefined>(undefined)
const purchaseValue = ref<number | undefined>(undefined)
const purchaseDate = ref<string | undefined>(undefined)
const warrantyExpiry = ref<string | undefined>(undefined)
const supplierName = ref('')
const supplierContact = ref('')
const notes = ref('')
const documents = ref<InventoryDocument[]>([])

function resetForm() {
  name.value = ''
  category.value = 'Furniture'
  type.value = 'permanent'
  unit.value = ''
  photo.value = undefined
  purchaseValue.value = undefined
  purchaseDate.value = undefined
  warrantyExpiry.value = undefined
  supplierName.value = ''
  supplierContact.value = ''
  notes.value = ''
  documents.value = []
}

function populateForm(item: InventoryItem) {
  name.value = item.name
  category.value = item.category
  type.value = item.type
  unit.value = item.unit
  photo.value = item.photo
  purchaseValue.value = item.purchaseValue
  purchaseDate.value = item.purchaseDate
  warrantyExpiry.value = item.warrantyExpiry
  supplierName.value = item.supplier?.name ?? ''
  supplierContact.value = item.supplier?.contact ?? ''
  notes.value = item.notes ?? ''
  documents.value = item.documents ? [...item.documents] : []
}

watch(() => props.open, (val) => {
  if (val) {
    if (props.item) populateForm(props.item)
    else resetForm()
  }
})

function handlePhotoUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (evt) => {
    photo.value = evt.target?.result as string
  }
  reader.readAsDataURL(file)
}

function handleDocumentUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (evt) => {
    documents.value = [
      ...documents.value,
      {
        name: file.name,
        url: evt.target?.result as string,
        type: 'other',
      },
    ]
  }
  reader.readAsDataURL(file)
}

function updateDocType(index: number, docType: InventoryDocument['type']) {
  documents.value = documents.value.map((d, i) => i === index ? { ...d, type: docType } : d)
}

function removeDocument(index: number) {
  documents.value = documents.value.filter((_, i) => i !== index)
}

function handleSave() {
  if (!name.value.trim()) return

  const payload: Omit<InventoryItem, 'id'> = {
    name: name.value.trim(),
    category: category.value,
    type: type.value,
    unit: unit.value.trim(),
    photo: photo.value,
    purchaseValue: purchaseValue.value,
    purchaseDate: purchaseDate.value,
    warrantyExpiry: warrantyExpiry.value,
    documents: documents.value.length > 0 ? documents.value : undefined,
    supplier: supplierName.value.trim()
      ? { name: supplierName.value.trim(), contact: supplierContact.value.trim() }
      : undefined,
    notes: notes.value.trim() || undefined,
  }

  if (isEditing.value && props.item) {
    updateItem(props.item.id, payload)
    toast.success('Item updated')
  }
  else {
    addItem(payload)
    toast.success('Item added to catalog')
  }
  isOpen.value = false
}
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{{ isEditing ? 'Edit Item' : 'Add Item' }}</SheetTitle>
        <SheetDescription>
          {{ isEditing ? 'Update item details in the catalog.' : 'Add a new item to the master catalog.' }}
        </SheetDescription>
      </SheetHeader>

      <div class="flex flex-col gap-4 py-4">
        <div class="flex flex-col gap-1.5">
          <Label for="item-name">Item Name <span class="text-destructive">*</span></Label>
          <Input id="item-name" v-model="name" placeholder="e.g. King Bed, Shampoo" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select v-model="category">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="cat in INVENTORY_CATEGORIES" :key="cat" :value="cat">
                  {{ cat }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Unit</Label>
            <Input v-model="unit" placeholder="pcs / bottle / set" />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label>Type</Label>
          <RadioGroup v-model="type" class="flex gap-4">
            <div class="flex items-center gap-2">
              <RadioGroupItem id="type-permanent" value="permanent" />
              <Label for="type-permanent">Permanent</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem id="type-consumable" value="consumable" />
              <Label for="type-consumable">Consumable</Label>
            </div>
          </RadioGroup>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label>Photo</Label>
          <div v-if="photo" class="relative w-24 h-24 rounded-md overflow-hidden border">
            <img :src="photo" alt="item photo" class="w-full h-full object-cover" />
            <button
              class="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"
              @click="photo = undefined"
            >
              <Icon name="lucide:x" class="h-3 w-3" />
            </button>
          </div>
          <label v-else class="flex items-center gap-2 cursor-pointer w-fit">
            <Button variant="outline" size="sm" as="span">
              <Icon name="lucide:upload" class="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
            <input type="file" accept="image/*" class="hidden" @change="handlePhotoUpload" />
          </label>
        </div>

        <Separator />

        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium">Purchase Information</p>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <Label>Purchase Value (IDR)</Label>
              <Input
                v-model.number="purchaseValue"
                type="number"
                placeholder="0"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>Purchase Date</Label>
              <Input v-model="purchaseDate" type="date" />
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Warranty Expiry</Label>
            <Input v-model="warrantyExpiry" type="date" />
          </div>
        </div>

        <Separator />

        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium">Supplier / Vendor</p>
          <div class="flex flex-col gap-1.5">
            <Label>Supplier Name</Label>
            <Input v-model="supplierName" placeholder="e.g. Ace Hardware Bali" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Contact</Label>
            <Input v-model="supplierContact" placeholder="Phone number or email" />
          </div>
        </div>

        <Separator />

        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium">Documents</p>
          <div v-if="documents.length > 0" class="flex flex-col gap-2">
            <div
              v-for="(doc, i) in documents"
              :key="i"
              class="flex items-center gap-2 p-2 rounded-md border bg-muted/30"
            >
              <Icon name="lucide:file" class="h-4 w-4 text-muted-foreground shrink-0" />
              <span class="text-sm truncate flex-1">{{ doc.name }}</span>
              <Select :model-value="doc.type" @update:model-value="(val) => updateDocType(i, val as InventoryDocument['type'])">
                <SelectTrigger class="w-28 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warranty">Warranty</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" class="h-7 w-7" @click="removeDocument(i)">
                <Icon name="lucide:x" class="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <label class="flex items-center gap-2 cursor-pointer w-fit">
            <Button variant="outline" size="sm" as="span">
              <Icon name="lucide:paperclip" class="mr-2 h-4 w-4" />
              Upload Document
            </Button>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="hidden" @change="handleDocumentUpload" />
          </label>
          <p class="text-xs text-muted-foreground">PDF, JPG, PNG. Multiple files supported.</p>
        </div>

        <Separator />

        <div class="flex flex-col gap-1.5">
          <Label>Notes</Label>
          <Textarea v-model="notes" placeholder="Additional notes about this item..." rows="3" />
        </div>
      </div>

      <SheetFooter>
        <Button variant="outline" @click="isOpen = false">
          Cancel
        </Button>
        <Button :disabled="!name.trim()" @click="handleSave">
          {{ isEditing ? 'Save Changes' : 'Add Item' }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
