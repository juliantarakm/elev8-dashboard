# Upsells Catalog Page — Design Spec

**Date:** 2026-05-23
**Status:** Approved
**Approach:** Data Table + Side Drawer (Approach 2)

## Purpose

CRUD catalog page for managing upsell services offered to guests at Bali vacation rental properties. Staff can create, edit, deactivate, and delete upsell services with category grouping, image support, and per-listing assignment.

## Data Model

```ts
type UpsellCategory =
  | 'Vehicle Rental'
  | 'Airport Transport'
  | 'Private Chef'
  | 'Spa'
  | 'Activity'
  | 'Late Check-out'
  | 'Early Check-in'
  | 'Mid-stay Cleaning'
  | 'Office Equipment'
  | 'Baby'
  | 'Pet'
  | 'Miscellaneous'

interface UpsellService {
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
```

Categories reuse existing `UpsellType` union from `app/components/finance/data/upsells.ts` for consistency.

## File Structure

```
app/pages/upsells.vue                       — Thin page shell
app/components/upsells/
  data/upsell-services.ts                   — Types + mock data (10 services)
  UpsellTable.vue                           — Data table with columns
  UpsellFilterBar.vue                       — Category, status, listing filters
  UpsellDrawer.vue                          — Sheet drawer for create/edit/delete
app/composables/useUpsellServices.ts        — Reactive state + CRUD actions
```

## Page Layout

### Header
- `h2` "Upsells" + `p.text-muted-foreground` subtitle
- Button "Add Service" (right-aligned, `lucide:plus` icon)

### Filter Bar (`UpsellFilterBar.vue`)
- **Category**: Select dropdown (all categories from `UpsellCategory`)
- **Status**: Select dropdown (All / Active / Inactive)
- **Listing**: Select dropdown (all active listings)
- All filters optional — empty = show all

### Data Table (`UpsellTable.vue`)
Columns:
1. **Image** — Thumbnail (40x40 rounded, placeholder if no image)
2. **Name** — Service name, bold
3. **Category** — Badge with category label
4. **Price** — Formatted with currency (e.g. "IDR 350,000")
5. **Listings** — Count badge (e.g. "3 listings")
6. **Status** — Badge: `default` variant for active, `secondary` for inactive
7. **Actions** — `⋯` dropdown menu (Edit, Deactivate/Activate, Delete)

Row click → open drawer in edit mode.

### Drawer (`UpsellDrawer.vue`)
Sheet component sliding from right. Two modes: Create / Edit.

**Fields:**
- Name (Input, required)
- Description (Textarea)
- Category (Select from `UpsellCategory`, required)
- Price (Number input, required)
- Currency (Select, default IDR)
- Image (Upload area — placeholder with `lucide:image-plus` icon for now; image URL input)
- Assigned Listings (Multi-select checkboxes grouped by listing name)
- Status (Switch toggle, default active)

**Footer:**
- Create mode: Cancel + Create Service button
- Edit mode: Cancel + Save Changes button + Delete (destructive, with AlertDialog confirmation)

## Composable: `useUpsellServices`

```ts
// State
services: useState<UpsellService[]>
filters: { category, status, listing }

// Computed
filteredServices: computed — applies active filters
activeServices: computed — services with status 'active'
categories: UpsellCategory[] — static list

// Actions
addService(service: Omit<UpsellService, 'id' | 'createdAt' | 'updatedAt'>): void
updateService(id: string, updates: Partial<UpsellService>): void
deleteService(id: string): void
toggleStatus(id: string): void — toggles active ↔ inactive
```

Uses `useState<T>()` for SSR-safe reactive state. Mutations use spread syntax for Vue reactivity.

## Sidebar Navigation

Add "Upsells" entry to `navMenu` in `app/constants/menus.ts`:
- **Group**: General
- **Position**: After Tasks, before Finance
- **Icon**: `lucide:sparkles` or `lucide:tag`
- **Route**: `/upsells`

## Mock Data

10 realistic Bali vacation rental services:

| Name | Category | Price (IDR) | Listings |
|------|----------|-------------|----------|
| Airport Transfer (Ngurah Rai) | Airport Transport | 350,000 | All |
| Private Chef - Dinner | Private Chef | 1,500,000 | Villa Properties |
| In-Villa Spa Treatment | Spa | 800,000 | All |
| Ubud Rice Terrace Tour | Activity | 600,000 | All |
| Surf Lesson at Canggu | Activity | 500,000 | Beach Properties |
| Late Check-out (until 2pm) | Late Check-out | 450,000 | All |
| Early Check-in (from 10am) | Early Check-in | 450,000 | All |
| Scooter Rental (Daily) | Vehicle Rental | 120,000 | All |
| Baby Crib Setup | Baby | 250,000 | Family Villas |
| Mid-stay Deep Cleaning | Mid-stay Cleaning | 400,000 | All |

All mock services have `status: 'active'`, `currency: 'IDR'`.

## UI Components Used

From existing shadcn-vue library:
- `Table` — data table
- `Sheet` — side drawer
- `Select` — filter dropdowns
- `Input` — text fields
- `Textarea` — description
- `Switch` — status toggle
- `Button` — actions
- `Badge` — category/status badges
- `AlertDialog` — delete confirmation
- `DropdownMenu` — row actions menu
- `Separator` — visual dividers

## Conventions

- Semantic Tailwind tokens (`text-muted-foreground`, `bg-muted`, etc.)
- Icons use `lucide:` prefix
- No hardcoded colors
- Toast notifications via `vue-sonner` for CRUD feedback
- Follow existing page patterns (Kanban, Tasks) for header layout
