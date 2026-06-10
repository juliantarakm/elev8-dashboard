# Inventory KPI Cards + Warranty Alerts — Design Spec
**Date:** 2026-05-28
**Status:** Approved
**Scope:** KPI summary cards on Inventory page + static warranty alert entries in Notification Center

---

## Overview

Two small additions to the existing Inventory module:
1. **KPI Cards** — 4 summary metrics shown above the tabs on the Inventory page
2. **Warranty Alerts** — 2 static mock alerts in the Notification Center for items with expiring/expired warranties

---

## Feature 1: KPI Cards

### Placement
Above the `<Tabs>` in `app/pages/inventory/index.vue`, using the same `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4` layout as the Upsells orders KPI cards.

### Cards

| Card | Label | Value | Accent |
|------|-------|-------|--------|
| 1 | Total Items | `items.value.length` | — |
| 2 | Total Asset Value | Sum of `purchaseValue` for all permanent items, formatted as `IDR x,xxx,xxx` | — |
| 3 | Expiring Soon | Count of items where `warrantyExpiry` is within 30 days OR already expired | Amber text if > 0 |
| 4 | Damaged / Missing | Count of listing entries where `condition === 'damaged'` or `condition === 'missing'` | Red text if > 0 |

### Data Sources
- `useInventoryCatalog()` → `items` — for cards 1, 2, 3
- `useInventoryListings()` → `entries` — for card 4

### Computed Logic (inline in page, no new composable)

```ts
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
```

### Card Style
```vue
<div class="rounded-lg border p-4">
  <p class="text-sm text-muted-foreground">Label</p>
  <p class="text-2xl font-bold [conditional color class]">Value</p>
</div>
```
- Expiring Soon value: `class="text-2xl font-bold" :class="expiringSoonCount > 0 ? 'text-amber-600' : ''"` 
- Damaged value: `class="text-2xl font-bold" :class="damagedCount > 0 ? 'text-destructive' : ''"`

---

## Feature 2: Warranty Alerts (Static Mock)

### New Alert Types
Add to `AlertType` union in `app/components/notifications/data/alerts.ts`:
```ts
| 'WARRANTY_EXPIRING_SOON'
| 'WARRANTY_EXPIRED'
```

### Display Labels
```ts
WARRANTY_EXPIRING_SOON: 'Inventory — Warranty Expiring Soon',
WARRANTY_EXPIRED: 'Inventory — Warranty Expired',
```

### Route Map
Both route to `/inventory`:
```ts
WARRANTY_EXPIRING_SOON: '/inventory',
WARRANTY_EXPIRED: '/inventory',
```

### getDescription entries
```ts
WARRANTY_EXPIRING_SOON: (ctx) => `${ctx.itemName} warranty expires on ${ctx.expiryDate}.`,
WARRANTY_EXPIRED: (ctx) => `${ctx.itemName} warranty expired on ${ctx.expiryDate}.`,
```

### Mock Alert Entries (add to `mockAlerts`)

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

---

## Files Changed

| File | Change |
|------|--------|
| `app/pages/inventory/index.vue` | Add KPI cards + computed stats |
| `app/components/notifications/data/alerts.ts` | Add 2 alert types, labels, routes, descriptions, 2 mock entries |
