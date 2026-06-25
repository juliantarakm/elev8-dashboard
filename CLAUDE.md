# CLAUDE.md — Elev8 Dashboard AI Design System

> **Stack**: Nuxt 3 + Vue 3 + shadcn-vue + Tailwind CSS v4
> **Project**: elev8-dashboard — Property management for Bali vacation rentals
> **Current User**: Komang Juliantara (Guest Relations role)

---

## 🏗️ Project Overview

**Elev8** is a web dashboard for managing Bali vacation rental properties. Built with **Nuxt 3**, **Vue 3**, **shadcn-vue**, and **Tailwind CSS v4**.

### Main Modules
- **Inbox** — Guest messaging system (4-panel layout) with Phone call tab
- **Notification Center** — Bell icon in header with dropdown for CRITICAL/WARNING alerts
- **Finance** — Revenue (Reservations + Upsell), Costs, Integrations (Jurnal/Bexio)
- **Listings** — Property management with 6-tab detail page (Overview, Pricing, Calendar, Reviews, Maintenance, Settings) + compact hero with AI schedule Sheet (HostBuddy concept)
- **Upsells** — Full request system: Catalog CRUD, Order tracking with lifecycle (pending→confirmed→completed/cancelled), Cancellation flow with refund policies, Staff/Guest notifications, Inbox integration (UpsellOrderCreator, UpsellOfferCard in chat, linked orders in ReservationPanel)
- **Journeys** — AI-powered multi-step guest communication automation (Smart Flow section)
- **Kanban** — Task board
- **Tasks** — Data table with filtering (TanStack table)
- **Settings** — Profile, appearance, notifications, account
- **Auth** — Login, register, OTP, forgot password
- **Mail** — Email interface (demo)
- **Components Gallery** — All shadcn-vue component demos

---

## 👤 Current User Context

The logged-in user is **Komang Juliantara** (Guest Relations role), NOT "You" (Admin).

- `staff-1` / "You" in mock data = property owner
- Komang = active staff member viewing the dashboard
- This affects how you reference users in mock data vs. UI

---

## 📚 Key Documentation

- **Inbox Module Changelog** → `docs/superpowers/changelogs/2025-04-25-inbox-module.md`
- **Inbox Quick Reference** → `docs/superpowers/changelogs/2025-04-25-inbox-quick-ref.md`
- **Notification Center Spec** → `docs/superpowers/specs/2026-05-07-notification-center-design.md`
- **Notification Center Plan** → `docs/superpowers/plans/2026-05-07-notification-center-plan.md`
- **Auto-Translate Spec** → `docs/superpowers/specs/2026-05-25-auto-translate-design.md`
- **Auto-Translate Plan** → `docs/superpowers/plans/2026-05-25-auto-translate.md`
- **Listing Details Redesign Spec** → `docs/superpowers/specs/2026-06-01-listing-details-redesign.md`
- **Listing Details Redesign Plan** → `docs/superpowers/plans/2026-06-01-listing-details-redesign.md`
- **Listing Floating Menu + AI Auto-Fill Spec** → `docs/superpowers/specs/2026-06-01-listing-floating-menu-ai-autofill.md`
- **Listing Floating Menu + AI Auto-Fill Plan** → `docs/superpowers/plans/2026-06-01-listing-floating-menu-ai-autofill.md`
- **WhatsApp Integration UI Spec** → `docs/superpowers/specs/2026-06-01-whatsapp-ui-spec.md`

---

## 📊 Architecture Quick Reference

### Listing Module (`app/components/listings/`)

#### Data + Types (`app/components/listings/data/listings.ts`)
- `Listing` type with `photos: string[]`, `unitType: 'single' | 'multi'`, `aiSchedule: AiSchedule`, plus `stats`, `pricing`, `bookings`, `blockedDates`, `reviews`, `maintenance`
- **AI schedule (HostBuddy concept)**:
  - `AiSchedule` = `{ always: boolean (24/7), days: DayHours[] (7, Mon→Sun), dateOverrides: DateOverride[] }`
  - `DayHours` = `{ enabled, slots: TimeSlot[], activeFor: OverrideAudience[] }` — multiple time ranges per day
  - `TimeSlot` = `{ id, start, end }` (24h "HH:MM")
  - `DateOverride` = `{ id, startDate, startTime, endDate, endTime, activeFor }` — date RANGES that override the weekly schedule
  - `OverrideAudience` = `'future' | 'current' | 'inquiry'`
  - `alwaysOn()` factory builds a 24/7 default schedule
- `ListingStats`, `ListingPricing` (nightlyRate/fees/discounts/seasonalRates), `Booking`, `Review`, `MaintenanceTask`, `ListingMaintenance`
- `ListingDocument`, `ListingResources` (documents, basics, listingDetails, sops, topicsToAvoid, propertyUpsells, fieldConfig)
- `FieldConfig` = `{ stages: ReservationStage[] }` — per-field config stored in `listing.resources.fieldConfig[fieldKey]`
- `ReservationStage` = `'future' | 'inquiry_past' | 'current'`
- Reactive: `listings` uses `ref<Listing[]>` — mutations use `listings.value[index] = updated`
- Helper exports: `allTags`, `allLocations`, `allProperties`, `allOtas` (computed)
- Mock data: 16 listings with Unsplash photos (lst-1 has rich mock data + custom schedule; rest use `alwaysOn()` + defaults)

#### Page (`app/pages/listings/[id].vue`)
- 6-tab layout: Overview | Pricing | Calendar | Reviews | Maintenance | Settings
- Imports child components explicitly (not auto-imported)
- `ListingHeroCompact` emits `update`; tabs emit `update`/`switchTab` (Overview links to Calendar/Reviews tabs)

#### Child Components
- **`ListingHeroCompact.vue`** — Compact hero: editable cover photo (click → photo picker dialog), name, unit-type badge (single/multi), location, OTA badges, AI status **button** that opens a **Sheet** to manage schedules. The Sheet has Weekly Schedule + Date Overrides tabs, fixed footer (Clear All / Copy to Properties / Save Schedule), and a Copy-to-Listings dialog (search + tag filter + select all)
- **`ListingOverviewTab.vue`** — Stats cards (revenue/occupancy/rating/rate) + upcoming bookings + recent reviews
- **`ListingPricingTab.vue`** — Base pricing, discounts, seasonal rates table
- **`ListingCalendarTab.vue`** — Bookings list + blocked dates
- **`ListingReviewsTab.vue`** — Rating summary (category Progress bars) + filter + review cards with host reply
- **`ListingMaintenanceTab.vue`** — Cleaning schedule + tasks + add-task dialog
- **`ListingSettingsTab.vue`** — Property details form + amenities (Popover) + distribution channels (AI schedule moved to hero Sheet)
- **`ListingRowActions.vue`** — Dropdown menu (View Detail, Deactivate, Toggle AI)
- **`ListingFloatingMenu.vue`** — Fixed floating pill bar at bottom of page: Listing Setup · Test AI · AI Schedule
- **`ListingSetupOverlay.vue`** — Full-screen overlay shell for Listing Setup (header with **Property/Unit toggle** + two-panel layout + **footer with Save Changes**). Toggle allows switching between property-level info and unit-specific info for multi-unit listings. Unit button is a **dropdown menu** when multiple units exist, allowing selection of which unit to edit. Footer includes **"Copy to Other Units"** button (unit view only) and **"Save Changes"** button with toast confirmation.
- **`ListingSetupFieldPanel.vue`** — Left panel: 6 tabs (Basics, Listing Details, Amenities, SOPs, Topics to Avoid, Property Upsells). **Supports Property/Unit view modes** — Property view shows property-level fields (name, location, check-in/out), Unit view shows unit-specific fields (unit name, capacity). Each field has a pencil icon → opens `FieldConfigDialog`. Dot indicator on pencil when config saved.
- **`ListingSetupResourcePanel.vue`** — Right panel (300px): Property Documents (upload PDF/DOCX/TXT, download, delete), Elev8 AI integration checklist, Auto-Fill (1.5s mock), Copy from Property
- **`FieldConfigDialog.vue`** — Per-field config: Property Type info, Reservation Stages (Future/Inquiry Past/Current), Copy to Other Properties
- **`ListingTestAIDialog.vue`** — Guest chat simulation dialog with mock AI responses based on listing data (check-in time, amenities, etc.)

> **Schedule overlap rule**: time slots within a day auto-adjust to never overlap (`normalizeSlots` sorts by start and pushes each start past the previous end). Clear All resets hours+audience only (keeps enabled state). When 24/7 is on, the Custom Schedule is shown dimmed + non-editable.

> **Floating menu**: `ListingFloatingMenu` emits `open-setup`, `open-test-ai`, `open-schedule`. Page handles these — setup/test-ai open their overlays, schedule triggers `openSchedule` prop on hero which programmatically opens the schedule Sheet.

#### Listings Index (`app/pages/listings/index.vue`)
- TanStack Table with search, tag filter (AND logic), AI status filter
- **Status toggle column** (leftmost) — `ListingSingleToggle` component per row; Switch reactive via `listings` store
- **Unit type label** — "Single unit" / "Multi-unit · N units" (grey text) below listing name
- **Expand row** (multi-unit only) — chevron expands `ListingExpandRow` with per-unit toggles
- **Inactive dim** — name, AI Status, OTA columns all dim (`opacity-40`) when listing/all-units inactive
- `listingsKey` computed forces table re-render on status/aiStatus changes
- **`ListingAiStatusCell.vue` / `ListingOtaCell.vue`** — AI Status and OTA columns are dedicated reactive components rendered directly in the template (`v-if cell.column.id === ...` with explicit `ai-${id}`/`ota-${id}` keys), NOT via `h(Icon)` in TanStack column `cell` functions.
- ⚠️ **Table wrapped in `<ClientOnly>`** (with a `#fallback` skeleton). **Required** — without it, SSR hydration mismatch causes adjacent icon-bearing columns (AI Status ↔ OTA) to reuse each other's DOM `<span>`/`<svg>` nodes, so the AI Status column shows an OTA logo until a `listingsKey` change (e.g. toggling a listing) forces a full table remount. Same pattern as `app/pages/inbox.vue`.
- **Icon mode** — `nuxt.config.ts` sets `icon.mode: 'svg'` + `serverBundle.collections: ['lucide', 'logos', 'simple-icons']` (deps: `@iconify-json/logos`, `@iconify-json/simple-icons`). SVG mode avoids CSS-mode `<span class="iconify i-...">` DOM reuse across icons.

#### Listing Status System
- `Listing.status?: 'active' | 'inactive'` — listing-level status
- `Unit.status?: 'active' | 'inactive'` — per-unit status
- `Unit.aiStatus?: 'active' | 'paused' | 'not_set'` — per-unit AI override
- `Unit.otaConnected?: string[]` — per-unit OTA override (falls back to listing OTA)
- **Multi-unit logic**: property status derived from units — all inactive = property inactive
- **Deactivate cascade**: turning off listing/unit also pauses AI
- **`ListingExpandRow.vue`** — reactive expand panel; property toggle cascades to all units; per-unit toggle with AI badge (click to toggle AI) + OTA icons + Switch; shows `toast.info/success` on property-level and per-unit toggle
- **`ListingSingleToggle.vue`** — handles both single and multi-unit toggle logic; shows `toast.info/success` on activate/deactivate
- **`ListingRowActions.vue`** — "Activate/Deactivate Listing" in dropdown; implemented with spread mutation

### Inbox Module (`app/components/inbox/`)

#### Data + Types (`app/components/inbox/data/conversations.ts`)
- `Conversation` type with `status: ConversationStatus | null`, `assignedTo?: string | null`, `tags: string[]`, `guestLanguage?: string`
- `Message` type with `aiWritten?: boolean`, `senderRole?: string`, `translatedContent?: string`
- `GuestDetails` type with `language: string`
- `StaffMember` list: You/Admin, Komang Juliantara/Guest Relations, Made Surya/Housekeeping, Wayan Adi/Maintenance
- `Reservation` type + mock data (6 conversations)
- **WhatsApp additions**: `otaSources` includes `WhatsApp` (`logos:whatsapp-icon`, green); `Conversation.waWindowExpired?: boolean` (24h window); `Message.mediaUrl?`/`mediaDims?` (photo messages); `StayStatus` includes `'unmatched'`; `UnmatchedMessage` type. WhatsApp conversations seeded: Max Müller (normal), Lisa Park (complaint + pool photos), Marcel Weber (window expired), + 3 `conv-um-*` unmatched (phone-number as guestName, `listingName: 'Unknown'`)

#### Shared State (`app/composables/useInbox.ts`)
- **Reactive**: `conversations` uses `useState<Conversation[]>` — mutations MUST use spread syntax to trigger Vue reactivity
- **Filters**:
  - `showActionNeeded` — boolean toggle
  - `assignedToMeFilter` — boolean
  - `activeStayFilter` — boolean
  - `activeListingFilter` — multi-select `string[]` (empty = no filter). Checkboxes in sidebar. Selected listings shown as removable chips.
  - `activeTagFilters` — multi-select `string[]` (AND logic). Tags button opens searchable Popover with checkboxes. Selected tags shown as removable chips.
  - `listingSearchText`, `searchValue`, `sortBy`
- **Actions**: `markAsHandled()`, `markAsUnread()`, `assignTo()`, `getAssignedStaff()`, `toggleListingFilter()`, `clearListingFilters()`, `toggleTagFilter()`, `clearTagFilters()`, `clearAllListingFilters()`, ElevAI toggle functions
- **Auto-read**: Selecting a conversation sets `unreadCount = 0`
- **Key type**: `ConversationStatus = 'action_needed'` (nullable — `null` = no action needed)
- **Phone**: `getPhoneCalls(conversationId)` returns `PhoneCall[]` for the conversation
- **Auto-translate**: `autoTranslate` boolean state (default `true`), `mockTranslate(text, lang)` async mock function (500ms delay)
  - Guest messages → translated to Bahasa Indonesia; Host messages → translated to `guestLanguage`
  - Toggle button (icon `lucide:languages`, ghost variant) in Thread header opens Popover with guest language info + Active/Disabled toggle
  - `ThreadMessage.vue`: when auto-translate ON → bubble shows translated text only + "Translated" label; when OFF → shows original
  - `ReplyBox.vue`: shows "Messages will be auto-translated to {guestLanguage}" indicator when ON

#### Phone Call Features
- `PhoneCall` interface with `direction`, `status`, `duration`, `transcript`, `summary`, `recording_url`
- Phone tab in Thread.vue — call history with transcript expand/collapse, download recording
- Call summaries in Notes tab (tagged ElevAI for AI consumption)
- Phone call entries in Activity timeline with Send button for unsent templates

### WhatsApp Integration (`app/components/settings/` + `app/components/inbox/`)

> **Full UI spec** → `docs/superpowers/specs/2026-06-01-whatsapp-ui-spec.md` (Phase 1–4 wireframes, states, design tokens)

WhatsApp Business is integrated **into the existing inbox** (not a separate page). Mock/demo only — no real Meta API.

#### Settings → Integrations (`app/pages/settings/integrations.vue`)
- Route added to `SettingsSidebarNav.vue` + `constants/menus.ts`
- Shows only `SettingsWhatsAppIntegration`
- **`SettingsWhatsAppIntegration.vue`** — multi-account WhatsApp management: Connected tab (account cards with business name, phone, listing count, Edit/Test Send/Disconnect) + Unassigned tab (bulk assign listings to accounts). OAuth flow (simulated Meta Embedded Signup popup) — no manual form fields. Add account triggers OAuth → auto-creates account → opens Assign Listings dialog. Listing assignment: one account per listing enforced.

#### Composables
- **`useWhatsApp.ts`** — `useState('whatsapp-accounts')`; multi-account `WhatsAppAccount[]` with `listingIds: string[]`. Key exports: `whatsappAccounts`, `isConnected`, `addAccount()`, `removeAccount()`, `assignListings()`, `bulkAssign()`, `connect()`, `disconnect()`. Backward compat: `isConnected` checks if any account is connected. Shared with inbox.
- **`useWhatsAppRules.ts`** — `useState('whatsapp-rules')`; `RoutingRule` type, `conditionTypeLabels`, `routeToLabels`, `ruleConditionText()`, `saveRule()`, `deleteRule()`, `toggleRule()` (component not currently used in UI)
- **`useWhatsAppTemplates.ts`** — `waTemplates` (booking_confirmation, checkin_instructions, upsell_early_checkin, review_request) + `renderTemplate()`

#### Inbox features (reuse existing channel filter / notes / assignment / AI / send-status)
- **Channel**: WhatsApp appears automatically in the List.vue Filters → Channel (from `otaSource`)
- **`WhatsAppSendModal.vue`** (`InboxWhatsAppSendModal`) — template picker + live preview; used by Thread (window-expired fallback) and reusable for reservation detail
- **Media messages** — `ThreadMessage.vue` renders `mediaUrl` image + dims caption inside bubble
- **24h window** — `Thread.vue` shows "window expired" banner + Send Template button when `otaSource === 'WhatsApp' && waWindowExpired`
- **Not-connected state** — `Thread.vue` shows "WhatsApp not connected" banner (link to `/settings/integrations`) when `otaSource === 'WhatsApp' && !useWhatsApp().isConnected`; takes priority over window-expired
- **Unmatched queue** — unmatched messages are conversations with `stayStatus: 'unmatched'`, filterable via the new "Unmatched" sidebar filter (`Nav.vue`). Thread shows an action bar (Match to Guest / Dismiss). `useInbox`: `matchUnmatched(umConvId, targetConvId)` (moves messages into target conv), `createFromUnmatched(umConvId)`, `dismissUnmatched(id)`
- **Automation channel** — Journeys builder (`JourneyStepSidebar.vue`) already had a `whatsapp` channel option
- **NOT implemented** (descoped per user): Claim/Release buttons, routing-mode badges (HostBuddy/Staff/Review) — `action_needed` status already covers escalation

#### Inbox SSR note
- `app/pages/inbox.vue` wraps `<InboxLayout>` in `<ClientOnly>` to avoid Reka UI `ScrollArea` hydration mismatches. `useInbox` merges fresh seed conversations/messages into `useState` so newly added seed data always appears.

### Inbox Settings (gear icon in inbox header)

A gear icon (⚙️) sits next to the "Inbox" header title in `InboxLayout.vue`. Clicking it opens a **Popover** with two options:

- **Integrations** → opens a Sheet with `SettingsWhatsAppIntegration`
- **AI Conversation Settings** → opens `InboxAiSettings` Sheet

#### `InboxAiSettings.vue` (`app/components/inbox/AiSettings.vue`)
- `Sheet` (640px wide) with two-column layout: config sidebar (left, 192px) + form (right, scrollable)
- Multi-config support: **default** config (applies to all unlisted properties) + custom configs per listing
- Custom configs have a listing picker (checkboxes from `allProperties`) to select which listings they apply to
- Config form fields: Defer Behavior (5 options), Direct Contact, Use Signature + textarea, Conversation Closing, AI Transparency, Language (guest/always), Stop on Negative Sentiment, Message Delay (min/max), Customize Tone
- `defineModel<boolean>('open')` — controlled by parent
- `inboxView` state was added to `useInbox` but is unused (kept for future use)

### Notification Center Module (`app/components/notifications/`)

#### Data + Types (`app/components/notifications/data/alerts.ts`)
- `AlertType` — 18 alert types (SMART_LOCK_DEAD, CLEANING_NOT_STARTED_IMMINENT, STRIPE_DISCONNECTED, etc.)
- `AlertSeverity` — `'CRITICAL' | 'WARNING'`
- `Alert` interface with `alert_id`, `type`, `severity`, `status`, `triggered_at`, `auto_resolve`, `context`
- `alertDisplayLabels`, `alertRouteMap`, `getDescription()`, `mockAlerts` (7 mock alerts)

#### Shared State (`app/composables/useNotifications.ts`)
- `alerts` — `useState<Alert[]>` with spread syntax for reactivity
- Computed: `activeAlerts`, `unreadCount`, `filteredAlerts` (by severity)
- Actions: `markAsRead()`, `markAllAsRead()`, `dismiss()`, `navigateToAlert()`
- Severity filter: `selectedSeverity` ref (`'all' | 'critical' | 'warning'`)

#### Components
- **NotificationCenter.vue** — Bell icon in Header with unread Badge, Popover dropdown with filter tabs (All/Critical/Warning), ScrollArea list
- **NotificationItem.vue** — Single alert row with severity-based coloring (red/amber), keyboard accessible, dismiss + navigate actions

### Layout (`app/components/layout/`)
- **Header.vue** — SidebarTrigger + user menu (no breadcrumb)
- **HeaderUserMenu.vue** — Komang Juliantara + "Guest Relations" role dropdown
- **AppSidebar.vue** — No footer (user menu moved to topbar)
- **SidebarNavLink.vue** — Unread count badge on Inbox link

### Tasks Module (`app/components/tasks/`)
- **DataTable.vue** — TanStack table wrapper
- **DataTableToolbar.vue**, **DataTableFacetedFilter.vue**, **DataTablePagination.vue**, **DataTableViewOptions.vue**, **DataTableColumnHeader.vue**, **DataTableRowActions.vue**
- Schema: `app/components/tasks/data/schema.ts`
- Mock data: `app/components/tasks/data/data.ts`
- Columns: `app/components/tasks/components/columns.ts`

### Finance Module (`app/components/finance/`)

#### Overview
- **OverviewTab.vue** — Header KPI cards (Net Revenue, Total Costs, Upsell Revenue, Unsynced count) + Pending Actions + Recent Activity tables
- **RevenueTab.vue** — Wrapper with sub-tabs: Reservations + Upsell
- **CostsTab.vue** — Cost tracking with filters and detail drawer
- **IntegrationsTab.vue** — Jurnal + Bexio integration cards
- Page: `app/pages/finance/index.vue`

#### Accounting Integration System
Two integrations supported: **Mekari Jurnal** (IDR, Indonesia) and **Bexio** (CHF, Switzerland).

**Composables:**
- `useListingMappings` (`app/composables/useListingMappings.ts`) — shared `useState<Record<string, ListingMapping>>` keyed by listing name. `initialMappings` pre-seeds all known listings: Bali + first 12 Swiss → Jurnal, last 16 Swiss → Bexio. Key exports: `getMappingFor(name)`, `setMapping(name, integration, accountId)`, `hasAnyMapping`, `mappedByIntegration`
- `useJurnal` (`app/composables/useJurnal.ts`) — Jurnal connection state, exchange rate (CHF → IDR), `convertToAccounting(chf)`, `formatAccounting(idr)`, `pushCosts()`, `pushRevenue()`, `isPushingCosts`, `isPushingRevenue`
- `useBexio` (`app/composables/useBexio.ts`) — Bexio connection state, CHF accounting, `availableListings` (excludes Jurnal-mapped listings), `applyAccountToAll` skips Jurnal-mapped listings
- `useActiveIntegration` (`app/composables/useActiveIntegration.ts`) — derives column visibility and per-listing accounting amounts:
  - `showConvertedColumn` — true if any integration is connected with mapped listings
  - `getAccountingAmount(listingName, chfAmount)` — for reservations/upsells (CHF input)
  - `getCostAccountingAmount(listingName, amount, currency)` — for costs (IDR or CHF input)

**1 listing = 1 integration rule**: enforced at UI level — rows mapped to the other integration show a lock badge and disabled select in both `JurnalIntegration.vue` and `BexioIntegration.vue`.

**Currency display**: always `IDR` prefix (not `Rp`) for Indonesian Rupiah. CHF uses `de-CH` locale with 2 decimal places.

**Integration filter**: all three tabs (Reservations, Upsell, Costs) have a `filterIntegration` select — `'all' | 'jurnal' | 'bexio' | 'none'`.

**Acctg. Amount column**: shown in Reservations, Upsell, and Costs tables when `showConvertedColumn` is true. Displays `—` for unsynced rows.

**Synced badge**: table rows in Reservations, Upsell, and Costs tabs all show cloud-check icon + Jurnal (blue) or Bexio (violet) badge when synced. Not-synced rows show cloud-off icon.

#### Reservations Tab (`ReservationsTab.vue`)
- Data: `app/components/finance/data/revenue.ts` — `ReservationEntry` interface + `recentReservations[]`
- `ReservationStatus` = `'Unverified' | 'Verified' | 'Checked-in' | 'Checked-out'`
- `invoice: string` — required field (all confirmed reservations have an invoice)
- Composable: `app/composables/useReservations.ts`
  - `pushReservations()` — push all unsynced
  - `pushSelected(keys)` — push specific rows only
  - `isPushingSelected` ref — separate loading state for partial push
- **Selection bar** (inline, appears on row select): `X rows selected | Clear | [Download X invoices] | [Export CSV] | [Push X to {integration}]`
  - Push button label is smart: detects which integrations are mapped for selected rows (Jurnal / Bexio / accounting)
- **Checkbox fix**: Reka UI `CheckboxRoot` maintains internal state — use `clearKey` ref that increments on `clearSelection()` and bind as `:key` on each `<Checkbox>` to force re-mount on clear

#### Upsell Tab (`UpsellTab.vue`)
- Data: `app/components/finance/data/upsells.ts` — `UpsellEntry` interface + `mockUpsells[]`
- No `status` field — all upsells are always Paid
- `invoice: string` — required field (always present)
- `UpsellType` = `'Vehicle Rental' | 'Airport Transport' | 'Private Chef' | 'Spa' | 'Activity' | 'Late Check-out' | 'Early Check-in' | 'Mid-stay Cleaning' | 'Office Equipment' | 'Baby' | 'Miscellaneous' | 'Pet'`
- Composable: `app/composables/useUpsells.ts`
- Same checkbox `clearKey` pattern as ReservationsTab
- **Selection bar**: `X rows selected | Clear | [Download X invoices] | [Export CSV]`
- **Detail drawer**: `UpsellDetailDrawer.vue` — opens on row click or "View detail" dropdown. Shows guest avatar + type badge, date/amount/acctg. amount, channel + icon, reservation ID, sync status with integration badge, note, invoice download.

#### Costs Tab (`CostsTab.vue`)
- Data: `app/components/finance/data/costs.ts` — `CostEntry` interface + `mockCosts[]`
- `CostType` = `'Manual' | 'Cleaning' | 'Activity' | 'Task'`
- `CostCategory` = `'Cleaning Labor' | 'Cleaning Supplies' | 'Maintenance' | 'Consumables' | 'Other'`
- **Currency**: IDR for Bali staff, CHF for Swiss staff — `currency` field on each entry
- **Invoice rules**: Manual entries always have an invoice. Task and Activity entries may optionally have an invoice.
- **Split entry pattern** (labor vs. materials): Task/Activity entries track labor only (duration × rate). If materials were purchased, a separate Manual entry is created with `linkedTaskId` pointing to the Task/Activity id. This keeps labor and material accounting clean for different GL accounts.
  - `linkedTaskId?: string` on Manual entries → links to the Task/Activity parent
  - `CostDetailDrawer.vue` shows "Material Entry" card when viewing a Task/Activity that has a linked Manual entry, and "Linked Task" card when viewing a linked Manual entry
- Composable: `app/composables/useCosts.ts`
  - `costs`, `filteredCosts`, `filterListing`, `filterType`, `filterSynced`, `filterStaff`, `filterIntegration`, `filterDateFrom`, `filterDateTo`
  - `totalThisMonth`, `unsyncedCount`, `markSynced()`, `clearFilters()`, `hasActiveFilters`
- Staff: Bali housekeeping/maintenance + Swiss staff (Petra Keller, Hans Müller, Markus Weber, Anna Brunner)
- Cleaning labor rate: IDR 625/minute

#### Checkbox Controlled State Pattern
Reka UI `CheckboxRoot` ignores external `:checked` prop changes after initial render when used without `v-model`. Fix:
```ts
const clearKey = ref(0)
function clearSelection() {
  selected.value = []
  clearKey.value++
}
```
```vue
<Checkbox :key="`${rowId}-${clearKey}`" :checked="..." @click.stop="toggleRow(id)" />
```

### Journeys Module (`app/components/journeys/`)

AI-powered multi-step guest communication automation. Replaces Dynamic Templates as the primary automation surface.

#### Data + Types (`app/components/journeys/data/journeys.ts`)
- Types: `Journey`, `JourneyStep` (union of `TriggerStep | WaitStep | MessageStep | ContextCheckStep | ActionStep`), `MarketplaceTemplate`
- Step types: `trigger` (purple), `wait` (gray), `message` (green), `context_check` (amber), `action` (red)
- Mock data: `mockJourneys` (4 journeys), `marketplaceTemplates` (4 templates), `generatedJourneyExample`
- `generatedJourneyExample` includes `aiReasoning: string` and `stats: { messages, contextChecks, estimatedTime }`

#### Composable (`app/composables/useJourneys.ts`)
- `journeys` — `useState<Journey[]>` with spread syntax mutations
- `toggleStatus(id)`, `saveJourney(journey)`, `deleteJourney(id)`

#### Components
- **JourneyList.vue** — Table of journeys with inline Switch toggle, status Badge, DropdownMenu (Edit/Delete), empty state
- **JourneyBuilderPrompt.vue** — Screen 1: textarea + example chips + 2×2 template grid
- **JourneyBuilderGenerating.vue** — Screen 2: 5-step animated progress (600ms per step), gold spinner for active step, emits `done(journey)` with `generatedJourneyExample`
- **JourneyBuilderReview.vue** — Screen 3: two-column step list + AI reasoning/stats/refine sidebar
- **JourneyEditor.vue** — Two-column editor: step timeline (left) + JourneyStepSidebar (right), inline editable journey name, Active switch, Save button, Add Step dropdown
- **JourneyStepCard.vue** — Step card with colored icon circle, HostBuddy AI gold badge on message steps, WhatsApp warning tooltip, hover trash button, connecting dashed line
- **JourneyStepSidebar.vue** — Dynamic form per step type (trigger/wait/message/context_check/action), emits `update(step)` on every change
- **JourneyMarketplace.vue** — Category filter tabs, 2-col grid, Preview Dialog (non-interactive step list), Install button

#### Page (`app/pages/journeys/index.vue`)
View states: `'list' | 'marketplace' | 'builder-prompt' | 'builder-generating' | 'builder-review' | 'editor'`
Flow: list → builder-prompt → builder-generating → builder-review → editor → (save) → list

#### Nav
Smart Flow section in `app/constants/menus.ts` — Journeys (`i-lucide-route`) + Templates

### Kanban Module (`app/components/kanban/`)
- **KanbanBoard.vue** — Main board component
- Composable: `app/composables/useKanban.ts`

### Upsells Module (`app/components/upsells/`)

#### Data + Types
- **`upsell-services.ts`** — `UpsellItem` (with `description?`, `image?`), `UpsellService` (with `availability: 'always' | 'by_request'`, `pricingEnabled`, `taxPercent`, `servicePercent`), 10 mock services
- **`upsell-orders.ts`** — `UpsellOrder` interface with `serviceDate`, `serviceEndDate?`, `source` ('manual' | 'inbox' | 'web'), `conversationId?`, `approvalStatus`, `paymentStatus`, `fulfillmentStatus`, `cancellationReason?`, `cancellationBy?`, `invoice?`; `OrderStatus` derived from lifecycle (`requested`, `awaiting_payment`, `paid_in_progress`, `completed`, `declined`); 11 mock orders
- **`upsell-notifications.ts`** — 7 notification types (order_created, order_confirmed, order_completed, order_cancelled, refund_issued, reminder_24h, reminder_1h), notification template system, 10 mock notifications
- **`cancellation-policies.ts`** — Per-service refund calculator (48h/24h/late windows); staff cancel = 100% refund always; guest cancel depends on timing

#### Composables
- **`useUpsellServices.ts`** — Catalog CRUD, filters (`activeCategoryFilter`, `activeStatusFilter`, `activeListingFilter`, `searchValue`)
- **`useUpsellOrders.ts`** — Orders state + CRUD, `updateStatus()`, `addOrder()`, `cancelOrder()` (with refund calculation), filters, `statusCounts`, `totalRevenue`
- **`useUpsellNotifications.ts`** — Notification state, `createNotification()`, `markAsRead()`, unread count

#### Components
- **`UpsellTable.vue`** — TanStack data table with columns: Name, Category, Price Range, Items, Listings, Availability, Status
- **`UpsellFilterBar.vue`** — Category pills + Status filter + Listing filter + Search input
- **`UpsellDrawer.vue`** — 2-tab Sheet drawer (Details + Items); Details: name, description, image upload (FileReader→base64), YouTube links, listings, availability selector, tax/service section; Items: modal dialog for adding items, vuedraggable sort with grip handle
- **`UpsellOrderTable.vue`** — Orders table with status filter pills, KPI cards
- **`UpsellOrderDrawer.vue`** — Order detail with reactive computed lookup from `useUpsellOrders` state, fulfillment section, approval/decline + payment actions, no notification log section
- **`UpsellNotificationList.vue`** — Staff notification list with unread/all filter, severity icons
- **`UpsellCancelModal.vue`** — Decline reason textarea + handled-by toggle (guest/staff)

#### Page (`app/pages/upsells.vue`)
- 3 tabs: Catalog / Orders / Notifications with KPI cards

### Upsells Inbox Integration (`app/components/inbox/`)

#### Components
- **`UpsellOrderCreator.vue`** — Mini Sheet drawer for creating upsell orders from chat; service picker (Select component), item checkboxes (with `isCreateDisabled` computed), date picker
- **`UpsellOfferCard.vue`** — Renders upsell offer in chat thread with service details, pricing breakdown, status badge, action buttons (Withdraw / View Order)
- **`ReplyBox.vue`** — "Upsell" button (shopping-cart icon) next to channel dropdown, opens UpsellOrderCreator
- **`ReservationUpsells.vue`** — Tab in ReservationPanel showing linked upsell orders from `conversation.linkedUpsellOrderIds`, displays order status, service date, grand total
- **`Thread.vue`** — Linked order badges removed from thread header (moved to ReservationPanel Upsell tab)

#### Data + Types (`app/components/inbox/data/conversations.ts`)
- `Conversation` extended with `linkedUpsellOrderIds?: string[]`
- `Message` extended with `upsellOffer?: UpsellOffer`
- `UpsellOffer` type — `id`, `orderId`, `serviceName`, `items`, `subtotal`, `taxAmount`, `serviceAmount`, `grandTotal`, `currency`, `status: 'pending' | 'accepted' | 'declined' | 'withdrawn'`, `serviceDate`
- Mock `conv-21` (Emma Thompson) with accepted spa upsell + `ord-011` order
- Reservation `R-2026-0521` added for Emma Thompson

#### Composable (`app/composables/useInbox.ts`)
- `sendMessage()` accepts optional `upsellOffer` payload — creates order + sends chat message with offer card
- `getLinkedOrders(conversationId)` — returns UpsellOrder[] for a conversation
- `linkOrderToConversation(conversationId, orderId)` — adds order ID to `linkedUpsellOrderIds`

#### Upsell Offer Flow
1. Staff clicks Upsell button → UpsellOrderCreator opens → selects service/items/date → sends offer
2. `sendMessage()` creates order (status: pending) + sends message with `upsellOffer` payload
3. `UpsellOfferCard` renders in thread with pricing breakdown and status badge
4. Guest accepts → offer status becomes 'accepted', order status becomes 'confirmed'
5. Staff can withdraw offer → status becomes 'withdrawn'
6. Linked order appears in ReservationPanel → Upsell tab

#### Key Patterns
- `availability: 'always'` → auto-confirmed; `'by_request'` → pending confirmation
- Cancellation: staff cancel = 100% refund; guest cancel depends on policy timing
- Upsell offers embedded in chat via `UpsellOfferCard` component (not separate notification)
- Order drawer reactivity: use computed lookup from `useUpsellOrders` state, not prop snapshot

### Payment Request Module (`app/components/payment-request/`)

**Full UI spec** → `docs/superpowers/specs/2026-06-18-payment-request-design.md`

Page for creating payment links, tracking status, and managing receipts. Integrated with Payouts module.

**New files:**
```
app/
├── pages/payment-requests/index.vue
├── components/payment-request/
│   ├── PaymentRequestCreateDialog.vue   # Create payment link wizard
│   ├── PaymentRequestTable.vue          # History table with filters
│   ├── PaymentRequestDetailDialog.vue   # Detail view (status, receipt, timeline)
│   ├── PaymentRequestShareDialog.vue    # Copy link, QR code, WhatsApp/Email
│   └── data/payment-requests.ts         # Types, mock data, helpers
└── composables/usePaymentRequests.ts    # State + CRUD + filters
```

**Data Model:**
```ts
interface PaymentRequest {
  id: string
  guestName: string
  guestEmail: string
  listingId: string
  title: string
  description?: string
  amount: number
  currency: 'USD' | 'IDR'
  feeMode: 'card' | 'manual'        // card = +3%, manual = no fee
  feeAmount: number
  totalAmount: number
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  payoutAccountId: string
  paymentLink: string
  qrCodeUrl?: string
  expiresAt: string
  paidAt?: string
  receiptUrl?: string
  createdAt: string
  createdBy: string
  notes?: string
}
```

**Create Flow (2-step Dialog):**
1. **Payment Details**: Guest name (searchable autocomplete from existing guests/inbox), Select Listing (with unassigned warning), Payment title, Description, Email, Amount, Currency, Fee mode (Card +3% / Manual no fee)
2. **Share & Confirm**: Generated link, QR code, WhatsApp/Email share, expiry selector, summary

**Guest Search:**
- Combobox with search — sources from `conversations` (inbox guests) + existing payment requests
- Selecting existing guest auto-fills email
- "New guest" option if not found
- Shows guest avatar + last stay if from inbox

**Payout Integration:**
- Auto-detect currency from assigned payout account
- Unassigned listing → warning banner + [Assign now] link (disabled until fixed)
- Minimum amount validation per provider (Stripe $0.50, Doku IDR 10k)

**Status Lifecycle:** `pending` → `paid` / `expired` (auto) / `cancelled` (staff)

**List View:** TanStack Table with columns: Guest, Title, Listing, Amount (with fee breakdown), Status badge, Created, Expires, Actions (View/Copy/Cancel)

**Filters:** Status, Listing multi-select, Date range, Search (guest/title)

**Empty States:**
- No payout accounts → CTA to Settings → Payouts
- No requests → "Create your first payment request"

**Edge Cases:**
- Duplicate detection (same guest + amount within 1h → confirm dialog)
- Expired link accessed → "Link expired" page
- Already paid → "Payment completed" with receipt
- Account disconnected → badge on old requests
- Currency mismatch → auto-switch or warning
- Network error → retry + toast

**Sidebar:** Added under Finance section (`i-lucide-link` icon)

### Operations Calendar Module (`app/components/operations-calendar/`)

Time-based view of guest stays, cleaning jobs, and tasks. Week/day views with hierarchical tree.

- **Data + types**: `app/components/operations-calendar/data/operations-calendar.ts`
  - `OperationsFilters` type with `listingSearch`, `listingTags` (AND logic), `eventTypes` (OR logic)
  - `CalendarEvent` type with `type: 'guest_stay' | 'cleaning' | 'task'`, `listingId`, scheduled times
  - Build helpers: `buildAllEvents()`, `eventsForDay()`, `getWeekDays()`, `groupEventsByListingAndDay()`
  - Events built from cleaning jobs + tasks (not inbox conversations)
- **State**: `app/composables/useOperationsCalendar.ts`
  - `filters` — `ref<OperationsFilters>` with spread assignment to trigger reactivity
  - Computed: `filteredListings` (search + tag AND filter), `filteredListingIds` (Set), `hasListingFilter`, `filteredEvents` (listing + event type), `eventsByDay`, `eventsByDayAndListing`, `eventsByListingAndDay`
  - Navigation: `previousWeek()`, `nextWeek()`, `goToToday()`
  - Actions: `moveCleaning()`, `clearFilters()`, `toggleEventType()`
- **Page**: `app/pages/operations-calendar.vue`
  - Week/Day toggle (Tabs), prev/next/Today navigation buttons
  - Filters bar + board grid, wrapped in `<ClientOnly>`
  - Lazy-loaded board, create dialog
- **Components**:
  - `OperationsCalendarFilters.vue` — Search input, Tags Popover (multi-select with search, AND logic), Event Types Popover (OR logic), Clear button
  - `OperationsCalendarBoard.vue` — Week/day grid rendering events by listing rows
  - `OperationsCalendarEventChip.vue` — Individual event chip in grid cells
  - `OperationsCalendarCreateDialog.vue` — New cleaning job / task creation
- **Key fix**: Reka UI `CheckboxRoot` ignores external `:checked` prop changes after initial render. Filter checkboxes use native `<button @click>` for toggle logic + plain `<span>` with reactive Tailwind classes for visual — no Reka UI checkbox component to avoid desync.

### Auth (`app/components/auth/`)
- **SignIn.vue**, **SignUp.vue**, **OTPForm.vue**, **OTPForm1.vue**, **OTPForm2.vue**, **ForgotPassword.vue**
- Layout: `app/components/layout/Auth.vue`

### Mail (`app/components/mail/`)
- **Layout.vue**, **List.vue**, **Display.vue**, **Nav.vue**, **AccountSwitcher.vue**
- Mock data: `app/components/mail/data/mails.ts`

---

## 🎨 UI Patterns

### Toast Notifications
- Uses `vue-sonner` (already configured in `app.vue`)
- Call `toast.success("Message saved")` / `toast.info("New message")` for user action feedback

### Unread Badges
- `Badge` component with `variant="default"` showing count
- Applied on: sidebar Inbox link, per-conversation in list

### AI-Written Messages
- `aiWritten: true` on host messages → shows:
  - "ElevAI" as sender name
  - Sparkle avatar
  - "AI" label instead of user name

### Action Needed Status
- Only `action_needed` or `null` (NO `needs_reply`, `waiting_on_guest`, `done`)
- Badge shown ONLY when `status === 'action_needed'` (destructive variant)

### reka-ui Form Controls (Switch / Checkbox) ⚠️

- **`Switch` and `Checkbox` use `model-value` / `@update:model-value`** — NOT `checked` / `@update:checked`. Using `:checked`/`@update:checked` silently does nothing (toggle appears dead).
  ```vue
  <Switch :model-value="isOn" @update:model-value="(v) => isOn = v" />
  ```
- **Never wrap a reka-ui `Checkbox` in a `<label>`** — the label re-dispatches the click to the underlying button, causing a double-toggle (net no change). For clickable rows, use a `div @click` with a custom checkbox visual instead (the Listings page tag-filter pattern):
  ```vue
  <div class="flex items-center gap-2 cursor-pointer" @click="toggle(item)">
    <div class="flex size-4 items-center justify-center rounded-[4px] border"
         :class="selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input'">
      <Icon v-if="selected" name="lucide:check" class="size-3" />
    </div>
  
    <span>
  {{ item }}
  </span>
  </div>
  ```
- **Tag/multi-select filter pattern** (match Listings index): Popover + inner search `Input` + `ScrollArea` of custom-checkbox rows + "Clear all" footer. Selected items use AND logic (`every`), not OR.

### Date Range Picker
- `app/components/base/DateRangePicker.vue`
- Used for filtering reservations by date range

### Search
- `app/components/Search.vue` — Global search component
- `app/components/PasswordInput.vue` — Password input with visibility toggle

---

## 🧩 Component Selection Hierarchy

When building UI, ALWAYS select components in this order:

### 1. shadcn-vue Components (atoms/primitives)
Located in `app/components/ui/` — **CHECK HERE FIRST**.

Most commonly used:
- **Basic**: `Button`, `Input`, `Label`, `Badge`, `Textarea`
- **Overlay**: `Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `AlertDialog`, `Drawer`, `HoverCard`, `Tooltip`, `ContextMenu`, `Command`, `Menubar`, `NavigationMenu`
- **Forms**: `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `Calendar`, `DatePicker`, `RangeCalendar`, `PinInput`, `NumberField`, `TagsInput`, `Combobox`
- **Data Display**: `Table`, `DataTable`, `Tabs`, `Accordion`, `Collapsible`, `Separator`, `ScrollArea`, `AspectRatio`, `Resizable`, `Progress`, `Skeleton`, `Stepper`, `Toggle`, `ToggleGroup`, `Avatar`, `Breadcrumb`, `Card`, `Carousel`, `Kbd`, `Pagination`
- **Feedback**: `Alert`, `Sonner` (toast), `Toast`
- **Layout**: `Sidebar` (from `layout/AppSidebar.vue` wrapper)

> ⚠️ **Never duplicate shadcn components**. Customize via:
> - Props (`variant`, `size`, `class`)
> - Slots (override content)
> - `cn()` utility for class merging

### 2. Custom Base Components
- `app/components/base/BreadcrumbCustom.vue`
- `app/components/base/DateRangePicker.vue`
- `app/components/Search.vue`
- `app/components/PasswordInput.vue`
- `app/components/AppSettings.vue`
- `app/components/DarkToggle.vue`
- `app/components/ThemeCustomize.vue`

### 3. Module-Specific Components
- **Inbox**: `inbox/Layout`, `inbox/List`, `inbox/Thread`, `inbox/ReplyBox`, `inbox/Nav`, `inbox/ActionCard`, etc.
- **Layout**: `layout/AppSidebar`, `layout/Header`, `layout/HeaderUserMenu`, `layout/Auth`
- **Auth**: `auth/SignIn`, `auth/SignUp`, `auth/OTPForm`
- **Tasks**: `tasks/components/DataTable` (complex TanStack table wrapper)
- **Kanban**: `kanban/KanbanBoard`
- **Settings**: `settings/Layout`, `settings/AccountForm`, etc.
- **Mail**: `mail/Layout`, `mail/List`, `mail/Display`

### 4. Build New (Last Resort)
Only when no existing component fits. Place in appropriate folder:
- `components/atoms/` — single element (future)
- `components/molecules/` — combination of atoms (future)
- `components/organisms/` — complex sections (future)
- Or alongside existing module: `components/<module>/NewComponent.vue`

---

## 🧱 shadcn-vue Usage Patterns

### Button Variants
```vue
<!-- Primary action -->
<Button>
Save
</Button>

<!-- Destructive action -->
<Button variant="destructive">
Delete
</Button>

<!-- Secondary / Cancel -->
<Button variant="outline">
Cancel
</Button>

<!-- Ghost / Icon only -->
<Button variant="ghost" size="icon">
<Icon />
</Button>

<!-- Link style -->
<Button variant="link">
Learn more
</Button>

<!-- With loading state -->
<Button :disabled="isLoading">
  <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
  Submit
</Button>
```

### Dialog Pattern
```vue
<Dialog v-model:open="isOpen">
  <DialogTrigger as-child>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Description of what this dialog does.</DialogDescription>
    </DialogHeader>
    <!-- Body content -->
    <DialogFooter>
      <Button variant="outline" @click="isOpen = false">Cancel</Button>
      <Button @click="handleConfirm">Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form Pattern (vee-validate + zod)
```vue
<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const formSchema = toTypedSchema(z.object({
  username: z.string().min(2).max(50),
}))

function onSubmit(values) {
  console.log('Form submitted!', values)
}
</script>

<template>
  <Form v-slot="{ handleSubmit }" :validation-schema="formSchema">
    <form @submit="handleSubmit($event, onSubmit)">
      <FormField v-slot="{ componentField }" name="username">
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <Input type="text" placeholder="shadcn" v-bind="componentField" />
          </FormControl>
          <FormDescription>This is your public display name.</FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>
      <Button type="submit">
        Submit
      </Button>
    </form>
  </Form>
</template>
```

### Sheet (Slide-over) Pattern
```vue
<Sheet>
  <SheetTrigger as-child>
    <Button variant="outline">Open Sheet</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Edit profile</SheetTitle>
      <SheetDescription>Make changes to your profile here.</SheetDescription>
    </SheetHeader>
    <!-- Content -->
    <SheetFooter>
      <SheetClose as-child>
        <Button type="submit">Save changes</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

### DataTable (TanStack)
```vue
<script setup>
import { getCoreRowModel, useVueTable } from '@tanstack/vue-table'

const table = useVueTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
})
</script>

<template>
  <div class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
          <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
            <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
```

---

## 🎨 Tailwind & Styling Rules

- **NO arbitrary colors** → use CSS variables: `bg-primary`, `text-destructive-foreground`, `bg-muted`, `text-muted-foreground`
- **ElevAI gold ONLY**: `bg-[#C8A84B]` for ElevAI branding; `bg-warning` for host chat bubbles and toggle
- **Responsive** → mobile-first (`md:`, `lg:`, `xl:`)
- **Spacing** → Tailwind scale: `p-4`, `gap-2`, `mb-6`, `space-y-4`
- **Dark mode** → handled automatically via `.dark` class + CSS variables in `app/assets/css/themes.css`
- **Merge classes** → always use `cn()` from `@/lib/utils`
- **No hardcoded colors** except ElevAI gold

### Common Utility Patterns
```vue
<!-- Container -->
<div class="flex flex-col gap-4 p-6">

<!-- Card-like container -->
<div class="rounded-lg border bg-card text-card-foreground shadow-sm">

<!-- Flex center -->
<div class="flex items-center justify-center">

<!-- Text hierarchy -->
<h2 class="text-2xl font-bold tracking-tight">Title</h2>
<p class="text-sm text-muted-foreground">Description</p>
```

---

## 🔌 Composables Reference

| Composable | File | Usage | Key Exports |
|-----------|------|-------|-------------|
| `useInbox` | `app/composables/useInbox.ts` | Inbox module state | `conversations`, filters, `autoTranslate`, `mockTranslate()`, `markAsHandled()`, `assignTo()`, `toggleListingFilter()`, `clearTagFilters()`, `getPhoneCalls()` |
| `useNotifications` | `app/composables/useNotifications.ts` | Notification Center | `alerts`, `unreadCount`, `filteredAlerts`, `markAsRead()`, `markAllAsRead()`, `dismiss()`, `navigateToAlert()` |
| `useKanban` | `app/composables/useKanban.ts` | Kanban board state | columns, cards, drag handlers |
| `useAppSettings` | `app/composables/useAppSettings.ts` | Theme/settings | dark mode, sidebar state, settings preferences |
| `useShortcuts` | `app/composables/useShortcuts.ts` | Keyboard shortcuts | `defineShortcuts` wrapper |
| `useListingMappings` | `app/composables/useListingMappings.ts` | Per-listing integration mapping | `getMappingFor()`, `setMapping()`, `hasAnyMapping`, `mappedByIntegration` |
| `useJurnal` | `app/composables/useJurnal.ts` | Jurnal integration state | `isConnected`, `exchangeRate`, `convertToAccounting()`, `formatAccounting()`, `pushCosts()`, `pushRevenue()` |
| `useBexio` | `app/composables/useBexio.ts` | Bexio integration state | `isConnected`, `availableListings`, `localSelections`, `applyAccountToAll()` |
| `useActiveIntegration` | `app/composables/useActiveIntegration.ts` | Per-listing accounting amount resolution | `showConvertedColumn`, `getAccountingAmount()`, `getCostAccountingAmount()` |
| `useCosts` | `app/composables/useCosts.ts` | Costs tab state + filters | `costs`, `filteredCosts`, all `filter*` refs, `markSynced()`, `clearFilters()` |
| `useReservations` | `app/composables/useReservations.ts` | Reservations state | `reservations`, `pushReservations()`, `pushSelected()`, `isPushingSelected` |
| `useUpsells` | `app/composables/useUpsells.ts` | Upsells (Finance) state | `upsells`, `pushUpsells()`, `isPushingUpsells` |
| `useUpsellServices` | `app/composables/useUpsellServices.ts` | Upsells Catalog state + CRUD | `services`, filters, `addService()`, `updateService()`, `deleteService()` |
| `useUpsellOrders` | `app/composables/useUpsellOrders.ts` | Upsell Orders state + CRUD | `orders`, `filteredOrders`, `statusCounts`, `totalRevenue`, `updateStatus()`, `addOrder()`, `cancelOrder()` |
| `useUpsellNotifications` | `app/composables/useUpsellNotifications.ts` | Upsell Notifications state | `notifications`, `unreadCount`, `createNotification()`, `markAsRead()` |
| `useWhatsApp` | `app/composables/useWhatsApp.ts` | WhatsApp connection state | `connection`, `isConnected`, `connect()`, `disconnect()` |
| `useWhatsAppRules` | `app/composables/useWhatsAppRules.ts` | Routing rules CRUD | `rules`, `saveRule()`, `deleteRule()`, `toggleRule()` |
| `useWhatsAppTemplates` | `app/composables/useWhatsAppTemplates.ts` | Template messages | `waTemplates`, `renderTemplate()` |

### State Management Rules
- **Inbox conversations**: `useState<Conversation[]>()` — reactive, persists per request
- **Mutations**: ALWAYS use spread syntax:
  ```ts
  conversations.value = conversations.value.map(
    c => c.id === id ? { ...c, status: null, unreadCount: 0 } : c
  )
  ```
- **Filters**: Computed from reactive state (multi-select arrays)
- **Avoid direct mutation**: ❌ `conv.status = null` → ✅ spread replace

---

## 🖼️ Icon Rules

- **Default**: `lucide:` prefix via `lucide-vue-next`
  ```vue
  <Icon icon="lucide:user-check" />
  ```
- **OTA logos**: `logos:airbnb`, `simple-icons:bookingdotcom`
- **Custom icons**: Add to `app/components/ui/icon/` if needed

---

## 📁 File Structure Reference

```
app/
├── app.config.ts              # App config (shadcn-vue)
├── app.vue                    # Root app with Sonner/Toaster
├── assets/
│   └── css/
│       ├── tailwind.css       # Tailwind entry
│       └── themes.css         # Theme tokens (light/dark)
├── components/
│   ├── ui/                    ← shadcn-vue components (338 files)
│   ├── AppSettings.vue
│   ├── DarkToggle.vue
│   ├── PasswordInput.vue
│   ├── Search.vue
│   ├── ThemeCustomize.vue
│   ├── auth/
│   │   ├── ForgotPassword.vue
│   │   ├── OTPForm.vue
│   │   ├── OTPForm1.vue
│   │   ├── OTPForm2.vue
│   │   ├── SignIn.vue
│   │   └── SignUp.vue
│   ├── base/
│   │   ├── BreadcrumbCustom.vue
│   │   └── DateRangePicker.vue
│   ├── dashboard/
│   │   └── TotalVisitors.vue
│   ├── listings/
│   │   ├── data/
│   │   │   └── listings.ts        ← Listing type (unitType, stats, pricing, bookings, reviews, maintenance, resources), AiSchedule, Unit, ListingResources, FieldConfig, ReservationStage, ref<Listing[]>, allTags/allLocations/allProperties/allOtas
│   │   ├── ListingHeroCompact.vue ← Compact hero: photo manager, unit switcher, editable name+tags, AI schedule Sheet, accepts openSchedule prop
│   │   ├── ListingOverviewTab.vue ← Stats cards + upcoming bookings + recent reviews
│   │   ├── ListingPricingTab.vue  ← Base pricing, discounts, seasonal rates
│   │   ├── ListingCalendarTab.vue ← Bookings list + blocked dates
│   │   ├── ListingReviewsTab.vue  ← Rating summary + filter + reviews with host reply
│   │   ├── ListingMaintenanceTab.vue ← Cleaning schedule + tasks + add-task dialog
│   │   ├── ListingSettingsTab.vue ← Property details form + amenities + distribution channels
│   │   ├── ListingFloatingMenu.vue ← Fixed floating pill bar (Listing Setup / Test AI / AI Schedule)
│   │   ├── ListingSetupOverlay.vue ← Full-screen overlay shell (centered header + two-panel)
│   │   ├── ListingSetupFieldPanel.vue ← Left panel: 6 tabs + pencil config icons per field
│   │   ├── ListingSetupResourcePanel.vue ← Right panel: documents + Elev8 AI + auto-fill + copy
│   │   ├── FieldConfigDialog.vue  ← Per-field: reservation stages + copy to properties
│   │   ├── ListingTestAIDialog.vue ← Guest chat simulation
│   │   └── ListingRowActions.vue  ← Dropdown menu (View Detail, Deactivate, Toggle AI)
│   ├── finance/
│   │   ├── BexioIntegration.vue  ← Bexio mapping UI, locks Jurnal-mapped listings
│   │   ├── CostDetailDrawer.vue  ← Shows linked material/task entries in drawer
│   │   ├── CostFilters.vue       ← Includes integration filter select
│   │   ├── CostTable.vue         ← Multi-currency, Acctg. Amount col, integration badge
│   │   ├── CostsTab.vue
│   │   ├── IntegrationsTab.vue
│   │   ├── JurnalIntegration.vue ← Locks Bexio-mapped listings
│   │   ├── OverviewTab.vue
│   │   ├── ReservationsTab.vue   ← Smart push label, integration filter, Acctg. Amount
│   │   ├── RevenueTab.vue        ← Sub-tabs wrapper (Reservations + Upsell)
│   │   ├── UpsellDetailDrawer.vue ← Guest avatar, type badge, sync info, invoice download
│   │   ├── UpsellTab.vue         ← Always Paid, integration filter, Acctg. Amount, detail drawer
│   │   └── data/
│   │       ├── bexio.ts          ← Bexio listing data (Swiss properties)
│   │       ├── costs.ts          ← CostEntry interface (linkedTaskId), mockCosts (IDR + CHF)
│   │       ├── integrations.ts
│   │       ├── jurnal.ts
│   │       ├── overview.ts
│   │       ├── revenue.ts        ← ReservationEntry, ReservationStatus, recentReservations
│   │       └── upsells.ts        ← UpsellEntry (no status), mockUpsells
│   ├── inbox/
│   │   ├── ActionCard.vue
│   │   ├── GuestSentiment.vue
│   │   ├── HostbuddySuggestion.vue
│   │   ├── Layout.vue
│   │   ├── List.vue
│   │   ├── ListItem.vue
│   │   ├── Nav.vue
│   │   ├── ReplyBox.vue            ← Upsell button next to channel dropdown
│   │   ├── ReservationActivity.vue
│   │   ├── ReservationGuest.vue
│   │   ├── ReservationListing.vue
│   │   ├── ReservationPanel.vue    ← Upsell tab shows linked orders
│   │   ├── ReservationSummary.vue
│   │   ├── ReservationTasks.vue
│   │   ├── ReservationUpsells.vue  ← Linked upsell orders from conversation
│   │   ├── Thread.vue              ← Phone tab + UpsellOfferCard in messages
│   │   ├── UpsellOfferCard.vue     ← Upsell offer UI in chat (status, pricing, actions)
│   │   ├── UpsellOrderCreator.vue  ← Mini drawer for creating orders from chat
│   │   ├── WhatsAppSendModal.vue   ← Template picker + live preview (window-expired fallback)
│   │   └── data/
│   │       └── conversations.ts    ← UpsellOffer type, linkedUpsellOrderIds, conv-21
│   ├── notifications/          ← Notification Center (new)
│   │   ├── NotificationCenter.vue
│   │   ├── NotificationItem.vue
│   │   └── data/
│   │       └── alerts.ts       ← Alert types + mock data
│   ├── upsells/
│   │   ├── data/
│   │   │   ├── upsell-services.ts  ← UpsellItem (desc/image), UpsellService (availability)
│   │   │   ├── upsell-orders.ts    ← UpsellOrder (serviceDate, source, cancellation)
│   │   │   ├── upsell-notifications.ts ← 7 notification types + templates
│   │   │   └── cancellation-policies.ts ← Per-service refund calculator
│   │   ├── UpsellFilterBar.vue
│   │   ├── UpsellTable.vue
│   │   ├── UpsellDrawer.vue        ← 2-tab: Details + Items (modal + drag-sort)
│   │   ├── UpsellOrderTable.vue
│   │   ├── UpsellOrderDrawer.vue   ← Order detail with cancel + notification log
│   │   ├── UpsellNotificationList.vue
│   │   └── UpsellCancelModal.vue
│   ├── kanban/
│   │   └── KanbanBoard.vue
│   ├── layout/
│   │   ├── AppSidebar.vue
│   │   ├── Auth.vue
│   │   ├── Header.vue
│   │   ├── HeaderUserMenu.vue
│   │   ├── SidebarNavFooter.vue
│   │   ├── SidebarNavGroup.vue
│   │   ├── SidebarNavHeader.vue
│   │   └── SidebarNavLink.vue
│   ├── mail/
│   │   ├── AccountSwitcher.vue
│   │   ├── Display.vue
│   │   ├── Layout.vue
│   │   ├── List.vue
│   │   ├── Nav.vue
│   │   └── data/
│   │       └── mails.ts
│   ├── navigation-menu/
│   │   └── DemoItem.vue
│   ├── settings/
│   │   ├── AccountForm.vue
│   │   ├── AppearanceForm.vue
│   │   ├── DisplayForm.vue
│   │   ├── Layout.vue
│   │   ├── NotificationsForm.vue
│   │   ├── ProfileForm.vue
│   │   ├── SidebarNav.vue
│   │   ├── WhatsAppIntegration.vue  ← Connection card (disconnected/connected states)
│   │   └── WhatsAppRoutingRules.vue ← Routing rules (not currently used in UI)
│   └── tasks/
│       ├── components/
│       │   ├── columns.ts
│       │   ├── DataTable.vue
│       │   ├── DataTableColumnHeader.vue
│       │   ├── DataTableFacetedFilter.vue
│       │   ├── DataTablePagination.vue
│       │   ├── DataTableRowActions.vue
│       │   ├── DataTableToolbar.vue
│       │   └── DataTableViewOptions.vue
│       └── data/
│           ├── data.ts
│           └── schema.ts
├── composables/
│   ├── defineShortcuts.ts
│   ├── useActiveIntegration.ts  ← showConvertedColumn, getAccountingAmount, getCostAccountingAmount
│   ├── useAppSettings.ts
│   ├── useBexio.ts              ← Bexio connection + CHF accounting
│   ├── useCosts.ts              ← Costs filters, markSynced, totalThisMonth
│   ├── useInbox.ts
│   ├── useJurnal.ts             ← Jurnal connection + IDR accounting + push actions
│   ├── useKanban.ts
│   ├── useListingMappings.ts    ← Per-listing integration mapping (shared useState)
│   ├── useNotifications.ts      ← Notification Center state
│   ├── useReservations.ts       ← pushReservations(), pushSelected(), isPushingSelected
│   ├── useShortcuts.ts
│   ├── useUpsells.ts
│   ├── useUpsellServices.ts       ← Catalog CRUD
│   ├── useUpsellOrders.ts         ← Orders CRUD + cancelOrder()
│   ├── useUpsellNotifications.ts  ← Notification state + createNotification()
│   ├── useWhatsApp.ts             ← WhatsApp connection state (connect/disconnect)
│   ├── useWhatsAppRules.ts        ← Routing rules CRUD
│   └── useWhatsAppTemplates.ts    ← Template messages (booking_confirmation, etc.)
├── layouts/
│   ├── blank.vue              # Auth pages
│   └── default.vue            # Main app layout
├── lib/
│   └── utils.ts               # cn(), formatDate(), etc.
└── pages/
    ├── (auth)/
    │   ├── forgot-password.vue
    │   ├── login-basic.vue
    │   ├── login.vue
    │   ├── otp-1.vue
    │   ├── otp-2.vue
    │   ├── otp.vue
    │   └── register.vue
    ├── (error)/
    │   ├── 401.vue
    │   ├── 403.vue
    │   ├── 404.vue
    │   ├── 500.vue
    │   └── 503.vue
    ├── components/            # Component demo pages
    │   ├── accordion.vue
    │   ├── alert-dialog.vue
    │   ├── alert.vue
    │   ├── ... (all shadcn demos)
    │   └── tooltip.vue
    ├── email.vue
    ├── finance/
    │   └── index.vue           # Finance page (Overview/Revenue/Costs/Integrations tabs)
    ├── inbox.vue
    ├── index.vue               # Dashboard home
    ├── kanban.vue
    ├── listings/
    │   ├── index.vue           # Listings table (TanStack Table + search/tag/AI filters)
    │   └── [id].vue            # Listing detail page (HeroCompact + Overview/Pricing/Calendar/Reviews/Maintenance/Settings tabs)
    ├── settings/
    │   ├── account.vue
    │   ├── appearance.vue
    │   ├── display.vue
    │   ├── integrations.vue        ← WhatsApp connection + routing rules
    │   ├── notifications.vue
    │   └── profile.vue
    └── tasks.vue
```

---

## 🚫 Anti-Patterns

- ❌ **Clone HTML** from existing component → **import & compose**
- ❌ Use `<a>` for internal navigation → **use `<NuxtLink>` or `<NuxtLinkLocale>`**
- ❌ Hardcode colors → **use theme tokens** (`bg-primary`, `text-muted-foreground`)
- ❌ Import shadcn components from elsewhere → **use `@/components/ui/`**
- ❌ Mutate state directly (`conv.status = null`) → **use spread syntax for reactivity**
- ❌ Create new component when shadcn exists → **customize existing via props/slots**
- ❌ Use raw HTML for layouts → **compose with existing molecules/organisms**
- ❌ Forget aria-labels on icon-only buttons → **always add accessible labels**
- ❌ Use `:checked`/`@update:checked` on `Switch`/`Checkbox` → **use `model-value`/`@update:model-value`**
- ❌ Wrap reka-ui `Checkbox` in `<label>` → **double-toggle bug; use `div @click` + custom checkbox visual**

---

## 🐛 Debugging Tips

- **Adoption report mismatch?** → Check `codebase-index.json` freshness; regenerate via script
- **Component marked unused but you know it's used?** → Verify imports use full path (not stem collision)
- **Reactivity issue?** → Check spread syntax in mutations; avoid direct property assignment
- **Icon shows wrong glyph (e.g. AI Status column renders OTA logo) and only fixes after an interaction?** → SSR hydration mismatch in a TanStack table — adjacent icon columns reuse each other's DOM nodes. Wrap the table in `<ClientOnly>` (see `listings/index.vue`). Per-cell `key`s and svg mode alone don't fix hydration-level reuse.
- **Style not applying?** → Check `cn()` merge order; ensure dark mode class is set
- **shadcn component not working?** → Check `app.config.ts` for component registration; verify import path
- **Build errors?** → Check `components.json` for shadcn-vue config; verify `lib/utils.ts` exports

---

## 🔄 Regeneration Instructions

When adding/removing major components or refactoring structure:

1. Run codebase scanner to update `codebase-index.json`
2. Update `component-metadata/` for new components
3. Add new composables to Composables Reference
4. Update File Structure if folders change
5. Check Anti-Patterns — any new ones discovered?

---

*Generated from AGENTS.md + codebase scan. Keep updated as project evolves.*
