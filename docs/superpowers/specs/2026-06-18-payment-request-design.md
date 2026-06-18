# Payment Request Module — Design Spec

> **Date**: 2026-06-18
> **Module**: Payment Requests (`/payment-requests`)
> **Status**: Approved
> **Depends on**: Payouts module (connected accounts), Inbox module (guest data)

---

## 1. Overview

Payment Request is a feature for Elev8 staff to create shareable payment links for guests. It integrates with the existing Payouts module (Stripe, Doku, Xendit) to process payments and tracks the full lifecycle from creation to completion.

### Key Features
- Create payment links with guest search (existing guests from inbox + past requests)
- Automatic fee calculation (Card +3% / Manual no fee)
- Payout account integration with listing assignment validation
- Share via link, QR code, WhatsApp, or Email
- Status tracking (Pending → Paid / Expired / Cancelled)
- Receipt generation for completed payments
- Duplicate detection and edge case handling

---

## 2. Data Model

### PaymentRequest Interface

```ts
interface PaymentRequest {
  id: string                    // Format: "pr-{timestamp}"
  guestName: string             // Required
  guestEmail: string            // Required, validated email
  guestPhone?: string           // Optional, for WhatsApp share
  listingId: string             // Required, must have payout account
  title: string                 // Required, payment description
  description?: string          // Optional, internal notes
  amount: number                // Required, > 0
  currency: 'USD' | 'IDR'       // Auto-filled from payout account
  feeMode: FeeMode              // 'card' | 'manual'
  feeAmount: number             // Calculated: amount * 0.03 for card
  totalAmount: number           // amount + feeAmount
  status: PaymentStatus         // 'pending' | 'paid' | 'expired' | 'cancelled'
  payoutAccountId: string       // Reference to connected account
  paymentLink: string           // Generated URL: https://pay.elev8.co/r/{id}
  qrCodeUrl?: string            // Generated QR code image URL
  expiresAt: string             // ISO datetime, default +24h from creation
  paidAt?: string               // ISO datetime, set when status → paid
  receiptUrl?: string           // PDF receipt URL
  cancelledAt?: string          // ISO datetime
  cancelledBy?: string          // Staff member who cancelled
  createdAt: string             // ISO datetime
  createdBy: string             // Staff member (Komang Juliantara)
  notes?: string                // Internal staff notes
}

type FeeMode = 'card' | 'manual'
type PaymentStatus = 'pending' | 'paid' | 'expired' | 'cancelled'
```

### Fee Calculation Rules

| Fee Mode | Calculation | Example ($100) |
|----------|-------------|----------------|
| Card | `amount * 0.03` | $100 + $3 = **$103 total** |
| Manual | `0` | $100 + $0 = **$100 total** |

- Card fee is **added to total** (guest absorbs fee)
- Fee amount rounded to 2 decimal places (USD) or 0 (IDR)
- Minimum fee: USD $0.01, IDR 1

---

## 3. Guest Search System

### Guest Source

Guest search combines data from multiple sources:

1. **Inbox conversations** (`useInbox.conversations`) — guests with active/past conversations
2. **Existing payment requests** (`usePaymentRequests.requests`) — guests from previous requests
3. **Manual entry** — type new name if not found

### Guest Data Structure

```ts
interface GuestOption {
  id: string                    // guest email or conversation id
  name: string                  // Display name
  email: string                 // Primary email
  phone?: string                // For WhatsApp
  avatar?: string               // From inbox
  source: 'inbox' | 'payment_request' | 'manual'
  lastStay?: string             // "May 2026" or date
  listingName?: string          // Last stayed at
}
```

### Search Behavior

- **Combobox** with search input (Popover + Command pattern)
- Search across: name, email, phone
- Group results by source:
  - "Recent Guests" (from inbox, sorted by last message)
  - "Previous Requests" (from payment history)
  - "New Guest" (always last option — creates manual entry)
- Selecting a guest auto-fills:
  - `guestName`
  - `guestEmail`
  - `guestPhone` (if available)
  - `listingId` (last stayed at, if available)

### Guest Selection UI

```
┌─────────────────────────────────────┐
│ Guest name *                        │
│ [John Sm...                ▼]       │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Search guests...             │ │
│ │                                 │ │
│ │ Recent Guests                   │ │
│ │ 👤 John Smith          john@... │ │
│ │ 👤 Lisa Park           lisa@... │ │
│ │                                 │ │
│ │ Previous Requests               │ │
│ │ 👤 Marcel Weber        marc@... │ │
│ │                                 │ │
│ │ ─────────────────────────────── │ │
│ │ + Add new guest "John Sm..."    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 4. Create Payment Flow

### Step 1: Payment Details

**Form Fields:**

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Guest name | Combobox search | ✅ | Min 2 chars | Search existing guests |
| Select Listing | Select dropdown | ✅ | Must have payout account | Shows unassigned warning |
| Payment title | Text input | ✅ | Min 3 chars | e.g. "Downpayment Villa Sunset" |
| Description | Textarea | ❌ | Max 500 chars | Internal notes |
| Email for invoice | Email input | ✅ | Valid email regex | Auto-filled from guest |
| Amount | Number input | ✅ | > 0, min per provider | Stripe: $0.50, Doku: IDR 10k |
| Currency | Select | ✅ | USD/IDR | Auto-filled from account |
| Fee mode | Radio group | ✅ | card/manual | Default: card |

**Fee Preview:**
```
┌─────────────────────────────────────┐
│ Fee calculation                     │
│                                     │
│ ○ Card fee (+3%)                    │
│   Guest pays $103.00                │
│   You receive $100.00               │
│                                     │
│ ○ Manual (no fee)                   │
│   Guest pays $100.00                │
│   You receive $100.00               │
└─────────────────────────────────────┘
```

**Listing Validation:**
```
Selected listing: Villa Sunset Paradise

✅ Connected to: Stripe Bali Main (USD)
   Continue

⚠️ Not assigned to any payout account
   Guests won't be able to pay.
   [Assign now] → /settings/payouts
   [Continue] → disabled
```

**Real-time Validation:**
- Guest name: min 2 chars, red border + error message
- Email: regex validation on blur
- Amount: 
  - Must be > 0
  - Stripe: minimum $0.50 → error if < $0.50
  - Doku: minimum IDR 10,000 → error if < 10,000
  - Maximum: provider-specific (Stripe: $999,999.99)
- Currency mismatch: if listing assigned to IDR account but user manually changes to USD → warning banner

### Step 2: Share & Confirm

**Generated Link:**
```
┌─────────────────────────────────────┐
│ Payment link ready!                 │
│                                     │
│ ┌──────────────────────────────┐    │
│ │ https://pay.elev8.co/r/pr-001│    │
│ │                    [Copy 🔗] │    │
│ └──────────────────────────────┘    │
│                                     │
│ [QR Code 📱]  [WhatsApp 💬]  [Email 📧]│
│                                     │
│ Expires in: [▼ 24 hours]            │
│                                     │
│ ─────────────────────────────────   │
│ Summary                             │
│ Guest:        John Smith            │
│ Listing:      Villa Sunset Paradise │
│ Amount:       $100.00               │
│ Card fee:     $3.00                 │
│ Total:        $103.00               │
│ Account:      Stripe Bali Main      │
│ Expires:      June 19, 2026 2:30 PM │
│                                     │
│ [← Back]        [Create & Share]    │
└─────────────────────────────────────┘
```

**Expiry Options:**
- 1 hour
- 6 hours
- 24 hours (default)
- 3 days
- 7 days
- Custom date/time

**Share Actions:**
- **Copy link** → clipboard + toast "Link copied"
- **QR Code** → opens dialog with downloadable PNG
- **WhatsApp** → opens WhatsApp web with pre-filled message
- **Email** → opens mailto with pre-filled subject/body

---

## 5. List View (History Table)

### Table Columns

| Column | Width | Content |
|--------|-------|---------|
| Guest | 20% | Name + email tooltip on hover |
| Title | 25% | Payment title, truncated |
| Listing | 15% | Property name |
| Amount | 15% | `$100.00 + $3.00 fee` or `$100.00` |
| Status | 10% | Badge |
| Created | 10% | Relative time ("2h ago") |
| Expires | 10% | Countdown or "Expired" |
| Actions | 5% | Dropdown menu |

### Status Badges

| Status | Variant | Icon |
|--------|---------|------|
| Pending | `default` (amber) | `lucide:clock` |
| Paid | `default` (green) | `lucide:check-circle` |
| Expired | `secondary` | `lucide:x-circle` |
| Cancelled | `outline` | `lucide:ban` |

### Actions Dropdown

- **View details** → opens detail dialog
- **Copy link** → clipboard
- **Resend** → opens share dialog again
- **Cancel** → confirmation dialog → cancelled status
- **Duplicate** → pre-fills create dialog with same data

### Filters

```
┌─────────────────────────────────────────────────────────┐
│ [Search guest or title...]  [▼ Status: All]  [▼ Listing]│
│ [Date range 📅]  [Clear filters]                        │
└─────────────────────────────────────────────────────────┘
```

**Filter Options:**
- **Status**: All / Pending / Paid / Expired / Cancelled
- **Listing**: Multi-select dropdown (all assigned listings)
- **Date range**: Created date range picker
- **Search**: Full-text search on guest name, title, email

### Selection Bar (bulk actions)

When rows selected:
```
┌─────────────────────────────────────────────┐
│ 3 selected  |  [Cancel selected]  [Export]  │
└─────────────────────────────────────────────┘
```

### Sorting

Default: Created at desc
Options: Guest name, Amount, Created date, Expiry date

---

## 6. Detail View Dialog

### Layout

```
┌─────────────────────────────────────┐
│ Payment Request #pr-001        [×]  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │        Status Banner        │    │
│  └─────────────────────────────┘    │
│                                     │
│  Guest Information                  │
│  ─────────────────────────────────  │
│  Name:    John Smith                │
│  Email:   john@example.com          │
│  Phone:   +62 812 3456 7890         │
│                                     │
│  Payment Details                    │
│  ─────────────────────────────────  │
│  Title:   Downpayment Villa Sunset  │
│  Listing: Villa Sunset Paradise     │
│  Amount:  $100.00                   │
│  Fee:     $3.00 (Card, 3%)          │
│  Total:   $103.00                   │
│  Account: Stripe Bali Main          │
│                                     │
│  Timeline                           │
│  ─────────────────────────────────  │
│  ● June 18, 2:30 PM — Created      │
│  ○ June 19, 2:30 PM — Expires      │
│                                     │
│  [Copy Link] [View Receipt] [Cancel]│
│                                     │
└─────────────────────────────────────┘
```

### Status Banner States

**Pending:**
```
┌─────────────────────────────────────┐
│ ⏳ Pending                          │
│ Payment link is active and waiting  │
│ for guest to complete payment.      │
│ Expires in 23 hours.                │
└─────────────────────────────────────┘
```

**Paid:**
```
┌─────────────────────────────────────┐
│ ✅ Paid on June 18, 3:15 PM         │
│ Payment completed successfully.     │
│ Transaction ID: pi_3Oxxx...         │
└─────────────────────────────────────┘
```

**Expired:**
```
┌─────────────────────────────────────┐
│ ⏱️ Expired on June 19, 2:30 PM      │
│ This payment link is no longer      │
│ active. [Create new request]        │
└─────────────────────────────────────┘
```

**Cancelled:**
```
┌─────────────────────────────────────┐
│ 🚫 Cancelled on June 18, 4:00 PM    │
│ Cancelled by Komang Juliantara.     │
└─────────────────────────────────────┘
```

---

## 7. Receipt System

### Receipt Generation

When payment status changes to `paid`:
1. Generate PDF receipt
2. Store at `receiptUrl`
3. Auto-send email to guest (optional)

### Receipt Content

```
┌─────────────────────────────────────┐
│           ELEV8 RECEIPT             │
│                                     │
│  Receipt #: RCP-001                 │
│  Date: June 18, 2026                │
│                                     │
│  Bill To:                           │
│  John Smith                         │
│  john@example.com                   │
│                                     │
│  Description              Amount    │
│  ─────────────────────────────────  │
│  Downpayment Villa Sunset $100.00   │
│  Card processing fee       $3.00    │
│  ─────────────────────────────────  │
│  Total                    $103.00   │
│                                     │
│  Paid via: Stripe ****4242          │
│  Transaction: pi_3Oxxx              │
│                                     │
│  Thank you for your payment!        │
└─────────────────────────────────────┘
```

---

## 8. Edge Cases & Error Handling

### Critical Cases

| Case | UX | Prevention |
|------|-----|-----------|
| **No payout accounts** | Full-page empty state with CTA to Settings → Payouts | Check on page mount |
| **Listing unassigned** | Inline warning + disabled continue + [Assign now] link | Validate before create |
| **Account disconnected** | "Account disconnected" badge on old requests, disable new requests | Check account status on create |
| **Duplicate request** | Dialog: "Similar request found. Create anyway?" | Check last 1h on submit |
| **Expired link accessed** | "This payment link has expired" page | Expiry check on load |
| **Already paid** | "Payment completed" page with receipt | Status check on access |
| **Cancelled** | "Payment cancelled" page | Status check on access |

### Validation Cases

| Case | Rule | Error Message |
|------|------|---------------|
| Amount < minimum | Stripe: $0.50, Doku: IDR 10k | "Minimum amount is $0.50" |
| Amount > maximum | Provider limit | "Amount exceeds maximum of $999,999.99" |
| Invalid email | Regex validation | "Please enter a valid email address" |
| Empty guest name | Required | "Guest name is required" |
| Empty title | Required | "Payment title is required" |
| Currency mismatch | Listing account vs selected currency | "This listing uses IDR. Switch currency?" |

### Network & System Cases

| Case | UX |
|------|-----|
| Network error on create | Retry button + "Network error. Please try again." |
| QR code generation fails | Fallback to text link + "QR code unavailable" |
| Receipt generation fails | "Receipt not available. Contact support." |
| Email send fails | "Link created but email failed. Copy link manually." |

---

## 9. State Management

### Composable: usePaymentRequests

```ts
// State
const requests = useState<PaymentRequest[]>('payment-requests')
const filters = ref({
  status: 'all' as PaymentStatus | 'all',
  listings: [] as string[],
  dateFrom: '',
  dateTo: '',
  search: '',
})

// Computed
const filteredRequests = computed(() => { /* apply filters */ })
const pendingCount = computed(() => requests.value.filter(r => r.status === 'pending').length)
const totalRevenue = computed(() => /* sum of paid amounts */)

// Actions
function createRequest(data: PaymentRequestDraft): PaymentRequest
function cancelRequest(id: string, reason?: string): void
function duplicateRequest(id: string): void
function checkDuplicate(guestName: string, amount: number): boolean
function expireOldRequests(): void // called periodically
```

### Auto-Expiry

```ts
// Run every 5 minutes or on page focus
function expireOldRequests() {
  const now = new Date().toISOString()
  requests.value = requests.value.map(r => {
    if (r.status === 'pending' && r.expiresAt < now) {
      return { ...r, status: 'expired' }
    }
    return r
  })
}
```

---

## 10. Integration Points

### With Payouts Module

```
Create Payment Request
    ↓
Get listing's payout account
    ↓
[Has account] → Use account currency + settings
    ↓
Generate payment intent with provider
    ↓
Create shareable link
```

### With Inbox Module

```
Guest search
    ↓
Query conversations (useInbox)
    ↓
Merge with existing payment guests
    ↓
Show in combobox
```

### Sidebar Integration

Add to `constants/menus.ts` under **Finance**:
```ts
{
  title: 'Payment Requests',
  icon: 'i-lucide-link',
  link: '/payment-requests',
  new: true,
}
```

---

## 11. Mock Data

```ts
const mockPaymentRequests: PaymentRequest[] = [
  {
    id: 'pr-001',
    guestName: 'John Smith',
    guestEmail: 'john@example.com',
    listingId: 'lst-1',
    title: 'Downpayment Villa Sunset',
    amount: 500,
    currency: 'USD',
    feeMode: 'card',
    feeAmount: 15,
    totalAmount: 515,
    status: 'pending',
    payoutAccountId: 'pay-1',
    paymentLink: 'https://pay.elev8.co/r/pr-001',
    expiresAt: '2026-06-19T14:30:00Z',
    createdAt: '2026-06-18T14:30:00Z',
    createdBy: 'staff-2',
  },
  {
    id: 'pr-002',
    guestName: 'Lisa Park',
    guestEmail: 'lisa@example.com',
    listingId: 'lst-3',
    title: 'Spa package payment',
    amount: 1500000,
    currency: 'IDR',
    feeMode: 'manual',
    feeAmount: 0,
    totalAmount: 1500000,
    status: 'paid',
    payoutAccountId: 'pay-2',
    paymentLink: 'https://pay.elev8.co/r/pr-002',
    paidAt: '2026-06-17T10:00:00Z',
    receiptUrl: '/receipts/pr-002.pdf',
    createdAt: '2026-06-17T09:00:00Z',
    createdBy: 'staff-2',
  },
  // ... more mock data
]
```

---

## 12. UI Components Needed

### New Components

| Component | File | Purpose |
|-----------|------|---------|
| PaymentRequestCreateDialog | `PaymentRequestCreateDialog.vue` | 2-step create wizard |
| PaymentRequestTable | `PaymentRequestTable.vue` | History table with filters |
| PaymentRequestDetailDialog | `PaymentRequestDetailDialog.vue` | Detail view |
| PaymentRequestShareDialog | `PaymentRequestShareDialog.vue` | Share/QR/WhatsApp/Email |
| GuestSearchCombobox | `GuestSearchCombobox.vue` | Reusable guest search |
| FeeCalculator | `FeeCalculator.vue` | Fee preview display |
| StatusBadge | `StatusBadge.vue` | Payment status badge |

### Reused Components

| Component | Source | Usage |
|-----------|--------|-------|
| Dialog | shadcn-vue | Create, Detail, Share dialogs |
| Table | shadcn-vue | History table |
| Select | shadcn-vue | Listing, Currency, Status selects |
| Input | shadcn-vue | Text inputs |
| Button | shadcn-vue | Actions |
| Badge | shadcn-vue | Status badges |
| Popover | shadcn-vue | Guest search dropdown |
| Command | shadcn-vue | Guest search list |
| DatePicker | base/DateRangePicker | Date range filter |
| TanStack Table | existing pattern | Sortable/filterable table |

---

## 13. Page Structure

```vue
<!-- pages/payment-requests/index.vue -->
<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Payment Requests</h1>
        <p class="text-muted-foreground">
          {{ pendingCount }} pending · {{ totalRevenue }} received
        </p>
      </div>
      <Button @click="openCreateDialog">
        <Icon name="lucide:plus" /> Create Request
      </Button>
    </div>

    <!-- Filters -->
    <PaymentRequestFilterBar
      v-model:filters="filters"
      :listings="availableListings"
    />

    <!-- Table -->
    <PaymentRequestTable
      :requests="filteredRequests"
      @view="openDetail"
      @copy="copyLink"
      @cancel="cancelRequest"
      @duplicate="duplicateRequest"
    />

    <!-- Dialogs -->
    <PaymentRequestCreateDialog v-model:open="createOpen" />
    <PaymentRequestDetailDialog
      v-model:open="detailOpen"
      :request="selectedRequest"
    />
    <PaymentRequestShareDialog
      v-model:open="shareOpen"
      :request="selectedRequest"
    />
  </div>
</template>
```

---

## 14. Accessibility

- All form inputs have associated labels
- Error messages linked via `aria-describedby`
- Dialog traps focus
- Keyboard navigation for guest search (↑↓ Enter Escape)
- Status badges have aria-label for screen readers
- Color not sole indicator (icons + text for status)

---

## 15. Performance

- Table virtualization if > 100 rows
- Debounce search input (300ms)
- Lazy load QR code generation
- Cache guest list (refetch every 5 min)

---

## 16. Future Enhancements (Out of Scope)

- Recurring payment requests
- Partial payments / installments
- Refund processing
- Payment analytics dashboard
- Multi-currency display (show both IDR and USD)
- Guest portal (guests can view all their payment requests)
- Integration with reservation system (auto-create request on booking)
