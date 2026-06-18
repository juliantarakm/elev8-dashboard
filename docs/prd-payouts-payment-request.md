# PRD: Payouts & Payment Request Modules

## 1. Payouts (Settings → Payment Gateways)

### Requirements
- Support 3 providers: **Stripe** (USD), **Doku** (IDR), **Xendit** (IDR).
- Each account stores credentials per provider, connection status, live/test mode, and assigned listings.
- One listing can only be assigned to **one** payout account at a time.
- Show how-to-connect steps per provider inside the connect dialog.

### Core Flows

#### Add Account (3-step wizard)
1. **Choose provider** → Stripe / Doku / Xendit.
2. **Enter credentials** (provider-specific fields):
   - Stripe: Publishable key, Secret key
   - Doku: ClientID, ActiveSecretKey
   - Xendit: SecretKey, PublicKey, WebhookSecret
3. **Assign listings** → Search/filter listings by tag; multi-select checkboxes.
4. **Save** → account created with status `connected` or `needs_webhook` (Xendit without webhook).

#### Edit Account
- Re-open wizard at step 2 (credentials) with pre-filled values.
- Can update credentials and re-assign listings.

#### Delete Account
- Confirmation dialog → on confirm, remove account and unlink all its listings.

#### Listing Assignment (Bulk)
- **Connected tab**: view all accounts with listing count.
- **Unassigned tab**: list listings with no payout account; bulk-select → assign to chosen account.
- Filters: search by name/location, filter by tag.

---

## 2. Payment Requests

### Requirements
- Create a payment request for a guest linked to a listing.
- Auto-route to the **payout account assigned to that listing**.
- Support 3 fee modes: **Card** (fixed 3% fee), **Manual** (custom % fee), and **No fee** (0%).
- Status lifecycle: `pending` → `paid` / `expired` / `cancelled`.
- Auto-expire pending requests when `expiresAt` is reached.

### Core Flows

#### Create Request
1. **Select guest** — search across:
   - Inbox conversations (guests)
   - Previous payment request guests (email auto-fills if available)
   - Add new guest manually (name, email, phone)
2. **Select listing** — searchable + tag filter.
3. **Fill details** — title, description, amount, currency (auto from payout account), expiry (hours).
4. **Choose fee mode**:
   - **Card** — fixed 3% processing fee
   - **Manual** — enter custom fee percentage (0–100%)
   - **No fee** — 0% fee
5. **Save** → status `pending`, payment link generated, auto-open **Share dialog**.

#### Share Request
- Copy payment link to clipboard.
- Share via WhatsApp (prefilled message with link).
- Share via Email (prefilled subject + body).

#### View Detail
- Show status banner, creator info, cancellation info (who + when + reason).
- Amount breakdown: subtotal + fee = total.
- Actions per status:
  - **Pending**: Cancel, Duplicate, Copy Link.
  - **Paid / Expired / Cancelled**: Duplicate only.

#### List & Filter
- Filters: status (single), listings (multi-select), date range (createdAt), search (guest/name/title).
- Stats: pending count, paid count.
- Table columns: Guest, Title, Listing, Amount, Status, Created by, Created (time ago).

#### Auto-Expiry
- On page load / periodically, mark `pending` requests as `expired` if `expiresAt < now`.

---

## 3. Data Model Summary

### PayoutAccount
```
id, provider, accountName, status, liveMode, connectedAt, currency,
listingIds[], publicKey?, secretKey?, webhookSecret?, notes?
```

### PaymentRequest
```
id, guestName, guestEmail, guestPhone?, listingId, title, description?,
amount, currency, feeMode, customFeePercentage?, feeAmount, totalAmount, status,
payoutAccountId, paymentLink, qrCodeUrl?, expiresAt, paidAt?, receiptUrl?,
cancelledAt?, cancelledBy?, createdAt, createdBy, notes?
```

### GuestOption (search source)
```
id, name, email, phone?, avatar?, source: inbox|payment_request|manual,
lastStay?, listingName?
```

---

## 4. Key Business Rules
- A listing **must** have a payout account before a payment request can be created for it.
- Card fee is fixed **3%**; Manual fee uses a custom percentage set by the user; No fee is **0%**.
- Currency is derived from the payout account: Stripe → USD, Doku/Xendit → IDR.
- One listing = one payout account. Re-assigning a listing to a new account unlinks it from the old one.
