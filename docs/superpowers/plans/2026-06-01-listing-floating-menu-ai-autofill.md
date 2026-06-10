# Listing Floating Menu & AI Auto-Fill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating action bar to the listing detail page with Listing Setup (full-screen two-panel overlay for AI knowledge management + auto-fill), Test AI (guest chat simulation), and AI Schedule (reuse existing sheet).

**Architecture:** New `ListingFloatingMenu.vue` sits at the bottom of `[id].vue` and emits events to open three features. Listing Setup is a full-screen overlay composed of `ListingSetupOverlay.vue` → `ListingSetupFieldPanel.vue` + `ListingSetupResourcePanel.vue`. Test AI is a self-contained dialog. AI Schedule reuses the existing sheet in `ListingHeroCompact.vue` via a prop trigger.

**Tech Stack:** Nuxt 3, Vue 3, shadcn-vue (Dialog, Sheet, Tabs, Button, Input, Textarea, ScrollArea, Separator, Badge), Tailwind CSS v4, TypeScript

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `app/components/listings/data/listings.ts` | Modify | Add `ListingDocument`, `ListingResources` types + `resources` field to `Listing` + mock data |
| `app/components/listings/ListingFloatingMenu.vue` | Create | Floating pill bar — 3 buttons, emits `open-setup`, `open-test-ai`, `open-schedule` |
| `app/components/listings/ListingSetupOverlay.vue` | Create | Full-screen overlay shell — header + two-panel layout |
| `app/components/listings/ListingSetupFieldPanel.vue` | Create | Left panel — 6 tabs with editable fields + auto-fill badges |
| `app/components/listings/ListingSetupResourcePanel.vue` | Create | Right panel — documents, Elev8 AI checklist, action buttons |
| `app/components/listings/ListingTestAIDialog.vue` | Create | Guest chat simulation dialog |
| `app/components/listings/ListingHeroCompact.vue` | Modify | Accept `openSchedule` prop to programmatically open schedule sheet |
| `app/pages/listings/[id].vue` | Modify | Mount floating menu, handle events, pass `openSchedule` to hero |

---

### Task 1: Extend Data Model

**Files:**
- Modify: `app/components/listings/data/listings.ts`

- [ ] **Step 1: Add new interfaces after `ListingMaintenance`**

```ts
export interface ListingDocument {
  id: string
  name: string
  url: string // base64 data URL or remote URL
  size: number // bytes
  uploadedAt: string // ISO date
}

export interface ListingResources {
  documents: ListingDocument[]
  basics: {
    description?: string
    houseRules?: string
    neighborhood?: string
    checkInTime?: string
    checkOutTime?: string
  }
  listingDetails?: string
  sops?: string
  topicsToAvoid?: string[]
  propertyUpsells?: string[]
}
```

- [ ] **Step 2: Add `resources` field to `Listing` interface** (after `maintenance`)

```ts
resources: ListingResources
```

- [ ] **Step 3: Add default resources to lst-1 mock data** (after `maintenance` field)

```ts
    resources: {
      documents: [
        { id: 'doc-1', name: 'Villa_Luwa_Info.pdf', url: '', size: 245000, uploadedAt: '2026-05-15' },
        { id: 'doc-2', name: 'SOPs_Template.docx', url: '', size: 89000, uploadedAt: '2026-05-20' },
      ],
      basics: {
        description: 'A serene 5-bedroom villa with private pool near Canggu beach. Perfect for families and groups seeking a luxurious Bali experience with modern amenities and traditional Balinese architecture.',
        checkInTime: '14:00',
        checkOutTime: '11:00',
      },
      topicsToAvoid: ['competitor pricing', 'refund disputes'],
      propertyUpsells: [],
    },
```

- [ ] **Step 4: Add empty default resources to all other listings** (lst-2 through lst-16, after their `maintenance` field)

```ts
    resources: { documents: [], basics: {}, topicsToAvoid: [], propertyUpsells: [] },
```

- [ ] **Step 5: Verify no TS errors**

```bash
cd /Users/juli/Documents/ELEV8-DASHBOARD/Dashboard && npx vue-tsc --noEmit 2>&1 | grep -i "listings/" || echo "No listing errors"
```

Expected: `No listing errors`

- [ ] **Step 6: Commit**

```bash
git add app/components/listings/data/listings.ts
git commit -m "feat(listings): add ListingResources type and resources field to Listing"
```

---

### Task 2: Create Floating Menu Component

**Files:**
- Create: `app/components/listings/ListingFloatingMenu.vue`

- [ ] **Step 1: Create the component**

```vue
<script setup lang="ts">
const emit = defineEmits<{
  openSetup: []
  openTestAi: []
  openSchedule: []
}>()
</script>

<template>
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded-full border bg-background px-2 py-1.5 shadow-lg">
    <Button variant="ghost" size="sm" class="rounded-full gap-2 text-xs" @click="emit('openSetup')">
      <Icon name="lucide:layout-panel-left" class="size-3.5" />
      Listing Setup
    </Button>
    <Separator orientation="vertical" class="h-4" />
    <Button variant="ghost" size="sm" class="rounded-full gap-2 text-xs" @click="emit('openTestAi')">
      <Icon name="lucide:bot" class="size-3.5" />
      Test AI
    </Button>
    <Separator orientation="vertical" class="h-4" />
    <Button variant="ghost" size="sm" class="rounded-full gap-2 text-xs" @click="emit('openSchedule')">
      <Icon name="lucide:clock" class="size-3.5" />
      AI Schedule
    </Button>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingFloatingMenu.vue
git commit -m "feat(listings): add floating action bar component"
```

---

### Task 3: Create Resource Panel Component

**Files:**
- Create: `app/components/listings/ListingSetupResourcePanel.vue`

- [ ] **Step 1: Create the component**

```vue
<script setup lang="ts">
import type { Listing, ListingDocument } from '~/components/listings/data/listings'
import { toast } from 'vue-sonner'
import { listings } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing }>()
const emit = defineEmits<{ update: [listing: Listing] }>()

const fileInputEl = ref<HTMLInputElement | null>(null)
const MAX_DOCS = 20
const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']

function uploadDocs(files: FileList | null) {
  if (!files)
    return
  const remaining = MAX_DOCS - props.listing.resources.documents.length
  Array.from(files).slice(0, remaining).forEach((file) => {
    if (!ALLOWED.includes(file.type) || file.size > MAX_SIZE)
      return
    const reader = new FileReader()
    reader.onload = (e) => {
      const doc: ListingDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        url: e.target?.result as string,
        size: file.size,
        uploadedAt: new Date().toISOString().split('T')[0]!,
      }
      emit('update', { ...props.listing, resources: { ...props.listing.resources, documents: [...props.listing.resources.documents, doc] } })
    }
    reader.readAsDataURL(file)
  })
}

function deleteDoc(id: string) {
  emit('update', { ...props.listing, resources: { ...props.listing.resources, documents: props.listing.resources.documents.filter(d => d.id !== id) } })
}

function downloadDoc(doc: ListingDocument) {
  const a = document.createElement('a')
  a.href = doc.url || '#'
  a.download = doc.name
  a.click()
}

function formatSize(bytes: number) {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Auto-fill
const isAutoFilling = ref(false)

async function autoFill() {
  isAutoFilling.value = true
  await new Promise(r => setTimeout(r, 1500))
  const filled: Listing['resources']['basics'] = {
    description: props.listing.resources.basics.description || `${props.listing.name} is a beautiful ${props.listing.room} in ${props.listing.location}, accommodating up to ${props.listing.capacity} guests.`,
    checkInTime: props.listing.resources.basics.checkInTime || '14:00',
    checkOutTime: props.listing.resources.basics.checkOutTime || '11:00',
  }
  emit('update', { ...props.listing, resources: { ...props.listing.resources, basics: filled } })
  isAutoFilling.value = false
  toast.success('Property details auto-filled from resources')
}

// Copy from other property
const showCopyDialog = ref(false)
const copySearch = ref('')
const otherListings = computed(() => listings.value.filter(l => l.id !== props.listing.id))
const filteredCopyListings = computed(() => {
  if (!copySearch.value)
    return otherListings.value
  return otherListings.value.filter(l => l.name.toLowerCase().includes(copySearch.value.toLowerCase()))
})

function copyFromProperty(sourceId: string) {
  const source = listings.value.find(l => l.id === sourceId)
  if (!source)
    return
  emit('update', { ...props.listing, resources: JSON.parse(JSON.stringify(source.resources)) })
  toast.success('Resources copied from property')
  showCopyDialog.value = false
  copySearch.value = ''
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="px-4 py-3 border-b flex-shrink-0">
      <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resources</span>
    </div>

    <ScrollArea class="flex-1">
      <div class="flex flex-col gap-4 p-4">
        <!-- Property Documents -->
        <div class="flex flex-col gap-2">
          <div class="text-sm font-semibold">
            Property Documents
          </div>
          <p class="text-xs text-muted-foreground">
            All documents are used automatically by Elev8 AI
          </p>

          <div v-for="doc in listing.resources.documents" :key="doc.id" class="flex items-center gap-2 rounded-lg border p-2.5">
            <Icon name="lucide:file-text" class="size-4 text-amber-500 shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium truncate">
                {{ doc.name }}
              </p>
              <p class="text-[10px] text-muted-foreground">
                {{ formatSize(doc.size) }}
              </p>
            </div>
            <Button variant="ghost" size="icon" class="size-7 shrink-0" @click="downloadDoc(doc)">
              <Icon name="lucide:download" class="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" class="size-7 shrink-0 hover:text-destructive" @click="deleteDoc(doc.id)">
              <Icon name="lucide:x" class="size-3.5" />
            </Button>
          </div>

          <Button variant="outline" size="sm" class="w-full gap-1.5 border-dashed" @click="fileInputEl?.click()">
            <Icon name="lucide:plus" class="size-3.5" />
            Upload New Document
          </Button>
          <input
            ref="fileInputEl" type="file" accept=".pdf,.docx,.txt" multiple class="hidden"
            @change="uploadDocs(($event.target as HTMLInputElement).files)"
          >
        </div>

        <Separator />

        <!-- Elev8 AI Integration -->
        <div class="flex flex-col gap-2">
          <div class="text-sm font-semibold">
            Elev8 AI
          </div>
          <div class="text-xs text-muted-foreground font-medium">
            Property Integration
          </div>
          <div class="flex flex-col gap-1.5">
            <div v-for="item in ['Property details', 'Property availability and pricing', 'Guest and reservation data', 'Past conversations (last 6 months)']" :key="item" class="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name="lucide:check" class="size-3.5 text-green-500 shrink-0" />
              {{ item }}
            </div>
          </div>
        </div>

        <Separator />

        <!-- Property Profile Actions -->
        <div class="flex flex-col gap-2">
          <div class="text-sm font-semibold">
            Property Profile
          </div>
          <Button class="w-full gap-1.5" :disabled="isAutoFilling" @click="autoFill">
            <Icon v-if="isAutoFilling" name="lucide:loader-2" class="size-3.5 animate-spin" />
            <Icon v-else name="lucide:sparkles" class="size-3.5" />
            {{ isAutoFilling ? 'Filling...' : 'Auto-Fill Property Details' }}
          </Button>
          <Button variant="outline" class="w-full gap-1.5" @click="showCopyDialog = true">
            <Icon name="lucide:copy" class="size-3.5" />
            Copy Data From Other Property
          </Button>
        </div>
      </div>
    </ScrollArea>

    <!-- Copy from property dialog -->
    <Dialog v-model:open="showCopyDialog">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>Copy From Property</DialogTitle>
          <DialogDescription>Copy resources from another listing.</DialogDescription>
        </DialogHeader>
        <div class="relative">
          <Icon name="lucide:search" class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input v-model="copySearch" placeholder="Search listings..." class="pl-8" />
        </div>
        <ScrollArea class="max-h-60">
          <div class="flex flex-col gap-1">
            <div
              v-for="l in filteredCopyListings" :key="l.id"
              class="flex items-center gap-3 rounded-md px-2 py-2 cursor-pointer hover:bg-accent"
              @click="copyFromProperty(l.id)"
            >
              <div class="size-8 rounded overflow-hidden bg-muted shrink-0">
                <img :src="l.photos[0]" class="size-full object-cover">
              </div>
              <span class="text-sm truncate">{{ l.name }}</span>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingSetupResourcePanel.vue
git commit -m "feat(listings): add resource panel (documents, Elev8 AI checklist, auto-fill, copy)"
```

---

### Task 4: Create Field Panel Component

**Files:**
- Create: `app/components/listings/ListingSetupFieldPanel.vue`

- [ ] **Step 1: Create the component**

```vue
<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing }>()
const emit = defineEmits<{ update: [listing: Listing] }>()

const activeTab = ref('basics')

// Basics form — synced with listing.resources.basics
const basics = computed({
  get: () => props.listing.resources.basics,
  set: val => emit('update', { ...props.listing, resources: { ...props.listing.resources, basics: val } }),
})

function updateBasics(patch: Partial<typeof basics.value>) {
  emit('update', { ...props.listing, resources: { ...props.listing.resources, basics: { ...basics.value, ...patch } } })
}

function updateResources(patch: Partial<Listing['resources']>) {
  emit('update', { ...props.listing, resources: { ...props.listing.resources, ...patch } })
}

// Amenities (reuse listing.amenities)
const allAmenities = [
  'Pool',
  'WiFi',
  'AC',
  'Kitchen',
  'Parking',
  'Garden',
  'Beach Access',
  'Rooftop Deck',
  'Plunge Pool',
  'Yoga Deck',
  'Hammock Deck',
  'Nature Bath',
  'Ocean View',
  'Cliff Deck',
  'Surfboard Storage',
  'Mountain View',
  'Hot Tub',
  'Fireplace',
  'River View',
  'Bamboo Construction',
]
const amenitySearch = ref('')
const amenityPopoverOpen = ref(false)
const filteredAmenities = computed(() => {
  const available = allAmenities.filter(a => !props.listing.amenities.includes(a))
  if (!amenitySearch.value)
    return available
  return available.filter(a => a.toLowerCase().includes(amenitySearch.value.toLowerCase()))
})
function addAmenity(a: string) { emit('update', { ...props.listing, amenities: [...props.listing.amenities, a] }) }
function removeAmenity(a: string) { emit('update', { ...props.listing, amenities: props.listing.amenities.filter(x => x !== a) }) }

// Topics to avoid
const topicInput = ref('')
function addTopic() {
  const t = topicInput.value.trim()
  if (!t || props.listing.resources.topicsToAvoid?.includes(t))
    return
  updateResources({ topicsToAvoid: [...(props.listing.resources.topicsToAvoid ?? []), t] })
  topicInput.value = ''
}
function removeTopic(t: string) {
  updateResources({ topicsToAvoid: props.listing.resources.topicsToAvoid?.filter(x => x !== t) })
}

const isFilled = (val?: string) => !!val?.trim()
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <Tabs v-model="activeTab" class="flex flex-col h-full overflow-hidden">
      <TabsList class="flex-shrink-0 w-full justify-start rounded-none border-b bg-transparent px-4 h-auto pb-0 gap-0">
        <TabsTrigger
          v-for="tab in ['basics', 'listing-details', 'amenities', 'sops', 'topics', 'upsells']" :key="tab"
          :value="tab"
          class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2 text-xs"
        >
          {{ { "basics": 'Basics', 'listing-details': 'Listing Details', "amenities": 'Amenities', "sops": 'SOPs', "topics": 'Topics to Avoid', "upsells": 'Property Upsells' }[tab] }}
        </TabsTrigger>
      </TabsList>

      <!-- Basics -->
      <TabsContent value="basics" class="flex-1 overflow-y-auto p-5 mt-0 flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <Label>Property Name</Label>
            <Input :model-value="listing.name" @update:model-value="(v) => emit('update', { ...listing, name: String(v) })" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Location</Label>
            <Input :model-value="listing.location" @update:model-value="(v) => emit('update', { ...listing, location: String(v) })" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Check-in Time</Label>
            <Input type="time" :model-value="basics.checkInTime ?? '14:00'" @update:model-value="(v) => updateBasics({ checkInTime: String(v) })" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Check-out Time</Label>
            <Input type="time" :model-value="basics.checkOutTime ?? '11:00'" @update:model-value="(v) => updateBasics({ checkOutTime: String(v) })" />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <Label>Property Description</Label>
            <span v-if="isFilled(basics.description)" class="text-[10px] text-primary flex items-center gap-1">
              <Icon name="lucide:sparkles" class="size-3" /> AI filled
            </span>
          </div>
          <Textarea :model-value="basics.description ?? ''" rows="5" placeholder="Describe your property..." @update:model-value="(v) => updateBasics({ description: String(v) })" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>House Rules</Label>
          <Textarea :model-value="basics.houseRules ?? ''" rows="3" placeholder="e.g. No smoking, no parties..." @update:model-value="(v) => updateBasics({ houseRules: String(v) })" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Neighborhood Info</Label>
          <Textarea :model-value="basics.neighborhood ?? ''" rows="3" placeholder="Nearby attractions, transport..." @update:model-value="(v) => updateBasics({ neighborhood: String(v) })" />
        </div>
      </TabsContent>

      <!-- Listing Details -->
      <TabsContent value="listing-details" class="flex-1 overflow-y-auto p-5 mt-0 flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <Label>Full Listing Description</Label>
            <span v-if="isFilled(listing.resources.listingDetails)" class="text-[10px] text-primary flex items-center gap-1">
              <Icon name="lucide:sparkles" class="size-3" /> AI filled
            </span>
          </div>
          <Textarea
            :model-value="listing.resources.listingDetails ?? ''" rows="12"
            placeholder="Full description for OTA listings..."
            @update:model-value="(v) => updateResources({ listingDetails: String(v) })"
          />
        </div>
      </TabsContent>

      <!-- Amenities -->
      <TabsContent value="amenities" class="flex-1 overflow-y-auto p-5 mt-0 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <Label>Amenities</Label>
          <Popover v-model:open="amenityPopoverOpen">
            <PopoverTrigger as-child>
              <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs">
                <Icon name="lucide:plus" class="size-3" /> Add
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-56 p-0" align="end">
              <div class="p-2">
                <Input v-model="amenitySearch" placeholder="Search..." class="h-7 text-xs" />
              </div>
              <ScrollArea class="h-48">
                <div class="space-y-1">
                  <div
                    v-for="a in filteredAmenities" :key="a"
                    class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    @click="addAmenity(a)"
                  >
                    {{ a }}
                  </div>
                  <p v-if="filteredAmenities.length === 0" class="px-2 py-1.5 text-xs text-muted-foreground">
                    No amenities found.
                  </p>
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
        <div class="flex flex-wrap gap-2">
          <Badge v-for="a in listing.amenities" :key="a" variant="secondary" class="text-xs gap-1 cursor-pointer" @click="removeAmenity(a)">
            {{ a }} <Icon name="lucide:x" class="size-3" />
          </Badge>
        </div>
      </TabsContent>

      <!-- SOPs -->
      <TabsContent value="sops" class="flex-1 overflow-y-auto p-5 mt-0 flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <Label>Standard Operating Procedures</Label>
          <Textarea
            :model-value="listing.resources.sops ?? ''" rows="14"
            placeholder="e.g. Check-in procedure, cleaning checklist, emergency contacts..."
            @update:model-value="(v) => updateResources({ sops: String(v) })"
          />
        </div>
      </TabsContent>

      <!-- Topics to Avoid -->
      <TabsContent value="topics" class="flex-1 overflow-y-auto p-5 mt-0 flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Label>Topics to Avoid</Label>
          <p class="text-xs text-muted-foreground">
            Topics the AI should not discuss with guests.
          </p>
          <div class="flex gap-2">
            <Input
              v-model="topicInput" placeholder="e.g. competitor pricing" class="flex-1"
              @keydown.enter="addTopic"
            />
            <Button size="sm" @click="addTopic">
              Add
            </Button>
          </div>
          <div class="flex flex-wrap gap-2 mt-2">
            <Badge v-for="t in listing.resources.topicsToAvoid" :key="t" variant="secondary" class="text-xs gap-1 cursor-pointer" @click="removeTopic(t)">
              {{ t }} <Icon name="lucide:x" class="size-3" />
            </Badge>
          </div>
        </div>
      </TabsContent>

      <!-- Property Upsells -->
      <TabsContent value="upsells" class="flex-1 overflow-y-auto p-5 mt-0 flex flex-col gap-4">
        <p class="text-sm text-muted-foreground">
          Link upsell services the AI can promote to guests.
        </p>
        <p class="text-xs text-muted-foreground italic">
          Upsell catalog integration coming soon.
        </p>
      </TabsContent>
    </Tabs>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingSetupFieldPanel.vue
git commit -m "feat(listings): add field panel with 6 tabs (Basics, Listing Details, Amenities, SOPs, Topics, Upsells)"
```

---

### Task 5: Create Setup Overlay Shell

**Files:**
- Create: `app/components/listings/ListingSetupOverlay.vue`

- [ ] **Step 1: Create the component**

```vue
<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'
import ListingSetupFieldPanel from '~/components/listings/ListingSetupFieldPanel.vue'
import ListingSetupResourcePanel from '~/components/listings/ListingSetupResourcePanel.vue'

const props = defineProps<{ listing: Listing, open: boolean }>()
const emit = defineEmits<{ 'update:open': [val: boolean], 'update': [listing: Listing] }>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex flex-col bg-background">
      <!-- Header -->
      <div class="flex items-center justify-between border-b px-5 py-3 flex-shrink-0">
        <div class="flex items-center gap-3">
          <Icon name="lucide:layout-panel-left" class="size-5 text-muted-foreground" />
          <h2 class="text-base font-semibold">
            Listing Setup
          </h2>
          <span class="text-sm text-muted-foreground">{{ listing.name }}</span>
        </div>
        <Button variant="ghost" size="sm" class="gap-1.5" @click="emit('update:open', false)">
          <Icon name="lucide:x" class="size-4" />
          Close
        </Button>
      </div>

      <!-- Two-panel body -->
      <div class="flex flex-1 overflow-hidden">
        <div class="flex-1 overflow-hidden">
          <ListingSetupFieldPanel :listing="listing" @update="emit('update', $event)" />
        </div>
        <div class="w-[300px] shrink-0 border-l overflow-hidden">
          <ListingSetupResourcePanel :listing="listing" @update="emit('update', $event)" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingSetupOverlay.vue
git commit -m "feat(listings): add listing setup overlay shell (two-panel full-screen)"
```

---

### Task 6: Create Test AI Dialog

**Files:**
- Create: `app/components/listings/ListingTestAIDialog.vue`

- [ ] **Step 1: Create the component**

```vue
<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing, open: boolean }>()
const emit = defineEmits<{ 'update:open': [val: boolean] }>()

interface Message { role: 'guest' | 'ai', text: string }

const messages = ref<Message[]>([
  { role: 'ai', text: `Hi! I'm the AI assistant for ${props.listing.name}. How can I help you today?` },
])
const input = ref('')
const isTyping = ref(false)
const scrollEl = ref<HTMLElement | null>(null)

const starters = [
  'What time is check-in?',
  'Is there parking available?',
  'What\'s the WiFi password?',
]

function getMockResponse(question: string): string {
  const q = question.toLowerCase()
  if (q.includes('check-in') || q.includes('checkin')) {
    const time = props.listing.resources.basics.checkInTime ?? '14:00'
    return `Check-in is at ${time}. Early check-in may be available upon request.`
  }
  if (q.includes('check-out') || q.includes('checkout')) {
    const time = props.listing.resources.basics.checkOutTime ?? '11:00'
    return `Check-out is at ${time}. Late check-out can be arranged for an additional fee.`
  }
  if (q.includes('parking')) {
    const hasParking = props.listing.amenities.includes('Parking')
    return hasParking
      ? 'Yes, free private parking is available on the property.'
      : 'Unfortunately there is no dedicated parking on-site. Street parking is available nearby.'
  }
  if (q.includes('wifi') || q.includes('wi-fi') || q.includes('internet')) {
    return 'WiFi details will be provided in your check-in instructions. The connection is high-speed and available throughout the property.'
  }
  if (q.includes('pool')) {
    const hasPool = props.listing.amenities.some(a => a.toLowerCase().includes('pool'))
    return hasPool
      ? 'Yes! The property has a private pool available for guests. Pool hours are 7am–10pm.'
      : 'This property does not have a pool, but there are nearby facilities available.'
  }
  return 'That\'s a great question! I\'ll check with the host and get back to you shortly. Is there anything else I can help with?'
}

async function send(text?: string) {
  const msg = (text ?? input.value).trim()
  if (!msg)
    return
  input.value = ''
  messages.value.push({ role: 'guest', text: msg })
  isTyping.value = true
  await nextTick()
  scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
  await new Promise(r => setTimeout(r, 900))
  messages.value.push({ role: 'ai', text: getMockResponse(msg) })
  isTyping.value = false
  await nextTick()
  scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-lg flex flex-col gap-0 p-0 h-[600px]">
      <DialogHeader class="px-5 py-4 border-b flex-shrink-0">
        <div class="flex items-center gap-2">
          <DialogTitle>Test AI</DialogTitle>
          <Badge variant="secondary" class="text-xs">
            Simulating guest view
          </Badge>
        </div>
        <DialogDescription>{{ listing.name }}</DialogDescription>
      </DialogHeader>

      <!-- Messages -->
      <div ref="scrollEl" class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        <div
          v-for="(msg, i) in messages" :key="i"
          class="flex"
          :class="msg.role === 'guest' ? 'justify-end' : 'justify-start'"
        >
          <div v-if="msg.role === 'ai'" class="flex items-end gap-2 max-w-[80%]">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#C8A84B]/20">
              <Icon name="lucide:bot" class="size-4 text-[#C8A84B]" />
            </div>
            <div class="rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
              {{ msg.text }}
            </div>
          </div>
          <div v-else class="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
            {{ msg.text }}
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="isTyping" class="flex items-end gap-2">
          <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#C8A84B]/20">
            <Icon name="lucide:bot" class="size-4 text-[#C8A84B]" />
          </div>
          <div class="rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
            <span class="animate-pulse">···</span>
          </div>
        </div>
      </div>

      <!-- Starter chips -->
      <div v-if="messages.length <= 1" class="flex flex-wrap gap-2 px-4 pb-2">
        <button
          v-for="s in starters" :key="s"
          class="rounded-full border px-3 py-1 text-xs hover:bg-accent transition-colors"
          @click="send(s)"
        >
          {{ s }}
        </button>
      </div>

      <!-- Input -->
      <div class="flex gap-2 border-t px-4 py-3 flex-shrink-0">
        <Input
          v-model="input" placeholder="Ask as a guest..." class="flex-1"
          @keydown.enter="send()"
        />
        <Button size="sm" :disabled="!input.trim() || isTyping" @click="send()">
          <Icon name="lucide:send" class="size-4" />
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingTestAIDialog.vue
git commit -m "feat(listings): add Test AI guest chat simulation dialog"
```

---

### Task 7: Wire Hero Schedule Prop

**Files:**
- Modify: `app/components/listings/ListingHeroCompact.vue`

- [ ] **Step 1: Add `openSchedule` prop and watcher**

In the `<script setup>` section, add after the existing props/emits:

```ts
const props = defineProps<{ listing: Listing, openSchedule?: boolean }>()
// ... existing emits ...

watch(() => props.openSchedule, (val) => {
  if (val)
    showScheduleSheet.value = true
})
```

- [ ] **Step 2: Verify no TS errors**

```bash
npx vue-tsc --noEmit 2>&1 | grep -i "listings/" || echo "No listing errors"
```

- [ ] **Step 3: Commit**

```bash
git add app/components/listings/ListingHeroCompact.vue
git commit -m "feat(listings): hero accepts openSchedule prop to programmatically open schedule sheet"
```

---

### Task 8: Wire Everything in Page Shell

**Files:**
- Modify: `app/pages/listings/[id].vue`

- [ ] **Step 1: Add imports and state**

Add to the imports:
```ts
import ListingFloatingMenu from '~/components/listings/ListingFloatingMenu.vue'
import ListingSetupOverlay from '~/components/listings/ListingSetupOverlay.vue'
import ListingTestAIDialog from '~/components/listings/ListingTestAIDialog.vue'
```

Add to the script setup body:
```ts
const showSetup = ref(false)
const showTestAi = ref(false)
const openSchedule = ref(false)

function handleOpenSchedule() {
  openSchedule.value = true
  nextTick(() => { openSchedule.value = false })
}
```

- [ ] **Step 2: Update the template**

Pass `openSchedule` to hero and add the three new components at the bottom of the `v-else` div:

```vue
<ListingHeroCompact :listing="listing" :open-schedule="openSchedule" @update="updateListing" />
```

At the bottom of the `v-else` div (after `</Tabs>`):

```vue
    <ListingFloatingMenu
      @open-setup="showSetup = true"
      @open-test-ai="showTestAi = true"
      @open-schedule="handleOpenSchedule"
    />

    <ListingSetupOverlay
      v-if="showSetup"
      :listing="listing"
      :open="showSetup"
      @update:open="showSetup = $event"
      @update="updateListing"
    />

    <ListingTestAIDialog
      :listing="listing"
      :open="showTestAi"
      @update:open="showTestAi = $event"
    />
```

- [ ] **Step 3: Verify no TS errors**

```bash
npx vue-tsc --noEmit 2>&1 | grep -i "listings/" || echo "No listing errors"
```

Expected: `No listing errors`

- [ ] **Step 4: Commit**

```bash
git add app/pages/listings/[id].vue
git commit -m "feat(listings): wire floating menu, setup overlay, test AI dialog in page shell"
```

---

### Task 9: Verify & Manual Test

- [ ] **Step 1: Run dev server**

```bash
pnpm run dev
```

- [ ] **Step 2: Navigate to lst-1**

Open `http://localhost:3000/listings/lst-1` and verify:

- Floating bar visible at bottom: "Listing Setup · Test AI · AI Schedule"
- Click **Listing Setup** → full-screen overlay opens with 6 tabs + resource panel
  - Basics tab: name, location, check-in/out, description (pre-filled from mock data)
  - Resource panel: 2 documents with download/delete, Elev8 AI checklist, Auto-Fill button
  - Auto-Fill: shows spinner 1.5s then fills description, toast appears
  - Copy from Property: opens dialog with search + listing list
  - Upload Document: file picker opens, accepts PDF/DOCX/TXT
- Click **Test AI** → chat dialog opens
  - Starter chips visible
  - Click "What time is check-in?" → AI responds with "14:00"
  - Type custom message → AI responds after ~1s
- Click **AI Schedule** → existing schedule sheet opens from hero

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix(listings): address issues found during manual testing"
```
