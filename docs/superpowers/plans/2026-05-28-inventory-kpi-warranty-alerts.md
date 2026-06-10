# Inventory KPI Cards + Warranty Alerts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 KPI summary cards to the Inventory page and 2 static warranty alert entries in the Notification Center.

**Architecture:** KPI cards are computed inline in `app/pages/inventory/index.vue` using existing `useInventoryCatalog` and `useInventoryListings` composables — no new files. Warranty alerts are added as static mock data and new alert types in `app/components/notifications/data/alerts.ts`.

**Tech Stack:** Nuxt 3, Vue 3, `computed` (Vue auto-import), existing composables `useInventoryCatalog` + `useInventoryListings`

---

## Task 1: KPI Cards on Inventory Page

**Files:**
- Modify: `app/pages/inventory/index.vue`

- [ ] **Step 1: Replace the entire file with the updated version**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useInventoryCatalog } from '@/composables/useInventoryCatalog'
import { useInventoryListings } from '@/composables/useInventoryListings'

const activeTab = ref<'catalog' | 'listings'>('catalog')

const { items } = useInventoryCatalog()
const { entries } = useInventoryListings()

const totalAssetValue = computed(() =>
  items.value
    .filter(i => i.type === 'permanent')
    .reduce((sum, i) => sum + (i.purchaseValue ?? 0), 0),
)

const expiringSoonCount = computed(() => {
  const now = new Date()
  return items.value.filter((i) => {
    if (!i.warrantyExpiry)
      return false
    const diff = (new Date(i.warrantyExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 30
  }).length
})

const damagedCount = computed(() =>
  entries.value.filter(e => e.condition === 'damaged' || e.condition === 'missing').length,
)
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Inventory
        </h2>
        <p class="text-muted-foreground">
          Track assets and supplies across your property listings.
        </p>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">
          Total Items
        </p>
        <p class="text-2xl font-bold">
          {{ items.length }}
        </p>
      </div>
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">
          Total Asset Value
        </p>
        <p class="text-2xl font-bold">
          IDR {{ totalAssetValue.toLocaleString('id-ID') }}
        </p>
      </div>
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">
          Warranty Expiring / Expired
        </p>
        <p
          class="text-2xl font-bold"
          :class="expiringSoonCount > 0 ? 'text-amber-600' : ''"
        >
          {{ expiringSoonCount }}
        </p>
      </div>
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">
          Damaged / Missing
        </p>
        <p
          class="text-2xl font-bold"
          :class="damagedCount > 0 ? 'text-destructive' : ''"
        >
          {{ damagedCount }}
        </p>
      </div>
    </div>

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

- [ ] **Step 2: Verify visually**

Open `http://localhost:3000/dashboard/inventory`. Confirm:
- 4 KPI cards appear above the tabs in a 4-column grid
- "Total Items" shows 12
- "Total Asset Value" shows IDR with a large number
- "Warranty Expiring / Expired" shows a number > 0 in amber (Coffee Maker, Rice Cooker, AC Split, Smart TV are all expired/expiring)
- "Damaged / Missing" shows 1 in red (entry-009, Coffee Maker at BRATAN)

- [ ] **Step 3: Commit**

```bash
git add app/pages/inventory/index.vue
git commit -m "feat(inventory): add KPI summary cards"
```

---

## Task 2: Warranty Alert Types + Mock Entries

**Files:**
- Modify: `app/components/notifications/data/alerts.ts`

- [ ] **Step 1: Add the two new alert types to the `AlertType` union**

Find the end of the `AlertType` union (line 19, after `'DYNAMIC_TEMPLATE_FAILED'`) and add:

```ts
  | 'DYNAMIC_TEMPLATE_FAILED'
  | 'WARRANTY_EXPIRING_SOON'
  | 'WARRANTY_EXPIRED'
  // Upsell alert types (managed via useUpsellNotifications, surfaced here for display)
```

- [ ] **Step 2: Add display labels to `alertDisplayLabels`**

Add at the end of the `alertDisplayLabels` object (after `DYNAMIC_TEMPLATE_FAILED`):

```ts
  DYNAMIC_TEMPLATE_FAILED: 'Automated Message — Failed to Send',
  WARRANTY_EXPIRING_SOON: 'Inventory — Warranty Expiring Soon',
  WARRANTY_EXPIRED: 'Inventory — Warranty Expired',
```

- [ ] **Step 3: Add routes to `alertRouteMap`**

Add at the end of the `alertRouteMap` object (after `DYNAMIC_TEMPLATE_FAILED`):

```ts
  DYNAMIC_TEMPLATE_FAILED: '/',
  WARRANTY_EXPIRING_SOON: '/inventory',
  WARRANTY_EXPIRED: '/inventory',
```

- [ ] **Step 4: Add cases to `getDescription` switch statement**

Add before the `default` case:

```ts
    case 'WARRANTY_EXPIRING_SOON':
      return `${context.itemName} warranty expires on ${context.expiryDate}.`
    case 'WARRANTY_EXPIRED':
      return `${context.itemName} warranty expired on ${context.expiryDate}.`
    default:
      return ''
```

- [ ] **Step 5: Add mock alert entries to `mockAlerts`**

Append at the end of the `mockAlerts` array (after `alert-7`):

```ts
  {
    alert_id: 'alert-warranty-001',
    type: 'WARRANTY_EXPIRING_SOON',
    severity: 'WARNING',
    status: 'ACTIVE',
    listing_id: null,
    property_id: null,
    triggered_at: '2026-05-28T08:00:00.000Z',
    resolved_at: null,
    auto_resolve: false,
    resolve_condition: 'Warranty renewed or item replaced',
    context: { itemName: 'Smart TV 55"', expiryDate: 'Jun 10, 2026' },
  },
  {
    alert_id: 'alert-warranty-002',
    type: 'WARRANTY_EXPIRED',
    severity: 'WARNING',
    status: 'ACTIVE',
    listing_id: null,
    property_id: null,
    triggered_at: '2025-11-02T08:00:00.000Z',
    resolved_at: null,
    auto_resolve: false,
    resolve_condition: 'Warranty renewed or item replaced',
    context: { itemName: 'AC Split 1 PK', expiryDate: 'Nov 1, 2025' },
  },
```

- [ ] **Step 6: Verify visually**

Open `http://localhost:3000/dashboard/` and click the bell icon in the header. Confirm:
- The unread count badge increased by 2
- Two new WARNING alerts appear in the list:
  - "Inventory — Warranty Expiring Soon" → Smart TV 55" warranty expires on Jun 10, 2026.
  - "Inventory — Warranty Expired" → AC Split 1 PK warranty expired on Nov 1, 2025.
- Clicking either alert navigates to `/inventory`

- [ ] **Step 7: Commit**

```bash
git add app/components/notifications/data/alerts.ts
git commit -m "feat(inventory): add WARRANTY_EXPIRING_SOON and WARRANTY_EXPIRED alert types with mock data"
```
