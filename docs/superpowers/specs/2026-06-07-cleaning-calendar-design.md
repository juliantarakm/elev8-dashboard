# Cleaning Calendar Design

> **Goal:** Build a cleaning calendar that tracks cleaning work per listing and per cleaner, supports manual creation and auto-generation from checkout reservations, and appears both inside Listing Maintenance and as a dedicated calendar module.

## Scope

This feature adds a single cleaning workflow with two entry points:

1. A listing-scoped view inside `Listing Maintenance` for operational work on one property at a time.
2. A global `Cleaning Calendar` page for staff to review and manage all cleaning jobs across listings.

The same data must back both surfaces. A cleaning job can be created manually by staff or generated automatically from a checkout reservation, then edited before confirmation.

## Product Rules

- Every cleaning job belongs to exactly one listing.
- Every cleaning job can optionally be assigned to one cleaner or team.
- Cleaning jobs must support both one-time and recurring schedules.
- Manual creation and auto-generated checkout cleaning must use the same form and data structure.
- The global calendar must be filterable by listing, cleaner, status, and priority.
- `Listing Maintenance` should show only jobs for the active listing, but still allow creation and editing.

## Data Model

Create a shared cleaning domain model in a new data/composable layer that can be reused by listing detail and the calendar page.

Recommended fields for a cleaning job:

- `id`
- `listingId`
- `listingName`
- `scheduledAt` or `date` + `time`
- `cleanerId`
- `cleanerName`
- `teamName`
- `status` with values like `draft`, `scheduled`, `confirmed`, `in_progress`, `done`, `cancelled`
- `priority` with values like `low`, `normal`, `high`, `urgent`
- `durationMinutes`
- `notes`
- `source` with values like `manual`, `checkout`
- `reservationId` when auto-generated from a checkout reservation
- `recurrence` for repeating jobs, if enabled

Recurring support should be simple and explicit, not a full scheduling engine. The model only needs to handle the patterns the UI can create and edit.

## UI Surfaces

### 1) Listing Maintenance

Extend the existing maintenance tab to include a cleaning jobs section, not just the current static cleaning schedule and generic tasks.

The listing view should:

- show cleaning jobs for the active listing only
- allow creating a new cleaning job from the listing context
- allow editing status, cleaner, time, notes, duration, and priority
- show whether a job was created manually or from checkout
- keep the existing maintenance tasks area intact unless it conflicts with the cleaning calendar structure

### 2) Cleaning Calendar Page

Add a new route for an all-listings cleaning calendar.

The page should:

- show a calendar or agenda-style schedule of cleaning jobs
- support quick filters for listing, cleaner, status, and priority
- allow switching between day, week, and agenda-style views if it fits the current UI patterns
- provide a create button for manual jobs
- show compact job cards that include listing, cleaner, time, duration, and status

## Auto-Generation From Checkout

When a reservation is checked out, the system should be able to create a proposed cleaning job automatically.

The auto-generated job should:

- inherit the listing and guest checkout context
- default to a reasonable cleaning time after checkout
- start in a non-final state such as `draft` or `scheduled`
- be editable before it is confirmed

This feature is mock/data-driven for now. It does not need a live reservation service integration.

## Manual Creation Flow

Manual creation should be available from both surfaces.

The form should allow staff to set:

- listing
- date and time
- cleaner or team
- duration
- priority
- notes
- recurrence, if needed

The same form component should be reused in the listing tab and in the calendar page to avoid drift.

## State and Behavior

- Keep cleaning jobs in a shared reactive store or composable so both views stay in sync.
- Mutations should use the same reactivity pattern the repo already uses for shared state.
- Editing a job in one place must update the other view immediately.
- Filters should be local UI state, not baked into the canonical job data.

## Empty and Error States

- If a listing has no cleaning jobs, show an empty state with a create action.
- If the global calendar has no matching results after filters, show a filtered empty state and a clear-filters action.
- If an auto-generated checkout job cannot be created because required reservation data is missing, the UI should fall back to manual creation rather than failing silently.

## Out of Scope

- Real-time dispatch to cleaners
- Push notifications or external integrations
- Billing or payroll for cleaning staff
- Complex multi-step recurrence rules beyond the simple patterns the UI can author

## Acceptance Criteria

- A staff member can create a cleaning job manually from `Listing Maintenance`.
- A staff member can create a cleaning job manually from the global cleaning calendar.
- The system can generate a cleaning job from a checkout reservation.
- The same cleaning job appears in both the listing-specific view and the global calendar.
- Staff can filter the calendar by listing, cleaner, status, and priority.
- Staff can update cleaning status and assignment without leaving the calendar.

## Implementation Notes

- Reuse the existing Elev8 component style: shadcn-vue, semantic Tailwind tokens, concise badges, and table/card hybrids where appropriate.
- Keep the calendar module aligned with the rest of the dashboard rather than introducing a separate visual language.
- Prefer small focused components: one for data, one for list/calendar display, and one shared job form.
