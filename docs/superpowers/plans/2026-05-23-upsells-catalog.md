# Upsells Catalog Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CRUD catalog page for managing upsell services offered to guests at Bali vacation rental properties.

**Architecture:** Data table page with side drawer for create/edit/delete. Composable manages reactive state with `useState`. Mock data in component data directory. Sidebar nav entry added to General group.

**Tech Stack:** Nuxt 3, Vue 3, shadcn-vue (Table, Sheet, Select, Input, Textarea, Switch, Badge, DropdownMenu, AlertDialog, Button), Tailwind CSS, vue-sonner for toasts.

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/components/upsells/data/upsell-services.ts` | Types + mock data (10 services) |
| Create | `app/composables/useUpsellServices.ts` | Reactive state + CRUD actions |
| Create | `app/components/upsells/UpsellTable.vue` | Data table with columns |
| Create | `app/components/upsells/UpsellFilterBar.vue` | Category, status, listing filters |
| Create | `app/components/upsells/UpsellDrawer.vue` | Sheet drawer for create/edit/delete |
| Create | `app/pages/upsells.vue` | Thin page shell |
| Modify | `app/constants/menus.ts:24-28` | Add Upsells nav entry |

---

### Task 1: Types + Mock Data

**Files:**
- Create: `app/components/upsells/data/upsell-services.ts`

- [ ] **Step 1: Create data file with types and mock data**

```ts
export type UpsellCategory
  = | 'Vehicle Rental'
    | 'Airport Transport'
    | 'Private Chef'
    | 'Spa'
    | 'Activity'
    | 'Late Check-out'
    | 'Early Check-in'
    | 'Mid-stay Cleaning'
    | 'Office Equipment'
    | 'Baby'
    | 'Miscellaneous'
    | 'Pet'

export interface UpsellService {
  id: string
  name: string
  description: string
  category: UpsellCategory
  price: number
  currency: string
  image?: string
  assignedListings: string[]
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export const UPSPELL_CATEGORIES: UpsellCategory[] = [
  'Airport Transport',
  'Vehicle Rental',
  'Private Chef',
  'Spa',
  'Activity',
  'Late Check-out',
  'Early Check-in',
  'Mid-stay Cleaning',
  'Office Equipment',
  'Baby',
  'Pet',
  'Miscellaneous',
]

export const BALI_LISTINGS = [
  'The R Pererenan Mezzanine Studio + Plunge Pool',
  'Cozy 2BR - the R Villa Sinabung w/ Pool in Sanur',
  'The R Villa Merapi',
  'TAMBORA - The R Tambora: Stylish 3BR Tropical Escape',
  'The R Loft - Cosy Suite Kalmantan incl Breakfast',
  'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu',
  'KABA - Stylish 2BR the R Villa Kaba-Kerobokan+Pool/Bikes',
  'The R Apartments Studio walk to the Beach',
  'Tranquil the R Villa Patuha-Pool/Rice Field Views',
  'Cozy Meets Luxe – 3BR the R Villa Ranakah Stay',
  'Tropical 2BR the R Villa Dempo w/Pool - Pererenan',
  '2BR-Tropical Escape at Villa Toba | Pool & Bikes',
  '5BR Pool the R Villa Luwa – Serene near Canggu',
  'Modern 2BR the R Villa Swantika w/Pool - Pererenan',
  'The R Pererenan Mezzanine Apartment w/ balcony',
  'The R Villa Samalas | 4BR Retreat in Pererenan',
]

export const mockUpsellServices: UpsellService[] = [
  {
    id: 'svc-001',
    name: 'Airport Transfer (Ngurah Rai)',
    description: 'Private airport transfer from Ngurah Rai International Airport to your villa. Includes meet & greet, luggage assistance, and cold towels upon arrival.',
    category: 'Airport Transport',
    price: 350000,
    currency: 'IDR',
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-04-20T10:30:00Z',
  },
  {
    id: 'svc-002',
    name: 'Private Chef - Dinner',
    description: 'Experience a private dinner prepared by a local Balinese chef at your villa. Choose from Balinese, Indonesian, or Western menu. Includes appetizer, main course, dessert for up to 4 guests.',
    category: 'Private Chef',
    price: 1500000,
    currency: 'IDR',
    assignedListings: ['TAMBORA - The R Tambora: Stylish 3BR Tropical Escape', 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu', 'Cozy Meets Luxe – 3BR the R Villa Ranakah Stay', '5BR Pool the R Villa Luwa – Serene near Canggu', 'The R Villa Samalas | 4BR Retreat in Pererenan'],
    status: 'active',
    createdAt: '2026-01-20T09:00:00Z',
    updatedAt: '2026-05-01T14:00:00Z',
  },
  {
    id: 'svc-003',
    name: 'In-Villa Spa Treatment',
    description: 'Relaxing in-villa spa treatment with professional therapists. Choose from Balinese massage, aromatherapy, or body scrub. 90-minute session.',
    category: 'Spa',
    price: 800000,
    currency: 'IDR',
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-03-15T11:00:00Z',
  },
  {
    id: 'svc-004',
    name: 'Ubud Rice Terrace Tour',
    description: 'Full-day guided tour to Tegallalang Rice Terraces, Tirta Empul water temple, and Ubud Monkey Forest. Includes private driver, lunch, and entrance fees.',
    category: 'Activity',
    price: 600000,
    currency: 'IDR',
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-02-10T12:00:00Z',
    updatedAt: '2026-04-05T09:30:00Z',
  },
  {
    id: 'svc-005',
    name: 'Surf Lesson at Canggu',
    description: '2-hour surf lesson with certified instructor at Canggu or Batu Bolong beach. Includes surfboard rental, rash guard, and bottled water. Suitable for beginners.',
    category: 'Activity',
    price: 500000,
    currency: 'IDR',
    assignedListings: ['The R Apartments Studio walk to the Beach', 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu', '5BR Pool the R Villa Luwa – Serene near Canggu', 'The R Villa Samalas | 4BR Retreat in Pererenan', 'Tropical 2BR the R Villa Dempo w/Pool - Pererenan'],
    status: 'active',
    createdAt: '2026-02-15T08:00:00Z',
    updatedAt: '2026-04-10T15:00:00Z',
  },
  {
    id: 'svc-006',
    name: 'Late Check-out (until 2pm)',
    description: 'Extend your check-out time until 2:00 PM. Subject to availability and next-day bookings.',
    category: 'Late Check-out',
    price: 450000,
    currency: 'IDR',
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'svc-007',
    name: 'Early Check-in (from 10am)',
    description: 'Check in early from 10:00 AM instead of the standard 3:00 PM. Subject to availability and prior-night bookings.',
    category: 'Early Check-in',
    price: 450000,
    currency: 'IDR',
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'svc-008',
    name: 'Scooter Rental (Daily)',
    description: 'Automatic scooter rental delivered to your villa. Includes helmet, basic insurance, and unlimited mileage. Perfect for exploring Bali at your own pace.',
    category: 'Vehicle Rental',
    price: 120000,
    currency: 'IDR',
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-03-10T14:00:00Z',
    updatedAt: '2026-05-10T16:00:00Z',
  },
  {
    id: 'svc-009',
    name: 'Baby Crib Setup',
    description: 'Baby crib with clean linens, high chair, and baby-proofing kit setup in your villa prior to arrival.',
    category: 'Baby',
    price: 250000,
    currency: 'IDR',
    assignedListings: ['TAMBORA - The R Tambora: Stylish 3BR Tropical Escape', 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu', 'KABA - Stylish 2BR the R Villa Kaba-Kerobokan+Pool/Bikes', 'Cozy Meets Luxe – 3BR the R Villa Ranakah Stay', '5BR Pool the R Villa Luwa – Serene near Canggu'],
    status: 'active',
    createdAt: '2026-03-20T11:00:00Z',
    updatedAt: '2026-04-15T08:00:00Z',
  },
  {
    id: 'svc-010',
    name: 'Mid-stay Deep Cleaning',
    description: 'Thorough mid-stay cleaning service including fresh linens, towel replacement, and full villa refresh. Recommended for stays of 5+ nights.',
    category: 'Mid-stay Cleaning',
    price: 400000,
    currency: 'IDR',
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-04-01T09:00:00Z',
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add app/components/upsells/data/upsell-services.ts
git commit -m "feat(upsells): add types and mock data for upsell services catalog"
```

---

### Task 2: Composable

**Files:**
- Create: `app/composables/useUpsellServices.ts`

- [ ] **Step 1: Create composable with reactive state + CRUD actions**

```ts
import type { UpsellCategory, UpsellService } from '@/components/upsells/data/upsell-services'
import { computed } from 'vue'
import { mockUpsellServices } from '@/components/upsells/data/upsell-services'

export function useUpsellServices() {
  const services = useState<UpsellService[]>('upsell-services', () =>
    mockUpsellServices.map(s => ({ ...s })),)

  const filterCategory = ref<UpsellCategory | 'all'>('all')
  const filterStatus = ref<'all' | 'active' | 'inactive'>('all')
  const filterListing = ref<string>('all')

  const filteredServices = computed(() => {
    return services.value.filter((s) => {
      if (filterCategory.value !== 'all' && s.category !== filterCategory.value)
        return false
      if (filterStatus.value !== 'all' && s.status !== filterStatus.value)
        return false
      if (filterListing.value !== 'all' && !s.assignedListings.includes(filterListing.value))
        return false
      return true
    })
  })

  const activeServices = computed(() =>
    services.value.filter(s => s.status === 'active'),
  )

  function addService(data: Omit<UpsellService, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const id = `svc-${String(services.value.length + 1).padStart(3, '0')}`
    services.value = [...services.value, {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    }]
  }

  function updateService(id: string, updates: Partial<UpsellService>) {
    services.value = services.value.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s,
    )
  }

  function deleteService(id: string) {
    services.value = services.value.filter(s => s.id !== id)
  }

  function toggleStatus(id: string) {
    services.value = services.value.map(s =>
      s.id === id
        ? { ...s, status: s.status === 'active' ? 'inactive' : 'active', updatedAt: new Date().toISOString() }
        : s,
    )
  }

  function clearFilters() {
    filterCategory.value = 'all'
    filterStatus.value = 'all'
    filterListing.value = 'all'
  }

  return {
    services,
    filteredServices,
    activeServices,
    filterCategory,
    filterStatus,
    filterListing,
    addService,
    updateService,
    deleteService,
    toggleStatus,
    clearFilters,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/useUpsellServices.ts
git commit -m "feat(upsells): add useUpsellServices composable with CRUD actions"
```

---

### Task 3: Filter Bar Component

**Files:**
- Create: `app/components/upsells/UpsellFilterBar.vue`

- [ ] **Step 1: Create filter bar with category, status, and listing selects**

```vue
<script setup lang="ts">
import { BALI_LISTINGS, UPSPELL_CATEGORIES } from '@/components/upsells/data/upsell-services'
import { useUpsellServices } from '@/composables/useUpsellServices'

const { filterCategory, filterStatus, filterListing, clearFilters } = useUpsellServices()
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <div class="flex flex-col gap-1">
      <label class="text-xs text-muted-foreground">Category</label>
      <Select v-model="filterCategory">
        <SelectTrigger class="h-8 w-44 text-sm">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All categories
          </SelectItem>
          <SelectItem v-for="cat in UPSPELL_CATEGORIES" :key="cat" :value="cat">
            {{ cat }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="flex flex-col gap-1">
      <label class="text-xs text-muted-foreground">Status</label>
      <Select v-model="filterStatus">
        <SelectTrigger class="h-8 w-36 text-sm">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All
          </SelectItem>
          <SelectItem value="active">
            Active
          </SelectItem>
          <SelectItem value="inactive">
            Inactive
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="flex flex-col gap-1">
      <label class="text-xs text-muted-foreground">Listing</label>
      <Select v-model="filterListing">
        <SelectTrigger class="h-8 w-56 text-sm">
          <SelectValue placeholder="All listings" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All listings
          </SelectItem>
          <SelectItem v-for="listing in BALI_LISTINGS" :key="listing" :value="listing">
            {{ listing }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <Button variant="ghost" size="sm" class="h-8 self-end" @click="clearFilters">
      Clear filters
    </Button>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/upsells/UpsellFilterBar.vue
git commit -m "feat(upsells): add UpsellFilterBar component"
```

---

### Task 4: Data Table Component

**Files:**
- Create: `app/components/upsells/UpsellTable.vue`

- [ ] **Step 1: Create table component with all columns**

```vue
<script setup lang="ts">
import type { UpsellService } from '@/components/upsells/data/upsell-services'
import { toast } from 'vue-sonner'
import { useUpsellServices } from '@/composables/useUpsellServices'

const emit = defineEmits<{
  openDrawer: [service: UpsellService | null]
}>()

const { filteredServices, toggleStatus, deleteService } = useUpsellServices()

const drawerOpen = ref(false)
const editingService = ref<UpsellService | null>(null)

function openEdit(service: UpsellService) {
  emit('openDrawer', service)
}

function openCreate() {
  emit('openDrawer', null)
}

function handleToggleStatus(id: string) {
  toggleStatus(id)
  toast.success('Service status updated.')
}

function handleDelete(id: string) {
  deleteService(id)
  toast.success('Service deleted.')
}

function formatPrice(price: number, currency: string) {
  return `${currency} ${price.toLocaleString('id-ID')}`
}

const categoryBadgeClass: Record<string, string> = {
  'Airport Transport': 'text-violet-700 bg-violet-50',
  'Vehicle Rental': 'text-slate-700 bg-slate-100',
  'Private Chef': 'text-amber-700 bg-amber-50',
  'Spa': 'text-pink-700 bg-pink-50',
  'Activity': 'text-emerald-700 bg-emerald-50',
  'Late Check-out': 'text-indigo-700 bg-indigo-50',
  'Early Check-in': 'text-sky-700 bg-sky-50',
  'Mid-stay Cleaning': 'text-teal-700 bg-teal-50',
  'Office Equipment': 'text-orange-700 bg-orange-50',
  'Baby': 'text-rose-700 bg-rose-50',
  'Pet': 'text-lime-700 bg-lime-50',
  'Miscellaneous': 'text-gray-700 bg-gray-100',
}
</script>

<template>
  <div class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="w-12" />
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead class="text-right">
            Price
          </TableHead>
          <TableHead class="text-center">
            Listings
          </TableHead>
          <TableHead class="text-center">
            Status
          </TableHead>
          <TableHead class="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="filteredServices.length === 0">
          <TableCell colspan="7" class="py-12 text-center text-sm text-muted-foreground">
            No upsell services match the selected filters.
          </TableCell>
        </TableRow>
        <TableRow
          v-for="svc in filteredServices"
          v-else
          :key="svc.id"
          class="cursor-pointer hover:bg-muted/50"
          @click="openEdit(svc)"
        >
          <TableCell>
            <div class="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Icon name="lucide:image" class="h-5 w-5 text-muted-foreground" />
            </div>
          </TableCell>
          <TableCell>
            <p class="font-medium">
              {{ svc.name }}
            </p>
            <p class="max-w-64 truncate text-xs text-muted-foreground">
              {{ svc.description }}
            </p>
          </TableCell>
          <TableCell>
            <span
              class="rounded-full px-2.5 py-0.5 text-xs font-medium"
              :class="categoryBadgeClass[svc.category] ?? 'text-gray-700 bg-gray-100'"
            >
              {{ svc.category }}
            </span>
          </TableCell>
          <TableCell class="text-right font-semibold tabular-nums">
            {{ formatPrice(svc.price, svc.currency) }}
          </TableCell>
          <TableCell class="text-center">
            <Badge variant="secondary">
              {{ svc.assignedListings.length }} {{ svc.assignedListings.length === 1 ? 'listing' : 'listings' }}
            </Badge>
          </TableCell>
          <TableCell class="text-center">
            <Badge :variant="svc.status === 'active' ? 'default' : 'secondary'">
              {{ svc.status === 'active' ? 'Active' : 'Inactive' }}
            </Badge>
          </TableCell>
          <TableCell @click.stop>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" class="h-7 w-7" aria-label="Row actions">
                  <Icon name="lucide:ellipsis" class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="openEdit(svc)">
                  <Icon name="lucide:pencil" class="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem @click="handleToggleStatus(svc.id)">
                  <Icon
                    :name="svc.status === 'active' ? 'lucide:eye-off' : 'lucide:eye'"
                    class="mr-2 h-4 w-4"
                  />
                  {{ svc.status === 'active' ? 'Deactivate' : 'Activate' }}
                </DropdownMenuItem>
                <DropdownMenuItem class="text-destructive" @click="handleDelete(svc.id)">
                  <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/upsells/UpsellTable.vue
git commit -m "feat(upsells): add UpsellTable component with columns and actions"
```

---

### Task 5: Drawer Component

**Files:**
- Create: `app/components/upsells/UpsellDrawer.vue`

- [ ] **Step 1: Create Sheet drawer with form for create/edit/delete**

```vue
<script setup lang="ts">
import type { UpsellService } from '@/components/upsells/data/upsell-services'
import { toast } from 'vue-sonner'
import { BALI_LISTINGS, UPSPELL_CATEGORIES } from '@/components/upsells/data/upsell-services'
import { useUpsellServices } from '@/composables/useUpsellServices'

const props = defineProps<{
  service: UpsellService | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { addService, updateService, deleteService } = useUpsellServices()

const isEditing = computed(() => props.service !== null)

const formName = ref('')
const formDescription = ref('')
const formCategory = ref<UpsellService['category']>('Airport Transport')
const formPrice = ref(0)
const formCurrency = ref('IDR')
const formImage = ref('')
const formListings = ref<string[]>([])
const formStatus = ref<'active' | 'inactive'>('active')
const showDeleteConfirm = ref(false)

watch(() => props.open, (open) => {
  if (open) {
    showDeleteConfirm.value = false
    if (props.service) {
      formName.value = props.service.name
      formDescription.value = props.service.description
      formCategory.value = props.service.category
      formPrice.value = props.service.price
      formCurrency.value = props.service.currency
      formImage.value = props.service.image ?? ''
      formListings.value = [...props.service.assignedListings]
      formStatus.value = props.service.status
    }
    else {
      formName.value = ''
      formDescription.value = ''
      formCategory.value = 'Airport Transport'
      formPrice.value = 0
      formCurrency.value = 'IDR'
      formImage.value = ''
      formListings.value = []
      formStatus.value = 'active'
    }
  }
})

function toggleListing(listing: string) {
  if (formListings.value.includes(listing)) {
    formListings.value = formListings.value.filter(l => l !== listing)
  }
  else {
    formListings.value = [...formListings.value, listing]
  }
}

function selectAllListings() {
  formListings.value = [...BALI_LISTINGS]
}

function clearAllListings() {
  formListings.value = []
}

function handleSave() {
  if (!formName.value.trim()) {
    toast.error('Service name is required.')
    return
  }
  if (formPrice.value <= 0) {
    toast.error('Price must be greater than 0.')
    return
  }

  const data = {
    name: formName.value.trim(),
    description: formDescription.value.trim(),
    category: formCategory.value,
    price: formPrice.value,
    currency: formCurrency.value,
    image: formImage.value.trim() || undefined,
    assignedListings: formListings.value,
    status: formStatus.value,
  }

  if (isEditing.value && props.service) {
    updateService(props.service.id, data)
    toast.success('Service updated.')
  }
  else {
    addService(data)
    toast.success('Service created.')
  }
  emit('update:open', false)
}

function handleDelete() {
  if (props.service) {
    deleteService(props.service.id)
    toast.success('Service deleted.')
    emit('update:open', false)
  }
}

function onOpenChange(val: boolean) {
  emit('update:open', val)
}
</script>

<template>
  <Sheet :open="props.open" @update:open="onOpenChange">
    <SheetContent class="flex w-full flex-col gap-0 p-0 sm:max-w-lg" side="right">
      <SheetHeader class="border-b px-6 py-4">
        <SheetTitle>{{ isEditing ? 'Edit Service' : 'Add Service' }}</SheetTitle>
        <SheetDescription>
          {{ isEditing ? 'Update the upsell service details.' : 'Create a new upsell service to offer to guests.' }}
        </SheetDescription>
      </SheetHeader>

      <ScrollArea class="flex-1">
        <div class="flex flex-col gap-5 p-6">
          <div class="flex flex-col gap-2">
            <Label>Name</Label>
            <Input v-model="formName" placeholder="e.g. Airport Transfer (Ngurah Rai)" />
          </div>

          <div class="flex flex-col gap-2">
            <Label>Description</Label>
            <Textarea v-model="formDescription" placeholder="Describe the service..." rows="3" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <Label>Category</Label>
              <Select v-model="formCategory">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="cat in UPSPELL_CATEGORIES" :key="cat" :value="cat">
                    {{ cat }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="flex flex-col gap-2">
              <Label>Currency</Label>
              <Select v-model="formCurrency">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDR">
                    IDR
                  </SelectItem>
                  <SelectItem value="USD">
                    USD
                  </SelectItem>
                  <SelectItem value="EUR">
                    EUR
                  </SelectItem>
                  <SelectItem value="CHF">
                    CHF
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <Label>Price</Label>
            <Input v-model.number="formPrice" type="number" min="0" placeholder="0" />
          </div>

          <div class="flex flex-col gap-2">
            <Label>Image URL</Label>
            <div class="flex items-center gap-3">
              <Input v-model="formImage" placeholder="https://..." class="flex-1" />
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon name="lucide:image-plus" class="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          <Separator />

          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <Label>Assigned Listings</Label>
              <div class="flex gap-2">
                <Button variant="ghost" size="sm" class="h-7 text-xs" @click="selectAllListings">
                  Select all
                </Button>
                <Button variant="ghost" size="sm" class="h-7 text-xs" @click="clearAllListings">
                  Clear
                </Button>
              </div>
            </div>
            <div class="max-h-48 overflow-y-auto rounded-md border">
              <label
                v-for="listing in BALI_LISTINGS"
                :key="listing"
                class="flex cursor-pointer items-center gap-2 border-b px-3 py-2 last:border-b-0 hover:bg-muted/50"
              >
                <Checkbox
                  :checked="formListings.includes(listing)"
                  @update:checked="toggleListing(listing)"
                />
                <span class="text-sm">{{ listing }}</span>
              </label>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ formListings.length }} of {{ BALI_LISTINGS.length }} listings selected
            </p>
          </div>

          <Separator />

          <div class="flex items-center justify-between">
            <Label>Status</Label>
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">
                {{ formStatus === 'active' ? 'Active' : 'Inactive' }}
              </span>
              <Switch
                :checked="formStatus === 'active'"
                @update:checked="formStatus = $event ? 'active' : 'inactive'"
              />
            </div>
          </div>
        </div>
      </ScrollArea>

      <div class="border-t px-6 py-4">
        <div class="flex items-center gap-2">
          <Button variant="outline" class="flex-1" @click="onOpenChange(false)">
            Cancel
          </Button>
          <Button class="flex-1" @click="handleSave">
            {{ isEditing ? 'Save Changes' : 'Create Service' }}
          </Button>
        </div>
        <div v-if="isEditing" class="mt-3">
          <AlertDialog v-model:open="showDeleteConfirm">
            <AlertDialogTrigger as-child>
              <Button variant="destructive" class="w-full" size="sm">
                <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
                Delete Service
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this service?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove "{{ props.service?.name }}" from your catalog. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="handleDelete">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/upsells/UpsellDrawer.vue
git commit -m "feat(upsells): add UpsellDrawer component with create/edit/delete form"
```

---

### Task 6: Page Shell + Wire Up Components

**Files:**
- Create: `app/pages/upsells.vue`

- [ ] **Step 1: Create page that wires together all components**

```vue
<script setup lang="ts">
import type { UpsellService } from '@/components/upsells/data/upsell-services'

const drawerOpen = ref(false)
const selectedService = ref<UpsellService | null>(null)

function openDrawer(service: UpsellService | null) {
  selectedService.value = service
  drawerOpen.value = true
}
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Upsells
        </h2>
        <p class="text-muted-foreground">
          Manage upsell services offered to your guests.
        </p>
      </div>
      <Button size="sm" @click="openDrawer(null)">
        <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
        Add Service
      </Button>
    </div>

    <UpsellsUpsellFilterBar />

    <UpsellsUpsellTable @open-drawer="openDrawer" />

    <UpsellsUpsellDrawer
      :service="selectedService"
      :open="drawerOpen"
      @update:open="drawerOpen = $event"
    />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/pages/upsells.vue
git commit -m "feat(upsells): add upsells page shell"
```

---

### Task 7: Sidebar Navigation

**Files:**
- Modify: `app/constants/menus.ts` — add Upsells entry after Tasks in General group (line 27)

- [ ] **Step 1: Add Upsells nav entry to General group**

In `app/constants/menus.ts`, add after the Tasks entry (after line 27, before the closing `}` of items array):

```ts
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
```

The final General items array should be:

```ts
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
    ],
```

- [ ] **Step 2: Commit**

```bash
git add app/constants/menus.ts
git commit -m "feat(upsells): add Upsells to sidebar navigation"
```

---

### Task 8: Verify

- [ ] **Step 1: Run dev server and verify page loads**

```bash
npm run dev
```

- [ ] **Step 2: Verify in browser**

1. Navigate to `/upsells` — page loads with table showing 10 services
2. Filter by category — table filters correctly
3. Filter by status — shows active/inactive
4. Filter by listing — filters by assigned listings
5. Click "Add Service" — drawer opens with empty form
6. Fill form and save — new service appears in table, toast shown
7. Click a row — drawer opens in edit mode with pre-filled data
8. Edit and save — service updates, toast shown
9. Click ⋯ → Deactivate — status toggles, toast shown
10. Click ⋷ → Delete — service removed from table, toast shown
11. Verify sidebar shows "Upsells" link with "new" badge

- [ ] **Step 3: Run typecheck**

```bash
npx nuxi typecheck
```

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(upsells): address typecheck and runtime issues"
```
