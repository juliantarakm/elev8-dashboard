# AGENTS.md

This file provides context for AI agents working on this project.

## Project Overview

**Elev8** — A web dashboard for property management (Bali vacation rentals). Built with **Nuxt 3**, **Vue 3**, **shadcn-vue**, and **Tailwind CSS**.

## Key Documentation

- **Inbox Module Changelog** → [`docs/superpowers/changelogs/2025-04-25-inbox-module.md`](docs/superpowers/changelogs/2025-04-25-inbox-module.md)
  - Full history of all changes, types, component structure, composables, and mock data for the 4-panel guest messaging inbox
- **Inbox Quick Reference** → [`docs/superpowers/changelogs/2025-04-25-inbox-quick-ref.md`](docs/superpowers/changelogs/2025-04-25-inbox-quick-ref.md)
  - Condensed reference: files, features, types, staff members, deviations from spec

## Architecture Quick Reference

### Listing Module (`app/components/listings/`)

- **Data + types**: `app/components/listings/data/listings.ts`
  - `Listing` type (with `photos: string[]`, `aiSchedule: AiSchedule`)
  - `AiSchedule` type (with `enabled`, `repeatType: 'weekly' | 'monthly'`, `activeDays: number[]`, `activeHours: { start, end }`)
  - Reactive: `listings` uses `ref<Listing[]>` — mutations use `listings.value[index] = updated`
  - Helper exports: `allTags`, `allLocations`, `allProperties`, `allOtas` (computed)
  - Mock data: 16 listings with Unsplash photos

- **Page**: `app/pages/listings/[id].vue`
  - Tabbed layout: Overview | Property Settings | AI Schedule
  - Imports child components explicitly (not auto-imported)

- **Child components**:
  - `ListingHero.vue` — Photo gallery (360px grid) + name/location/AI badge + tags + OTA connections
  - `ListingOverview.vue` — Stats cards + editable amenities (add/remove via Popover)
  - `ListingPropertySettings.vue` — Sub-tabs: Details form + Distribution Channels
  - `ListingAiSchedule.vue` — AI toggle (Switch) + schedule config (repeat type, days, hours, timeline preview)

- **Listings index**: `app/pages/listings/index.vue`
  - TanStack Table with search, tag filter, AI status filter

### Inbox Module (`app/components/inbox/`)

- **Data + types**: `app/components/inbox/data/conversations.ts`
  - `Conversation` type (with `status: ConversationStatus | null`, `assignedTo?: string | null`, `tags: string[]`)
  - `Message` type (with `aiWritten?: boolean`, `senderRole?: string`)
  - `StaffMember` list (You/Admin, Komang Juliantara/Guest Relations, Made Surya/Housekeeping, Wayan Adi/Maintenance)
  - `Reservation` type, mock data (6 conversations)
- **Shared state**: `app/composables/useInbox.ts`
  - **Reactive**: `conversations` uses `useState<Conversation[]>` — mutations use spread syntax to trigger Vue reactivity
  - Filters: `showActionNeeded`, `assignedToMeFilter`, `activeStayFilter`, `activeListingFilter` (multi-select `string[]`), `activeTagFilters`, `listingSearchText`, `searchValue`, `sortBy`
  - Listing filter: Multi-select — `activeListingFilter` is `string[]` (empty = no filter). Checkboxes in sidebar. Selected listings shown as removable chips.
  - Tag filter: Multi-select via searchable Popover — `activeTagFilters` is `string[]` (AND logic). Tags button opens popover with search + checkboxes. Selected tags shown as removable chips.
  - Actions: `markAsHandled()`, `markAsUnread()`, `assignTo()`, `getAssignedStaff()`, `toggleListingFilter()`, `clearListingFilters()`, `toggleTagFilter()`, `clearTagFilters()`, `clearAllListingFilters()`, ElevAI toggle functions
  - Auto-read: Selecting a conversation sets `unreadCount = 0`
  - Key type: `ConversationStatus = 'action_needed'` (nullable — `null` = no action needed)

### Journeys Module (`app/components/journeys/`)

- **Data + types**: `app/components/journeys/data/journeys.ts`
  - `TriggerType`: 15 types across 3 categories (no integration triggers):
    - **Conversation-Based**: `conversation_content` (keywords textarea), `sentiment_change` (Positive/Neutral/Negative toggle + immediate + delay + time)
    - **Reservation Events**: `inquiry_received`, `new_message_received`, `new_booking`, `guest_checkout`, `booking_cancelled` (immediate checkbox + delay + time), `checkin`, `checkout` (Before/On/After 3-way toggle + offsetAmount/offsetUnit + time)
    - **Calendar-Based**: `send_once` (date + time), `gap_nights` (min/max + before/after + delay + time), `daily`, `weekly`, `monthly`, `yearly`
  - `TriggerCategory = 'conversation' | 'reservation' | 'calendar'`
  - `WaitStep`: `waitMode: 'time_delay' | 'until_condition'` — Time Delay has `durationDays/Hours/Minutes` + optional `waitUntilSpecificTime` + `waitUntilTime`; Until Condition uses `rules` + `combinator` (same condition system as Hard Requirement/If-Else)
  - **IfElseStep**: `trueBranchStep` / `falseBranchStep` store full step configs (`Record<string, any>`)
    - Branch action picker uses same DropdownMenu as "Add Step" (groups + icons), **excludes If/Else** to prevent infinite loops
    - Selecting an action **auto-opens Dialog popup** with full step config for that type
    - Each branch shows a summary of the configured action (e.g., "Wait: 2d 3h", "Send a Message: AI Directive · WhatsApp")
    - Delete Action button in popup resets branch to "None"
    - Branches stack vertically (not grid) to fit sidebar width
    - `defaultBranchConfig()` initializes correct fields per type (including `hard_requirement` with `rules: [], combinator: 'and'`)
    - `branchStepType()` maps config to display type (handles `toggle_ai` → `toggle_ai_pause`/`toggle_ai_start`)
    - Condition modal targets: `'branchTrue'` / `'branchFalse'` for Hard Requirement branches
  - Condition system: `ConditionRule` with 14 types, `ConditionCombinator = 'and' | 'or'` — configured via `JourneyConditionsModal.vue` (reusable for Hard Requirement, If-Else, Wait Until Condition, and branch Hard Requirements)
  - `JourneyStatus = 'active' | 'inactive'` (no 'draft' — known pre-existing type error in `pages/journeys/index.vue`)
  - `addStepOptions`: Removed `context_check` and `end_journey`. Remaining: Wait, Send Message, If/Else, Hard Requirement, Create Action Item, Create Reservation Note, Pause/Start Auto-responses, Integrations
  - `handleStepUpdate` uses `splice` (not object spread) to avoid Select dropdown portal issues

- **Components**:
  - `JourneyEditor.vue` — Editor top bar (Add Requirements, Build with AI, Save as Template), step canvas, add step dropdown, sidebar
  - `JourneyStepSidebar.vue` — Step config UI for all step types + trigger config + branch dialog
  - `JourneyStepCard.vue` — Step cards with badges + summary text
  - `JourneyBuilderReview.vue` — AI-generated journey review screen
  - `JourneyConditionsModal.vue` — Reusable Configure Conditions modal (14 types, AND/OR)
  - `JourneySaveTemplateModal.vue` — Save as Template modal
  - `JourneyBuildAIModal.vue` — Build with AI modal

- **Page**: `app/pages/journeys/index.vue` — Marketplace view, builder flow, editor routing

### Booking Widgets Module (`app/components/booking-widget/`)

- **Data + types**: `app/components/booking-widget/data/widgets.ts`
  - `BookingWidgetConfig` type with new fields: `cleaningFee`, `prepayment`, `extraGuestPerNight`, `extraGuestStartAt`, `maxGuests`, `extraChildPerNight`, `seasonalConditions`, `lengthOfStayDiscounts`, `contactFields`, `status`
  - `ToggleableAmount` = `{ mode: 'currency' | 'percent', value: number }`
  - `SeasonalCondition` = `{ id, startDate, endDate, arrivalDays, departureDays }`
  - `LengthOfStayDiscountTier` = `{ id, minNights, discountType: '%' | 'fixed', value }`
  - `ContactFields` = `{ firstName, lastName, email, phone, country, address, notes, arrivalTime }` (each `'required' | 'optional' | 'hidden'`)
  - `bookingWidgets` ref (local reactive copy `widgets` used in index page for reliable reactivity)
  - `useBookingWidgets()` composable: `getWidgetById()`, `buildEmbedPreview()`, `copyEmbedSnippet()`, `getSnippetForForm()`

- **Page**: `app/pages/booking-widgets/index.vue`
  - Minimal card layout: widget name, listing count, status toggle (active/inactive), more menu (Edit/Preview/Delete)
  - Status toggle uses native `<button>` styled as switch (not shadcn Switch) for reliable reactivity
  - Delete confirmation dialog

- **Page**: `app/pages/booking-widgets/new.vue`
  - 3 tabs: Accommodation Setting | Booking System Setting | Embed in Website
  - **Accommodation tab**: multi-select listings (checkbox dialog with tags), cleaning fee/prepayment/extra guests/extra child (all with currency/% toggle), min days before arrival, max guests, seasonal conditions (RangeCalendar popover + arrival/departure day toggles), length of stay discounts, promo codes
  - **Booking System tab**: currency, payment methods (multi-select), default payment option, locked requestNumberOfPersons, contact field configuration (8 fields × Required/Optional/Hidden dropdown)
  - **Embed tab**: allowed domains, embed snippet, UTM params, preview dialog

- **Components**:
  - `BookingWidgetPreview.vue` — Embed preview with listing selector, deposit info
  - `BookingWidgetWysiwyg.vue` — WYSIWYG editor (unused after Contact section redesign)

### Payment Request Module (`app/components/payment-request/`)

- **Data + types**: `app/components/payment-request/data/payment-requests.ts`
  - `PaymentRequest` type (with `status: 'pending' | 'paid' | 'expired' | 'cancelled'`, `feeMode: 'card' | 'manual'`, `createdBy: string`, `cancelledAt?`, `cancelledBy?`)
  - `PaymentRequestDraft` type for creation
  - `GuestOption` type for guest search (sources: inbox, payment_request, manual)
  - Fee helpers: `calculateFee()` (3% for card, 0 for manual), `calculateTotal()`, `generatePaymentLink()`, `getStaffName()`
  - Mock data: 4 requests (pending, paid, expired, cancelled)
- **State**: `app/composables/usePaymentRequests.ts`
  - `requests` uses `useState<PaymentRequest[]>` — mutations use spread syntax
  - Filters: `status` (single), `listings` (multi-select `string[]`), `dateFrom`/`dateTo`, `search`
  - Actions: `createRequest()`, `cancelRequest()`, `duplicateRequest()`, `checkDuplicate()`, `expireOldRequests()`, `isListingAssigned()`
- **Page**: `app/pages/payment-requests/index.vue`
  - Filter bar: Search input, Status dropdown, Listing filter (Popover + search + Tags button inside search bar), Date range (RangeCalendar 2-month view)
  - Active filters shown as removable chips below filter bar
  - Stats: pending count, paid count
- **Components**:
  - `PaymentRequestCreateDialog.vue` — Create form with guest search (Popover+Command from inbox guests + previous PR guests + manual), listing picker (search + tag filter), fee mode toggle (Card/Manual), amount + title + description + expiry
  - `PaymentRequestTable.vue` — Table with Guest, Title, Listing, Amount, Status, Created by (avatar initials + name), Created (time ago)
  - `PaymentRequestDetailDialog.vue` — Status banner, creator info (name + date), cancellation info (who + when + reason), amount breakdown, payment link copy
  - `PaymentRequestShareDialog.vue` — Copy link (toast confirmation), WhatsApp share, Email share
  - `FeeCalculator.vue` — Live fee preview (Card: +3%, Manual: no fee)
- **Guest search**: Sources from `useInbox().conversations` + existing payment requests. "Add new guest" option when no match. Email auto-fills for existing guests, empty for new guests.
- **Share dialog**: Opens AFTER creation via `@created` event. No QR Code button.

### Settings Module (`app/components/settings/`)

- **Payouts**: `app/pages/settings/payouts.vue` + `app/components/settings/PayoutGatewayPanel.vue`
  - Payout gateway configuration (Stripe, PayPal, bank transfer)
  - Custom SVG logos: `DokuLogo.vue`, `XenditLogo.vue`
  - Data: `app/components/settings/data/payouts.ts`

### Operations Calendar Module (`app/components/operations-calendar/`)

- **Data + types**: `app/components/operations-calendar/data/operations-calendar.ts`
  - `OperationsFilters` type with `listingSearch`, `listingTags` (AND logic), `eventTypes` (OR logic)
  - `CalendarEvent` type with `type: 'guest_stay' | 'cleaning' | 'task'`, `listingId`, scheduled times
- **State**: `app/composables/useOperationsCalendar.ts`
  - `filters` — `ref<OperationsFilters>`, computed filter pipelines
  - Navigation: `previousWeek()`, `nextWeek()`, `goToToday()`
- **Page**: `app/pages/operations-calendar.vue` — Week/Day toggle, filter bar, board grid
- **Components**:
  - `OperationsCalendarFilters.vue` — Search input, Tags Popover, Event Types Popover, Clear button. Uses native `<button @click>` + plain `<span>` checkbox visuals (bypasses Reka UI CheckboxRoot `:checked` prop issue)
  - `OperationsCalendarBoard.vue` — Week/day grid
  - `OperationsCalendarEventChip.vue` — Event chip in grid cells
  - `OperationsCalendarCreateDialog.vue` — Create cleaning job / task

### CI/CD

- **GitHub Actions**: Two workflows — `CI` (lint + build check) and `Deploy to GitHub Pages`
- **ESLint**: `eslint.config.js` uses `@antfu/eslint-config` + Nuxt config. Ignores `docs/**`, `dist/**`, `.output/**`
- **Known pre-existing type errors**: `JourneyStatus` 'draft' in `pages/journeys/index.vue`, `useJourneys.ts` `lastModified` undefined — do not block deploy (build succeeds)

### Layout

- **Topbar**: `app/components/layout/Header.vue` — SidebarTrigger + user menu (no breadcrumb)
- **User menu**: `app/components/layout/HeaderUserMenu.vue` — Komang Juliantara + "Guest Relations" role dropdown
- **Sidebar**: `app/components/layout/AppSidebar.vue` — No footer (user menu moved to topbar)
- **Sidebar nav**: `app/components/layout/SidebarNavLink.vue` — Unread count badge on Inbox link

### UI Patterns

- **Toast notifications**: Uses `vue-sonner` (already in `app.vue`). Call `toast.success()` / `toast.info()` for user action feedback.
- **Unread badges**: `Badge` component with `variant="default"` showing count. On sidebar Inbox link and per-conversation in list.
- **AI-written messages**: `aiWritten: true` on host messages → shows "ElevAI" as sender name, sparkle avatar, "AI" label instead of user name
- **Action Needed status**: Only `action_needed` or `null` (no `needs_reply`, `waiting_on_guest`, `done`). Badge shown only when `status === 'action_needed'` (destructive variant).

### Current User Context

The logged-in user is **Komang Juliantara** (Guest Relations role), not "You" (Admin). The `staff-1` / "You" in data represents the property owner; Komang is the active staff member viewing the dashboard.

## Conventions

- **shadcn-vue components**: Use existing shadcn components from `app/components/ui/`
- **Semantic colors**: Use theme tokens (`bg-muted`, `text-muted-foreground`, `bg-warning`, etc.) — no hardcoded colors except ElevAI gold
- **ElevAI gold**: `bg-[#C8A84B]` only for ElevAI branding; `bg-warning` for host chat bubbles and toggle
- **Icons**: Use `lucide:` prefix (e.g. `lucide:user-check`); OTA icons use `logos:airbnb` and `simple-icons:bookingdotcom`
- **CSS framework**: Tailwind CSS v4
- **State mutations**: Always use spread syntax (`{ ...conv, field: value }`) when modifying conversation properties to ensure Vue reactivity triggers
