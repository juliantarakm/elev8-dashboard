# Listing Details Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the listing details page from 3-tab layout to a clean, spacious 6-tab layout with compact hero and new content sections (pricing, calendar, reviews, maintenance).

**Architecture:** Extend the `Listing` type with new fields (stats, pricing, bookings, reviews, maintenance), add mock data, replace the hero with a compact version, and build 6 focused tab components using existing shadcn-vue UI components.

**Tech Stack:** Nuxt 3, Vue 3, shadcn-vue, Tailwind CSS 4, TypeScript

---

## File Structure

| File | Responsibility |
|------|---------------|
| `app/components/listings/data/listings.ts` | Extended Listing type + mock data |
| `app/pages/listings/[id].vue` | Page shell — compact hero + 6 tabs |
| `app/components/listings/ListingHeroCompact.vue` | Compact hero (photo thumb + name + badges) |
| `app/components/listings/ListingOverviewTab.vue` | Stats cards + upcoming bookings + recent reviews |
| `app/components/listings/ListingPricingTab.vue` | Pricing management |
| `app/components/listings/ListingCalendarTab.vue` | Calendar + bookings list |
| `app/components/listings/ListingReviewsTab.vue` | Reviews + ratings |
| `app/components/listings/ListingMaintenanceTab.vue` | Maintenance tasks + cleaning schedule |
| `app/components/listings/ListingSettingsTab.vue` | Property details + amenities + OTA + AI schedule |

---

### Task 1: Extend Data Model & Mock Data

**Files:**
- Modify: `app/components/listings/data/listings.ts`

- [ ] **Step 1: Add new interfaces to listings.ts**

Add these interfaces after the existing `AiSchedule` interface:

```ts
export interface ListingStats {
  monthlyRevenue: number
  revenueTrend: number
  occupancyRate: number
  occupancyTrend: number
  avgRating: number
  totalReviews: number
}

export interface ListingPricing {
  nightlyRate: number
  cleaningFee: number
  serviceFee: number
  weeklyDiscount: number
  monthlyDiscount: number
  seasonalRates: Array<{ startDate: string, endDate: string, rate: number, label: string }>
}

export interface Booking {
  id: string
  guestName: string
  checkIn: string
  checkOut: string
  nights: number
  status: 'confirmed' | 'pending' | 'cancelled'
  revenue: number
  source: string
}

export interface Review {
  id: string
  guestName: string
  date: string
  rating: number
  text: string
  hostReply?: string
  categories: {
    cleanliness: number
    communication: number
    location: number
    value: number
  }
}

export interface MaintenanceTask {
  id: string
  title: string
  date: string
  assignedTo: string
  status: 'pending' | 'in_progress' | 'completed'
  type: 'cleaning' | 'repair' | 'inspection'
}

export interface ListingMaintenance {
  cleaningSchedule: Array<{ task: string, frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' }>
  tasks: MaintenanceTask[]
}
```

- [ ] **Step 2: Extend the Listing interface**

Add new fields to the existing `Listing` interface:

```ts
export interface Listing {
  // ... existing fields stay unchanged ...
  stats: ListingStats
  pricing: ListingPricing
  bookings: Booking[]
  blockedDates: string[]
  reviews: Review[]
  maintenance: ListingMaintenance
}
```

- [ ] **Step 3: Add mock data to the first listing (lst-1)**

Add these fields to the first listing object in the `listings` ref array:

```ts
stats: {
  monthlyRevenue: 4280,
  revenueTrend: 12,
  occupancyRate: 78,
  occupancyTrend: 5,
  avgRating: 4.8,
  totalReviews: 24,
},
pricing: {
  nightlyRate: 185,
  cleaningFee: 45,
  serviceFee: 25,
  weeklyDiscount: 10,
  monthlyDiscount: 20,
  seasonalRates: [
    { startDate: '2026-07-01', endDate: '2026-08-31', rate: 220, label: 'Peak Season' },
    { startDate: '2026-12-20', endDate: '2027-01-05', rate: 250, label: 'Holiday' },
  ],
},
bookings: [
  { id: 'bk-1', guestName: 'Sarah Mitchell', checkIn: '2026-06-05', checkOut: '2026-06-09', nights: 4, status: 'confirmed', revenue: 740, source: 'Airbnb' },
  { id: 'bk-2', guestName: 'James Kim', checkIn: '2026-06-12', checkOut: '2026-06-15', nights: 3, status: 'confirmed', revenue: 555, source: 'Booking.com' },
  { id: 'bk-3', guestName: 'Emma Wilson', checkIn: '2026-06-20', checkOut: '2026-06-25', nights: 5, status: 'pending', revenue: 925, source: 'Airbnb' },
],
blockedDates: ['2026-06-10', '2026-06-11'],
reviews: [
  { id: 'rv-1', guestName: 'Sarah Mitchell', date: '2026-05-20', rating: 5, text: 'Amazing villa! The pool was perfect and staff was incredibly helpful. Would definitely come back.', categories: { cleanliness: 5, communication: 5, location: 4, value: 5 } },
  { id: 'rv-2', guestName: 'David Lee', date: '2026-05-10', rating: 4, text: 'Great location and beautiful property. WiFi could be better but overall a wonderful stay.', hostReply: 'Thank you David! We have upgraded our WiFi since your visit.', categories: { cleanliness: 4, communication: 5, location: 5, value: 4 } },
  { id: 'rv-3', guestName: 'Anna Chen', date: '2026-04-28', rating: 5, text: 'Absolutely stunning property. The garden is beautiful and the rooms are spacious and clean.', categories: { cleanliness: 5, communication: 5, location: 5, value: 5 } },
],
maintenance: {
  cleaningSchedule: [
    { task: 'Pool cleaning', frequency: 'daily' },
    { task: 'Garden maintenance', frequency: 'weekly' },
    { task: 'Deep clean', frequency: 'biweekly' },
    { task: 'AC filter replacement', frequency: 'monthly' },
  ],
  tasks: [
    { id: 'mt-1', title: 'Fix leaking faucet - Master bathroom', date: '2026-06-03', assignedTo: 'Wayan Adi', status: 'pending', type: 'repair' },
    { id: 'mt-2', title: 'Pre-arrival deep clean', date: '2026-06-04', assignedTo: 'Made Surya', status: 'in_progress', type: 'cleaning' },
    { id: 'mt-3', title: 'Pool pump inspection', date: '2026-05-28', assignedTo: 'Wayan Adi', status: 'completed', type: 'inspection' },
  ],
},
```

- [ ] **Step 4: Add minimal mock data to remaining listings**

For listings `lst-2` through `lst-16`, add the same fields with varied values. Use a helper pattern to keep it DRY — create a `defaultListingExtras` object and spread it, then override a few values per listing for variety:

```ts
const defaultExtras = {
  stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
  pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
  bookings: [],
  blockedDates: [],
  reviews: [],
  maintenance: { cleaningSchedule: [], tasks: [] },
}
```

Spread `...defaultExtras` into each remaining listing object.

- [ ] **Step 5: Commit**

```bash
git add app/components/listings/data/listings.ts
git commit -m "feat(listings): extend data model with stats, pricing, bookings, reviews, maintenance"
```

---

### Task 2: Create Compact Hero Component

**Files:**
- Create: `app/components/listings/ListingHeroCompact.vue`

- [ ] **Step 1: Create ListingHeroCompact.vue**

```vue
<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing }>()
const router = useRouter()

const aiStatusLabel: Record<string, string> = {
  active: 'AI Active',
  paused: 'AI Paused',
  not_set: 'AI Not Set',
}

function otaIcon(ota: string) {
  return ota === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Button variant="ghost" size="sm" class="h-8 w-fit gap-1.5 pl-2" @click="router.push('/listings')">
      <Icon name="lucide:arrow-left" class="size-4" />
      Back
    </Button>

    <div class="flex items-center gap-4">
      <div class="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        <img :src="listing.photos[0]" :alt="listing.name" class="size-full object-cover">
      </div>

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-semibold tracking-tight">
            {{ listing.name }}
          </h1>
          <Badge :variant="listing.aiStatus === 'active' ? 'default' : 'secondary'" class="text-xs shrink-0">
            <Icon :name="listing.aiStatus === 'active' ? 'lucide:bot' : 'lucide:bot-off'" class="size-3 mr-1" />
            {{ aiStatusLabel[listing.aiStatus] }}
          </Badge>
        </div>

        <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Icon name="lucide:map-pin" class="size-3.5" />
          <span>{{ listing.location }}</span>
          <span class="text-muted-foreground/50">·</span>
          <span>{{ listing.property }}</span>
        </div>

        <div class="flex items-center gap-2">
          <div
            v-for="ota in listing.otaConnected"
            :key="ota"
            class="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5"
          >
            <Icon :name="otaIcon(ota)" class="size-3" />
            <span class="text-xs">{{ ota }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingHeroCompact.vue
git commit -m "feat(listings): add compact hero component"
```

---

### Task 3: Create Overview Tab Component

**Files:**
- Create: `app/components/listings/ListingOverviewTab.vue`

- [ ] **Step 1: Create ListingOverviewTab.vue**

```vue
<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing }>()
const emit = defineEmits<{ switchTab: [tab: string] }>()

const stats = computed(() => [
  { label: 'Monthly Revenue', value: `$${props.listing.stats.monthlyRevenue.toLocaleString()}`, trend: props.listing.stats.revenueTrend, icon: 'lucide:dollar-sign' },
  { label: 'Occupancy Rate', value: `${props.listing.stats.occupancyRate}%`, trend: props.listing.stats.occupancyTrend, icon: 'lucide:calendar-check' },
  { label: 'Avg Rating', value: `${props.listing.stats.avgRating}`, subtitle: `${props.listing.stats.totalReviews} reviews`, icon: 'lucide:star' },
  { label: 'Nightly Rate', value: `$${props.listing.pricing.nightlyRate}`, subtitle: 'avg across OTAs', icon: 'lucide:bed-double' },
])

const upcomingBookings = computed(() =>
  props.listing.bookings
    .filter(b => b.status !== 'cancelled')
    .slice(0, 3)
)

const recentReviews = computed(() => props.listing.reviews.slice(0, 2))

function formatDateRange(checkIn: string, checkOut: string) {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

function renderStars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card v-for="stat in stats" :key="stat.label" class="p-5">
        <div class="flex items-center gap-3">
          <div class="flex size-9 items-center justify-center rounded-full bg-muted">
            <Icon :name="stat.icon" class="size-4 text-muted-foreground" />
          </div>
          <div class="flex flex-col">
            <span class="text-xs text-muted-foreground">{{ stat.label }}</span>
            <span class="text-lg font-semibold">{{ stat.value }}</span>
            <span v-if="stat.trend !== undefined" class="text-xs" :class="stat.trend >= 0 ? 'text-green-500' : 'text-red-500'">
              {{ stat.trend >= 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}% vs last month
            </span>
            <span v-else-if="stat.subtitle" class="text-xs text-muted-foreground">{{ stat.subtitle }}</span>
          </div>
        </div>
      </Card>
    </div>

    <!-- Two Column: Bookings + Reviews -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Upcoming Bookings -->
      <Card class="p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold">
            Upcoming Bookings
          </h3>
          <Button variant="link" size="sm" class="h-auto p-0 text-xs" @click="emit('switchTab', 'calendar')">
            View Calendar →
          </Button>
        </div>
        <div class="flex flex-col gap-3">
          <div
            v-for="booking in upcomingBookings"
            :key="booking.id"
            class="flex items-center justify-between rounded-lg border p-3"
          >
            <div class="flex flex-col gap-0.5">
              <span class="text-sm font-medium">{{ formatDateRange(booking.checkIn, booking.checkOut) }}</span>
              <span class="text-xs text-muted-foreground">{{ booking.guestName }} · {{ booking.nights }} nights</span>
            </div>
            <Badge :variant="booking.status === 'confirmed' ? 'default' : 'secondary'" class="text-xs">
              {{ booking.status }}
            </Badge>
          </div>
          <div v-if="upcomingBookings.length === 0" class="text-sm text-muted-foreground text-center py-4">
            No upcoming bookings
          </div>
        </div>
      </Card>

      <!-- Recent Reviews -->
      <Card class="p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold">
            Recent Reviews
          </h3>
          <Button variant="link" size="sm" class="h-auto p-0 text-xs" @click="emit('switchTab', 'reviews')">
            View All →
          </Button>
        </div>
        <div class="flex flex-col gap-3">
          <div
            v-for="review in recentReviews"
            :key="review.id"
            class="rounded-lg border p-3"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium">{{ review.guestName }}</span>
              <span class="text-xs text-amber-500">{{ renderStars(review.rating) }}</span>
            </div>
            <p class="text-xs text-muted-foreground line-clamp-2">
              {{ review.text }}
            </p>
          </div>
          <div v-if="recentReviews.length === 0" class="text-sm text-muted-foreground text-center py-4">
            No reviews yet
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingOverviewTab.vue
git commit -m "feat(listings): add overview tab component"
```

---

### Task 4: Create Pricing Tab Component

**Files:**
- Create: `app/components/listings/ListingPricingTab.vue`

- [ ] **Step 1: Create ListingPricingTab.vue**

```vue
<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing }>()
const emit = defineEmits<{ update: [listing: Listing] }>()

const editForm = ref({
  nightlyRate: props.listing.pricing.nightlyRate,
  cleaningFee: props.listing.pricing.cleaningFee,
  serviceFee: props.listing.pricing.serviceFee,
  weeklyDiscount: props.listing.pricing.weeklyDiscount,
  monthlyDiscount: props.listing.pricing.monthlyDiscount,
})

watch(() => props.listing.pricing, (p) => {
  editForm.value = { nightlyRate: p.nightlyRate, cleaningFee: p.cleaningFee, serviceFee: p.serviceFee, weeklyDiscount: p.weeklyDiscount, monthlyDiscount: p.monthlyDiscount }
})

function savePricing() {
  emit('update', { ...props.listing, pricing: { ...props.listing.pricing, ...editForm.value } })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Base Pricing -->
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">
        Base Pricing
      </h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="flex flex-col gap-1.5">
          <Label>Nightly Rate ($)</Label>
          <Input v-model.number="editForm.nightlyRate" type="number" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Cleaning Fee ($)</Label>
          <Input v-model.number="editForm.cleaningFee" type="number" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Service Fee ($)</Label>
          <Input v-model.number="editForm.serviceFee" type="number" />
        </div>
      </div>
    </Card>

    <!-- Discounts -->
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">
        Discounts
      </h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <Label>Weekly Discount (%)</Label>
          <Input v-model.number="editForm.weeklyDiscount" type="number" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Monthly Discount (%)</Label>
          <Input v-model.number="editForm.monthlyDiscount" type="number" />
        </div>
      </div>
    </Card>

    <!-- Seasonal Rates -->
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">
        Seasonal Rates
      </h3>
      <Table v-if="listing.pricing.seasonalRates.length > 0">
        <TableHeader>
          <TableRow>
            <TableHead>Season</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="season in listing.pricing.seasonalRates" :key="season.label">
            <TableCell class="font-medium">
              {{ season.label }}
            </TableCell>
            <TableCell class="text-muted-foreground">
              {{ season.startDate }} → {{ season.endDate }}
            </TableCell>
            <TableCell>${{ season.rate }}/night</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p v-else class="text-sm text-muted-foreground">
        No seasonal rates configured.
      </p>
    </Card>

    <div class="flex justify-end">
      <Button @click="savePricing">
        Save Pricing
      </Button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingPricingTab.vue
git commit -m "feat(listings): add pricing tab component"
```

---

### Task 5: Create Calendar Tab Component

**Files:**
- Create: `app/components/listings/ListingCalendarTab.vue`

- [ ] **Step 1: Create ListingCalendarTab.vue**

```vue
<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { Listing } from '~/components/listings/data/listings'
import { getLocalTimeZone, today } from '@internationalized/date'

const props = defineProps<{ listing: Listing }>()

const selectedDate = ref<DateValue>(today(getLocalTimeZone()))

const bookingStatusColors: Record<string, string> = {
  confirmed: 'default',
  pending: 'secondary',
  cancelled: 'destructive',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const sortedBookings = computed(() =>
  [...props.listing.bookings].sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Calendar -->
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">
        Availability
      </h3>
      <div class="flex justify-center">
        <Calendar v-model="selectedDate" class="rounded-md border" />
      </div>
    </Card>

    <!-- Bookings List -->
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">
        All Bookings
      </h3>
      <div class="flex flex-col gap-3">
        <div
          v-for="booking in sortedBookings"
          :key="booking.id"
          class="flex items-center justify-between rounded-lg border p-4"
        >
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium">{{ booking.guestName }}</span>
            <span class="text-xs text-muted-foreground">
              {{ formatDate(booking.checkIn) }} → {{ formatDate(booking.checkOut) }} · {{ booking.nights }} nights
            </span>
            <span class="text-xs text-muted-foreground">via {{ booking.source }}</span>
          </div>
          <div class="flex flex-col items-end gap-1">
            <Badge :variant="bookingStatusColors[booking.status] as any" class="text-xs capitalize">
              {{ booking.status }}
            </Badge>
            <span class="text-sm font-medium">${{ booking.revenue }}</span>
          </div>
        </div>
        <div v-if="sortedBookings.length === 0" class="text-sm text-muted-foreground text-center py-4">
          No bookings yet
        </div>
      </div>
    </Card>

    <!-- Blocked Dates -->
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">
        Blocked Dates
      </h3>
      <div v-if="listing.blockedDates.length > 0" class="flex flex-wrap gap-2">
        <Badge v-for="date in listing.blockedDates" :key="date" variant="outline" class="text-xs">
          {{ formatDate(date) }}
        </Badge>
      </div>
      <p v-else class="text-sm text-muted-foreground">
        No blocked dates.
      </p>
    </Card>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingCalendarTab.vue
git commit -m "feat(listings): add calendar tab component"
```

---

### Task 6: Create Reviews Tab Component

**Files:**
- Create: `app/components/listings/ListingReviewsTab.vue`

- [ ] **Step 1: Create ListingReviewsTab.vue**

```vue
<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing }>()
const emit = defineEmits<{ update: [listing: Listing] }>()

const filterRating = ref<number | null>(null)

const avgCategories = computed(() => {
  const reviews = props.listing.reviews
  if (reviews.length === 0)
    return { cleanliness: 0, communication: 0, location: 0, value: 0 }
  const sum = reviews.reduce((acc, r) => ({
    cleanliness: acc.cleanliness + r.categories.cleanliness,
    communication: acc.communication + r.categories.communication,
    location: acc.location + r.categories.location,
    value: acc.value + r.categories.value,
  }), { cleanliness: 0, communication: 0, location: 0, value: 0 })
  const len = reviews.length
  return { cleanliness: sum.cleanliness / len, communication: sum.communication / len, location: sum.location / len, value: sum.value / len }
})

const filteredReviews = computed(() => {
  if (filterRating.value === null)
    return props.listing.reviews
  return props.listing.reviews.filter(r => r.rating === filterRating.value)
})

const replyText = ref<Record<string, string>>({})

function submitReply(reviewId: string) {
  const text = replyText.value[reviewId]
  if (!text?.trim())
    return
  const updatedReviews = props.listing.reviews.map(r =>
    r.id === reviewId ? { ...r, hostReply: text.trim() } : r
  )
  emit('update', { ...props.listing, reviews: updatedReviews })
  replyText.value[reviewId] = ''
}

function renderStars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Rating Summary -->
    <Card class="p-5">
      <div class="flex items-center gap-6 mb-4">
        <div class="text-center">
          <div class="text-3xl font-bold">
            {{ listing.stats.avgRating }}
          </div>
          <div class="text-xs text-muted-foreground">
            {{ listing.stats.totalReviews }} reviews
          </div>
        </div>
        <div class="flex-1 grid grid-cols-2 gap-3">
          <div v-for="(value, key) in avgCategories" :key="key" class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-xs capitalize">{{ key }}</span>
              <span class="text-xs font-medium">{{ value.toFixed(1) }}</span>
            </div>
            <Progress :model-value="value * 20" class="h-1.5" />
          </div>
        </div>
      </div>
    </Card>

    <!-- Filter -->
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        :class="filterRating === null ? 'border-primary' : ''"
        @click="filterRating = null"
      >
        All
      </Button>
      <Button
        v-for="r in [5, 4, 3, 2, 1]"
        :key="r"
        variant="outline"
        size="sm"
        :class="filterRating === r ? 'border-primary' : ''"
        @click="filterRating = r"
      >
        {{ r }}★
      </Button>
    </div>

    <!-- Reviews List -->
    <div class="flex flex-col gap-4">
      <Card v-for="review in filteredReviews" :key="review.id" class="p-5">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">{{ review.guestName }}</span>
            <span class="text-xs text-muted-foreground">{{ formatDate(review.date) }}</span>
          </div>
          <span class="text-sm text-amber-500">{{ renderStars(review.rating) }}</span>
        </div>
        <p class="text-sm text-muted-foreground mb-3">
          {{ review.text }}
        </p>

        <!-- Host Reply -->
        <div v-if="review.hostReply" class="rounded-lg bg-muted p-3 mt-2">
          <span class="text-xs font-medium">Host Reply:</span>
          <p class="text-xs text-muted-foreground mt-1">
            {{ review.hostReply }}
          </p>
        </div>

        <!-- Reply Form -->
        <div v-else class="flex gap-2 mt-3">
          <Textarea
            v-model="replyText[review.id]"
            placeholder="Write a reply..."
            class="min-h-[60px] text-xs"
          />
          <Button size="sm" class="shrink-0 self-end" @click="submitReply(review.id)">
            Reply
          </Button>
        </div>
      </Card>

      <div v-if="filteredReviews.length === 0" class="text-sm text-muted-foreground text-center py-8">
        No reviews matching this filter.
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingReviewsTab.vue
git commit -m "feat(listings): add reviews tab component"
```

---

### Task 7: Create Maintenance Tab Component

**Files:**
- Create: `app/components/listings/ListingMaintenanceTab.vue`

- [ ] **Step 1: Create ListingMaintenanceTab.vue**

```vue
<script setup lang="ts">
import type { Listing, MaintenanceTask } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing }>()
const emit = defineEmits<{ update: [listing: Listing] }>()

const showAddDialog = ref(false)
const newTask = ref({ title: '', assignedTo: '', type: 'cleaning' as MaintenanceTask['type'] })

const statusColors: Record<string, string> = {
  pending: 'secondary',
  in_progress: 'default',
  completed: 'outline',
}

const frequencyLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
}

const pendingTasks = computed(() => props.listing.maintenance.tasks.filter(t => t.status !== 'completed'))
const completedTasks = computed(() => props.listing.maintenance.tasks.filter(t => t.status === 'completed'))

function addTask() {
  if (!newTask.value.title.trim())
    return
  const task: MaintenanceTask = {
    id: `mt-${Date.now()}`,
    title: newTask.value.title.trim(),
    date: new Date().toISOString().split('T')[0],
    assignedTo: newTask.value.assignedTo || 'Unassigned',
    status: 'pending',
    type: newTask.value.type,
  }
  emit('update', {
    ...props.listing,
    maintenance: { ...props.listing.maintenance, tasks: [...props.listing.maintenance.tasks, task] },
  })
  newTask.value = { title: '', assignedTo: '', type: 'cleaning' }
  showAddDialog.value = false
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Cleaning Schedule -->
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">
        Cleaning Schedule
      </h3>
      <Table v-if="listing.maintenance.cleaningSchedule.length > 0">
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Frequency</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in listing.maintenance.cleaningSchedule" :key="item.task">
            <TableCell class="font-medium">
              {{ item.task }}
            </TableCell>
            <TableCell>
              <Badge variant="outline" class="text-xs">
                {{ frequencyLabels[item.frequency] }}
              </Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p v-else class="text-sm text-muted-foreground">
        No cleaning schedule configured.
      </p>
    </Card>

    <!-- Upcoming Tasks -->
    <Card class="p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold">
          Upcoming Tasks
        </h3>
        <Dialog v-model:open="showAddDialog">
          <DialogTrigger as-child>
            <Button size="sm" variant="outline" class="h-7 gap-1 text-xs">
              <Icon name="lucide:plus" class="size-3" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Maintenance Task</DialogTitle>
            </DialogHeader>
            <div class="flex flex-col gap-4 py-4">
              <div class="flex flex-col gap-1.5">
                <Label>Task Title</Label>
                <Input v-model="newTask.title" placeholder="e.g. Fix leaking faucet" />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label>Assigned To</Label>
                <Input v-model="newTask.assignedTo" placeholder="e.g. Wayan Adi" />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select v-model="newTask.type">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaning">
                      Cleaning
                    </SelectItem>
                    <SelectItem value="repair">
                      Repair
                    </SelectItem>
                    <SelectItem value="inspection">
                      Inspection
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button @click="addTask">
                Add Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div class="flex flex-col gap-3">
        <div
          v-for="task in pendingTasks"
          :key="task.id"
          class="flex items-center justify-between rounded-lg border p-3"
        >
          <div class="flex flex-col gap-0.5">
            <span class="text-sm font-medium">{{ task.title }}</span>
            <span class="text-xs text-muted-foreground">{{ formatDate(task.date) }} · {{ task.assignedTo }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="outline" class="text-xs capitalize">
              {{ task.type }}
            </Badge>
            <Badge :variant="statusColors[task.status] as any" class="text-xs capitalize">
              {{ task.status.replace('_', ' ') }}
            </Badge>
          </div>
        </div>
        <p v-if="pendingTasks.length === 0" class="text-sm text-muted-foreground text-center py-4">
          No pending tasks.
        </p>
      </div>
    </Card>

    <!-- Completed Tasks -->
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">
        Completed
      </h3>
      <div class="flex flex-col gap-3">
        <div
          v-for="task in completedTasks"
          :key="task.id"
          class="flex items-center justify-between rounded-lg border border-dashed p-3 opacity-60"
        >
          <div class="flex flex-col gap-0.5">
            <span class="text-sm font-medium line-through">{{ task.title }}</span>
            <span class="text-xs text-muted-foreground">{{ formatDate(task.date) }} · {{ task.assignedTo }}</span>
          </div>
          <Badge variant="outline" class="text-xs capitalize">
            {{ task.type }}
          </Badge>
        </div>
        <p v-if="completedTasks.length === 0" class="text-sm text-muted-foreground text-center py-4">
          No completed tasks.
        </p>
      </div>
    </Card>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingMaintenanceTab.vue
git commit -m "feat(listings): add maintenance tab component"
```

---

### Task 8: Create Settings Tab Component

**Files:**
- Create: `app/components/listings/ListingSettingsTab.vue`

- [ ] **Step 1: Create ListingSettingsTab.vue**

This combines the existing PropertySettings + AiSchedule into one tab with sections separated by `Separator`:

```vue
<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing }>()
const emit = defineEmits<{ update: [listing: Listing] }>()

// Property Details
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

// Amenities
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
function addAmenity(amenity: string) { emit('update', { ...props.listing, amenities: [...props.listing.amenities, amenity] }) }
function removeAmenity(amenity: string) { emit('update', { ...props.listing, amenities: props.listing.amenities.filter(a => a !== amenity) }) }

// OTA
function otaIcon(ota: string) { return ota === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom' }
const allOtas = ['Airbnb', 'Booking.com']

// AI Schedule
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const schedule = computed(() => props.listing.aiSchedule)
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

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

const previewHours = computed(() => {
  const start = Number.parseInt(schedule.value.activeHours.start.split(':')[0])
  const end = Number.parseInt(schedule.value.activeHours.end.split(':')[0])
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    active: start <= end ? (i >= start && i < end) : (i >= start || i < end),
  }))
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Property Details -->
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">
        Property Details
      </h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <Label>Listing Name</Label>
          <Input v-model="editForm.name" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Location</Label>
          <Input v-model="editForm.location" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Capacity</Label>
          <Input v-model.number="editForm.capacity" type="number" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Room Type</Label>
          <Input v-model="editForm.room" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Property</Label>
          <Input v-model="editForm.property" />
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <Button size="sm" @click="saveDetails">
          Save Changes
        </Button>
      </div>
    </Card>

    <Separator />

    <!-- Amenities -->
    <Card class="p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold">
          Amenities
        </h3>
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
    </Card>

    <Separator />

    <!-- Distribution Channels -->
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">
        Distribution Channels
      </h3>
      <div class="flex flex-col gap-3">
        <div v-for="ota in allOtas" :key="ota" class="flex items-center justify-between rounded-lg border p-4">
          <div class="flex items-center gap-3">
            <Icon :name="otaIcon(ota)" class="size-5" />
            <span class="text-sm font-medium">{{ ota }}</span>
          </div>
          <Badge :variant="listing.otaConnected.includes(ota) ? 'default' : 'secondary'" class="text-xs">
            {{ listing.otaConnected.includes(ota) ? 'Connected' : 'Not Connected' }}
          </Badge>
        </div>
      </div>
    </Card>

    <Separator />

    <!-- AI Schedule -->
    <Card class="p-5">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-full" :class="listing.aiStatus === 'active' ? 'bg-[#C8A84B]/10' : 'bg-muted'">
            <Icon :name="listing.aiStatus === 'active' ? 'lucide:bot' : 'lucide:bot-off'" class="size-5" :class="listing.aiStatus === 'active' ? 'text-[#C8A84B]' : 'text-muted-foreground'" />
          </div>
          <div>
            <p class="text-sm font-semibold">
              ElevAI {{ listing.aiStatus === 'active' ? 'Active' : 'Paused' }}
            </p>
            <p class="text-xs text-muted-foreground">
              Automated guest messaging
            </p>
          </div>
        </div>
        <Switch :checked="listing.aiStatus === 'active'" @update:checked="toggleAi" />
      </div>

      <div v-if="schedule.enabled" class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-2">
          <Label>Repeat</Label>
          <Select :model-value="schedule.repeatType" @update:model-value="(val: string) => updateSchedule({ repeatType: val as 'weekly' | 'monthly' })">
            <SelectTrigger class="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">
                Weekly
              </SelectItem>
              <SelectItem value="monthly">
                Monthly
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex flex-col gap-2">
          <Label>Active Days</Label>
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

        <div class="flex flex-col gap-2">
          <Label>Active Hours</Label>
          <div class="flex items-center gap-3">
            <Select :model-value="schedule.activeHours.start" @update:model-value="(val: string) => updateSchedule({ activeHours: { ...schedule.activeHours, start: val } })">
              <SelectTrigger class="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="h in hours" :key="h" :value="h">
                  {{ h }}
                </SelectItem>
              </SelectContent>
            </Select>
            <span class="text-sm text-muted-foreground">to</span>
            <Select :model-value="schedule.activeHours.end" @update:model-value="(val: string) => updateSchedule({ activeHours: { ...schedule.activeHours, end: val } })">
              <SelectTrigger class="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="h in hours" :key="h" :value="h">
                  {{ h }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="mt-2">
            <p class="text-xs text-muted-foreground mb-2">
              24h Preview
            </p>
            <div class="flex gap-0.5">
              <div
                v-for="item in previewHours"
                :key="item.hour"
                class="flex-1 h-6 rounded-sm transition-colors"
                :class="item.active ? 'bg-[#C8A84B]' : 'bg-muted'"
                :title="`${String(item.hour).padStart(2, '0')}:00`"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/listings/ListingSettingsTab.vue
git commit -m "feat(listings): add settings tab component (property + amenities + OTA + AI)"
```

---

### Task 9: Update Page Shell ([id].vue)

**Files:**
- Modify: `app/pages/listings/[id].vue`

- [ ] **Step 1: Replace the entire [id].vue with the new structure**

```vue
<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'
import { listings } from '~/components/listings/data/listings'
import ListingCalendarTab from '~/components/listings/ListingCalendarTab.vue'
import ListingHeroCompact from '~/components/listings/ListingHeroCompact.vue'
import ListingMaintenanceTab from '~/components/listings/ListingMaintenanceTab.vue'
import ListingOverviewTab from '~/components/listings/ListingOverviewTab.vue'
import ListingPricingTab from '~/components/listings/ListingPricingTab.vue'
import ListingReviewsTab from '~/components/listings/ListingReviewsTab.vue'
import ListingSettingsTab from '~/components/listings/ListingSettingsTab.vue'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const listingIndex = computed(() => listings.value.findIndex(l => l.id === route.params.id))
const listing = computed(() => listingIndex.value !== -1 ? listings.value[listingIndex.value] : undefined)

function updateListing(updated: Listing) {
  if (listingIndex.value !== -1) {
    listings.value[listingIndex.value] = updated
  }
}

const activeTab = ref('overview')
</script>

<template>
  <div v-if="!listing" class="flex flex-col items-center justify-center gap-4 py-24">
    <Icon name="lucide:alert-circle" class="size-12 text-muted-foreground" />
    <h2 class="text-lg font-semibold">
      Listing not found
    </h2>
    <Button variant="outline" size="sm" @click="router.push('/listings')">
      <Icon name="lucide:arrow-left" class="size-4" />
      Back to Listings
    </Button>
  </div>

  <div v-else class="flex flex-col gap-6">
    <ListingHeroCompact :listing="listing" />

    <Tabs v-model="activeTab">
      <TabsList>
        <TabsTrigger value="overview">
          <Icon name="lucide:layout-grid" class="mr-1.5 size-3.5" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="pricing">
          <Icon name="lucide:dollar-sign" class="mr-1.5 size-3.5" />
          Pricing
        </TabsTrigger>
        <TabsTrigger value="calendar">
          <Icon name="lucide:calendar" class="mr-1.5 size-3.5" />
          Calendar
        </TabsTrigger>
        <TabsTrigger value="reviews">
          <Icon name="lucide:star" class="mr-1.5 size-3.5" />
          Reviews
        </TabsTrigger>
        <TabsTrigger value="maintenance">
          <Icon name="lucide:wrench" class="mr-1.5 size-3.5" />
          Maintenance
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Icon name="lucide:settings" class="mr-1.5 size-3.5" />
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" class="mt-6">
        <ListingOverviewTab :listing="listing" @switch-tab="activeTab = $event" />
      </TabsContent>

      <TabsContent value="pricing" class="mt-6">
        <ListingPricingTab :listing="listing" @update="updateListing" />
      </TabsContent>

      <TabsContent value="calendar" class="mt-6">
        <ListingCalendarTab :listing="listing" />
      </TabsContent>

      <TabsContent value="reviews" class="mt-6">
        <ListingReviewsTab :listing="listing" @update="updateListing" />
      </TabsContent>

      <TabsContent value="maintenance" class="mt-6">
        <ListingMaintenanceTab :listing="listing" @update="updateListing" />
      </TabsContent>

      <TabsContent value="settings" class="mt-6">
        <ListingSettingsTab :listing="listing" @update="updateListing" />
      </TabsContent>
    </Tabs>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/pages/listings/[id].vue
git commit -m "feat(listings): update page shell with 6-tab layout and compact hero"
```

---

### Task 10: Delete Old Components

**Files:**
- Delete: `app/components/listings/ListingHero.vue`
- Delete: `app/components/listings/ListingOverview.vue`
- Delete: `app/components/listings/ListingPropertySettings.vue`
- Delete: `app/components/listings/ListingAiSchedule.vue`

- [ ] **Step 1: Remove old components**

```bash
rm app/components/listings/ListingHero.vue
rm app/components/listings/ListingOverview.vue
rm app/components/listings/ListingPropertySettings.vue
rm app/components/listings/ListingAiSchedule.vue
```

- [ ] **Step 2: Verify the app builds**

```bash
pnpm run build
```

Expected: Build succeeds with no errors referencing deleted components.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor(listings): remove old listing detail components"
```

---

### Task 11: Verify & Manual Test

- [ ] **Step 1: Run dev server**

```bash
pnpm run dev
```

- [ ] **Step 2: Navigate to a listing detail page**

Open `http://localhost:3000/listings/lst-1` and verify:
- Compact hero shows photo thumbnail, name, AI badge, location, OTA badges
- 6 tabs are visible and clickable
- Overview tab shows stats cards, upcoming bookings, recent reviews
- Pricing tab shows base pricing form, discounts, seasonal rates table
- Calendar tab shows calendar widget and bookings list
- Reviews tab shows rating summary, filter buttons, review cards with reply
- Maintenance tab shows cleaning schedule, tasks, add task dialog
- Settings tab shows property form, amenities, OTA channels, AI schedule

- [ ] **Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(listings): address any issues found during manual testing"
```
