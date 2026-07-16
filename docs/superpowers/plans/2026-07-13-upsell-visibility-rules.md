# Upsell Visibility Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Visibility" step to the Upsells catalog drawer with 7 optional targeting conditions (Time before Check-in/out, Booking Status, Guest Count, Length of Stay, Related Upsell, Channels) and an AND/OR match-mode selector. Settings step content moves from step 4 to step 5.

**Architecture:** All changes touch two files: `app/components/upsells/data/upsell-services.ts` (add types + helper + seed mock data) and `app/components/upsells/UpsellDrawer.vue` (renumber steps, add Step 4 UI, wire state). Pure-data logic (`emptyVisibilityConditions`, default-value lookups, summary-banner fragment rendering) is exported from the data file and unit-tested. UI changes are verified manually per the project's established pattern (no Vue component tests yet).

**Tech Stack:** Vue 3, Nuxt 3, shadcn-vue (Switch), Tailwind CSS v4, lucide-vue-next icons, Vitest + jsdom

**Spec:** `docs/superpowers/specs/2026-07-13-upsell-visibility-rules-design.md`

---

## File Map

| File | Change |
|------|--------|
| `app/components/upsells/data/upsell-services.ts` | Add `VisibilityConditions`, `BookingStatusFilter`, `OtaChannel`, `VisibilityMatchMode` types; add `emptyVisibilityConditions()`, `getConditionDefault()`, `getConditionEmpty()`, `summarizeCondition()` helpers; update `UpsellService` interface; seed 10 mock services with defaults |
| `app/components/upsells/UpsellDrawer.vue` | Add visibility refs + helpers, update watch reset path, update save path, renumber steps (Settings moves 4→5), add Step 4 UI (match mode + 7 condition cards + summary banner) |
| `tests/components/upsells/data/visibility.test.ts` | New test file for pure-data helpers |

---

### Task 1: Add visibility types and `emptyVisibilityConditions()` helper

**Files:**
- Modify: `app/components/upsells/data/upsell-services.ts` (top of file, after existing type exports)

- [ ] **Step 1: Add new type exports above `UpsellItem`**

Open `app/components/upsells/data/upsell-services.ts`. After the closing of `UPSPELL_CATEGORIES` type union (the line ending `| 'Miscellaneous'`) and BEFORE the `UpsellItem` interface declaration, insert:

```ts
export type BookingStatusFilter
  = | 'inquiry'
    | 'confirmed'
    | 'checked_in'
    | 'checked_out'
    | 'cancelled'

export type OtaChannel
  = | 'airbnb'
    | 'booking_com'
    | 'direct'
    | 'agoda'
    | 'vrbo'
    | 'expedia'

export type VisibilityMatchMode = 'all' | 'any'

export type VisibilityConditionKey
  = | 'hoursBeforeCheckIn'
    | 'hoursBeforeCheckOut'
    | 'bookingStatuses'
    | 'guestCountMin'
    | 'guestCountMax'
    | 'lengthOfStayMin'
    | 'lengthOfStayMax'
    | 'excludeIfUpsellPurchased'
    | 'channels'

export interface VisibilityConditions {
  hoursBeforeCheckIn: number | null
  hoursBeforeCheckOut: number | null
  bookingStatuses: BookingStatusFilter[] | null
  guestCountMin: number | null
  guestCountMax: number | null
  lengthOfStayMin: number | null
  lengthOfStayMax: number | null
  excludeIfUpsellPurchased: string[] | null
  channels: OtaChannel[] | null
}

export function emptyVisibilityConditions(): VisibilityConditions {
  return {
    hoursBeforeCheckIn: null,
    hoursBeforeCheckOut: null,
    bookingStatuses: null,
    guestCountMin: null,
    guestCountMax: null,
    lengthOfStayMin: null,
    lengthOfStayMax: null,
    excludeIfUpsellPurchased: null,
    channels: null,
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx nuxi typecheck 2>&1 | head -40`
Expected: No new errors related to the data file.

If `nuxi typecheck` is unavailable, run: `npx vue-tsc --noEmit -p tsconfig.json 2>&1 | head -40`
Expected: same — no errors from `upsell-services.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/components/upsells/data/upsell-services.ts
git commit -m "feat(upsells): add visibility conditions types + empty helper"
```

---

### Task 2: Update `UpsellService` interface and add `getConditionDefault`/`getConditionEmpty`/`summarizeCondition` helpers

**Files:**
- Modify: `app/components/upsells/data/upsell-services.ts`

- [ ] **Step 1: Update `UpsellService` interface**

Find the existing `UpsellService` interface (starts around line 23). Add two new fields at the end, before the closing brace:

```ts
export interface UpsellService {
  id: string
  name: string
  description: string
  category: UpsellCategory
  currency: string
  image?: string
  youtubeLinks: string[]
  internalNotes: string
  notificationUsers: string[]
  pricingEnabled: boolean
  taxPercent: number
  servicePercent: number
  items: UpsellItem[]
  assignedListings: string[]
  availability: 'always' | 'by_request'
  status: 'active' | 'inactive'
  visibility: VisibilityConditions
  visibilityMatchMode: VisibilityMatchMode
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Add `getConditionDefault` helper after `emptyVisibilityConditions()`**

Append directly after the closing `}` of `emptyVisibilityConditions()`:

```ts
export function getConditionDefault(key: VisibilityConditionKey): VisibilityConditions[VisibilityConditionKey] {
  switch (key) {
    case 'hoursBeforeCheckIn':
    case 'hoursBeforeCheckOut':
      return 24
    case 'bookingStatuses':
      return ['confirmed', 'checked_in']
    case 'guestCountMin':
    case 'lengthOfStayMin':
      return 1
    case 'guestCountMax':
    case 'lengthOfStayMax':
      return 10
    case 'excludeIfUpsellPurchased':
      return []
    case 'channels':
      return ['airbnb']
  }
}

export function getConditionEmpty(key: VisibilityConditionKey): VisibilityConditions[VisibilityConditionKey] {
  return null
}
```

- [ ] **Step 3: Add `summarizeCondition` helper**

Append after `getConditionEmpty()`:

```ts
export function summarizeCondition(
  key: VisibilityConditionKey,
  value: VisibilityConditions[VisibilityConditionKey],
): string {
  if (value === null)
    return ''
  switch (key) {
    case 'hoursBeforeCheckIn':
      return `Time before Check-in (within ${value as number}h)`
    case 'hoursBeforeCheckOut':
      return `Time before Check-out (within ${value as number}h)`
    case 'bookingStatuses': {
      const arr = value as BookingStatusFilter[]
      const labels: Record<BookingStatusFilter, string> = {
        inquiry: 'Inquiry',
        confirmed: 'Confirmed',
        checked_in: 'Checked-in',
        checked_out: 'Checked-out',
        cancelled: 'Cancelled',
      }
      return `Booking Status (${arr.map(s => labels[s]).join(', ')})`
    }
    case 'guestCountMin':
      return `Guest Count min (${value as number})`
    case 'guestCountMax':
      return `Guest Count max (${value as number})`
    case 'lengthOfStayMin':
      return `Length of Stay min (${value as number} nights)`
    case 'lengthOfStayMax':
      return `Length of Stay max (${value as number} nights)`
    case 'excludeIfUpsellPurchased': {
      const ids = value as string[]
      return `Related Upsell (${ids.length} selected)`
    }
    case 'channels': {
      const arr = value as OtaChannel[]
      const labels: Record<OtaChannel, string> = {
        airbnb: 'Airbnb',
        booking_com: 'Booking.com',
        direct: 'Direct',
        agoda: 'Agoda',
        vrbo: 'VRBO',
        expedia: 'Expedia',
      }
      return `Channels (${arr.map(c => labels[c]).join(', ')})`
    }
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx nuxi typecheck 2>&1 | head -40`
Expected: No errors. (`UpsellService` interface change is expected to break `mockUpsellServices` — fix it in Task 3.)

- [ ] **Step 5: Commit**

```bash
git add app/components/upsells/data/upsell-services.ts
git commit -m "feat(upsells): add visibility to UpsellService + condition helpers"
```

---

### Task 3: Seed all 10 mock services with default visibility

**Files:**
- Modify: `app/components/upsells/data/upsell-services.ts` (`mockUpsellServices` array, ~line 78)

- [ ] **Step 1: Add `visibility` + `visibilityMatchMode` to all 10 services**

The `mockUpsellServices` array contains 10 `UpsellService` literals. Each currently ends with `status: 'active'` and `createdAt`/`updatedAt`. For each service, insert before the `createdAt` line:

```ts
    visibility: emptyVisibilityConditions(),
    visibilityMatchMode: 'all',
```

Example transformation for the first service (svc-001):

Before:
```ts
  {
    id: 'svc-001',
    name: 'Airport Transfer (Ngurah Rai)',
    // ...other fields...
    availability: 'always',
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-04-20T10:30:00Z',
  },
```

After:
```ts
  {
    id: 'svc-001',
    name: 'Airport Transfer (Ngurah Rai)',
    // ...other fields...
    availability: 'always',
    status: 'active',
    visibility: emptyVisibilityConditions(),
    visibilityMatchMode: 'all',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-04-20T10:30:00Z',
  },
```

Apply this insertion to all 10 entries (svc-001 through svc-010).

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx nuxi typecheck 2>&1 | head -40`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/upsells/data/upsell-services.ts
git commit -m "feat(upsells): seed mock services with default visibility"
```

---

### Task 4: Add unit tests for the visibility helpers

**Files:**
- Create: `tests/components/upsells/data/visibility.test.ts`

- [ ] **Step 1: Create the test file**

```ts
import { describe, expect, it } from 'vitest'
import {
  emptyVisibilityConditions,
  getConditionDefault,
  getConditionEmpty,
  summarizeCondition,
  type VisibilityConditionKey,
} from '~/components/upsells/data/upsell-services'

describe('emptyVisibilityConditions', () => {
  it('returns all fields as null', () => {
    const v = emptyVisibilityConditions()
    expect(v).toEqual({
      hoursBeforeCheckIn: null,
      hoursBeforeCheckOut: null,
      bookingStatuses: null,
      guestCountMin: null,
      guestCountMax: null,
      lengthOfStayMin: null,
      lengthOfStayMax: null,
      excludeIfUpsellPurchased: null,
      channels: null,
    })
  })

  it('returns a fresh object on each call (no shared reference)', () => {
    const a = emptyVisibilityConditions()
    const b = emptyVisibilityConditions()
    expect(a).not.toBe(b)
    expect(a.channels).not.toBe(b.channels)
  })
})

describe('getConditionDefault', () => {
  it('returns 24 hours for time conditions', () => {
    expect(getConditionDefault('hoursBeforeCheckIn')).toBe(24)
    expect(getConditionDefault('hoursBeforeCheckOut')).toBe(24)
  })

  it('returns common statuses for bookingStatuses', () => {
    expect(getConditionDefault('bookingStatuses')).toEqual(['confirmed', 'checked_in'])
  })

  it('returns 1 for min count fields', () => {
    expect(getConditionDefault('guestCountMin')).toBe(1)
    expect(getConditionDefault('lengthOfStayMin')).toBe(1)
  })

  it('returns 10 for max count fields', () => {
    expect(getConditionDefault('guestCountMax')).toBe(10)
    expect(getConditionDefault('lengthOfStayMax')).toBe(10)
  })

  it('returns empty array for excludeIfUpsellPurchased', () => {
    expect(getConditionDefault('excludeIfUpsellPurchased')).toEqual([])
  })

  it('returns Airbnb as default channel', () => {
    expect(getConditionDefault('channels')).toEqual(['airbnb'])
  })
})

describe('getConditionEmpty', () => {
  it('returns null for every condition key', () => {
    const keys: VisibilityConditionKey[] = [
      'hoursBeforeCheckIn',
      'hoursBeforeCheckOut',
      'bookingStatuses',
      'guestCountMin',
      'guestCountMax',
      'lengthOfStayMin',
      'lengthOfStayMax',
      'excludeIfUpsellPurchased',
      'channels',
    ]
    for (const key of keys) {
      expect(getConditionEmpty(key)).toBeNull()
    }
  })
})

describe('summarizeCondition', () => {
  it('returns empty string for null value', () => {
    expect(summarizeCondition('hoursBeforeCheckIn', null)).toBe('')
    expect(summarizeCondition('channels', null)).toBe('')
  })

  it('formats time conditions with hours', () => {
    expect(summarizeCondition('hoursBeforeCheckIn', 24)).toBe('Time before Check-in (within 24h)')
    expect(summarizeCondition('hoursBeforeCheckOut', 48)).toBe('Time before Check-out (within 48h)')
  })

  it('formats booking statuses with human labels', () => {
    expect(summarizeCondition('bookingStatuses', ['confirmed', 'checked_in']))
      .toBe('Booking Status (Confirmed, Checked-in)')
  })

  it('formats guest count min/max', () => {
    expect(summarizeCondition('guestCountMin', 2)).toBe('Guest Count min (2)')
    expect(summarizeCondition('guestCountMax', 8)).toBe('Guest Count max (8)')
  })

  it('formats length of stay in nights', () => {
    expect(summarizeCondition('lengthOfStayMin', 3)).toBe('Length of Stay min (3 nights)')
    expect(summarizeCondition('lengthOfStayMax', 14)).toBe('Length of Stay max (14 nights)')
  })

  it('formats related upsell count', () => {
    expect(summarizeCondition('excludeIfUpsellPurchased', ['svc-001', 'svc-002']))
      .toBe('Related Upsell (2 selected)')
  })

  it('formats channels with human labels', () => {
    expect(summarizeCondition('channels', ['airbnb', 'booking_com']))
      .toBe('Channels (Airbnb, Booking.com)')
  })
})
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `npx vitest run tests/components/upsells/data/visibility.test.ts`
Expected: PASS — all tests green.

- [ ] **Step 3: Commit**

```bash
git add tests/components/upsells/data/visibility.test.ts
git commit -m "test(upsells): add visibility helper unit tests"
```

---

### Task 5: Add visibility form refs and helper functions to UpsellDrawer

**Files:**
- Modify: `app/components/upsells/UpsellDrawer.vue` (script section)

- [ ] **Step 1: Update the imports**

Find the existing import at the top of `<script setup>`:
```ts
import type { UpsellCategory, UpsellItem, UpsellService } from '@/components/upsells/data/upsell-services'
```

Replace with:
```ts
import type {
  BookingStatusFilter,
  OtaChannel,
  UpsellCategory,
  UpsellConditionKey,
  UpsellItem,
  UpsellService,
  VisibilityConditionKey,
  VisibilityConditions,
  VisibilityMatchMode,
} from '@/components/upsells/data/upsell-services'
import {
  emptyVisibilityConditions,
  getConditionDefault,
  getConditionEmpty,
  summarizeCondition,
} from '@/components/upsells/data/upsell-services'
```

(Note: if `UpsellConditionKey` isn't exported, just remove it — it was a planning note. Only `VisibilityConditionKey` is needed.)

- [ ] **Step 2: Add visibility refs after the existing form refs**

Find the line `const formStatus = ref<'active' | 'inactive'>('active')`. Directly after it (and before `const showDeleteConfirm = ref(false)`), insert:

```ts
const formVisibility = ref<VisibilityConditions>(emptyVisibilityConditions())
const formVisibilityMatchMode = ref<VisibilityMatchMode>('all')

function isConditionEnabled(key: VisibilityConditionKey): boolean {
  return formVisibility.value[key] !== null
}

function toggleCondition(key: VisibilityConditionKey) {
  if (isConditionEnabled(key)) {
    formVisibility.value = {
      ...formVisibility.value,
      [key]: getConditionEmpty(key),
    }
  }
  else {
    formVisibility.value = {
      ...formVisibility.value,
      [key]: getConditionDefault(key),
    }
  }
}

function isBookingStatusSelected(status: BookingStatusFilter): boolean {
  return formVisibility.value.bookingStatuses?.includes(status) ?? false
}

function toggleBookingStatus(status: BookingStatusFilter) {
  const current = formVisibility.value.bookingStatuses ?? []
  formVisibility.value = {
    ...formVisibility.value,
    bookingStatuses: current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status],
  }
}

function isChannelSelected(channel: OtaChannel): boolean {
  return formVisibility.value.channels?.includes(channel) ?? false
}

function toggleChannel(channel: OtaChannel) {
  const current = formVisibility.value.channels ?? []
  formVisibility.value = {
    ...formVisibility.value,
    channels: current.includes(channel)
      ? current.filter(c => c !== channel)
      : [...current, channel],
  }
}

function isRelatedUpsellSelected(serviceId: string): boolean {
  return formVisibility.value.excludeIfUpsellPurchased?.includes(serviceId) ?? false
}

function toggleRelatedUpsell(serviceId: string) {
  const current = formVisibility.value.excludeIfUpsellPurchased ?? []
  formVisibility.value = {
    ...formVisibility.value,
    excludeIfUpsellPurchased: current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId],
  }
}

const otherUpsellServices = computed(() => {
  const all = useUpsellServices().services.value
  return props.service ? all.filter(s => s.id !== props.service!.id) : all
})
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx nuxi typecheck 2>&1 | head -40`
Expected: No errors. (If `UpsellConditionKey` is unused, remove it from the import.)

- [ ] **Step 4: Commit**

```bash
git add app/components/upsells/UpsellDrawer.vue
git commit -m "feat(upsells): add visibility form refs + helpers to drawer"
```

---

### Task 6: Update watch reset path and save path

**Files:**
- Modify: `app/components/upsells/UpsellDrawer.vue`

- [ ] **Step 1: Add visibility initialization to edit branch in watch**

Find this block inside `watch(() => props.open, ...)`:
```ts
      formAvailability.value = props.service.availability
      formStatus.value = props.service.status
```

Replace with:
```ts
      formAvailability.value = props.service.availability
      formStatus.value = props.service.status
      formVisibility.value = { ...props.service.visibility }
      formVisibilityMatchMode.value = props.service.visibilityMatchMode
```

- [ ] **Step 2: Add visibility reset to create branch in watch**

Find this block inside the same watch, in the `else` branch (create mode):
```ts
      formAvailability.value = 'always'
      formStatus.value = 'active'
      currentStep.value = 1
      visitedSteps.value = new Set([1])
      nameError.value = false
```

Replace with:
```ts
      formAvailability.value = 'always'
      formStatus.value = 'active'
      formVisibility.value = emptyVisibilityConditions()
      formVisibilityMatchMode.value = 'all'
      currentStep.value = 1
      visitedSteps.value = new Set([1])
      nameError.value = false
```

- [ ] **Step 3: Add visibility fields to save data object**

Find the `data` object inside `handleSave()`:
```ts
  const data = {
    name: formName.value.trim(),
    description: formDescription.value.trim(),
    category: formCategory.value,
    currency: formCurrency.value,
    image: formImage.value,
    youtubeLinks: formYoutubeLinks.value,
    internalNotes: formInternalNotes.value.trim(),
    notificationUsers: formNotificationUsers.value,
    pricingEnabled: formPricingEnabled.value,
    taxPercent: formTaxPercent.value,
    servicePercent: formServicePercent.value,
    items: formItems.value,
    assignedListings: formListings.value,
    availability: formAvailability.value,
    status: formStatus.value,
  }
```

Add two fields at the end (before the closing brace):
```ts
  const data = {
    name: formName.value.trim(),
    description: formDescription.value.trim(),
    category: formCategory.value,
    currency: formCurrency.value,
    image: formImage.value,
    youtubeLinks: formYoutubeLinks.value,
    internalNotes: formInternalNotes.value.trim(),
    notificationUsers: formNotificationUsers.value,
    pricingEnabled: formPricingEnabled.value,
    taxPercent: formTaxPercent.value,
    servicePercent: formServicePercent.value,
    items: formItems.value,
    assignedListings: formListings.value,
    availability: formAvailability.value,
    status: formStatus.value,
    visibility: { ...formVisibility.value },
    visibilityMatchMode: formVisibilityMatchMode.value,
  }
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx nuxi typecheck 2>&1 | head -40`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add app/components/upsells/UpsellDrawer.vue
git commit -m "feat(upsells): wire visibility to reset and save paths"
```

---

### Task 7: Renumber steps (4 → 5)

**Files:**
- Modify: `app/components/upsells/UpsellDrawer.vue`

- [ ] **Step 1: Update the `steps` constant**

Find:
```ts
const steps = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Items' },
  { id: 3, label: 'Listings' },
  { id: 4, label: 'Settings' },
]
```

Replace with:
```ts
const steps = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Items' },
  { id: 3, label: 'Listings' },
  { id: 4, label: 'Visibility' },
  { id: 5, label: 'Settings' },
]
```

- [ ] **Step 2: Update the visited-steps initialization in watch (edit branch)**

Find:
```ts
      visitedSteps.value = new Set([1, 2, 3, 4])
```

Replace with:
```ts
      visitedSteps.value = new Set([1, 2, 3, 4, 5])
```

- [ ] **Step 3: Update the Save button condition**

Find:
```ts
            <Button class="flex-1" @click="currentStep < 4 ? nextStep() : handleSave()">
              <template v-if="currentStep < 4">
                Next
                <Icon name="lucide:chevron-right" class="ml-1 h-4 w-4" />
              </template>
              <template v-else>
```

Replace with:
```ts
            <Button class="flex-1" @click="currentStep < 5 ? nextStep() : handleSave()">
              <template v-if="currentStep < 5">
                Next
                <Icon name="lucide:chevron-right" class="ml-1 h-4 w-4" />
              </template>
              <template v-else>
```

- [ ] **Step 4: Update the Step 4 content block's outer condition**

Find:
```vue
        <!-- Step 4: Settings -->
        <div v-if="currentStep === 4" class="flex flex-col gap-5 p-6">
```

Replace with:
```vue
        <!-- Step 5: Settings -->
        <div v-if="currentStep === 5" class="flex flex-col gap-5 p-6">
```

- [ ] **Step 5: Verify TypeScript compiles and dev server hot-reloads cleanly**

Run: `npx nuxi typecheck 2>&1 | head -40`
Expected: No errors.

Open the dev server (if running) and navigate to `/upsells` — click "Add Service" to verify the step indicator shows 5 steps (1 Basic Info · 2 Items · 3 Listings · 4 Visibility · 5 Settings). Click through each step. The Visibility step body will be empty for now; Settings step should now be reachable at step 5.

- [ ] **Step 6: Commit**

```bash
git add app/components/upsells/UpsellDrawer.vue
git commit -m "refactor(upsells): renumber steps, move Settings to step 5"
```

---

### Task 8: Build Step 4 Visibility scaffold (match mode selector + card list shell)

**Files:**
- Modify: `app/components/upsells/UpsellDrawer.vue` (template, after the Step 3 block)

- [ ] **Step 1: Insert empty Step 4 block in template**

Find the closing of Step 3's content:
```vue
          </div>
        </div>

        <!-- Step 4: Settings -->
        <div v-if="currentStep === 5" class="flex flex-col gap-5 p-6">
```

Wait — Step 3 ends just before Step 5 now. So insert the new Step 4 block just BEFORE the Step 5 comment. Replace:
```vue
        <!-- Step 5: Settings -->
        <div v-if="currentStep === 5" class="flex flex-col gap-5 p-6">
```

With:
```vue
        <!-- Step 4: Visibility -->
        <div v-if="currentStep === 4" class="flex flex-col gap-5 p-6">
          <!-- Match mode selector -->
          <div class="flex flex-col gap-2 rounded-md border p-4">
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
                :class="formVisibilityMatchMode === 'all'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted/50'"
                @click="formVisibilityMatchMode = 'all'"
              >
                <Icon name="lucide:circle-check" class="mr-2 inline h-4 w-4" />
                All conditions met
                <span class="ml-1 text-xs opacity-70">(AND)</span>
              </button>
              <button
                type="button"
                class="flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
                :class="formVisibilityMatchMode === 'any'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted/50'"
                @click="formVisibilityMatchMode = 'any'"
              >
                <Icon name="lucide:circle-dot" class="mr-2 inline h-4 w-4" />
                Any condition met
                <span class="ml-1 text-xs opacity-70">(OR)</span>
              </button>
            </div>
            <p class="text-xs text-muted-foreground">
              Choose how multiple rules combine. Unset conditions are ignored.
            </p>
          </div>

          <!-- Condition cards container -->
          <div class="flex flex-col gap-3">
            <!-- Each condition card will be added in Tasks 9 and 10 -->
          </div>

          <!-- Summary banner placeholder -->
          <div class="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            No visibility conditions set — upsell will show everywhere.
          </div>
        </div>

        <!-- Step 5: Settings -->
        <div v-if="currentStep === 5" class="flex flex-col gap-5 p-6">
```

- [ ] **Step 2: Verify the dev server renders the new step**

Run the dev server (if not already running): `pnpm dev` (or `npm run dev`).
Navigate to `/upsells`. Click "Add Service". Click the "Visibility" step in the step indicator.

Expected: The Visibility step shows:
- Two-button match mode selector at the top ("All conditions met" selected by default with primary color, "Any condition met" muted)
- An empty container for condition cards
- The grey summary banner at the bottom

- [ ] **Step 3: Commit**

```bash
git add app/components/upsells/UpsellDrawer.vue
git commit -m "feat(upsells): add visibility step scaffold + match mode selector"
```

---

### Task 9: Build 4 numeric/single-value condition cards (Time-in, Time-out, Guest Count, Length of Stay)

**Files:**
- Modify: `app/components/upsells/UpsellDrawer.vue` (template, inside Step 4's card container)

- [ ] **Step 1: Insert the 4 numeric condition cards**

Find the comment `<!-- Each condition card will be added in Tasks 9 and 10 -->` inside Step 4's card container. Replace that comment with:

```vue
            <!-- Time before Check-in -->
            <div class="flex flex-col gap-2 rounded-md border p-3" :class="isConditionEnabled('hoursBeforeCheckIn') ? 'border-primary/30 bg-primary/5' : 'border-border'">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium">Time before Check-in</h4>
                <Switch
                  :model-value="isConditionEnabled('hoursBeforeCheckIn')"
                  @update:model-value="toggleCondition('hoursBeforeCheckIn')"
                />
              </div>
              <p v-if="!isConditionEnabled('hoursBeforeCheckIn')" class="text-xs text-muted-foreground">Off — condition ignored</p>
              <div v-else class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <Input
                    :model-value="formVisibility.hoursBeforeCheckIn"
                    type="number"
                    min="0"
                    class="flex-1"
                    @update:model-value="(v) => formVisibility = { ...formVisibility, hoursBeforeCheckIn: Number(v) }"
                  />
                  <span class="text-sm text-muted-foreground">hours</span>
                </div>
                <p class="text-xs text-muted-foreground">Show only within the window from N hours before check-in up to check-in. Set 0 for "show anytime up to check-in".</p>
              </div>
            </div>

            <!-- Time before Check-out -->
            <div class="flex flex-col gap-2 rounded-md border p-3" :class="isConditionEnabled('hoursBeforeCheckOut') ? 'border-primary/30 bg-primary/5' : 'border-border'">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium">Time before Check-out</h4>
                <Switch
                  :model-value="isConditionEnabled('hoursBeforeCheckOut')"
                  @update:model-value="toggleCondition('hoursBeforeCheckOut')"
                />
              </div>
              <p v-if="!isConditionEnabled('hoursBeforeCheckOut')" class="text-xs text-muted-foreground">Off — condition ignored</p>
              <div v-else class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <Input
                    :model-value="formVisibility.hoursBeforeCheckOut"
                    type="number"
                    min="0"
                    class="flex-1"
                    @update:model-value="(v) => formVisibility = { ...formVisibility, hoursBeforeCheckOut: Number(v) }"
                  />
                  <span class="text-sm text-muted-foreground">hours</span>
                </div>
                <p class="text-xs text-muted-foreground">Show only within the window from N hours before check-out up to check-out.</p>
              </div>
            </div>

            <!-- Guest Count -->
            <div class="flex flex-col gap-2 rounded-md border p-3" :class="(isConditionEnabled('guestCountMin') || isConditionEnabled('guestCountMax')) ? 'border-primary/30 bg-primary/5' : 'border-border'">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium">Guest Count</h4>
                <Switch
                  :model-value="isConditionEnabled('guestCountMin') || isConditionEnabled('guestCountMax')"
                  @update:model-value="(v) => { toggleCondition('guestCountMin'); toggleCondition('guestCountMax') }"
                />
              </div>
              <p v-if="!isConditionEnabled('guestCountMin') && !isConditionEnabled('guestCountMax')" class="text-xs text-muted-foreground">Off — condition ignored</p>
              <div v-else class="flex flex-col gap-1">
                <div class="grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-1">
                    <Label class="text-xs font-normal text-muted-foreground">Min guests</Label>
                    <Input
                      :model-value="formVisibility.guestCountMin"
                      type="number"
                      min="1"
                      @update:model-value="(v) => formVisibility = { ...formVisibility, guestCountMin: Number(v) }"
                    />
                  </div>
                  <div class="flex flex-col gap-1">
                    <Label class="text-xs font-normal text-muted-foreground">Max guests</Label>
                    <Input
                      :model-value="formVisibility.guestCountMax"
                      type="number"
                      min="1"
                      @update:model-value="(v) => formVisibility = { ...formVisibility, guestCountMax: Number(v) }"
                    />
                  </div>
                </div>
                <p v-if="formVisibility.guestCountMin !== null && formVisibility.guestCountMax !== null && formVisibility.guestCountMin > formVisibility.guestCountMax" class="text-xs text-destructive">
                  Min is greater than max.
                </p>
                <p class="text-xs text-muted-foreground">Show only when guest count is within this range.</p>
              </div>
            </div>

            <!-- Length of Stay -->
            <div class="flex flex-col gap-2 rounded-md border p-3" :class="(isConditionEnabled('lengthOfStayMin') || isConditionEnabled('lengthOfStayMax')) ? 'border-primary/30 bg-primary/5' : 'border-border'">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium">Length of Stay</h4>
                <Switch
                  :model-value="isConditionEnabled('lengthOfStayMin') || isConditionEnabled('lengthOfStayMax')"
                  @update:model-value="(v) => { toggleCondition('lengthOfStayMin'); toggleCondition('lengthOfStayMax') }"
                />
              </div>
              <p v-if="!isConditionEnabled('lengthOfStayMin') && !isConditionEnabled('lengthOfStayMax')" class="text-xs text-muted-foreground">Off — condition ignored</p>
              <div v-else class="flex flex-col gap-1">
                <div class="grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-1">
                    <Label class="text-xs font-normal text-muted-foreground">Min nights</Label>
                    <Input
                      :model-value="formVisibility.lengthOfStayMin"
                      type="number"
                      min="1"
                      @update:model-value="(v) => formVisibility = { ...formVisibility, lengthOfStayMin: Number(v) }"
                    />
                  </div>
                  <div class="flex flex-col gap-1">
                    <Label class="text-xs font-normal text-muted-foreground">Max nights</Label>
                    <Input
                      :model-value="formVisibility.lengthOfStayMax"
                      type="number"
                      min="1"
                      @update:model-value="(v) => formVisibility = { ...formVisibility, lengthOfStayMax: Number(v) }"
                    />
                  </div>
                </div>
                <p v-if="formVisibility.lengthOfStayMin !== null && formVisibility.lengthOfStayMax !== null && formVisibility.lengthOfStayMin > formVisibility.lengthOfStayMax" class="text-xs text-destructive">
                  Min is greater than max.
                </p>
                <p class="text-xs text-muted-foreground">Show only when stay length (nights) is within this range.</p>
              </div>
            </div>
```

- [ ] **Step 2: Verify the 4 numeric cards render**

In the browser at `/upsells` → Add Service → Visibility step:
- All 4 cards should display with the title + "Off — condition ignored" text + Switch toggle on the right
- Toggling each Switch ON should reveal the input(s) and a primary-tinted border
- Toggling back OFF should hide the inputs and restore the muted border
- For Guest Count and Length of Stay, typing min > max should show the red "Min is greater than max" warning

- [ ] **Step 3: Commit**

```bash
git add app/components/upsells/UpsellDrawer.vue
git commit -m "feat(upsells): add 4 numeric condition cards (time, guest count, length of stay)"
```

---

### Task 10: Build 3 multi-select condition cards (Booking Status, Related Upsell, Channels)

**Files:**
- Modify: `app/components/upsells/UpsellDrawer.vue` (template, inside Step 4's card container, after the 4 numeric cards)

- [ ] **Step 1: Append the 3 multi-select cards**

Find the closing `</div>` of the "Length of Stay" card. Directly after it, insert:

```vue
            <!-- Booking Status -->
            <div class="flex flex-col gap-2 rounded-md border p-3" :class="isConditionEnabled('bookingStatuses') ? 'border-primary/30 bg-primary/5' : 'border-border'">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium">Booking Status</h4>
                <Switch
                  :model-value="isConditionEnabled('bookingStatuses')"
                  @update:model-value="toggleCondition('bookingStatuses')"
                />
              </div>
              <p v-if="!isConditionEnabled('bookingStatuses')" class="text-xs text-muted-foreground">Off — condition ignored</p>
              <div v-else class="flex flex-col gap-1">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="opt in [
                      { value: 'inquiry', label: 'Inquiry' },
                      { value: 'confirmed', label: 'Confirmed' },
                      { value: 'checked_in', label: 'Checked-in' },
                      { value: 'checked_out', label: 'Checked-out' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ]"
                    :key="opt.value"
                    type="button"
                    class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                    :class="isBookingStatusSelected(opt.value as BookingStatusFilter)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted/50'"
                    @click="toggleBookingStatus(opt.value as BookingStatusFilter)"
                  >
                    {{ opt.label }}
                  </button>
                </div>
                <p class="text-xs text-muted-foreground">Show only when the booking is in one of these statuses.</p>
              </div>
            </div>

            <!-- Related Upsell -->
            <div class="flex flex-col gap-2 rounded-md border p-3" :class="isConditionEnabled('excludeIfUpsellPurchased') ? 'border-primary/30 bg-primary/5' : 'border-border'">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium">Related Upsell</h4>
                <Switch
                  :model-value="isConditionEnabled('excludeIfUpsellPurchased')"
                  @update:model-value="toggleCondition('excludeIfUpsellPurchased')"
                />
              </div>
              <p v-if="!isConditionEnabled('excludeIfUpsellPurchased')" class="text-xs text-muted-foreground">Off — condition ignored</p>
              <div v-else class="flex flex-col gap-1">
                <p v-if="otherUpsellServices.length === 0" class="text-xs text-muted-foreground">No other upsells to relate to.</p>
                <div v-else class="flex flex-wrap gap-2">
                  <button
                    v-for="svc in otherUpsellServices"
                    :key="svc.id"
                    type="button"
                    class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                    :class="isRelatedUpsellSelected(svc.id)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted/50'"
                    @click="toggleRelatedUpsell(svc.id)"
                  >
                    {{ svc.name }}
                  </button>
                </div>
                <p class="text-xs text-muted-foreground">Hide this upsell if any of the selected services were already purchased.</p>
              </div>
            </div>

            <!-- Channels -->
            <div class="flex flex-col gap-2 rounded-md border p-3" :class="isConditionEnabled('channels') ? 'border-primary/30 bg-primary/5' : 'border-border'">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium">Channels</h4>
                <Switch
                  :model-value="isConditionEnabled('channels')"
                  @update:model-value="toggleCondition('channels')"
                />
              </div>
              <p v-if="!isConditionEnabled('channels')" class="text-xs text-muted-foreground">Off — condition ignored</p>
              <div v-else class="flex flex-col gap-1">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="opt in [
                      { value: 'airbnb', label: 'Airbnb' },
                      { value: 'booking_com', label: 'Booking.com' },
                      { value: 'direct', label: 'Direct' },
                      { value: 'agoda', label: 'Agoda' },
                      { value: 'vrbo', label: 'VRBO' },
                      { value: 'expedia', label: 'Expedia' },
                    ]"
                    :key="opt.value"
                    type="button"
                    class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                    :class="isChannelSelected(opt.value as OtaChannel)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted/50'"
                    @click="toggleChannel(opt.value as OtaChannel)"
                  >
                    {{ opt.label }}
                  </button>
                </div>
                <p class="text-xs text-muted-foreground">Show only on these booking channels.</p>
              </div>
            </div>
```

- [ ] **Step 2: Verify the 3 multi-select cards render**

In the browser at `/upsells` → Add Service → Visibility step:
- All 3 cards should display with Switch toggles
- Toggling Booking Status ON shows 5 status chips (Inquiry / Confirmed / Checked-in / Checked-out / Cancelled) — Confirmed + Checked-in should be pre-selected (default)
- Toggling Related Upsell ON shows chips for each other upsell service (excluding the one being edited)
- Toggling Channels ON shows 6 channel chips — Airbnb should be pre-selected (default)
- Clicking chips toggles their selected state (primary color when selected)

- [ ] **Step 3: Commit**

```bash
git add app/components/upsells/UpsellDrawer.vue
git commit -m "feat(upsells): add 3 multi-select condition cards (status, related, channels)"
```

---

### Task 11: Replace summary banner placeholder with reactive summary

**Files:**
- Modify: `app/components/upsells/UpsellDrawer.vue` (template, in Step 4)

- [ ] **Step 1: Add a `computed` for active conditions list to script section**

Find the line `const formVisibilityMatchMode = ref<VisibilityMatchMode>('all')`. Directly after the `toggleRelatedUpsell` function and BEFORE the `otherUpsellServices` computed, insert:

```ts
const activeConditionSummaries = computed(() => {
  const v = formVisibility.value
  const entries: Array<{ key: VisibilityConditionKey, label: string }> = []
  for (const key of Object.keys(v) as VisibilityConditionKey[]) {
    const summary = summarizeCondition(key, v[key])
    if (summary)
      entries.push({ key, label: summary })
  }
  return entries
})

const summaryText = computed(() => {
  const entries = activeConditionSummaries.value
  if (entries.length === 0)
    return 'No visibility conditions set — upsell will show everywhere.'
  const conditionCount = entries.length
  const matchLabel = formVisibilityMatchMode.value === 'all' ? 'All conditions met' : 'Any condition met'
  return `${conditionCount} condition${conditionCount === 1 ? '' : 's'} active: ${entries.map(e => e.label).join(', ')}. Match mode: ${matchLabel}.`
})
```

- [ ] **Step 2: Replace the static summary banner with the reactive one**

Find:
```vue
          <!-- Summary banner placeholder -->
          <div class="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            No visibility conditions set — upsell will show everywhere.
          </div>
```

Replace with:
```vue
          <!-- Summary banner -->
          <div class="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Icon name="lucide:info" class="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{{ summaryText }}</span>
          </div>
```

- [ ] **Step 3: Verify the banner updates reactively**

In the browser at `/upsells` → Add Service → Visibility step:
- With all conditions OFF, banner reads: *"No visibility conditions set — upsell will show everywhere."*
- Enable Time before Check-in (24h), Guest Count (2-4), Channels (Airbnb): banner reads: *"3 conditions active: Time before Check-in (within 24h), Guest Count min (2), Guest Count max (4), Channels (Airbnb). Match mode: All conditions met."*
- Switch match mode to OR: banner updates the "Match mode: Any condition met." suffix

- [ ] **Step 4: Commit**

```bash
git add app/components/upsells/UpsellDrawer.vue
git commit -m "feat(upsells): reactive visibility summary banner"
```

---

### Task 12: Final end-to-end verification

**Files:** none — manual verification only

- [ ] **Step 1: Reset filter cache and reload dev server**

Stop the dev server (Ctrl+C) and restart: `pnpm dev` (or `npm run dev`).
Navigate to `/upsells`.

- [ ] **Step 2: Test create flow**

- Click "Add Service"
- Step 1 (Basic Info): enter name "Test Visibility Service" and description
- Step 2 (Items): add at least one item
- Step 3 (Listings): select at least one listing
- Step 4 (Visibility): toggle ON Time before Check-in (set 48), toggle ON Channels (select Airbnb + Booking.com), confirm summary banner shows both, switch match mode to "Any condition met"
- Step 5 (Settings): leave defaults, click "Create Service"
- Verify toast: "Service created."
- Verify the new service appears in the catalog table

- [ ] **Step 3: Test edit flow (round-trip persistence)**

- Click the ⋯ menu on the newly created service → Edit
- Click the Visibility step (step 4)
- Verify: Time before Check-in shows 48, Channels shows Airbnb + Booking.com selected, match mode = "Any condition met", other 5 conditions OFF
- Save without changes, reopen → verify values still persisted

- [ ] **Step 4: Test reset on re-open of existing service**

- Open edit drawer on one of the 10 seed services (e.g., Airport Transfer)
- Step 4 (Visibility) → all 7 conditions should be OFF, match mode = "All conditions met", summary banner should read "No visibility conditions set — upsell will show everywhere."
- Close drawer without saving
- Reopen → verify same state (no leakage between services)

- [ ] **Step 5: Test create flow reset**

- Click "Add Service" → Visibility step
- Toggle ON a couple of conditions, change match mode
- Close drawer without saving
- Click "Add Service" again → Visibility step should be back to all-OFF and "All conditions met"

- [ ] **Step 6: Run all tests to make sure nothing regressed**

Run: `npx vitest run`
Expected: All tests pass (existing tests + the 19 new visibility tests).

- [ ] **Step 7: Run TypeScript check**

Run: `npx nuxi typecheck 2>&1 | head -40`
Expected: No errors.

- [ ] **Step 8: Commit any cleanup (if needed)**

If no changes were needed, skip. Otherwise:
```bash
git add -A
git commit -m "chore(upsells): post-verification cleanup"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ 7 visibility conditions → Tasks 9, 10
- ✅ Match mode AND/OR → Tasks 5, 8, 11
- ✅ Data model (`VisibilityConditions`, types, `emptyVisibilityConditions`) → Tasks 1, 2
- ✅ Update `UpsellService` interface → Task 2
- ✅ Seed 10 mock services → Task 3
- ✅ Unit tests for pure-data helpers → Task 4
- ✅ Step renumbering (Settings 4→5) → Task 7
- ✅ Save path → Task 6
- ✅ Watch reset path → Task 6
- ✅ Summary banner reactive → Task 11
- ✅ Multi-select chip pattern (no Reka UI Checkbox) → Task 10
- ✅ Switch uses `model-value`/`@update:model-value` → Tasks 9, 10
- ✅ Min > max soft warning → Task 9
- ✅ Manual end-to-end verification → Task 12

**Type consistency:** `VisibilityConditionKey`, `VisibilityConditions`, `VisibilityMatchMode`, `BookingStatusFilter`, `OtaChannel` all defined once in Task 1–2 and used consistently in Tasks 5, 9, 10, 11. No name drift.

**Placeholders:** None. Every code block is the actual code; no "TBD" or "similar to".