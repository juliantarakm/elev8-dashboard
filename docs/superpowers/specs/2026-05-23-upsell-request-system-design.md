# Upsell Request & Order Management System — Design Spec

> **Status:** Draft  
> **Date:** 2026-05-23  
> **Related:** Upsells Catalog (`docs/superpowers/specs/2026-05-23-upsells-catalog-design.md`)

---

## 1. Overview & Purpose

The Upsell Request & Order Management System connects the Upsells Catalog to real guest bookings, staff notifications, and guest communications. It transforms the catalog from a static product list into a revenue-generating, trackable workflow.

### Key Goals
1. **Request Flow** — Guests can request upsells; staff approve/reject/manage
2. **Order Tracking** — Every upsell order has lifecycle (pending → confirmed → completed/cancelled)
3. **Staff Notifications** — Real-time alerts to assigned staff for action needed
4. **Guest Notifications** — Automated status updates via WhatsApp/Email
5. **Inbox Integration** — Create orders directly from guest chat threads

### Scope
- **In scope:** Catalog availability, order CRUD, status workflow, staff notifications, guest notifications, inbox integration, edge cases
- **Out of scope (Phase 2):** Guest self-service portal, payment gateway integration, inventory/stock tracking, automated pricing rules

---

## 2. Data Model

### 2.1 UpsellService (Catalog)

Already built. Key field added:

```ts
interface UpsellService {
  // ... existing fields ...
  availability: 'always' | 'by_request'
  notificationUsers: string[] // staff IDs to notify for this service
}
```

- `availability: 'always'` — Guest can order anytime, auto-confirmed
- `availability: 'by_request'` — Requires staff confirmation

### 2.2 UpsellOrder

Already built. Added fields for notification tracking:

```ts
interface UpsellOrder {
  id: string
  reservationId: string
  guestName: string
  guestEmail?: string
  guestPhone?: string // NEW: for WhatsApp notifications

  serviceId: string
  serviceName: string
  serviceCategory: string

  items: UpsellOrderItem[]
  subtotal: number
  taxAmount: number
  serviceAmount: number
  grandTotal: number
  currency: string

  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  cancellationReason?: string // NEW: required when cancelling
  cancellationBy?: 'guest' | 'staff' // NEW

  orderDate: string
  serviceDate: string
  serviceEndDate?: string // For multi-day services (vehicle rental)
  checkInDate: string
  checkOutDate: string

  listing: string
  channel: string
  notes: string
  invoice?: string
  staffAssigned?: string // Primary staff responsible

  source: 'inbox' | 'manual' | 'web' // NEW
  conversationId?: string // NEW: link to inbox thread
  createdByStaffId: string // NEW: who created the order

  // Notification tracking
  guestNotifiedAt?: string // NEW: last guest notification timestamp
  staffNotifiedAt?: string // NEW: last staff notification timestamp

  createdAt: string
  updatedAt: string
}

interface UpsellOrderItem {
  id: string
  name: string
  price: number
  quantity: number
}
```

### 2.3 StaffNotification

Reuses existing Notification Center infrastructure:

```ts
interface StaffNotification {
  id: string
  type: 'order_requested' | 'order_confirmed' | 'order_cancelled'
    | 'order_completed' | 'order_late_cancel' | 'order_no_show'
    | 'order_reminder'
  severity: 'info' | 'warning' | 'urgent'

  title: string
  message: string

  orderId: string
  recipientStaffId: string

  read: boolean
  createdAt: string
  actionUrl: string // e.g. '/upsells?tab=orders&order=ord-001'

  // For notification center grouping
  category: 'upsell'
  autoResolve: boolean // auto-dismiss after action taken
}
```

### 2.4 GuestNotificationLog

```ts
interface GuestNotificationLog {
  id: string
  orderId: string

  type: 'status_change' | 'reminder' | 'confirmation'
  channel: 'whatsapp' | 'email' | 'sms'

  content: string // Message body sent
  templateId?: string // Reference to message template

  sentAt: string
  delivered: boolean // Delivery confirmation
  failed: boolean
  failureReason?: string
}
```

### 2.5 CancellationPolicy (NEW — per service)

```ts
interface CancellationPolicy {
  serviceId: string
  fullRefundHours: number // e.g. 48
  partialRefundHours: number // e.g. 24
  partialRefundPercent: number // e.g. 50
  noRefundHours: number // e.g. 0 (same day)
  lateCancellationFee: number // Flat fee for < 24h
}
```

---

## 3. Status Lifecycle & Transitions

```
┌─────────┐    confirm      ┌───────────┐    complete    ┌───────────┐
│ PENDING │ ──────────────→ │ CONFIRMED │ ────────────→│ COMPLETED │
└────┬────┘                 └─────┬─────┘              └───────────┘
     │ cancel                           │ cancel
     │ (by staff/guest)                 │ (by guest < 24h)
     ▼                                  ▼
┌───────────┐                   ┌───────────┐
│ CANCELLED │                   │ CANCELLED │
│  (refund) │                   │  (no refund)
└───────────┘                   └───────────┘
```

### Transition Rules

| From | To | Who | Effects |
|------|-----|-----|---------|
| pending | confirmed | Staff | Notify guest, generate invoice, lock service date |
| pending | cancelled | Staff/Guest | Notify both, apply refund policy |
| confirmed | completed | Staff | Mark revenue, notify guest |
| confirmed | cancelled | Guest | Check cancellation policy, apply fees |
| confirmed | cancelled | Staff | Full refund, notify guest |
| cancelled | pending | Staff | Reopen order (rare) |
| any | any | System | Log audit trail, update timestamps |

---

## 4. Staff Notification Flow

### 4.1 Trigger Events

| Event | Severity | Recipients | Action Required |
|-------|----------|------------|----------------|
| New order (by_request) | info | `staffAssigned` + `notificationUsers` | Confirm/Reject |
| New order (always) | info | `staffAssigned` | Review (FYI) |
| Status → confirmed | info | `createdByStaffId` | None (FYI) |
| Status → completed | info | `staffAssigned` | None (FYI) |
| Status → cancelled | warning | `staffAssigned` | Review reason |
| Service date < 24h & pending | urgent | `staffAssigned` | Urgent confirm |
| Guest no-show | warning | `staffAssigned` | Log incident |
| Order created from inbox | info | `staffAssigned` | Review chat context |

### 4.2 Notification Content Examples

**Order Requested (by_request)**
```
Title: New Upsell Request
Message: [Guest Name] requested [Service Name] for [Service Date]. 
         Action needed.
Action: Open order drawer
```

**Urgent — Pending < 24h**
```
Title: Upsell Requires Action
Message: Order [ord-001] is still pending and service is tomorrow.
         Please confirm or cancel.
Severity: urgent
```

### 4.3 Notification UI

Reuses existing **NotificationCenter** (`app/components/notifications/`):

- New category filter: "Upsells" in notification dropdown
- Unread badge on bell icon
- Click → navigate to order detail with highlight
- Auto-mark-read when order opened
- Auto-dismiss after 7 days or after status resolved

### 4.4 Inbox Integration — Create Order

**Location:** `inbox/Thread.vue` — floating action button or reply bar extension

**Flow:**
1. Staff clicks "Create Upsell Order" (shopping-cart icon)
2. Mini drawer opens with:
   - Guest info pre-filled from conversation
   - Service selector (dropdown dengan search)
   - Item picker (checkboxes dengan harga)
   - Service date picker
   - Notes field (auto-fill dari chat context terakhir)
3. Submit:
   - `source: 'inbox'`, `conversationId: currentThread.id`
   - If service `always` → status = confirmed, guest notified immediately
   - If service `by_request` → status = pending, staff notified
4. Toast: "Order created successfully"
5. Order link muncul di chat thread sebagai system message (visible ke staff)

---

## 5. Guest Notification Flow

### 5.1 Channels

| Channel | Priority | Use Case |
|---------|----------|----------|
| **WhatsApp** | Primary | Status changes, reminders, confirmations |
| **Email** | Secondary | Invoice, detailed booking confirmation |
| **In-app** | Tertiary | Future guest portal |

### 5.2 Message Templates

**Pending → Confirmed**
```
Hi [guestFirstName]! ✨

Your [serviceName] is confirmed for [serviceDate] at [listing].

Details:
[itemsList]
Total: [grandTotal]

Our team will contact you 24h before. Need changes? Reply here or call us.

— The R Team
```

**Confirmed → Completed**
```
Hi [guestFirstName],

Thanks for choosing our [serviceName]! We hope you enjoyed it.

Invoice: [invoice]
Feedback? Reply to this message.

— The R Team
```

**Cancellation (by staff)**
```
Hi [guestFirstName],

We regret to inform you that your [serviceName] for [serviceDate] 
could not be confirmed due to [cancellationReason].

We'd love to offer you:
[alternativeSuggestions]

Full refund processed. Sorry for the inconvenience.

— The R Team
```

**24h Reminder**
```
Hi [guestFirstName]! 🔔

Reminder: Your [serviceName] is tomorrow ([serviceDate]).

[serviceSpecificDetails]
Questions? WhatsApp us anytime.

— The R Team
```

### 5.3 Delivery Tracking

- Every message logged in `GuestNotificationLog`
- Failed WhatsApp → auto-retry email fallback
- Email bounce → log error, show in order notes for staff
- Delivery status shown in order drawer: "Guest notified ✓"

---

## 6. Edge Cases & Business Rules

### 6.1 Cancellation Policy Engine

```ts
function calculateRefund(order: UpsellOrder, cancelledAt: string): {
  refundAmount: number
  refundPercent: number
  lateFee: number
  reason: string
}
```

**Rules:**
- Cancel > 48h before service date → 100% refund
- Cancel 24-48h before → 50% refund
- Cancel < 24h before → 0% refund, late fee applies
- Staff cancels (unavailable) → 100% refund regardless of timing
- No-show (guest) → 0% refund, charge full amount

### 6.2 Overbooking Prevention

**Current (simple):**
- Vehicle rental: max 2 scooters, 2 cars available per day
- Spa: max 2 sessions per therapist per day
- Chef: max 1 booking per evening

**Behavior:**
- If slot full → order auto `pending` with note "Overbooking risk"
- Staff gets urgent notification to resolve (split booking, alternative date)
- Guest gets: "We're checking availability, will confirm shortly"

### 6.3 Short Notice Requests

- Guest requests service with `serviceDate < 24h` from now
- Show warning banner in drawer: "Short notice — may not be confirmed"
- Staff gets `urgent` notification
- If not confirmed within 4h → auto-cancel, guest notified

### 6.4 Service Date Validation

- `serviceDate` must be between `checkInDate` and `checkOutDate` (inclusive)
- For check-out/check-in services: must equal respective date
- Past dates: disabled in date picker

### 6.5 Communication Failure Handling

| Failure | Fallback | Escalation |
|---------|----------|------------|
| WhatsApp not delivered | Retry → Email | Log in order notes |
| Email bounced | Retry → SMS | Staff notification |
| All channels fail | Log error | Manual follow-up by staff |
| Staff notification unread > 2h | — | Notify secondary staff |

### 6.6 Duplicate Order Prevention

- Same guest + same service + same serviceDate → show warning "Duplicate order?"
- Staff can proceed with confirmation
- Auto-merge identical items (increment quantity)

### 6.7 Reschedule Flow

- Staff can edit `serviceDate` on confirmed orders
- Guest gets: "Your [Service] has been rescheduled to [New Date]"
- If new date conflicts → back to pending, re-confirm

---

## 7. UI/UX Design

### 7.1 Page Upsells — 3 Tabs

```
┌────────────────────────────────────────────────────────────┐
│ Upsells                                           [+ Add]  │
│                                                            │
│ [ Catalog ] [ Orders ] [ Notifications ]                   │
│                                                            │
│                                                            │
│ [Content varies by tab]                                    │
└────────────────────────────────────────────────────────────┘
```

**Catalog Tab:** Existing services table
**Orders Tab:** Existing orders table + KPI cards
**Notifications Tab:** (NEW)
- List of upsell-related staff notifications
- Filter: All / Unread / Action Needed
- Group by: Today / Yesterday / Earlier
- Each item: title, message preview, timestamp, order link, mark-read

### 7.2 Inbox Thread — Create Order Button

**Placement:** Below message thread, above reply box. Or as floating action button (FAB) in thread header.

**Button:**
```
[shopping-cart icon] Create Upsell Order
```

**Mini Drawer (width: 400px):**
```
┌────────────────────────────┐
│ Create Upsell Order        │
│ ─────────────────────────  │
│ Guest: [Guest Name]        │
│ Reservation: [ID]          │
│                            │
│ Service *                  │
│ [Dropdown / Searchable]    │
│                            │
│ Items                      │
│ [x] Item A - IDR 350K      │
│ [x] Item B - IDR 500K      │
│                            │
│ Service Date *             │
│ [Date Picker]              │
│                            │
│ Notes                      │
│ [Textarea]                 │
│                            │
│ [Cancel] [Create Order]    │
└────────────────────────────┘
```

### 7.3 Order Detail Drawer — Notification Section

Tambah tab atau section di drawer:

```
┌────────────────────────────────────┐
│ Order #ord-001                     │
│ [Details] [Items] [Notifications] │
│ ────────────────────────────────── │
│                                    │
│ Staff Notifications                │
│ ✓ Order created — Komang — 2h ago │
│ ✓ Confirmed — Komang — 1h ago    │
│                                    │
│ Guest Communications               │
│ ✓ WhatsApp: Confirmed — 1h ago   │
│ ✓ WhatsApp: Reminder — scheduled  │
│ ✗ Email: Invoice — bounced       │
│                                    │
│ [Resend Invoice] [Notify Guest]    │
└────────────────────────────────────┘
```

### 7.4 Cancellation Flow

**Modal:**
```
┌────────────────────────────────────┐
│ Cancel Order                       │
│ ────────────────────────────────── │
│ Reason *                           │
│ [Textarea]                         │
│                                    │
│ Refund: IDR 580,000 (100%)         │
│                                    │
│ Notify guest? [x] Yes              │
│                                    │
│ [Keep Order] [Confirm Cancel]      │
└────────────────────────────────────┘
```

---

## 8. Integration Points

### 8.1 Finance Module

**Completed orders auto-sync to Finance → Revenue → Upsell:**
- Trigger: status → completed
- Creates `UpsellEntry` in finance data
- Includes invoice, guest, amount, currency
- Ready for Jurnal/Bexio push

### 8.2 Notification Center

**Reuses `app/components/notifications/`:**
- New alert type: `UpsellOrderAlert`
- New severity mapping: urgent (pending < 24h), warning (cancelled), info (others)
- Navigation: click → `/upsells?tab=orders&highlight=[orderId]`

### 8.3 Inbox Module

**Reuses `app/components/inbox/`:**
- Thread-level: show linked orders badge
- Message-level: system message showing order creation
- Reply context: quick reply template "Your upsell order is confirmed"

---

## 9. Implementation Phases

### Phase 1: Core Order + Notifications
- Staff notification system (Notification Center integration)
- Guest notification templates + mock sending
- Cancellation flow with reason
- Order drawer notification log tab
- Upsells page Notifications tab

### Phase 2: Inbox Integration
- Create order button in Thread.vue
- Mini drawer for order creation
- Link orders to conversations
- Show order status in thread

### Phase 3: Automation + Edge Cases
- Cancellation policy engine
- Reminder scheduling (24h, 1h)
- Overbooking detection
- Short notice auto-cancel
- Finance sync for completed orders

### Phase 4: Polish
- Real WhatsApp/email integration (replace mock)
- Analytics dashboard (conversion rates, revenue)
- Guest self-service portal (Phase 2 future)

---

## 10. Mock Data Additions

### Staff Notifications (10 items)
- 3 × order_requested (pending)
- 2 × order_confirmed
- 1 × order_completed
- 2 × order_cancelled
- 1 × order_late_cancel
- 1 × urgent_reminder (pending < 24h)

### Guest Notification Logs (15 items)
- Status changes for all 10 orders
- 3 × 24h reminders
- 2 × failed delivery (for edge case testing)

---

## 11. Testing Checklist

### Functional
- [ ] Create order from catalog (manual)
- [ ] Create order from inbox
- [ ] Confirm pending order → guest notified
- [ ] Cancel order → reason required → refund calculated
- [ ] Reschedule confirmed order → guest notified
- [ ] Notification center shows upsell alerts
- [ ] Click notification → navigates to correct order
- [ ] Status change buttons reactive (no stale UI)

### Edge Cases
- [ ] Duplicate order warning
- [ ] Service date before check-in → rejected
- [ ] Service date after check-out → rejected
- [ ] Short notice (< 24h) → urgent notification
- [ ] Cancellation < 24h → no refund
- [ ] Communication failure → fallback logged

### Integration
- [ ] Completed order appears in Finance Upsell tab
- [ ] Inbox thread shows linked order badge
- [ ] Notification badge count accurate
- [ ] Auto-dismiss after 7 days

---

## Appendix A: File Structure

```
app/
├── components/
│   ├── upsells/
│   │   ├── data/
│   │   │   ├── upsell-services.ts
│   │   │   ├── upsell-orders.ts
│   │   │   ├── upsell-notifications.ts      # NEW
│   │   │   └── cancellation-policies.ts     # NEW
│   │   ├── UpsellDrawer.vue
│   │   ├── UpsellOrderDrawer.vue
│   │   ├── UpsellOrderTable.vue
│   │   ├── UpsellTable.vue
│   │   ├── UpsellFilterBar.vue
│   │   ├── UpsellNotificationList.vue       # NEW
│   │   └── inbox/
│   │       └── UpsellOrderCreator.vue       # NEW (mini drawer)
│   └── notifications/
│       └── data/
│           └── alerts.ts                    # Extend with upsell types
├── composables/
│   ├── useUpsellServices.ts
│   ├── useUpsellOrders.ts
│   └── useUpsellNotifications.ts            # NEW
└── pages/
    └── upsells.vue
```

## Appendix B: Type Definitions (Full)

See data files in `app/components/upsells/data/` for complete type definitions and mock data.

---

*End of spec. Please review and approve before implementation planning.*
