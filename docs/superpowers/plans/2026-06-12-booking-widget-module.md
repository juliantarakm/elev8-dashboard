# Booking Widget Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Booking Widget module with its own index page, create/edit flow, and live preview, separate from Website Builder.

**Architecture:** The feature lives under a dedicated `booking-widget` page group with a list page and a tabbed editor page. State is kept in a local composable-backed `ref` store for now so the module can support multiple widgets without introducing backend dependencies. The editor uses three focused tabs: accommodation settings, booking system settings, and website embed settings, while a preview component renders the current widget configuration beside the form.

**Tech Stack:** Nuxt 3, Vue 3, shadcn-vue, Tailwind CSS, vue-sonner, existing Elev8 listing data/composables.

---

### Task 1: Create the standalone booking widget data model

**Files:**
- Create: `app/components/booking-widget/data/widgets.ts`
- Modify: `app/components/listings/data/listings.ts` only if a listing field is needed for eligibility checks

- [ ] **Step 1: Write the data shape and seed widgets**

```ts
export type BookingWidgetMode = 'single' | 'multi'

export interface BookingWidgetConfig {
  id: string
  name: string
  mode: BookingWidgetMode
  listingIds: string[]
  primaryListingId?: string | null
  accentColor: string
  cornerRadius: number
  depositPct: number
  minDaysBeforeArrival: number
  allowedDomains: string[]
  promoCodes: Array<{ code: string, discountType: '%' | 'fixed', value: number, active: boolean, redemptionCount: number }>
  embedVersion: 'v1'
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
}

export const bookingWidgets = ref<BookingWidgetConfig[]>([
  {
    id: 'bk-widget-1',
    name: 'Canggu Portfolio Widget',
    mode: 'multi',
    listingIds: ['lst-1', 'lst-3'],
    primaryListingId: null,
    accentColor: '#C8A84B',
    cornerRadius: 14,
    depositPct: 30,
    minDaysBeforeArrival: 2,
    allowedDomains: ['partner-bali.com'],
    promoCodes: [],
    embedVersion: 'v1',
    utmSource: 'partner-bali',
    utmMedium: 'partner-site',
    utmCampaign: 'summer-2026',
  },
])

export function useBookingWidgets() {
  function copyEmbedSnippet(widget: BookingWidgetConfig) {
    const listingAttr = widget.mode === 'single'
      ? `data-listing="${widget.primaryListingId ?? widget.listingIds[0] ?? ''}"`
      : `data-listings="${widget.listingIds.join(',')}"`

    return [
      '<' + 'script async src="https://booking.elev8-suite.com/v1/elev8-booking.js"></' + 'script>',
      '<div class="e8bk-root" ' + listingAttr + ' data-widget-id="' + widget.id + '"></div>',
    ].join('\n')
  }

  return { bookingWidgets, copyEmbedSnippet }
}
```

- [ ] **Step 2: Run a narrow typecheck on the new module**

Run: `pnpm typecheck`
Expected: the new file compiles; unrelated pre-existing errors elsewhere may still fail the full command.

- [ ] **Step 3: Keep the module self-contained**

Do not wire it into Website Builder. The module should own its own state and route tree.

### Task 2: Add the booking widget index page and route entry point

**Files:**
- Create: `app/pages/booking-widgets/index.vue`
- Modify: `app/pages/website-builder/index.vue` only to remove the widget link if it exists there
- Modify: `app/constants/menus.ts` if the sidebar needs a new nav item

- [ ] **Step 1: Write the list page scaffold**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
  <div class="flex flex-col gap-6 w-full">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Booking Widgets</h2>
        <p class="text-sm text-muted-foreground">Manage embeddable direct-booking widgets.</p>
      </div>
      <Button as-child>
        <NuxtLink to="/booking-widgets/new">
          <Icon name="i-lucide-plus" class="size-4 mr-2" />
          Create New
        </NuxtLink>
      </Button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Add a sidebar/nav entry**

Use the same pattern as other dashboard modules so the new page is reachable without going through Website Builder.

- [ ] **Step 3: Verify route resolution**

Run: `pnpm dev`
Expected: `/booking-widgets` opens the new module page.

### Task 3: Build the create/edit page with three tabs and preview

**Files:**
- Create: `app/pages/booking-widgets/new.vue`
- Create: `app/pages/booking-widgets/[id].vue`
- Create: `app/components/booking-widget/BookingWidgetPreview.vue`
- Create: `app/components/booking-widget/BookingWidgetTabs.vue` if a tab shell is worth extracting

- [ ] **Step 1: Define the tab layout and local form state**

```vue
<script setup lang="ts">
const activeTab = ref<'accommodation' | 'system' | 'embed'>('accommodation')
const form = reactive({
  name: '',
  mode: 'multi' as const,
  listingIds: [] as string[],
  primaryListingId: null as string | null,
  accentColor: '#C8A84B',
  cornerRadius: 12,
  depositPct: 30,
  minDaysBeforeArrival: 0,
  allowedDomains: [] as string[],
  promoCodes: [] as Array<{ code: string, discountType: '%' | 'fixed', value: number, active: boolean, redemptionCount: number }>,
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
})
</script>
```

- [ ] **Step 2: Add the Accommodation Setting tab**

Include listing selection, single vs multi mode, primary listing choice, eligibility badges, and selected listing chips. The tab should use the existing `listings` store and derive eligibility from photos, description, currency, and website availability.

- [ ] **Step 3: Add the Booking System Setting tab**

Include deposit %, lead time, promo codes, cancellation policy text, and visual settings like accent color and radius. Use local `v-model` state and a save button that writes back to the widget store.

- [ ] **Step 4: Add the Embed in Website tab**

Include allowed domains, wildcard domain support, UTM fields, code snippet display, and a copy button using `vue-sonner` for feedback.

- [ ] **Step 5: Add the live preview panel**

Place the preview beside the tabs on desktop and below them on small screens. The preview should update when the form state changes and should not depend on the final runtime script.

- [ ] **Step 6: Verify tab interaction and field entry**

Run: `pnpm typecheck`
Expected: the tab components compile; the form should not rely on `readonly` fields for editable values.

### Task 4: Remove the old Website Builder coupling

**Files:**
- Modify: `app/pages/website-builder/index.vue`
- Modify: `app/components/booking-widget/data/widgets.ts` if any shared state needs renaming

- [ ] **Step 1: Remove widget references from Website Builder**

The Website Builder page should stop advertising booking widget as a sibling action once the standalone module is live.

- [ ] **Step 2: Keep the old widget preview code from leaking into the builder**

Only the new booking widget module should own widget create/edit behavior.

- [ ] **Step 3: Smoke test the navigation flow**

Open the list page, create a widget, switch tabs, and return to the list page without losing state unexpectedly.

### Task 5: Local QA for layout and field behavior

**Files:**
- Modify only if issues are found in the new booking widget files

- [ ] **Step 1: Check the desktop layout**

Confirm that the tab content, preview, and snippet panel do not overlap or collapse awkwardly on wide screens.

- [ ] **Step 2: Check mobile layout**

Confirm the preview stacks below the form, long labels wrap cleanly, and the snippet area stays readable.

- [ ] **Step 3: Check input behavior**

Try typing into the widget name, accent color, radius, deposit, and lead-time fields. Confirm `v-model` updates do not fight each other and saved state updates the store.

- [ ] **Step 4: Record residual repo-wide type errors separately**

If `pnpm typecheck` still fails, capture only the errors introduced by this module and ignore unrelated legacy errors in finance/inbox/journeys.

