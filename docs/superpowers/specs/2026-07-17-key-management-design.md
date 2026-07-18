# Key Management (Physical Keys) — Design

**Date:** 2026-07-17
**Status:** Approved (brainstorming complete)

## Context

Elev8 already manages **digital access** (smart locks + access codes) via `useSmartLock`, surfaced in Settings > Integrations, the listing Settings tab, and the inbox Reservation panel. Many Bali villas, however, still rely on **physical keys** — and there is no place to track them. This feature adds a standalone **Key Management** module for physical keys: custody tracking, handover history, key box (lockbox) info, lost-key logging, and overdue reminders.

### Confirmed requirements (from brainstorming)

- **Scope:** Physical keys only. Smart locks stay untouched in their existing module.
- **Placement:** Centralized page, new sidebar item "Key Management".
- **Workflows:** (1) custody tracking — who currently holds each key copy, (2) handover history, (3) key box / lockbox info (location + PIN) for self check-in, (4) lost key report + replacement logging.
- **Key holders:** Registered staff only (from `staffMembers` in inbox data). No guest-linked custody, no free-text vendors.
- **Reminders:** Notification-center alert when a checked-out key passes its expected return time.

### Approach

Standalone module, **one record per physical key copy** (Approach A). Custody per person is only meaningful at copy level. Follows the established module pattern: `data/` + `useState` composable + page + components. No changes to existing modules except two additive touchpoints (sidebar menu, new alert type).

## Data model — `app/components/key-management/data/keys.ts`

```ts
export type KeyType =
  | 'main_door' | 'bedroom' | 'gate' | 'pool'
  | 'safe' | 'storage' | 'motorbike' | 'other'

export type KeyStatus = 'available' | 'checked_out' | 'lost'

export interface PhysicalKey {
  id: string
  listingId: string
  type: KeyType
  label?: string                 // free-form, e.g. "Kitchen door"
  copyNumber: number             // per (listingId, type), 1-based
  status: KeyStatus
  holderStaffId?: string         // required when checked_out
  checkedOutAt?: string          // ISO
  expectedReturnAt?: string      // ISO, default checkedOutAt + 24h
  location: 'office' | 'key_box' // where an available key is stored
  keyBoxId?: string              // when location === 'key_box'
  replacedByKeyId?: string       // set on a lost copy once replaced
  createdAt: string
}

export type KeyEventAction = 'register' | 'checkout' | 'return' | 'mark_lost' | 'replace'

export interface KeyEvent {
  id: string
  keyId: string
  action: KeyEventAction
  staffId?: string               // holder involved (empty for register)
  actorStaffId: string           // who recorded it (current user: 'staff-2')
  at: string                     // ISO
  note?: string
}

export interface KeyBox {
  id: string
  listingId: string
  name: string                   // e.g. "Front gate lockbox"
  location: string               // description, e.g. "Left pillar of main gate"
  pin: string
  notes?: string
}
```

Display maps: `keyTypeLabels` (e.g. `main_door` → "Main Door") and per-type icons (`main_door` → `i-lucide-door-open`, `motorbike` → `i-lucide-bike`, etc.).

**Replacement chain:** `replaceKey(lostKeyId)` creates a new copy (next `copyNumber` for that listing+type) with an event `replace`; the lost copy keeps `status: 'lost'` and gets `replacedByKeyId` pointing to the new copy.

**Mock data:** 5 listings, ~12 key copies (mixed available / checked out / lost, one already overdue), 3 key boxes across 2 listings, ~15 events seeded over the past days.

## State & logic — `app/composables/useKeyManagement.ts`

State via `useState` (no localStorage — consistent with inbox / payment-requests mock pattern):

- `keys: PhysicalKey[]`, `keyEvents: KeyEvent[]`, `keyBoxes: KeyBox[]`

Filters (local `ref`s in the composable, like payment-requests): `search`, `statusFilter`, `typeFilter`, `activeListingFilter: string[]`.

Computed:

- `filteredKeys` — search matches label/type/copy number; listing multi-select; status + type dropdowns.
- `stats` — `{ total, available, checkedOut, lost, overdue }`.
- `overdueKeys` — `checked_out` where `now > expectedReturnAt`.
- `keyBoxesByListing` — for the Key Boxes tab.
- `sortedEvents` — global activity feed, newest first.

Actions (all mutations use spread/replace patterns for reactivity; every action appends a `KeyEvent`):

- `registerKey({ listingId, type, label?, copies, location, keyBoxId? })` — creates N copies with sequential `copyNumber`s.
- `checkoutKey(keyId, staffId, expectedReturnAt?, note?)` — guard: only from `available`. Default expected return = +24h.
- `returnKey(keyId)` — one-click, only from `checked_out`. Resolves any active `KEY_NOT_RETURNED` alert for that key (via `markAsRead` on matching alert). Resets holder/checkout fields; `location` falls back to `office`.
- `markKeyLost(keyId, note)` — from `available` or `checked_out`.
- `replaceKey(lostKeyId)` — guard: only from `lost` and not already replaced.
- Key box CRUD: `addKeyBox`, `updateKeyBox`, `removeKeyBox` (guard: box must not hold available keys).
- `checkOverdueKeys()` — for each overdue key without an already-active alert for the same `key_id`, calls `useNotifications().createAlert('KEY_NOT_RETURNED', 'WARNING', { key_id, listing_id, listing_name, key_label, staff_name, overdue_hours })`. Pattern follows `emitMockAlerts` in `useSmartLock`. Called on page mount and after each checkout.

Staff data is imported from `app/components/inbox/data/conversations.ts` (`staffMembers`); the recording actor is the current user, `staff-2` (Komang Juliantara).

## Page & components

**`app/pages/key-management/index.vue`** — follows the payment-requests index pattern:

- Filter bar: search input, listing filter Popover, status Select, type Select.
- 4 stats cards: Total Keys, Available, Checked Out (with overdue count), Lost.
- Tabs: **Keys | Key Boxes | Activity**.
- Mount: `checkOverdueKeys()`; toast feedback (vue-sonner) on all actions.

**Components** in `app/components/key-management/`:

- `KeyTable.vue` — one row per copy: listing name, type icon + label (+ copy #), status badge, holder (avatar initials + name from `staffMembers`), red "Overdue" badge when past `expectedReturnAt`, location (Office / key box name), row actions dropdown:
  - `available` → Check out, Mark lost, View history
  - `checked_out` → Return, Mark lost, View history
  - `lost` → Replace (disabled with tooltip if already replaced), View history
- `KeyRegisterDialog.vue` — listing picker, type Select, optional label, copies NumberField, storage location (Office / key box Select).
- `KeyCheckoutDialog.vue` — staff Select (from `staffMembers`), expected return datetime (optional, default +24h), note textarea.
- `KeyLostDialog.vue` — note textarea; checkbox "Log replacement now" → on submit runs `markKeyLost` + `replaceKey`.
- `KeyHistorySheet.vue` — side Sheet with the key's event timeline (action badge, staff names, timestamp, note).
- `KeyBoxCard.vue` + `KeyBoxDialog.vue` — Key Boxes tab: card per box (name, location, masked PIN with reveal toggle, notes, count of stored keys); add/edit dialog; delete guarded.
- `KeyActivityTimeline.vue` — Activity tab: global event feed (key label + listing, action badge, holder + actor names, time ago, note).

**Sidebar** (`app/constants/menus.ts`): item `{ title: 'Key Management', icon: 'i-lucide-key-round', link: '/key-management', new: true }` in the "General" group, after "Inventory".

## Notification integration — `app/components/notifications/data/alerts.ts`

Additive changes only:

- Add `'KEY_NOT_RETURNED'` to the `AlertType` union.
- `alertDisplayLabels`: `'Key - Not Returned'` (single dash, per convention).
- `alertIcons`: `'i-lucide-key-round'`.
- `alertRouteMap`: `'/key-management'`.
- `getDescription`: uses `context.key_label`, `context.listing_name`, `context.staff_name`, `context.overdue_hours` → e.g. "Main Door copy #2 held by Made Surya at Villa Santai is 6h overdue."

Severity is `WARNING`. Dedupe: one active alert per key (`checkOverdueKeys` skips keys that already have an ACTIVE alert with the same `context.key_id`). Returning the key resolves the matching alert.

## Error handling

- Status guards in every action (listed above); invalid transitions are no-ops returning `{ success: false, error }`.
- Form validation: checkout requires a staff member; key box requires name, location, and PIN; register requires listing, type, and copies ≥ 1.
- All user-facing feedback via `toast.success` / `toast.error` (vue-sonner, already in `app.vue`).
- No async/mock-network delays — all actions are synchronous local state (unlike smart lock's simulated API).

## Testing — `tests/composables/useKeyManagement.spec.ts` (Vitest)

- register → copies created with sequential copy numbers.
- checkout → status/holder/expected return set, event appended; checkout of non-available key rejected.
- return → status reset, event appended.
- mark lost → replace creates new copy, links `replacedByKeyId`, old copy stays `lost`; double replace rejected.
- overdue computed + stats counts.
- `checkOverdueKeys` dedupes alerts per key.

## Out of scope (YAGNI)

- Guest- or vendor-held keys (staff only for V1).
- localStorage persistence (plain `useState`, like inbox).
- Replacement cost tracking.
- Any coupling with smart locks / access codes.
- Backend/API integration — pure mock module, consistent with the rest of the dashboard.
