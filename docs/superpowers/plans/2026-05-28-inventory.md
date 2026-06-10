# Inventory Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Inventory module — a first-class sidebar module for tracking property assets (permanent + consumable) per listing, with master catalog CRUD, per-listing entries, warranty tracking, supplier info, and document uploads.

**Architecture:** Two composables (`useInventoryCatalog`, `useInventoryListings`) backed by mock data files, five Vue components (2 tab views, 2 Sheet drawers, 1 filter bar), one page at `/inventory`, and a sidebar entry. Follows the exact same patterns as the Upsells module: `useState` with spread mutations, Sheet drawers, FileReader→base64 uploads.

**Tech Stack:** Nuxt 3, Vue 3, shadcn-vue (Sheet, Select, RadioGroup, Badge, Table, Tabs, NumberField, Textarea, Combobox), lucide-vue-next icons, Tailwind CSS v4

---

## Task 1: Data Types + Mock Catalog Data

**Files:**
- Create: `app/components/inventory/data/catalog.ts`

- [ ] **Step 1: Create the file with types and mock data**

```ts
// app/components/inventory/data/catalog.ts

export type InventoryCategory
  = | 'Furniture'
    | 'Electronics'
    | 'Linen'
    | 'Kitchen'
    | 'Consumable'
    | 'Other'

export type InventoryItemType = 'permanent' | 'consumable'

export interface InventoryDocument {
  name: string
  url: string
  type: 'warranty' | 'receipt' | 'invoice' | 'other'
}

export interface InventorySupplier {
  name: string
  contact: string
}

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  type: InventoryItemType
  unit: string
  photo?: string
  purchaseValue?: number
  purchaseDate?: string
  warrantyExpiry?: string
  documents?: InventoryDocument[]
  supplier?: InventorySupplier
  notes?: string
}

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  'Furniture',
  'Electronics',
  'Linen',
  'Kitchen',
  'Consumable',
  'Other',
]

export const mockInventoryItems: InventoryItem[] = [
  {
    id: 'inv-001',
    name: 'Kasur King',
    category: 'Furniture',
    type: 'permanent',
    unit: 'pcs',
    purchaseValue: 8500000,
    purchaseDate: '2024-01-15',
    warrantyExpiry: '2027-01-15',
    supplier: { name: 'Ace Hardware Bali', contact: '+62 361 123456' },
    notes: 'King size, 180x200cm, memory foam',
  },
  {
    id: 'inv-002',
    name: 'Smart TV 55"',
    category: 'Electronics',
    type: 'permanent',
    unit: 'pcs',
    purchaseValue: 7200000,
    purchaseDate: '2024-03-10',
    warrantyExpiry: '2026-06-10',
    supplier: { name: 'Samsung Store Denpasar', contact: '+62 361 789012' },
    notes: 'Samsung 4K, HDMI + Netflix built-in',
  },
  {
    id: 'inv-003',
    name: 'Set Linen',
    category: 'Linen',
    type: 'permanent',
    unit: 'set',
    purchaseValue: 450000,
    purchaseDate: '2024-06-01',
    notes: 'Includes 2 pillowcases + 1 duvet cover',
  },
  {
    id: 'inv-004',
    name: 'Coffee Maker',
    category: 'Kitchen',
    type: 'permanent',
    unit: 'pcs',
    purchaseValue: 1200000,
    purchaseDate: '2024-02-20',
    warrantyExpiry: '2026-02-20',
    supplier: { name: 'Philips Store Bali', contact: '+62 361 345678' },
  },
  {
    id: 'inv-005',
    name: 'Sabun Mandi',
    category: 'Consumable',
    type: 'consumable',
    unit: 'botol',
    purchaseValue: 15000,
    supplier: { name: 'Tokopedia Supplier', contact: 'tokopedia.com/supplier' },
  },
  {
    id: 'inv-006',
    name: 'Shampoo',
    category: 'Consumable',
    type: 'consumable',
    unit: 'botol',
    purchaseValue: 18000,
  },
  {
    id: 'inv-007',
    name: 'Tisu Gulung',
    category: 'Consumable',
    type: 'consumable',
    unit: 'rol',
    purchaseValue: 8000,
  },
  {
    id: 'inv-008',
    name: 'Kopi Sachet',
    category: 'Consumable',
    type: 'consumable',
    unit: 'sachet',
    purchaseValue: 3500,
    supplier: { name: 'Kopi Kapal Api', contact: '+62 21 999888' },
  },
  {
    id: 'inv-009',
    name: 'Rice Cooker',
    category: 'Kitchen',
    type: 'permanent',
    unit: 'pcs',
    purchaseValue: 650000,
    purchaseDate: '2024-04-05',
    warrantyExpiry: '2026-04-05',
  },
  {
    id: 'inv-010',
    name: 'AC Split 1 PK',
    category: 'Electronics',
    type: 'permanent',
    unit: 'unit',
    purchaseValue: 4500000,
    purchaseDate: '2023-11-01',
    warrantyExpiry: '2025-11-01',
    supplier: { name: 'Daikin Authorized Bali', contact: '+62 361 556677' },
    notes: 'Daikin 1PK Inverter. Annual servicing required.',
  },
  {
    id: 'inv-011',
    name: 'Bantal Tidur',
    category: 'Linen',
    type: 'permanent',
    unit: 'pcs',
    purchaseValue: 120000,
    purchaseDate: '2024-06-01',
  },
  {
    id: 'inv-012',
    name: 'Handuk Mandi',
    category: 'Linen',
    type: 'permanent',
    unit: 'pcs',
    purchaseValue: 85000,
    purchaseDate: '2024-06-01',
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add app/components/inventory/data/catalog.ts
git commit -m "feat(inventory): add InventoryItem types and mock catalog data"
```

---

## Task 2: Listing Entries Data + Types

**Files:**
- Create: `app/components/inventory/data/listing-entries.ts`

- [ ] **Step 1: Create the file**

```ts
// app/components/inventory/data/listing-entries.ts

export type ItemCondition = 'good' | 'fair' | 'damaged' | 'missing'

export interface ListingInventoryEntry {
  id: string
  itemId: string
  listingName: string
  quantity: number
  condition: ItemCondition
  stockLevel?: number
  notes?: string
  lastUpdated: string
}

export const mockListingEntries: ListingInventoryEntry[] = [
  {
    id: 'entry-001',
    itemId: 'inv-001',
    listingName: 'The R Villa Merapi',
    quantity: 3,
    condition: 'good',
    lastUpdated: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'entry-002',
    itemId: 'inv-002',
    listingName: 'The R Villa Merapi',
    quantity: 2,
    condition: 'good',
    lastUpdated: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'entry-003',
    itemId: 'inv-003',
    listingName: 'The R Villa Merapi',
    quantity: 6,
    condition: 'fair',
    notes: '2 set perlu diganti bulan depan',
    lastUpdated: '2026-05-18T10:30:00.000Z',
  },
  {
    id: 'entry-004',
    itemId: 'inv-010',
    listingName: 'The R Villa Merapi',
    quantity: 4,
    condition: 'good',
    lastUpdated: '2026-05-15T09:00:00.000Z',
  },
  {
    id: 'entry-005',
    itemId: 'inv-005',
    listingName: 'The R Villa Merapi',
    quantity: 12,
    condition: 'good',
    stockLevel: 8,
    lastUpdated: '2026-05-22T07:45:00.000Z',
  },
  {
    id: 'entry-006',
    itemId: 'inv-006',
    listingName: 'The R Villa Merapi',
    quantity: 12,
    condition: 'good',
    stockLevel: 5,
    lastUpdated: '2026-05-22T07:45:00.000Z',
  },
  {
    id: 'entry-007',
    itemId: 'inv-007',
    listingName: 'The R Villa Merapi',
    quantity: 24,
    condition: 'good',
    stockLevel: 10,
    lastUpdated: '2026-05-22T07:45:00.000Z',
  },
  {
    id: 'entry-008',
    itemId: 'inv-001',
    listingName: 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu',
    quantity: 3,
    condition: 'good',
    lastUpdated: '2026-05-19T11:00:00.000Z',
  },
  {
    id: 'entry-009',
    itemId: 'inv-004',
    listingName: 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu',
    quantity: 1,
    condition: 'damaged',
    notes: 'Karafe retak, perlu penggantian',
    lastUpdated: '2026-05-21T14:20:00.000Z',
  },
  {
    id: 'entry-010',
    itemId: 'inv-009',
    listingName: 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu',
    quantity: 1,
    condition: 'good',
    lastUpdated: '2026-05-10T09:00:00.000Z',
  },
  {
    id: 'entry-011',
    itemId: 'inv-008',
    listingName: 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu',
    quantity: 30,
    condition: 'good',
    stockLevel: 12,
    lastUpdated: '2026-05-22T08:00:00.000Z',
  },
  {
    id: 'entry-012',
    itemId: 'inv-011',
    listingName: 'TAMBORA - The R Tambora: Stylish 3BR Tropical Escape',
    quantity: 6,
    condition: 'good',
    lastUpdated: '2026-05-17T10:00:00.000Z',
  },
  {
    id: 'entry-013',
    itemId: 'inv-012',
    listingName: 'TAMBORA - The R Tambora: Stylish 3BR Tropical Escape',
    quantity: 8,
    condition: 'fair',
    notes: '3 handuk mulai lusuh',
    lastUpdated: '2026-05-17T10:00:00.000Z',
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add app/components/inventory/data/listing-entries.ts
git commit -m "feat(inventory): add ListingInventoryEntry types and mock data"
```

---

## Task 3: useInventoryCatalog Composable

**Files:**
- Create: `app/composables/useInventoryCatalog.ts`

- [ ] **Step 1: Create the composable**

```ts
import type { InventoryCategory, InventoryItem, InventoryItemType } from '@/components/inventory/data/catalog'
// app/composables/useInventoryCatalog.ts
import { computed, ref } from 'vue'
import { mockInventoryItems } from '@/components/inventory/data/catalog'

export function useInventoryCatalog() {
  const items = useState<InventoryItem[]>('inventory-catalog', () =>
    mockInventoryItems.map(i => ({ ...i })),)

  const searchValue = ref('')
  const activeCategoryFilter = ref<InventoryCategory | 'all'>('all')
  const activeTypeFilter = ref<InventoryItemType | 'all'>('all')

  const filteredItems = computed(() => {
    return items.value.filter((item) => {
      if (activeCategoryFilter.value !== 'all' && item.category !== activeCategoryFilter.value)
        return false
      if (activeTypeFilter.value !== 'all' && item.type !== activeTypeFilter.value)
        return false
      if (searchValue.value && !item.name.toLowerCase().includes(searchValue.value.toLowerCase()))
        return false
      return true
    })
  })

  function addItem(data: Omit<InventoryItem, 'id'>) {
    const id = `inv-${String(items.value.length + 1).padStart(3, '0')}`
    items.value = [...items.value, { ...data, id }]
  }

  function updateItem(id: string, updates: Partial<InventoryItem>) {
    items.value = items.value.map(i => i.id === id ? { ...i, ...updates } : i)
  }

  function deleteItem(id: string) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function getItemById(id: string): InventoryItem | undefined {
    return items.value.find(i => i.id === id)
  }

  function clearFilters() {
    searchValue.value = ''
    activeCategoryFilter.value = 'all'
    activeTypeFilter.value = 'all'
  }

  return {
    items,
    filteredItems,
    searchValue,
    activeCategoryFilter,
    activeTypeFilter,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    clearFilters,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/useInventoryCatalog.ts
git commit -m "feat(inventory): add useInventoryCatalog composable"
```

---

## Task 4: useInventoryListings Composable

**Files:**
- Create: `app/composables/useInventoryListings.ts`

- [ ] **Step 1: Create the composable**

```ts
import type { ItemCondition, ListingInventoryEntry } from '@/components/inventory/data/listing-entries'
// app/composables/useInventoryListings.ts
import { computed, ref } from 'vue'
import { mockListingEntries } from '@/components/inventory/data/listing-entries'

export function useInventoryListings() {
  const entries = useState<ListingInventoryEntry[]>('inventory-listings', () =>
    mockListingEntries.map(e => ({ ...e })),)

  const filterListing = ref<string>('all')
  const filterCategory = ref<string>('all')
  const filterCondition = ref<ItemCondition | 'all'>('all')

  const filteredEntries = computed(() => {
    return entries.value.filter((entry) => {
      if (filterListing.value !== 'all' && entry.listingName !== filterListing.value)
        return false
      if (filterCondition.value !== 'all' && entry.condition !== filterCondition.value)
        return false
      return true
    })
  })

  function addEntry(data: Omit<ListingInventoryEntry, 'id' | 'lastUpdated'>) {
    const id = `entry-${String(entries.value.length + 1).padStart(3, '0')}`
    entries.value = [...entries.value, { ...data, id, lastUpdated: new Date().toISOString() }]
  }

  function updateEntry(id: string, updates: Partial<ListingInventoryEntry>) {
    entries.value = entries.value.map(e =>
      e.id === id ? { ...e, ...updates, lastUpdated: new Date().toISOString() } : e,
    )
  }

  function deleteEntry(id: string) {
    entries.value = entries.value.filter(e => e.id !== id)
  }

  function clearFilters() {
    filterListing.value = 'all'
    filterCategory.value = 'all'
    filterCondition.value = 'all'
  }

  return {
    entries,
    filteredEntries,
    filterListing,
    filterCategory,
    filterCondition,
    addEntry,
    updateEntry,
    deleteEntry,
    clearFilters,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/useInventoryListings.ts
git commit -m "feat(inventory): add useInventoryListings composable"
```

---

## Task 5: InventoryItemDrawer Component

**Files:**
- Create: `app/components/inventory/InventoryItemDrawer.vue`

- [ ] **Step 1: Create the drawer component**

```vue
<!-- app/components/inventory/InventoryItemDrawer.vue -->
<script setup lang="ts">
import type { InventoryDocument, InventoryItem, InventoryItemType } from '@/components/inventory/data/catalog'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { INVENTORY_CATEGORIES } from '@/components/inventory/data/catalog'
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
  set: val => emit('update:open', val),
})

const isEditing = computed(() => !!props.item)

// Form state
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
    if (props.item)
      populateForm(props.item)
    else resetForm()
  }
})

// Photo upload
function handlePhotoUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file)
    return
  const reader = new FileReader()
  reader.onload = (evt) => {
    photo.value = evt.target?.result as string
  }
  reader.readAsDataURL(file)
}

// Document upload
function handleDocumentUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file)
    return
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
  if (!name.value.trim())
    return

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
        <!-- Name -->
        <div class="flex flex-col gap-1.5">
          <Label for="item-name">Nama Item <span class="text-destructive">*</span></Label>
          <Input id="item-name" v-model="name" placeholder="Cth: Kasur King, Sabun Mandi" />
        </div>

        <!-- Category + Type -->
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <Label>Kategori</Label>
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
            <Input v-model="unit" placeholder="pcs / botol / set" />
          </div>
        </div>

        <!-- Type -->
        <div class="flex flex-col gap-1.5">
          <Label>Tipe</Label>
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

        <!-- Photo -->
        <div class="flex flex-col gap-1.5">
          <Label>Foto</Label>
          <div v-if="photo" class="relative w-24 h-24 rounded-md overflow-hidden border">
            <img :src="photo" alt="item photo" class="w-full h-full object-cover">
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
              Upload Foto
            </Button>
            <input type="file" accept="image/*" class="hidden" @change="handlePhotoUpload">
          </label>
        </div>

        <Separator />

        <!-- Purchase Info -->
        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium">
            Informasi Pembelian
          </p>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <Label>Harga Beli (IDR)</Label>
              <Input
                v-model.number="purchaseValue"
                type="number"
                placeholder="0"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>Tanggal Beli</Label>
              <Input v-model="purchaseDate" type="date" />
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Expired Garansi</Label>
            <Input v-model="warrantyExpiry" type="date" />
          </div>
        </div>

        <Separator />

        <!-- Supplier -->
        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium">
            Supplier / Vendor
          </p>
          <div class="flex flex-col gap-1.5">
            <Label>Nama Supplier</Label>
            <Input v-model="supplierName" placeholder="Cth: Ace Hardware Bali" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Kontak</Label>
            <Input v-model="supplierContact" placeholder="Nomor HP atau email" />
          </div>
        </div>

        <Separator />

        <!-- Documents -->
        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium">
            Dokumen
          </p>
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
                  <SelectItem value="warranty">
                    Garansi
                  </SelectItem>
                  <SelectItem value="receipt">
                    Struk
                  </SelectItem>
                  <SelectItem value="invoice">
                    Invoice
                  </SelectItem>
                  <SelectItem value="other">
                    Lainnya
                  </SelectItem>
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
              Upload Dokumen
            </Button>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="hidden" @change="handleDocumentUpload">
          </label>
          <p class="text-xs text-muted-foreground">
            PDF, JPG, PNG. Bisa upload lebih dari satu.
          </p>
        </div>

        <Separator />

        <!-- Notes -->
        <div class="flex flex-col gap-1.5">
          <Label>Catatan</Label>
          <Textarea v-model="notes" placeholder="Informasi tambahan tentang item ini..." rows="3" />
        </div>
      </div>

      <SheetFooter>
        <Button variant="outline" @click="isOpen = false">
          Batal
        </Button>
        <Button :disabled="!name.trim()" @click="handleSave">
          {{ isEditing ? 'Simpan Perubahan' : 'Tambah Item' }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/inventory/InventoryItemDrawer.vue
git commit -m "feat(inventory): add InventoryItemDrawer component"
```

---

## Task 6: ListingInventoryDrawer Component

**Files:**
- Create: `app/components/inventory/ListingInventoryDrawer.vue`

- [ ] **Step 1: Create the drawer component**

```vue
<!-- app/components/inventory/ListingInventoryDrawer.vue -->
<script setup lang="ts">
import type { ListingInventoryEntry } from '@/components/inventory/data/listing-entries'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { BALI_LISTINGS } from '@/components/upsells/data/upsell-services'
import { useInventoryCatalog } from '@/composables/useInventoryCatalog'
import { useInventoryListings } from '@/composables/useInventoryListings'

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
  set: val => emit('update:open', val),
})

const isEditing = computed(() => !!props.entry)

// Form state
const selectedItemId = ref('')
const selectedListing = ref('')
const quantity = ref(1)
const condition = ref<ListingInventoryEntry['condition']>('good')
const stockLevel = ref<number | undefined>(undefined)
const notes = ref('')

const selectedItem = computed(() => {
  if (!selectedItemId.value)
    return null
  return getItemById(selectedItemId.value)
})

const isConsumable = computed(() => selectedItem.value?.type === 'consumable')

// Combobox search for items
const itemSearch = ref('')
const filteredItems = computed(() => {
  if (!itemSearch.value)
    return items.value
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
    if (props.entry)
      populateForm(props.entry)
    else resetForm()
  }
})

function handleSave() {
  if (!selectedItemId.value || !selectedListing.value)
    return

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

      <div class="flex flex-col gap-4 py-4">
        <!-- Item picker -->
        <div class="flex flex-col gap-1.5">
          <Label>Item <span class="text-destructive">*</span></Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" class="justify-between w-full font-normal">
                {{ selectedItem ? selectedItem.name : 'Pilih item dari catalog...' }}
                <Icon name="lucide:chevrons-up-down" class="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-72 p-0">
              <Command>
                <CommandInput v-model="itemSearch" placeholder="Cari item..." />
                <CommandList>
                  <CommandEmpty>Item tidak ditemukan.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      v-for="item in filteredItems"
                      :key="item.id"
                      :value="item.id"
                      @select="selectedItemId = item.id"
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

        <!-- Listing picker -->
        <div class="flex flex-col gap-1.5">
          <Label>Listing <span class="text-destructive">*</span></Label>
          <Select v-model="selectedListing">
            <SelectTrigger>
              <SelectValue placeholder="Pilih listing..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="listing in BALI_LISTINGS" :key="listing" :value="listing">
                {{ listing }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Quantity -->
        <div class="flex flex-col gap-1.5">
          <Label>Jumlah ({{ selectedItem?.unit || 'pcs' }})</Label>
          <Input v-model.number="quantity" type="number" min="1" />
        </div>

        <!-- Condition (permanent only) -->
        <div v-if="!isConsumable" class="flex flex-col gap-1.5">
          <Label>Kondisi</Label>
          <RadioGroup v-model="condition" class="flex flex-wrap gap-3">
            <div v-for="cond in ['good', 'fair', 'damaged', 'missing']" :key="cond" class="flex items-center gap-2">
              <RadioGroupItem :id="`cond-${cond}`" :value="cond" />
              <Label :for="`cond-${cond}`" class="capitalize">{{ cond }}</Label>
            </div>
          </RadioGroup>
        </div>

        <!-- Stock Level (consumable only) -->
        <div v-if="isConsumable" class="flex flex-col gap-1.5">
          <Label>Stok Saat Ini ({{ selectedItem?.unit || 'pcs' }})</Label>
          <Input v-model.number="stockLevel" type="number" min="0" placeholder="0" />
        </div>

        <!-- Notes -->
        <div class="flex flex-col gap-1.5">
          <Label>Catatan</Label>
          <Textarea v-model="notes" placeholder="Kondisi detail, lokasi di properti, dll." rows="3" />
        </div>
      </div>

      <SheetFooter>
        <Button variant="outline" @click="isOpen = false">
          Batal
        </Button>
        <Button :disabled="!selectedItemId || !selectedListing" @click="handleSave">
          {{ isEditing ? 'Simpan Perubahan' : 'Tambah Entry' }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/inventory/ListingInventoryDrawer.vue
git commit -m "feat(inventory): add ListingInventoryDrawer component"
```

---

## Task 7: InventoryCatalogTab Component

**Files:**
- Create: `app/components/inventory/InventoryCatalogTab.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/inventory/InventoryCatalogTab.vue -->
<script setup lang="ts">
import type { InventoryItem } from '@/components/inventory/data/catalog'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { INVENTORY_CATEGORIES } from '@/components/inventory/data/catalog'
import { useInventoryCatalog } from '@/composables/useInventoryCatalog'

const { filteredItems, searchValue, activeCategoryFilter, activeTypeFilter, deleteItem } = useInventoryCatalog()

const drawerOpen = ref(false)
const selectedItem = ref<InventoryItem | null>(null)

function openAdd() {
  selectedItem.value = null
  drawerOpen.value = true
}

function openEdit(item: InventoryItem) {
  selectedItem.value = item
  drawerOpen.value = true
}

function handleDelete(item: InventoryItem) {
  deleteItem(item.id)
  toast.success(`"${item.name}" dihapus dari catalog`)
}

function warrantyStatus(expiry?: string): 'expired' | 'soon' | 'ok' | 'none' {
  if (!expiry)
    return 'none'
  const exp = new Date(expiry)
  const now = new Date()
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 0)
    return 'expired'
  if (diff <= 30)
    return 'soon'
  return 'ok'
}

function formatIDR(val?: number) {
  if (val === undefined || val === null)
    return '—'
  return `IDR ${val.toLocaleString('id-ID')}`
}

function formatDate(d?: string) {
  if (!d)
    return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Filter bar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative w-48">
        <Icon name="lucide:search" class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchValue" placeholder="Cari item..." class="pl-8" />
      </div>

      <!-- Category pills -->
      <div class="flex flex-wrap gap-1.5">
        <Button
          v-for="cat in ['all', ...INVENTORY_CATEGORIES]"
          :key="cat"
          :variant="activeCategoryFilter === cat ? 'default' : 'outline'"
          size="sm"
          class="h-8"
          @click="activeCategoryFilter = cat as typeof activeCategoryFilter"
        >
          {{ cat === 'all' ? 'Semua' : cat }}
        </Button>
      </div>

      <!-- Type filter -->
      <Select v-model="activeTypeFilter">
        <SelectTrigger class="w-36 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            Semua Tipe
          </SelectItem>
          <SelectItem value="permanent">
            Permanent
          </SelectItem>
          <SelectItem value="consumable">
            Consumable
          </SelectItem>
        </SelectContent>
      </Select>

      <div class="ml-auto">
        <Button size="sm" @click="openAdd">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-12" />
            <TableHead>Nama</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Harga Beli</TableHead>
            <TableHead>Garansi</TableHead>
            <TableHead class="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="item in filteredItems"
            :key="item.id"
            class="cursor-pointer"
            @click="openEdit(item)"
          >
            <!-- Photo -->
            <TableCell>
              <div class="w-9 h-9 rounded-md border overflow-hidden bg-muted flex items-center justify-center">
                <img v-if="item.photo" :src="item.photo" class="w-full h-full object-cover" :alt="item.name">
                <Icon v-else name="lucide:package" class="h-4 w-4 text-muted-foreground" />
              </div>
            </TableCell>
            <!-- Name -->
            <TableCell class="font-medium">
              {{ item.name }}
            </TableCell>
            <!-- Category -->
            <TableCell>
              <Badge variant="outline">
                {{ item.category }}
              </Badge>
            </TableCell>
            <!-- Type -->
            <TableCell>
              <Badge :variant="item.type === 'permanent' ? 'secondary' : 'outline'" class="capitalize">
                {{ item.type }}
              </Badge>
            </TableCell>
            <!-- Unit -->
            <TableCell class="text-muted-foreground">
              {{ item.unit }}
            </TableCell>
            <!-- Purchase Value -->
            <TableCell class="text-muted-foreground">
              {{ formatIDR(item.purchaseValue) }}
            </TableCell>
            <!-- Warranty -->
            <TableCell>
              <template v-if="warrantyStatus(item.warrantyExpiry) === 'none'">
                <span class="text-muted-foreground">—</span>
              </template>
              <Badge
                v-else-if="warrantyStatus(item.warrantyExpiry) === 'expired'"
                variant="destructive"
              >
                Garansi habis
              </Badge>
              <Badge
                v-else-if="warrantyStatus(item.warrantyExpiry) === 'soon'"
                class="bg-amber-100 text-amber-700 border-amber-200"
              >
                Segera berakhir
              </Badge>
              <span v-else class="text-sm text-muted-foreground">
                {{ formatDate(item.warrantyExpiry) }}
              </span>
            </TableCell>
            <!-- Actions -->
            <TableCell @click.stop>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <Icon name="lucide:ellipsis" class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="openEdit(item)">
                    <Icon name="lucide:pencil" class="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive" @click="handleDelete(item)">
                    <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
          <TableRow v-if="filteredItems.length === 0">
            <TableCell colspan="8" class="text-center text-muted-foreground py-10">
              Tidak ada item ditemukan.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <InventoryItemDrawer v-model:open="drawerOpen" :item="selectedItem" />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/inventory/InventoryCatalogTab.vue
git commit -m "feat(inventory): add InventoryCatalogTab with warranty alerts"
```

---

## Task 8: InventoryListingsTab Component

**Files:**
- Create: `app/components/inventory/InventoryListingsTab.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/inventory/InventoryListingsTab.vue -->
<script setup lang="ts">
import type { ItemCondition, ListingInventoryEntry } from '@/components/inventory/data/listing-entries'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { BALI_LISTINGS } from '@/components/upsells/data/upsell-services'
import { useInventoryCatalog } from '@/composables/useInventoryCatalog'
import { useInventoryListings } from '@/composables/useInventoryListings'

const { getItemById } = useInventoryCatalog()
const { filteredEntries, filterListing, filterCondition, deleteEntry } = useInventoryListings()

const drawerOpen = ref(false)
const selectedEntry = ref<ListingInventoryEntry | null>(null)

function openAdd() {
  selectedEntry.value = null
  drawerOpen.value = true
}

function openEdit(entry: ListingInventoryEntry) {
  selectedEntry.value = entry
  drawerOpen.value = true
}

function handleDelete(entry: ListingInventoryEntry) {
  const item = getItemById(entry.itemId)
  deleteEntry(entry.id)
  toast.success(`"${item?.name ?? 'Item'}" dihapus dari listing`)
}

const CONDITIONS: { value: ItemCondition | 'all', label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'missing', label: 'Missing' },
]

function conditionVariant(cond: ItemCondition) {
  const map: Record<ItemCondition, string> = {
    good: 'bg-green-100 text-green-700 border-green-200',
    fair: 'bg-amber-100 text-amber-700 border-amber-200',
    damaged: 'bg-orange-100 text-orange-700 border-orange-200',
    missing: 'bg-red-100 text-red-700 border-red-200',
  }
  return map[cond]
}

function formatRelativeDate(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0)
    return 'Hari ini'
  if (diff === 1)
    return 'Kemarin'
  if (diff < 7)
    return `${diff} hari lalu`
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Filter bar -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Listing filter -->
      <Select v-model="filterListing">
        <SelectTrigger class="w-56 h-8">
          <SelectValue placeholder="Semua Listing" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            Semua Listing
          </SelectItem>
          <SelectItem v-for="listing in BALI_LISTINGS" :key="listing" :value="listing">
            {{ listing }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Condition pills -->
      <div class="flex flex-wrap gap-1.5">
        <Button
          v-for="cond in CONDITIONS"
          :key="cond.value"
          :variant="filterCondition === cond.value ? 'default' : 'outline'"
          size="sm"
          class="h-8"
          @click="filterCondition = cond.value as typeof filterCondition"
        >
          {{ cond.label }}
        </Button>
      </div>

      <div class="ml-auto">
        <Button size="sm" @click="openAdd">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Listing</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Kondisi</TableHead>
            <TableHead>Stok Level</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead class="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="entry in filteredEntries"
            :key="entry.id"
            class="cursor-pointer"
            @click="openEdit(entry)"
          >
            <TableCell>
              <div class="flex flex-col">
                <span class="font-medium">{{ getItemById(entry.itemId)?.name ?? '—' }}</span>
                <Badge variant="outline" class="w-fit mt-0.5 text-xs">
                  {{ getItemById(entry.itemId)?.category ?? '' }}
                </Badge>
              </div>
            </TableCell>
            <TableCell class="text-sm text-muted-foreground max-w-48 truncate">
              {{ entry.listingName }}
            </TableCell>
            <TableCell>
              {{ entry.quantity }} {{ getItemById(entry.itemId)?.unit ?? '' }}
            </TableCell>
            <TableCell>
              <span
                class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize"
                :class="conditionVariant(entry.condition)"
              >
                {{ entry.condition }}
              </span>
            </TableCell>
            <TableCell class="text-muted-foreground">
              <span v-if="entry.stockLevel !== undefined">
                {{ entry.stockLevel }} {{ getItemById(entry.itemId)?.unit ?? '' }}
              </span>
              <span v-else>—</span>
            </TableCell>
            <TableCell class="text-sm text-muted-foreground">
              {{ formatRelativeDate(entry.lastUpdated) }}
            </TableCell>
            <TableCell @click.stop>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <Icon name="lucide:ellipsis" class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="openEdit(entry)">
                    <Icon name="lucide:pencil" class="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive" @click="handleDelete(entry)">
                    <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
          <TableRow v-if="filteredEntries.length === 0">
            <TableCell colspan="7" class="text-center text-muted-foreground py-10">
              Tidak ada entry ditemukan.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <ListingInventoryDrawer v-model:open="drawerOpen" :entry="selectedEntry" />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/inventory/InventoryListingsTab.vue
git commit -m "feat(inventory): add InventoryListingsTab component"
```

---

## Task 9: Inventory Page + Sidebar Entry

**Files:**
- Create: `app/pages/inventory/index.vue`
- Modify: `app/constants/menus.ts`

- [ ] **Step 1: Create the page**

```vue
<!-- app/pages/inventory/index.vue -->
<script setup lang="ts">
const activeTab = ref<'catalog' | 'listings'>('catalog')
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <!-- Header -->
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Inventory
        </h2>
        <p class="text-muted-foreground">
          Lacak aset dan perlengkapan properti per listing.
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList>
        <TabsTrigger value="catalog">
          <Icon name="lucide:package" class="mr-2 h-4 w-4" />
          Catalog
        </TabsTrigger>
        <TabsTrigger value="listings">
          <Icon name="lucide:building-2" class="mr-2 h-4 w-4" />
          Per-Listing
        </TabsTrigger>
      </TabsList>

      <TabsContent value="catalog" class="mt-4">
        <InventoryCatalogTab />
      </TabsContent>

      <TabsContent value="listings" class="mt-4">
        <InventoryListingsTab />
      </TabsContent>
    </Tabs>
  </div>
</template>
```

- [ ] **Step 2: Add Inventory to sidebar in `app/constants/menus.ts`**

Find the `General` section items array. Add the Inventory entry **after** the Upsells entry:

```ts
// In the General section items array, after Upsells:
{
  title: 'Inventory',
  icon: 'i-lucide-package',
  link: '/inventory',
  new: true,
},
```

The General section should look like this after the change:

```ts
{
  heading: 'General',
  items: [
    {
      title: 'Home',
      icon: 'i-lucide-home',
      link: '/',
    },
    {
      title: 'Email',
      icon: 'i-lucide-mail',
      link: '/email',
    },
    {
      title: 'Inbox',
      icon: 'i-lucide-inbox',
      link: '/inbox',
      new: true,
    },
    {
      title: 'Tasks',
      icon: 'i-lucide-calendar-check-2',
      link: '/tasks',
    },
    {
      title: 'Upsells',
      icon: 'i-lucide-tag',
      link: '/upsells',
      new: true,
    },
    {
      title: 'Inventory',
      icon: 'i-lucide-package',
      link: '/inventory',
      new: true,
    },
  ],
},
```

- [ ] **Step 3: Commit**

```bash
git add app/pages/inventory/index.vue app/constants/menus.ts
git commit -m "feat(inventory): add inventory page and sidebar entry"
```

---

## Task 10: Smoke Test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify sidebar**
  - Open `http://localhost:3000`
  - Confirm "Inventory" link appears in sidebar under General with package icon
  - Click it → navigates to `/inventory`

- [ ] **Step 3: Verify Catalog tab**
  - Confirm 12 mock items are shown in the table
  - Test search filter — type "kasur" → only Kasur King shown
  - Test category pill filter — click "Electronics" → only Electronics items shown
  - Test type filter — select "Consumable" → only consumable items shown
  - Confirm warranty badge: AC Split shows amber "Segera berakhir" (expiry 2025-11-01, already past → shows red "Garansi habis")
  - Click "Add Item" → drawer opens
  - Fill in name + category + type + unit → click "Tambah Item" → item appears in table, toast shown
  - Click an existing row → drawer opens pre-filled with item data
  - Edit name → save → table updates
  - Click ellipsis → Delete → item removed, toast shown

- [ ] **Step 4: Verify Per-Listing tab**
  - Click "Per-Listing" tab
  - Confirm 13 mock entries are shown
  - Filter by listing → entries filter correctly
  - Filter by condition "damaged" → only entry-009 (Coffee Maker, damaged) shown
  - Condition badges render with correct colors (good=green, fair=amber, damaged=orange, missing=red)
  - Stok Level shows value for consumables, `—` for permanent items
  - Click "Add Entry" → drawer opens
  - Pick item from combobox (type to search) → pick listing → fill quantity → save → entry appears

- [ ] **Step 5: Commit if any fixes needed**

```bash
git add -p
git commit -m "fix(inventory): smoke test fixes"
```
