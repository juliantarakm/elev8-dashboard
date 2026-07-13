# Upsell Visibility Rules — Design Spec

**Date:** 2026-07-13
**Status:** Approved
**Approach:** Optional conditions with AND/OR match mode (Approach A)

## Purpose

Allow staff to control when, where, and to whom an upsell is shown by configuring 7 optional visibility conditions on each upsell service. Each condition can be enabled or left unset; the staff chooses whether all enabled conditions must match (AND) or any may match (OR) when more than one is set. Conditions are stored on the service and rendered in the Add/Edit upsell drawer; runtime evaluation is not in scope for v1 (mock only).

## Goals

- Give staff fine-grained control over who sees each upsell without forcing every condition to be set
- Keep the data model simple — one optional record per condition, no nested rule groups
- Make it obvious at a glance which conditions are active and how they combine

## Non-Goals (v1)

- Runtime evaluation against real reservations / OTA channels (rules are stored and displayed; not enforced server-side)
- Nested AND/OR groups
- Per-condition independent on/off toggles (we use a single match-mode selector)
- Time-of-day rules (e.g., "only between 9 AM–6 PM")
- Date-range windows (e.g., "only during high season")

## Data Model

Add to `UpsellService` in `app/components/upsells/data/upsell-services.ts`:

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

export interface VisibilityConditions {
  hoursBeforeCheckIn: number | null       // hours before guest check-in
  hoursBeforeCheckOut: number | null      // hours before guest check-out
  bookingStatuses: BookingStatusFilter[] | null
  guestCountMin: number | null
  guestCountMax: number | null
  lengthOfStayMin: number | null          // nights
  lengthOfStayMax: number | null
  excludeIfUpsellPurchased: string[] | null  // service ids — hide if any of these were bought
  channels: OtaChannel[] | null
}

export interface UpsellService {
  // ...existing fields (id, name, description, category, currency, items, etc.)
  visibility: VisibilityConditions
  visibilityMatchMode: VisibilityMatchMode
}
```

**Defaults for new services** (in `UpsellDrawer` reset path):
- `visibility`: every field `null` (no rules enforced)
- `visibilityMatchMode`: `'all'`

**Seed data:** All 10 existing mock services in `mockUpsellServices[]` get `visibility: emptyConditions()` and `visibilityMatchMode: 'all'`, so they continue to show everywhere as before.

**Helper:** `emptyVisibilityConditions(): VisibilityConditions` exported from the data file — returns an object with every field `null`. Used by the drawer's "reset" path and the mock data seeder.

### Why "null" instead of "undefined" / default empty values

- Explicit "off" state vs "set to zero" (e.g., `hoursBeforeCheckIn: 0` means "anytime up to check-in"; `null` means "ignore")
- Distinguishes "show only for these statuses" (empty array `[]` would be ambiguous — show none? show all?) from "no status filter" (`null` = ignore)

## File Structure

Files touched:

```
app/components/upsells/data/upsell-services.ts        — Add VisibilityConditions types, defaults helper, update UpsellService, seed mock data
app/components/upsells/UpsellDrawer.vue                — Renumber steps, add Step 4 "Visibility" UI + state, move Settings content to Step 5
app/composables/useUpsellServices.ts                    — No code changes required (visibility data flows through existing addService/updateService spread)
```

No new composables, no new components, no new pages. All UI lives inside the existing drawer.

## UI — UpsellDrawer Step 4: "Visibility"

### Step numbering change

Current order:
1. Basic Info
2. Items
3. Listings & Availability
4. Settings

New order:
1. Basic Info
2. Items
3. Listings & Availability
4. **Visibility** (NEW)
5. Settings (moved from step 4, unchanged content)

Update `steps` array constant and `stepCircleClass` / `nextStep` / `prevStep` validation accordingly. The `nextStep()` guard that requires at least one item stays at step 2. New `nextStep()` guard at step 3: at least one listing must be selected (unchanged behavior — already enforced elsewhere? verify in implementation). Step 4 (Visibility) and Step 5 (Settings) have no inter-step validation — empty visibility is valid.

### Top: Match mode selector

A segmented control with two buttons:

| "All conditions met" (AND) | "Any condition met" (OR) |

- Default selected: "All conditions met"
- 1-line help text underneath: *"Choose how multiple rules combine. Unset conditions are ignored."*
- Lives inside a `Card` (or bordered section) at the top of the step

### Body: 7 condition cards

Each condition is a self-contained card with:
- **Header row**: condition title (left) + enable `Switch` (right)
- **Disabled state**: card collapses to title + `"Off — condition ignored"` muted text
- **Enabled state**: card expands to show the input(s) below the header
- **Border**: `border-border` always; `border-primary/30 bg-primary/5` when enabled (mirrors existing selected-card pattern)

The 7 cards in order:

| # | Title | Helper (when enabled) | Inputs |
|---|-------|-----------------------|--------|
| 1 | Time before Check-in | *"Show only within the window from N hours before check-in up to check-in. Set 0 for 'show anytime up to check-in'."* | Number input (hours, min 0) |
| 2 | Time before Check-out | *"Show only within the window from N hours before check-out up to check-out."* | Number input (hours, min 0) |
| 3 | Booking Status | *"Show only when the booking is in one of these statuses."* | Multi-select chips: Inquiry / Confirmed / Checked-in / Checked-out / Cancelled |
| 4 | Guest Count | *"Show only when guest count is within this range."* | Two number inputs side-by-side: Min / Max |
| 5 | Length of Stay | *"Show only when stay length (nights) is within this range."* | Two number inputs side-by-side: Min / Max nights |
| 6 | Related Upsell | *"Hide this upsell if any of the selected services were already purchased."* | Multi-select chips of all other upsell services by name (excludes the current service) |
| 7 | Channels | *"Show only on these booking channels."* | Multi-select chips: Airbnb / Booking.com / Direct / Agoda / VRBO / Expedia |

### Multi-select chip pattern

Reuse the existing project pattern (chip toggles in a flex-wrap container):

```vue
<div class="flex flex-wrap gap-2">
  <button
    v-for="opt in options"
    :key="opt.value"
    type="button"
    class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
    :class="isSelected(opt.value)
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border bg-background hover:bg-muted/50'"
    @click="toggle(opt.value)"
  >
    {{ opt.label }}
  </button>
</div>
```

This matches the project convention used in tag-filters, amenity pickers, etc. No Reka UI `Checkbox` here to avoid the double-toggle `<label>` bug (see CLAUDE.md Anti-Patterns).

### Related Upsell source

For card #6, the options come from `useUpsellServices().services.value`, filtering out the service currently being edited (`props.service?.id`) so a service can't exclude itself. Display name = `service.name`. Value = `service.id`. If no other services exist yet, show muted text *"No other upsells to relate to."*

### Bottom: Active conditions summary banner

A small info banner (Alert or muted Card) below the 7 cards summarizing what's set:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⓘ  3 conditions active: Time before Check-in (within 24h),     │
│      Guest Count (2–4), Channels (Airbnb, Booking.com).         │
│      Match mode: All conditions met.                             │
└─────────────────────────────────────────────────────────────────┘
```

Computed reactively from the form state. Each condition's summary fragment uses its own copy:
- Time before Check-in / Check-out: `"within {N}h"` (meaning within the N-hour window before the milestone)
- Booking Status: `"{count} statuses ({comma-separated names})"`
- Guest Count: `"{min}–{max} guests"` (or `"{min}+"` if max is empty)
- Length of Stay: `"{min}–{max} nights"`
- Related Upsell: `"{count} related upsell(s) ({first 3 names})"`
- Channels: `"{count} channels ({comma-separated names})"`

Empty state when no conditions are set: *"No visibility conditions set — upsell will show everywhere."*

## Form State (UpsellDrawer.vue)

Add new refs alongside existing form refs:

```ts
const formVisibility = ref<VisibilityConditions>(emptyVisibilityConditions())
const formVisibilityMatchMode = ref<VisibilityMatchMode>('all')

// helpers for the per-card enable toggles
function isConditionEnabled(key: keyof VisibilityConditions): boolean {
  return !isConditionUnset(formVisibility.value[key])
}
function toggleCondition(key: keyof VisibilityConditions) {
  if (isConditionEnabled(key)) {
    // turning off: reset to null
    formVisibility.value = { ...formVisibility.value, [key]: getEmptyValueFor(key) }
  } else {
    // turning on: initialize to a sensible default for that condition
    formVisibility.value = { ...formVisibility.value, [key]: getDefaultValueFor(key) }
  }
}
```

Where `getDefaultValueFor(key)` returns:
- `hoursBeforeCheckIn` / `hoursBeforeCheckOut`: `24`
- `bookingStatuses`: `['confirmed', 'checked_in']`
- `guestCountMin` / `lengthOfStayMin`: `1`
- `guestCountMax` / `lengthOfStayMax`: `10`
- `excludeIfUpsellPurchased`: `[]`
- `channels`: `['airbnb']`

And `getEmptyValueFor(key)` returns:
- numeric fields: `null`
- array fields: `null` (we use `null` to mean "off" — see data model rationale above)

**Watch reset path** (existing `watch(() => props.open, ...)`):
- When editing: copy each visibility field from `props.service.visibility` and `props.service.visibilityMatchMode`
- When creating: reset to `emptyVisibilityConditions()` and `'all'`

**Save path** (existing `handleSave()`): include `visibility` and `visibilityMatchMode` in the `data` object passed to `addService` / `updateService`. The composable's spread-based mutation already accepts any extra fields.

## Validation

- No hard validation on visibility fields — every field is optional and accepts any valid number / array
- Soft warning (not blocking) when `guestCountMin > guestCountMax` or `lengthOfStayMin > lengthOfStayMax`: small red helper text below the inputs, but save still allowed
- Hours inputs: `min=0`; values like `0` are valid (means "anytime up to check-in/check-out")

## Accessibility

- Each condition card's enable toggle uses reka-ui `Switch` with `model-value` / `@update:model-value` (not `:checked`)
- Each card has a unique `aria-labelledby` pointing to its title `<h3 id="...">` so screen readers announce "Switch, Time before Check-in, on/off"
- Multi-select chip buttons have `aria-pressed` reflecting their selected state
- Helper text is associated via `aria-describedby` on each input

## Out of Scope (deferred)

- **Runtime evaluation** — visibility rules are stored but not evaluated against real reservations / channels in this iteration
- **Visualization on UpsellTable** — the catalog table does not display visibility info per row (could be a future "rules" badge column)
- **Templates / presets** — e.g., "Airport transfer" preset that auto-fills sensible defaults; can be added later
- **Bulk edit** — applying visibility rules to multiple upsells at once

## Testing Notes (manual for v1)

After implementation, verify:
- Creating a new service → all 7 condition cards show "Off" + match mode = "All conditions met"
- Editing existing service → visibility values populate correctly
- Toggling a card ON → input(s) appear with sensible defaults
- Toggling a card OFF → field resets to `null`
- Saving → reload drawer → visibility preserved
- Multi-select chips toggle correctly (no double-toggle bug)
- Empty visibility conditions don't break existing data — all 10 mock services should still render

## Implementation Order (informational)

1. Add types + `emptyVisibilityConditions()` to `app/components/upsells/data/upsell-services.ts`
2. Update all 10 mock services to include `visibility: emptyVisibilityConditions()` and `visibilityMatchMode: 'all'`
3. Add visibility state + helpers to `UpsellDrawer.vue`
4. Renumber steps (Settings moves from 4 → 5)
5. Build Step 4 UI: match mode + 7 condition cards + summary banner
6. Wire reset/save paths
7. Manual test (all 7 cards, edit + create flows, save + reload)