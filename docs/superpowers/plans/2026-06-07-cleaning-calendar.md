# Cleaning Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a shared cleaning job system with manual and auto-generated entries, surface it in `Listing Maintenance`, and add a dedicated `Cleaning Calendar` page.

**Architecture:** Add one shared cleaning data store and one shared form so both surfaces edit the same source of truth. The listing detail page will filter and display jobs for the active listing, while the new calendar page will present all jobs with filters and create/edit actions.

**Tech Stack:** Nuxt 3, Vue 3, shadcn-vue, Tailwind CSS v4, existing `useState`/reactive listing patterns.

---

### Task 1: Add shared cleaning domain data

**Files:**
- Create: `app/components/cleaning/data/cleaning-jobs.ts`
- Modify: `app/components/listings/data/listings.ts`

- [ ] **Step 1: Add the failing data contract expectations**

```ts
export type CleaningJobStatus = 'draft' | 'scheduled' | 'confirmed' | 'in_progress' | 'done' | 'cancelled'
export type CleaningJobPriority = 'low' | 'normal' | 'high' | 'urgent'
export type CleaningJobSource = 'manual' | 'checkout'

export interface CleaningJob {
  id: string
  listingId: string
  listingName: string
  scheduledAt: string
  cleanerId: string | null
  cleanerName: string | null
  teamName: string | null
  status: CleaningJobStatus
  priority: CleaningJobPriority
  durationMinutes: number
  notes: string
  source: CleaningJobSource
  reservationId?: string | null
  recurrence?: {
    enabled: boolean
    frequency: 'weekly' | 'monthly'
    interval: number
  } | null
}
```

- [ ] **Step 2: Implement the shared mock dataset**

```ts
export const cleaningJobs = ref<CleaningJob[]>([
  {
    id: 'cln-1',
    listingId: 'lst-1',
    listingName: '5BR Pool the R Villa Luwa – Serene near Canggu',
    scheduledAt: '2026-06-05T11:30:00+08:00',
    cleanerId: 'staff-3',
    cleanerName: 'Made Surya',
    teamName: 'Housekeeping',
    status: 'scheduled',
    priority: 'high',
    durationMinutes: 180,
    notes: 'Checkout cleaning after Sarah Mitchell departure.',
    source: 'checkout',
    reservationId: 'bk-1',
    recurrence: null,
  },
])
```

- [ ] **Step 3: Wire listing maintenance seed data to expose related cleaning jobs**

```ts
maintenance: {
  cleaningSchedule: [...],
  tasks: [...],
}
```

Expected: listing data remains intact; the new shared store is the single source of truth for calendar jobs.

- [ ] **Step 4: Verify the new module can be imported without breaking existing listing types**

Run: `npm run typecheck`
Expected: no new type errors from the added cleaning model imports.

### Task 2: Create shared cleaning store and helpers

**Files:**
- Create: `app/composables/useCleaningJobs.ts`

- [ ] **Step 1: Write the shared reactive store interface**

```ts
export function useCleaningJobs() {
  const jobs = useState<CleaningJob[]>('cleaning-jobs', () => cleaningJobs.value)
  return {
    jobs,
    jobsForListing(listingId: string) { /* ... */ },
    jobsForFilters(filters: CleaningFilters) { /* ... */ },
    createJob(input: CleaningJobInput) { /* ... */ },
    updateJob(id: string, patch: Partial<CleaningJob>) { /* ... */ },
    createFromCheckout(reservationId: string) { /* ... */ },
  }
}
```

- [ ] **Step 2: Implement mutation helpers with spread updates**

```ts
jobs.value = jobs.value.map(job => job.id === id ? { ...job, ...patch } : job)
```

- [ ] **Step 3: Add filter helpers for listing, cleaner, status, and priority**

```ts
interface CleaningFilters {
  listingIds: string[]
  cleanerIds: string[]
  statuses: CleaningJobStatus[]
  priorities: CleaningJobPriority[]
}
```

- [ ] **Step 4: Verify the store compiles and preserves reactivity**

Run: `npm run typecheck`
Expected: no errors from `useState` usage or helper typing.

### Task 3: Build reusable cleaning job form and card UI

**Files:**
- Create: `app/components/cleaning/CleaningJobForm.vue`
- Create: `app/components/cleaning/CleaningJobCard.vue`
- Create: `app/components/cleaning/CleaningFilters.vue`

- [ ] **Step 1: Write the shared form component**

```vue
<script setup lang="ts">
// accepts initial job or blank draft, emits save/cancel
</script>
```

- [ ] **Step 2: Add the reusable job card**

```vue
<script setup lang="ts">
// compact summary with listing, cleaner, time, duration, status, source
</script>
```

- [ ] **Step 3: Add filter controls for the calendar page**

```vue
<script setup lang="ts">
// multi-select filters for listing, cleaner, status, priority
</script>
```

- [ ] **Step 4: Verify the components render with placeholder props in a local page or story-like usage**

Run: `npm run typecheck`
Expected: the three components compile cleanly.

### Task 4: Extend Listing Maintenance with cleaning jobs

**Files:**
- Modify: `app/components/listings/ListingMaintenanceTab.vue`
- Modify: `app/pages/listings/[id].vue` if prop plumbing is needed

- [ ] **Step 1: Replace the static cleaning schedule section with cleaning job rendering backed by the shared store**

```vue
<CleaningJobCard v-for="job in jobsForListing(listing.id)" :key="job.id" :job="job" />
```

- [ ] **Step 2: Add a create dialog that reuses `CleaningJobForm`**

```vue
<CleaningJobForm :default-listing-id="listing.id" @save="createJob" />
```

- [ ] **Step 3: Keep the existing maintenance task area intact**

Expected: repairs/inspections stay visible; cleaning jobs become an additional section.

- [ ] **Step 4: Verify the listing page still updates reactively when jobs change**

Run: `npm run typecheck`
Expected: no prop/type mismatches from the maintenance tab changes.

### Task 5: Add the global Cleaning Calendar page and route entry

**Files:**
- Create: `app/pages/cleaning-calendar.vue`
- Modify: `app/components/layout/SidebarNavLink.vue` or the sidebar menu source used for primary nav

- [ ] **Step 1: Add the new page shell with filters and view controls**

```vue
<script setup lang="ts">
// useCleaningJobs + local filter state + create dialog
</script>
```

- [ ] **Step 2: Render all cleaning jobs in a calendar or agenda layout**

```vue
<CleaningJobCard v-for="job in filteredJobs" :key="job.id" :job="job" />
```

- [ ] **Step 3: Register the page in navigation**

```ts
{ label: 'Cleaning Calendar', to: '/cleaning-calendar', icon: 'lucide:calendar-days' }
```

- [ ] **Step 4: Verify the new route opens and the nav item is visible**

Run: `npm run typecheck`
Expected: page and sidebar links compile.

### Task 6: Add checkout-driven job creation flow

**Files:**
- Modify: `app/components/listings/ListingCalendarTab.vue` or the reservation source that already exposes checkout context
- Modify: `app/composables/useCleaningJobs.ts`

- [ ] **Step 1: Add a helper that maps a checkout reservation into a draft cleaning job**

```ts
function createFromCheckout(reservationId: string) {
  return createJob({ source: 'checkout', reservationId, status: 'draft', ... })
}
```

- [ ] **Step 2: Expose an action from any reservation context that can generate the cleaning job**

```vue
<Button variant="outline" @click="createFromCheckout(reservation.id)">
Create Cleaning
</Button>
```

- [ ] **Step 3: Ensure the created job is editable before confirmation**

Expected: generated jobs open in the same edit form and can be adjusted before final status.

- [ ] **Step 4: Verify the checkout flow does not break when reservation data is incomplete**

Run: `npm run typecheck`
Expected: fallback path remains manual creation.

### Task 7: Polish empty states, labels, and behavior

**Files:**
- Modify: `app/components/cleaning/CleaningJobCard.vue`
- Modify: `app/components/cleaning/CleaningFilters.vue`
- Modify: `app/components/listings/ListingMaintenanceTab.vue`
- Modify: `app/pages/cleaning-calendar.vue`

- [ ] **Step 1: Add empty states and clear-filters actions**
- [ ] **Step 2: Add status and source badges that match Elev8 semantics**
- [ ] **Step 3: Add toast feedback for create/update actions if the page already uses it elsewhere**
- [ ] **Step 4: Run the app and verify both views stay in sync after creating and editing a job**

Run: `npm run typecheck`
Expected: no remaining type issues.
