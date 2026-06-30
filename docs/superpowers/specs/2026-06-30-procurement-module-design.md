# Procurement Module Design Spec

## Overview

A procurement workflow module for the Elev8 Dashboard that extends the existing Inventory module with a full Purchase Request → Purchase Order → Receiving → Issuing pipeline. Lives as a new top-level sidebar module at `/procurement`.

## Requirements Summary

- **Navigation**: New sidebar module "Procurement" with 4 tabs
- **Workflow**: Strict linear flow — PR → PO → Receiving → Issuing
- **Approval**: Single approver (admin/owner) for Purchase Requests
- **Issuing**: Distributes received items to specific listing inventories
- **Items**: PR/PO reference existing catalog items only (no new items at PR stage)
- **Currency**: Multi-currency per document (IDR, USD, EUR, etc.), no exchange rate conversion
- **Integration**: Receiving updates catalog stock levels; Issuing creates/updates ListingInventoryEntry

## Data Model

### Purchase Request

```typescript
type PurchaseRequestStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'converted_to_po'

interface PurchaseRequestItem {
  id: string
  itemId: string               // ref → InventoryItem catalog
  quantity: number
  estimatedPrice?: number      // optional estimate per unit
  notes?: string
}

interface PurchaseRequest {
  id: string
  requestNumber: string        // PR-001, PR-002, ...
  title: string
  status: PurchaseRequestStatus
  requestedBy: string          // staff ID
  approvedBy?: string          // staff ID
  items: PurchaseRequestItem[]
  currency: string             // IDR, USD, EUR, etc.
  notes?: string
  createdAt: string
  updatedAt: string
}
```

### Purchase Order

```typescript
type PurchaseOrderStatus = 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled'

interface PurchaseOrderItem {
  id: string
  itemId: string               // ref → InventoryItem catalog
  quantity: number
  unitPrice: number
  receivedQuantity: number     // tracks partial receiving progress
  notes?: string
}

interface PurchaseOrder {
  id: string
  poNumber: string             // PO-001, PO-002, ...
  purchaseRequestId: string    // ref → PurchaseRequest
  status: PurchaseOrderStatus
  supplier: InventorySupplier  // reuses existing type from catalog.ts
  items: PurchaseOrderItem[]
  currency: string
  totalAmount: number
  expectedDeliveryDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
```

### Receiving

```typescript
type ReceivingStatus = 'draft' | 'completed'

interface ReceivingItem {
  id: string
  itemId: string               // ref → InventoryItem catalog
  purchaseOrderItemId: string  // ref → PurchaseOrderItem
  quantityReceived: number
  condition: ItemCondition     // reuses existing type: 'good' | 'fair' | 'damaged' | 'missing'
  notes?: string
}

interface Receiving {
  id: string
  receivingNumber: string      // RCV-001, RCV-002, ...
  purchaseOrderId: string      // ref → PurchaseOrder
  status: ReceivingStatus
  receivedBy: string           // staff ID
  items: ReceivingItem[]
  receivedAt: string
  notes?: string
}
```

### Issuing

```typescript
type IssueStatus = 'draft' | 'completed'

interface IssueItem {
  id: string
  itemId: string               // ref → InventoryItem catalog
  quantity: number
  toListing: string            // listing name (matches ListingInventoryEntry.listingName)
  notes?: string
}

interface Issuing {
  id: string
  issueNumber: string          // ISS-001, ISS-002, ...
  receivingId?: string         // optional ref → Receiving
  status: IssueStatus
  issuedBy: string             // staff ID
  items: IssueItem[]
  issuedAt: string
  notes?: string
}
```

## Workflow & Status Transitions

### Purchase Request Flow

```
draft → pending_approval → approved → converted_to_po
                          ↘ rejected
```

- **draft**: Created by staff, can edit items/details
- **pending_approval**: Submitted for approval, read-only
- **approved**: Approved by admin/owner, "Create PO" button enabled
- **rejected**: Rejected by approver, terminal state
- **converted_to_po**: PO has been created from this PR, terminal state

### Purchase Order Flow

```
draft → sent → partially_received → received
              ↘ cancelled
```

- **draft**: Created from approved PR, can edit supplier/pricing
- **sent**: PO sent to supplier, awaiting delivery
- **partially_received**: Some items received, awaiting rest
- **received**: All items fully received, terminal state
- **cancelled**: Cancelled, terminal state

### Receiving Flow

```
draft → completed
```

- **draft**: Recording received items, can edit quantities/conditions
- **completed**: Finalized — triggers PO updates and catalog stock updates

### Issuing Flow

```
draft → completed
```

- **draft**: Recording distribution to listings, can edit
- **completed**: Finalized — creates/updates ListingInventoryEntry in inventory module

## Automations

1. **PR → PO**: Approving a PR + clicking "Create PO" auto-creates a PO with PR items, sets PR status to `converted_to_po`
2. **Receiving → PO update**: Completing a Receiving updates PO item `receivedQuantity`, auto-sets PO status to `partially_received` or `received`
3. **Receiving → Catalog update**: For consumable items, updates catalog `stockLevel`
4. **Issuing → Inventory update**: Completing an Issuing creates or updates `ListingInventoryEntry` in the existing inventory listings module. If an entry already exists for that item+listing combination, increases `quantity`; if not, creates a new entry with `condition: 'good'`
5. **Low stock → PR shortcut**: Low stock items in catalog show a "Create PR" action

## UI Structure

### Page: `/procurement` (index.vue)

**KPI Cards (top row):**
- Pending PRs (status = pending_approval)
- Open POs (status = sent | partially_received)
- Pending Receivings (status = draft)
- Low Stock Items (from inventory module)

**Tabs:**
1. Purchase Requests
2. Purchase Orders
3. Receiving
4. Issuing

### Purchase Requests Tab

**Table columns:** Request #, Title, Items (#), Requested By, Status (badge), Created

**Row actions:** View/Edit (drawer), Submit for Approval, Approve, Reject, Create PO

**Status badges:**
- draft → gray
- pending_approval → amber
- approved → green
- rejected → red
- converted_to_po → blue

**Drawer (Sheet):** PR details form + line items table
- Header: requestNumber, title, currency selector
- Items: catalog item picker (Command/Popover), quantity, estimated price, notes
- Footer: notes textarea
- Actions: Save Draft, Submit for Approval

### Purchase Orders Tab

**Table columns:** PO #, Supplier, Items (#), Total Amount, Currency, Status (badge), Expected Delivery

**Row actions:** View/Edit (drawer), Mark Sent, Cancel

**Status badges:**
- draft → gray
- sent → blue
- partially_received → amber
- received → green
- cancelled → red

**Drawer (Sheet):** PO details form + line items
- Header: poNumber, supplier (from PR or manual), currency, expectedDeliveryDate
- Items: item name (read-only from PR), quantity, unitPrice, receivedQuantity (progress indicator)
- Linked PR info displayed
- Actions: Save Draft, Mark as Sent

### Receiving Tab

**Table columns:** Receiving #, PO #, Supplier, Items (#), Received By, Status (badge), Date

**Row actions:** View (drawer), Complete Receiving

**Drawer (Sheet):** Receiving form
- Header: receivingNumber, linked PO info, receivedBy
- Items: item name, ordered qty vs received qty, condition radio (good/fair/damaged/missing), notes
- Actions: Save Draft, Complete Receiving

### Issuing Tab

**Table columns:** Issue #, Items (#), Issued By, Status (badge), Date

**Row actions:** View (drawer), Complete Issuing

**Drawer (Sheet):** Issuing form
- Header: issueNumber, issuedBy
- Items: item name, quantity, destination listing picker (dropdown of listings), notes
- Actions: Save Draft, Complete Issue

## File Structure

```
app/
├── components/
│   └── procurement/
│       ├── data/
│       │   ├── purchase-requests.ts    # types + mock data
│       │   ├── purchase-orders.ts      # types + mock data
│       │   ├── receivings.ts           # types + mock data
│       │   └── issuings.ts             # types + mock data
│       ├── ProcurementPurchaseRequestsTab.vue
│       ├── ProcurementPurchaseOrdersTab.vue
│       ├── ProcurementReceivingTab.vue
│       ├── ProcurementIssuingTab.vue
│       ├── ProcurementPurchaseRequestDrawer.vue
│       ├── ProcurementPurchaseOrderDrawer.vue
│       ├── ProcurementReceivingDrawer.vue
│       └── ProcurementIssuingDrawer.vue
├── composables/
│   ├── usePurchaseRequests.ts
│   ├── usePurchaseOrders.ts
│   ├── useReceivings.ts
│   └── useIssuings.ts
└── pages/
    └── procurement/
        └── index.vue
```

## Cross-Module Integrations

### Inventory Catalog (`useInventoryCatalog`)
- PR items reference `InventoryItem.id` from catalog
- Receiving completion updates `stockLevel` for consumable items
- Low stock items can trigger "Create PR" shortcut

### Inventory Listings (`useInventoryListings`)
- Issuing completion creates/updates `ListingInventoryEntry`
- Uses existing `addEntry()` and `updateEntry()` functions

### Staff Members
- Reuses `StaffMember` from inbox module for `requestedBy`, `approvedBy`, `receivedBy`, `issuedBy`

### Sidebar Navigation
- New entry in `app/constants/menus.ts` with `lucide:shopping-cart` icon, route `/procurement`, tagged `new: true`

### Notification Center (optional, future)
- `PR_PENDING_APPROVAL` alert when new PR submitted
- `PO_DELIVERY_OVERDUE` alert when expectedDeliveryDate passes

## Conventions

- **State management**: `useState<T[]>('key', () => mockData.map(...))` with immutable spread mutations
- **UI components**: shadcn-vue (Table, Badge, Sheet, Tabs, Select, Command, Popover, Dialog)
- **Icons**: lucide-vue-next via `<Icon name="lucide:..." />`
- **Semantic colors**: theme tokens (bg-muted, text-muted-foreground, etc.)
- **Toast feedback**: `toast.success()` for all user actions
- **Confirmation dialogs**: for destructive actions (cancel PO, reject PR)
- **Currency display**: dynamic per document, using `toLocaleString()` with appropriate locale
