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
  - `IfElseStep`: `trueBranchStep` / `falseBranchStep` store full step configs (`Record<string, any>`) — user picks a step type from the same menu as "Add Step", and the full config UI opens in a Dialog popup. Each branch can have one action. Delete via Dialog.
  - Condition system: `ConditionRule` with 14 types, `ConditionCombinator = 'and' | 'or'` — configured via `JourneyConditionsModal.vue` (reusable for Hard Requirement, If-Else, Wait Until Condition)
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
