# Upsell Request Flow PRD

**Date:** 2026-06-17  
**Module:** Upsells  
**Scope:** Upsell page, request upsell flow, order lifecycle, staff handling, guest communication

## Problem Statement

The current Upsells area is split into a catalog and an orders view, but the request upsell flow is not described as a product workflow anywhere canonical. Teams need a clear definition of how a guest request becomes a handled order, who acts on it, what states it can move through, and what the page must support operationally.

## Goals

1. Let staff create upsells for a reservation and distinguish instant upsells from by-request upsells.
2. Make request upsells visible, actionable, and traceable from the Upsells page.
3. Give staff a reliable lifecycle for approval, payment, fulfillment, and cancellation.
4. Keep order state understandable at a glance in both the table and the order drawer.
5. Preserve a clean handoff between the catalog, the reservation context, and inbox-driven requests.

## Non-Goals

1. Guest self-service ordering portal.
2. Automatic online payments or gateway integration.
3. Inventory and stock reservation.
4. Dynamic pricing rules.
5. Full automation of approvals without staff review.

## Current Shape

The current page at `app/pages/upsells.vue` already exposes two views:

- Catalog: service management
- Orders: request and fulfillment management

The supporting data model already distinguishes order lifecycle through `approvalStatus`, `paymentStatus`, and `fulfillmentStatus` in `app/components/upsells/data/upsell-orders.ts`. Service availability already supports `always` and `by_request` in `app/components/upsells/data/upsell-services.ts`.

That means the missing piece is not core plumbing. It is product definition: what the request upsell flow is, how people use it, and what outcomes the page must support.

## User Roles

Primary users:

- Guest Relations staff, especially Komang Juliantara
- Admin or General Manager handling exceptions
- Property-facing operational staff when a service is assigned to them

Secondary users:

- Front desk or reservations staff creating requests from inbox or manually from the reservation context
- Finance or operations staff reviewing paid and completed orders

## Core Entities

### Upsell Service

A catalog item the tenant offers to guests.

Relevant fields:

- `category`
- `availability` = `always` or `by_request`
- `notificationUsers`
- `assignedListings`
- `pricingEnabled`
- `items`

### Upsell Order

A guest-specific request or purchase created for a reservation.

Relevant fields:

- `reservationId`
- `guestName`
- `serviceId`
- `serviceName`
- `source` = `inbox`, `manual`, or `web`
- `approvalStatus`
- `paymentStatus`
- `fulfillmentStatus`
- `decisionReason` / `cancellationReason`
- timestamps for approval, payment, fulfillment, and completion

## Request Upsell Definition

A request upsell is an order that cannot be finalized automatically. It requires staff review before the guest is told that the service is confirmed or a payment step is issued.

In practice, this applies when:

- the service is marked `by_request`
- the service has operational constraints such as staffing, vehicle availability, or timing conflicts
- the order is created from inbox context and needs human review

## Flow Overview

1. A guest expresses interest in an upsell, or staff creates one on their behalf.
2. The order is created in `requested` state.
3. Staff reviews the request in the Orders view or from the inbox context.
4. Staff either approves the request or declines it with a reason.
5. Approved requests move into payment handling if required.
6. Once paid, the order moves into fulfillment.
7. Completion closes the order and marks the service as delivered.
8. Cancellation or decline keeps the decision reason attached for audit and guest communication.

## Lifecycle States

### Approval

- `requested`
- `approved`
- `declined`

### Payment

- `unpaid`
- `awaiting_payment`
- `paid`

### Fulfillment

- `not_started`
- `in_progress`
- `completed`

### Display Status

The page should reduce the lifecycle into a simple operational label for scanning:

- Requested
- Awaiting Payment
- Paid - In Progress
- Completed
- Declined

## Main Flow

### 1. Create Request

A request can originate from:

- the Upsells catalog page when staff selects a service for a reservation
- the reservation or guest context
- an inbox thread when the guest asks for a service directly

Required order data at creation:

- reservation
- guest
- service
- chosen item or package
- service date
- assigned staff where relevant
- source

Expected result:

- order is visible in the Orders view
- request is flagged for action
- any assigned staff can see it quickly

### 2. Review Request

The reviewer checks:

- guest and reservation details
- service timing against stay dates
- whether the service is available and feasible
- any notes from the request thread
- pricing and item selection

Possible outcomes:

- approve
- decline with reason
- reopen if previously declined

### 3. Approve Request

When staff approves a request:

- the request becomes approved
- the order moves to payment handling
- a payment link or payment instruction can be issued
- the order remains visible as actionable until paid

### 4. Payment Handling

Payment can be handled in two ways:

- automatically through a link or guest payment flow
- manually by staff when payment is taken offline

When payment is recorded:

- the order is marked paid
- fulfillment can begin
- staff can move to the service delivery step

### 5. Fulfillment

For physical or time-based services:

- staff marks the service as started
- staff marks the service as completed after delivery
- the order stays on the operational list until completion

### 6. Decline or Cancel

If the request cannot be fulfilled:

- staff declines it with a clear reason
- the reason is retained on the order
- if the order was already in motion, cancellation should preserve the audit trail and show who cancelled it

## UX Requirements for the Upsells Page

### Catalog View

The catalog must support:

- service creation and editing
- `always` versus `by_request` availability
- listing assignment
- service-level notification recipients

### Orders View

The orders view must support:

- filtering by lifecycle status
- searching by guest, service, reservation, or listing
- scanning by order status, guest, total, and service date
- opening a detail drawer for deeper action

### Order Drawer

The drawer must surface:

- guest identity
- reservation and stay context
- service details and pricing
- item breakdown
- current lifecycle state
- assigned staff
- action history or decision context where available

### Actions

The drawer or row actions should support:

- approve request
- send payment step
- record payment
- start fulfillment
- complete fulfillment
- decline or cancel
- reopen a declined request

## Notifications

The request upsell flow should generate staff-facing signals for:

- new request created
- request approved
- payment pending
- payment recorded
- fulfillment started
- fulfillment completed
- declined or cancelled order
- urgent pending request near service time

Notifications should direct staff to the order that needs attention, not just announce that something changed.

### Staff Notification Templates

These are the canonical staff-facing messages for the request upsell flow:

- **New request:** `New Upsell Request` - `[Guest Name] requested [Service Name] for [Service Date]. Action needed.`
- **Approved:** `Order Confirmed` - `Order [Order ID] for [Guest Name] ([Service Name], [Service Date]) has been confirmed. Pay here: [Payment Link].`
- **Payment reminder:** `Order Reminder` - `Reminder: [Service Name] for [Guest Name] is tomorrow ([Service Date]). Your payment is still pending. Pay here: [Payment Link].`
- **Payment recorded:** `Payment Recorded` - `Order [Order ID] has been marked as paid.`
- **Fulfillment started:** `Fulfillment Started` - `Order [Order ID] for [Guest Name] is now in progress.`
- **Completed:** `Order Completed` - `Order [Order ID] for [Guest Name] ([Service Name]) is completed.`
- **Declined:** `Order Declined` - `Order [Order ID] for [Guest Name] was declined. Reason: [Reason].`
- **Cancelled:** `Order Cancelled` - `Order [Order ID] for [Guest Name] was cancelled. Reason: [Reason].`
- **Urgent pending:** `Upsell Requires Action` - `Order [Order ID] is still pending and service is tomorrow. Please confirm or cancel.`

### Staff Notification Timing

| Event | Send when |
|---|---|
| New request created | Immediately when the order is created |
| Request approved | Immediately when staff approves the order |
| Request declined | Immediately when staff declines the order |
| Payment reminder | 24 hours before `serviceDate` if the order is still unpaid or awaiting payment, with `[Payment Link]` included if available |
| Urgent pending alert | 2 hours before `serviceDate` if the order is still not resolved |
| Payment recorded | Immediately when payment is marked as received |
| Fulfillment started | Immediately when staff starts the service |
| Fulfillment completed | Immediately when staff completes the service |
| Cancellation | Immediately when the order is cancelled |

Recommended resend rule:

- one reminder at 24 hours before service time
- one urgent alert at 2 hours before service time if still unresolved
- no repeat alerts after the order is paid, declined, cancelled, or completed

## Guest Communication

Guest updates should be tied to state changes, not free-form ad hoc messaging.

Expected guest-facing moments:

- request received
- approved and payment is needed
- payment confirmed
- service confirmed and scheduled
- cancellation or decline

### Guest Message Templates

These are the canonical guest-facing templates for the request upsell flow:

- **Request received:** `Hi [Guest First Name], we received your request for [Service Name]. Our team is reviewing it now.`
- **Approved, payment needed:** `Hi [Guest First Name]! Your request for [Service Name] on [Service Date] is confirmed. Please complete payment to proceed: [Payment Link].`
- **Payment confirmed:** `Hi [Guest First Name], your payment for [Service Name] has been received. We are preparing everything for [Service Date].`
- **Service confirmed and scheduled:** `Hi [Guest First Name], your [Service Name] is scheduled for [Service Date]. We will follow up if anything changes.`
- **Payment reminder:** `Hi [Guest First Name], your [Service Name] for [Service Date] is still waiting for payment. Please complete it here: [Payment Link].`
- **Final reminder:** `Hi [Guest First Name], your [Service Name] is coming up on [Service Date]. If payment is still pending, please complete it here: [Payment Link].`
- **Declined:** `Hi [Guest First Name], unfortunately we cannot fulfill your request for [Service Name]. [Reason]`
- **Cancelled by staff:** `Hi [Guest First Name], unfortunately we had to cancel your [Service Name] request. [Reason]`

### Guest Message Timing

| Event | Send when |
|---|---|
| Request received | Immediately when the order is created |
| Approved, payment needed | Immediately when staff approves the request, with the payment link if one exists |
| Payment confirmed | Immediately when payment is recorded |
| Service confirmed and scheduled | Immediately after payment is confirmed or when the order is otherwise locked in |
| Payment reminder | 24 hours before `serviceDate` for confirmed orders that still need payment, with `[Payment Link]` if payment is still outstanding |
| Final reminder | 2 hours before `serviceDate` for time-sensitive services, if the order is still open |
| Declined | Immediately when staff declines the request |
| Cancelled by staff | Immediately when staff cancels the order |

Recommended resend rule:

- do not resend the same guest message more than once for the same state transition
- skip reminder messages if the order is already completed, declined, or cancelled
- if the guest has no contact channel, log the message as pending staff follow-up instead of sending

### Delivery Rules

- Staff notifications are always internal and should link to the order drawer.
- Guest messages are sent only when the order state changes.
- Request received, approved, payment confirmed, and cancellation all require a guest-facing message if guest contact is available.
- Decline and cancellation messages must include a reason when one exists.
- The message log should keep the latest sent timestamp per order so staff can see whether the guest was already notified.

## Data and Audit Expectations

Every meaningful state change should retain:

- who changed it
- when it changed
- why it changed if it was declined or cancelled
- whether the action came from inbox, manual, or web origin

## Acceptance Criteria

1. A by-request upsell can be created and is visible as a request, not as a completed sale.
2. Staff can approve, decline, take payment, start fulfillment, and complete the order in a clear sequence.
3. The page shows request status clearly without requiring staff to inspect raw lifecycle fields.
4. Declined or cancelled requests retain a reason.
5. Staff notifications point to the exact order that needs action.
6. Inbox-originated requests remain linked to the conversation or reservation context.
7. The workflow supports the existing page structure without needing a new module.

## Open Product Questions

1. Should `by_request` services always require manual approval, or can some be auto-approved after a rule check?
2. Do we want a separate guest-visible status for `approved` versus `payment pending`, or is the current operational simplification enough?
3. Should decline and cancellation be separated in the UI, or kept under one staff action with different reasons?
4. Which source should be treated as the primary creation path for request upsells: inbox, reservation view, or the Upsells page itself?
