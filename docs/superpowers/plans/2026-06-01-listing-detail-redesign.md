# Listing Detail Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the listing detail page with photo gallery, tabbed layout (Overview, Property Settings, AI Schedule), editable amenities, and AI toggle/schedule.

**Architecture:** Split the monolithic `[id].vue` into focused child components. Each tab is its own component. Data model extended with `photos` and `aiSchedule` fields. All state is local/mock.

**Tech Stack:** Nuxt 3, Vue 3, shadcn-vue (reka-ui), Tailwind CSS v4, Unsplash for photos

---

## File Structure

| File | Responsibility |
|------|----------------|
| `app/pages/listings/[id].vue` | Page shell — hero + tabs |
| `app/components/listings/ListingHero.vue` | Photo gallery + header info |
| `app/components/listings/ListingOverview.vue` | Stats, amenities, OTA, tags |
| `app/components/listings/ListingPropertySettings.vue` | Details form + distribution channels |
| `app/components/listings/ListingAiSchedule.vue` | AI toggle + schedule config |
| `app/components/listings/data/listings.ts` | Extended Listing type + mock data |

---

### Task 1: Extend Listing Data Model

**Files:**
- Modify: `app/components/listings/data/listings.ts`

- [ ] **Step 1: Update Listing interface**

```typescript
export interface AiSchedule {
  enabled: boolean
  repeatType: 'weekly' | 'monthly'
  activeDays: number[]
  activeHours: {
    start: string
    end: string
  }
}

export interface Listing {
  id: string
  name: string
  property: string
  location: string
  tags: string[]
  otaConnected: string[]
  amenities: string[]
  room: string
  capacity: number
  aiStatus: 'active' | 'paused' | 'not_set'
  photos: string[]
  aiSchedule: AiSchedule
}
```

- [ ] **Step 2: Add photos and aiSchedule to all 16 mock listings**

For each listing, add:
```typescript
photos: [
  'https://images.unsplash.com/photo-XXXXX?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-XXXXX?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-XXXXX?w=800&h=600&fit=crop',
],
aiSchedule: {
  enabled: true,  // or false for paused/not_set listings
  repeatType: 'weekly',
  activeDays: [1, 2, 3, 4, 5],  // Mon-Fri
  activeHours: { start: '08:00', end: '22:00' },
}
```

Use Unsplash photo IDs related to Bali villas. Example IDs:
- `photo-1537996194471-e657df975ab4` (Bali villa pool)
- `photo-1582268611958-ebfd161ef9cf` (tropical resort)
- `photo-1600596542815-ffad4c1539a9` (luxury villa)

- [ ] **Step 3: Commit**

```bash
git add app/components/listings/data/listings.ts
git commit -m "feat: extend Listing type with photos and aiSchedule"
```

---

### Task 2: Create ListingHero Component

**Files:**
- Create: `app/components/listings/ListingHero.vue`

- [ ] **Step 1: Create ListingHero.vue**

```vue
<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{
  listing: Listing
}>()

const router = useRouter()

const aiStatusIcon: Record<string, string> = {
  active: 'lucide:bot',
  paused: 'lucide:bot-off',
  not_set: 'lucide:bot-off',
}

const aiStatusLabel: Record<string, string> = {
  active: 'AI Active',
  paused: 'AI Paused',
  not_set: 'AI Not Set',
}

const activePhotoIndex = ref(0)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-3">
      <Button variant="ghost" size="sm" class="h-8 gap-1.5 pl-2" @click="router.push('/listings')">
        <Icon name="lucide:arrow-left" class="size-4" />
        Back
      </Button>
    </div>

    <div class="relative overflow-hidden rounded-lg aspect-[16/9] bg-muted">
      <img
        :src="listing.photos[activePhotoIndex]"
        :alt="listing.name"
        class="w-full h-full object-cover"
      />
    </div>

    <div v-if="listing.photos.length > 1" class="flex gap-2 overflow-x-auto">
      <button
        v-for="(photo, index) in listing.photos"
        :key="index"
        class="shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-colors"
        :class="activePhotoIndex === index ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'"
        @click="activePhotoIndex = index"
      >
        <img :src="photo" :alt="`Photo ${index + 1}`" class="w-full h-full object-cover" />
      </button>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold tracking-tight">{{ listing.name }}</h1>
        <Badge
          :variant="listing.aiStatus === 'active' ? 'default' : 'secondary'"
          class="text-xs"
        >
          <Icon :name="aiStatusIcon[listing.aiStatus] || 'lucide:bot'" class="size-3 mr-1" />
          {{ aiStatusLabel[listing.aiStatus] || listing.aiStatus }}
        </Badge>
      </div>
      <div class="flex items-center gap-2 text-muted-foreground">
        <Icon name="lucide:map-pin" class="size-4" />
        <span class="text-sm">{{ listing.location }}</span>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingHero.vue
git commit -m "feat: add ListingHero component with photo gallery"
```

---

### Task 3: Create ListingOverview Component

**Files:**
- Create: `app/components/listings/ListingOverview.vue`

- [ ] **Step 1: Create ListingOverview.vue**

```vue
<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'
import { allTags } from '~/components/listings/data/listings'

const props = defineProps<{
  listing: Listing
}>()

const emit = defineEmits<{
  update: [listing: Listing]
}>()

const stats = computed(() => [
  { label: 'Capacity', value: `${props.listing.capacity} guests`, icon: 'lucide:users' },
  { label: 'Room Type', value: props.listing.room, icon: 'lucide:bed-double' },
  { label: 'Property', value: props.listing.property, icon: 'lucide:building-2' },
  { label: 'Location', value: props.listing.location, icon: 'lucide:map-pin' },
])

function otaIcon(ota: string) {
  return ota === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom'
}

const allAmenities = [
  'Pool', 'WiFi', 'AC', 'Kitchen', 'Parking', 'Garden', 'Beach Access',
  'Rooftop Deck', 'Plunge Pool', 'Yoga Deck', 'Hammock Deck', 'Nature Bath',
  'Ocean View', 'Cliff Deck', 'Surfboard Storage', 'Mountain View', 'Hot Tub',
  'Fireplace', 'River View', 'Bamboo Construction',
]

const amenitySearch = ref('')
const amenityPopoverOpen = ref(false)

const filteredAmenities = computed(() => {
  const available = allAmenities.filter(a => !props.listing.amenities.includes(a))
  if (!amenitySearch.value) return available
  return available.filter(a => a.toLowerCase().includes(amenitySearch.value.toLowerCase()))
})

function addAmenity(amenity: string) {
  const updated = { ...props.listing, amenities: [...props.listing.amenities, amenity] }
  emit('update', updated)
}

function removeAmenity(amenity: string) {
  const updated = { ...props.listing, amenities: props.listing.amenities.filter(a => a !== amenity) }
  emit('update', updated)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div v-for="stat in stats" :key="stat.label" class="flex items-center gap-3 rounded-lg border p-4">
        <div class="flex size-9 items-center justify-center rounded-full bg-muted">
          <Icon :name="stat.icon" class="size-4 text-muted-foreground" />
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-muted-foreground">{{ stat.label }}</span>
          <span class="text-sm font-medium">{{ stat.value }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold">Amenities</h3>
          <Popover v-model:open="amenityPopoverOpen">
            <PopoverTrigger as-child>
              <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs">
                <Icon name="lucide:plus" class="size-3" />
                Add
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-56 p-0" align="end">
              <div class="p-2">
                <Input v-model="amenitySearch" placeholder="Search amenities..." class="h-7 text-xs" />
              </div>
              <ScrollArea class="h-48">
                <div class="space-y-1">
                  <div
                    v-for="amenity in filteredAmenities"
                    :key="amenity"
                    class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    @click="addAmenity(amenity)"
                  >
                    {{ amenity }}
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
          <Badge
            v-for="amenity in listing.amenities"
            :key="amenity"
            variant="secondary"
            class="text-xs gap-1 cursor-pointer"
            @click="removeAmenity(amenity)"
          >
            {{ amenity }}
            <Icon name="lucide:x" class="size-3" />
          </Badge>
        </div>
      </div>

      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <h3 class="text-sm font-semibold">OTA Connections</h3>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="ota in listing.otaConnected"
            :key="ota"
            class="flex items-center gap-2 rounded-full border px-3 py-1.5"
          >
            <Icon :name="otaIcon(ota)" class="size-4" />
            <span class="text-sm">{{ ota }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <h3 class="text-sm font-semibold">Tags</h3>
        <div class="flex flex-wrap gap-2">
          <Badge v-for="tag in listing.tags" :key="tag" variant="outline" class="text-xs">
            {{ tag }}
          </Badge>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingOverview.vue
git commit -m "feat: add ListingOverview with editable amenities"
```

---

### Task 4: Create ListingPropertySettings Component

**Files:**
- Create: `app/components/listings/ListingPropertySettings.vue`

- [ ] **Step 1: Create ListingPropertySettings.vue**

```vue
<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{
  listing: Listing
}>()

const emit = defineEmits<{
  update: [listing: Listing]
}>()

const activeSubTab = ref('details')

const editForm = ref({
  name: props.listing.name,
  location: props.listing.location,
  capacity: props.listing.capacity,
  room: props.listing.room,
  property: props.listing.property,
})

watch(() => props.listing, (l) => {
  editForm.value = { name: l.name, location: l.location, capacity: l.capacity, room: l.room, property: l.property }
})

function saveDetails() {
  emit('update', { ...props.listing, ...editForm.value, capacity: Number(editForm.value.capacity) })
}

function otaIcon(ota: string) {
  return ota === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom'
}

const allOtas = ['Airbnb', 'Booking.com']
</script>

<template>
  <Tabs v-model="activeSubTab">
    <TabsList>
      <TabsTrigger value="details">Details</TabsTrigger>
      <TabsTrigger value="channels">Distribution Channels</TabsTrigger>
    </TabsList>

    <TabsContent value="details" class="mt-4">
      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <h3 class="text-sm font-semibold">Listing Details</h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <Label for="name">Listing Name</Label>
            <Input id="name" v-model="editForm.name" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="location">Location</Label>
            <Input id="location" v-model="editForm.location" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="capacity">Capacity</Label>
            <Input id="capacity" v-model.number="editForm.capacity" type="number" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="room">Room Type</Label>
            <Input id="room" v-model="editForm.room" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="property">Property</Label>
            <Input id="property" v-model="editForm.property" />
          </div>
        </div>
        <div class="flex justify-end">
          <Button size="sm" @click="saveDetails">Save Changes</Button>
        </div>
      </div>
    </TabsContent>

    <TabsContent value="channels" class="mt-4">
      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <h3 class="text-sm font-semibold">Distribution Channels</h3>
        <div class="flex flex-col gap-3">
          <div
            v-for="ota in allOtas"
            :key="ota"
            class="flex items-center justify-between rounded-lg border p-4"
          >
            <div class="flex items-center gap-3">
              <Icon :name="otaIcon(ota)" class="size-5" />
              <span class="text-sm font-medium">{{ ota }}</span>
            </div>
            <Badge :variant="listing.otaConnected.includes(ota) ? 'default' : 'secondary'" class="text-xs">
              {{ listing.otaConnected.includes(ota) ? 'Connected' : 'Not Connected' }}
            </Badge>
          </div>
        </div>
      </div>
    </TabsContent>
  </Tabs>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingPropertySettings.vue
git commit -m "feat: add ListingPropertySettings with details form and distribution channels"
```

---

### Task 5: Create ListingAiSchedule Component

**Files:**
- Create: `app/components/listings/ListingAiSchedule.vue`

- [ ] **Step 1: Create ListingAiSchedule.vue**

```vue
<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{
  listing: Listing
}>()

const emit = defineEmits<{
  update: [listing: Listing]
}>()

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const dayFullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const schedule = computed(() => props.listing.aiSchedule)

function toggleAi() {
  const newStatus = props.listing.aiStatus === 'active' ? 'paused' : 'active'
  emit('update', { ...props.listing, aiStatus: newStatus, aiSchedule: { ...schedule.value, enabled: newStatus === 'active' } })
}

function updateSchedule(patch: Partial<typeof schedule.value>) {
  emit('update', { ...props.listing, aiSchedule: { ...schedule.value, ...patch } })
}

function toggleDay(day: number) {
  const days = schedule.value.activeDays.includes(day)
    ? schedule.value.activeDays.filter(d => d !== day)
    : [...schedule.value.activeDays, day]
  updateSchedule({ activeDays: days })
}

const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

const previewHours = computed(() => {
  const start = parseInt(schedule.value.activeHours.start.split(':')[0])
  const end = parseInt(schedule.value.activeHours.end.split(':')[0])
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    active: start <= end ? (i >= start && i < end) : (i >= start || i < end),
  }))
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between rounded-lg border p-5">
      <div class="flex items-center gap-3">
        <div class="flex size-10 items-center justify-center rounded-full" :class="listing.aiStatus === 'active' ? 'bg-[#C8A84B]/10' : 'bg-muted'">
          <Icon :name="listing.aiStatus === 'active' ? 'lucide:bot' : 'lucide:bot-off'" class="size-5" :class="listing.aiStatus === 'active' ? 'text-[#C8A84B]' : 'text-muted-foreground'" />
        </div>
        <div>
          <p class="text-sm font-semibold">ElevAI {{ listing.aiStatus === 'active' ? 'Active' : 'Paused' }}</p>
          <p class="text-xs text-muted-foreground">Automated guest messaging</p>
        </div>
      </div>
      <Switch :checked="listing.aiStatus === 'active'" @update:checked="toggleAi" />
    </div>

    <div v-if="schedule.enabled" class="flex flex-col gap-6">
      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <h3 class="text-sm font-semibold">Repeat</h3>
        <Select :model-value="schedule.repeatType" @update:model-value="(val: string) => updateSchedule({ repeatType: val as 'weekly' | 'monthly' })">
          <SelectTrigger class="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <h3 class="text-sm font-semibold">Active Days</h3>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="(day, index) in dayNames"
            :key="index"
            variant="outline"
            size="sm"
            class="h-9 w-12 text-xs"
            :class="schedule.activeDays.includes(index) ? 'border-primary text-primary bg-primary/5' : ''"
            @click="toggleDay(index)"
          >
            {{ day }}
          </Button>
        </div>
      </div>

      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <h3 class="text-sm font-semibold">Active Hours</h3>
        <div class="flex items-center gap-3">
          <Select :model-value="schedule.activeHours.start" @update:model-value="(val: string) => updateSchedule({ activeHours: { ...schedule.activeHours, start: val } })">
            <SelectTrigger class="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="h in hours" :key="h" :value="h">{{ h }}</SelectItem>
            </SelectContent>
          </Select>
          <span class="text-sm text-muted-foreground">to</span>
          <Select :model-value="schedule.activeHours.end" @update:model-value="(val: string) => updateSchedule({ activeHours: { ...schedule.activeHours, end: val } })">
            <SelectTrigger class="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="h in hours" :key="h" :value="h">{{ h }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="mt-2">
          <p class="text-xs text-muted-foreground mb-2">24h Preview</p>
          <div class="flex gap-0.5">
            <div
              v-for="item in previewHours"
              :key="item.hour"
              class="flex-1 h-6 rounded-sm transition-colors"
              :class="item.active ? 'bg-[#C8A84B]' : 'bg-muted'"
              :title="`${String(item.hour).padStart(2, '0')}:00`"
            />
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-[10px] text-muted-foreground">00:00</span>
            <span class="text-[10px] text-muted-foreground">12:00</span>
            <span class="text-[10px] text-muted-foreground">23:00</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <Icon name="lucide:clock" class="size-8 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">Activate AI to configure schedule</p>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingAiSchedule.vue
git commit -m "feat: add ListingAiSchedule with toggle and schedule config"
```

---

### Task 6: Rewrite [id].vue with Tabbed Layout

**Files:**
- Modify: `app/pages/listings/[id].vue`

- [ ] **Step 1: Rewrite [id].vue**

```vue
<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'
import { listings } from '~/components/listings/data/listings'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const listingIndex = computed(() => listings.findIndex(l => l.id === route.params.id))
const listing = computed(() => listingIndex.value !== -1 ? listings[listingIndex.value] : undefined)

function updateListing(updated: Listing) {
  if (listingIndex.value !== -1) {
    listings[listingIndex.value] = updated
  }
}

const activeTab = ref('overview')
</script>

<template>
  <div v-if="!listing" class="flex flex-col items-center justify-center gap-4 py-24">
    <Icon name="lucide:alert-circle" class="size-12 text-muted-foreground" />
    <h2 class="text-lg font-semibold">Listing not found</h2>
    <Button variant="outline" size="sm" @click="router.push('/listings')">
      <Icon name="lucide:arrow-left" class="size-4" />
      Back to Listings
    </Button>
  </div>

  <div v-else class="flex flex-col gap-6">
    <ListingHero :listing="listing" />

    <Tabs v-model="activeTab">
      <TabsList>
        <TabsTrigger value="overview">
          <Icon name="lucide:layout-grid" class="mr-2 size-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Icon name="lucide:settings" class="mr-2 size-4" />
          Property Settings
        </TabsTrigger>
        <TabsTrigger value="schedule">
          <Icon name="lucide:clock" class="mr-2 size-4" />
          AI Schedule
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" class="mt-4">
        <ListingOverview :listing="listing" @update="updateListing" />
      </TabsContent>

      <TabsContent value="settings" class="mt-4">
        <ListingPropertySettings :listing="listing" @update="updateListing" />
      </TabsContent>

      <TabsContent value="schedule" class="mt-4">
        <ListingAiSchedule :listing="listing" @update="updateListing" />
      </TabsContent>
    </Tabs>
  </div>
</template>
```

- [ ] **Step 2: Verify navigation works**

Run dev server: `npm run dev`
Navigate to `/listings` → click a listing → verify detail page loads with tabs.

- [ ] **Step 3: Commit**

```bash
git add app/pages/listings/[id].vue
git commit -m "feat: rewrite listing detail page with tabbed layout"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Verify all tabs render**

Check each tab:
1. Overview — stats, editable amenities, OTA, tags
2. Property Settings — details form, distribution channels
3. AI Schedule — toggle, schedule config, time picker

- [ ] **Step 2: Verify amenity edit works**

Add an amenity via popover → verify it appears in the list.
Click X on an amenity → verify it's removed.

- [ ] **Step 3: Verify AI toggle works**

Toggle switch → verify AI status badge updates on hero.
Toggle off → verify schedule section shows "Activate AI" placeholder.

- [ ] **Step 4: Verify schedule config works**

Change repeat type → verify Select updates.
Toggle days → verify button states.
Change hours → verify timeline preview updates.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: listing detail page redesign complete"
```
