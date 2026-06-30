# Procurement Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a procurement workflow module (Purchase Request, Purchase Order, Receiving, Issuing) as a new sidebar module at `/procurement`.

**Architecture:** New Procurement module with 4 tabs (PR, PO, Receiving, Issuing), each with table views and Sheet drawers. Strict linear flow PR → PO → Receiving → Issuing. Integrates with existing Inventory Catalog and Per-Listing modules via composables.

**Tech Stack:** Nuxt 3, Vue 3, shadcn-vue, Tailwind CSS v4, vue-sonner (toasts)

---

## File Structure

```
app/
├── components/
│   └── procurement/
│       ├── data/
│       │   ├── purchase-requests.ts    # PR types + mock data
│       │   ├── purchase-orders.ts      # PO types + mock data
│       │   ├── receivings.ts           # Receiving types + mock data
│       │   └── issuings.ts             # Issuing types + mock data
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

---

### Task 1: Data Types and Mock Data

**Files:**
- Create: `app/components/procurement/data/purchase-requests.ts`
- Create: `app/components/procurement/data/purchase-orders.ts`
- Create: `app/components/procurement/data/receivings.ts`
- Create: `app/components/procurement/data/issuings.ts`

- [ ] **Step 1: Create purchase-requests.ts**

```typescript
// app/components/procurement/data/purchase-requests.ts

export type PurchaseRequestStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'converted_to_po'

export interface PurchaseRequestItem {
  id: string
  itemId: string               // ref → InventoryItem catalog
  quantity: number
  estimatedPrice?: number      // optional estimate per unit
  notes?: string
}

export interface PurchaseRequest {
  id: string
  requestNumber: string
  title: string
  status: PurchaseRequestStatus
  requestedBy: string          // staff ID
  approvedBy?: string          // staff ID
  items: PurchaseRequestItem[]
  currency: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export const PR_STATUS_LABELS: Record<PurchaseRequestStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  converted_to_po: 'Converted to PO',
}

export const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: 'pr-001',
    requestNumber: 'PR-001',
    title: 'Restock consumables — Villa Merapi',
    status: 'approved',
    requestedBy: 'staff-2',
    approvedBy: 'staff-1',
    items: [
      { id: 'pri-001', itemId: 'inv-005', quantity: 24, estimatedPrice: 15000, notes: 'Low stock' },
      { id: 'pri-002', itemId: 'inv-006', quantity: 24, estimatedPrice: 18000, notes: 'Low stock' },
      { id: 'pri-003', itemId: 'inv-007', quantity: 48, estimatedPrice: 8000, notes: 'Low stock' },
    ],
    currency: 'IDR',
    notes: 'Monthly restock for Villa Merapi',
    createdAt: '2026-06-20T09:00:00.000Z',
    updatedAt: '2026-06-22T14:00:00.000Z',
  },
  {
    id: 'pr-002',
    requestNumber: 'PR-002',
    title: 'Replace damaged coffee maker — BRATAN',
    status: 'pending_approval',
    requestedBy: 'staff-2',
    items: [
      { id: 'pri-004', itemId: 'inv-004', quantity: 1, estimatedPrice: 1200000, notes: 'Carafe cracked' },
    ],
    currency: 'IDR',
    createdAt: '2026-06-28T10:00:00.000Z',
    updatedAt: '2026-06-28T10:00:00.000Z',
  },
  {
    id: 'pr-003',
    requestNumber: 'PR-003',
    title: 'New linen sets — TAMBORA',
    status: 'draft',
    requestedBy: 'staff-3',
    items: [
      { id: 'pri-005', itemId: 'inv-003', quantity: 6, estimatedPrice: 450000 },
      { id: 'pri-006', itemId: 'inv-012', quantity: 12, estimatedPrice: 85000 },
    ],
    currency: 'IDR',
    notes: 'Replacing worn-out linens',
    createdAt: '2026-06-29T08:00:00.000Z',
    updatedAt: '2026-06-29T08:00:00.000Z',
  },
  {
    id: 'pr-004',
    requestNumber: 'PR-004',
    title: 'Kitchen supplies — USD order',
    status: 'converted_to_po',
    requestedBy: 'staff-2',
    approvedBy: 'staff-1',
    items: [
      { id: 'pri-007', itemId: 'inv-009', quantity: 2, estimatedPrice: 45 },
      { id: 'pri-008', itemId: 'inv-008', quantity: 100, estimatedPrice: 0.25 },
    ],
    currency: 'USD',
    notes: 'International supplier order',
    createdAt: '2026-06-15T07:00:00.000Z',
    updatedAt: '2026-06-18T11:00:00.000Z',
  },
]
```

- [ ] **Step 2: Create purchase-orders.ts**

```typescript
// app/components/procurement/data/purchase-orders.ts

import type { InventorySupplier } from '@/components/inventory/data/catalog'

export type PurchaseOrderStatus = 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled'

export interface PurchaseOrderItem {
  id: string
  itemId: string
  quantity: number
  unitPrice: number
  receivedQuantity: number
  notes?: string
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  purchaseRequestId: string
  status: PurchaseOrderStatus
  supplier: InventorySupplier
  items: PurchaseOrderItem[]
  currency: string
  totalAmount: number
  expectedDeliveryDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  partially_received: 'Partially Received',
  received: 'Received',
  cancelled: 'Cancelled',
}

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-001',
    poNumber: 'PO-001',
    purchaseRequestId: 'pr-004',
    status: 'partially_received',
    supplier: { name: 'Amazon US Kitchen Supplies', contact: 'orders@amazon.com' },
    items: [
      { id: 'poi-001', itemId: 'inv-009', quantity: 2, unitPrice: 45, receivedQuantity: 1, notes: 'Rice Cooker' },
      { id: 'poi-002', itemId: 'inv-008', quantity: 100, unitPrice: 0.25, receivedQuantity: 100, notes: 'Kopi Sachet' },
    ],
    currency: 'USD',
    totalAmount: 115,
    expectedDeliveryDate: '2026-07-05',
    notes: 'International shipment',
    createdAt: '2026-06-18T11:00:00.000Z',
    updatedAt: '2026-06-25T09:00:00.000Z',
  },
  {
    id: 'po-002',
    poNumber: 'PO-002',
    purchaseRequestId: 'pr-001',
    status: 'sent',
    supplier: { name: 'Tokopedia Supplier', contact: 'tokopedia.com/supplier' },
    items: [
      { id: 'poi-003', itemId: 'inv-005', quantity: 24, unitPrice: 15000, receivedQuantity: 0, notes: 'Sabun Mandi' },
      { id: 'poi-004', itemId: 'inv-006', quantity: 24, unitPrice: 18000, receivedQuantity: 0, notes: 'Shampoo' },
      { id: 'poi-005', itemId: 'inv-007', quantity: 48, unitPrice: 8000, receivedQuantity: 0, notes: 'Tisu Gulung' },
    ],
    currency: 'IDR',
    totalAmount: 1224000,
    expectedDeliveryDate: '2026-07-02',
    createdAt: '2026-06-22T14:00:00.000Z',
    updatedAt: '2026-06-23T08:00:00.000Z',
  },
]
```

- [ ] **Step 3: Create receivings.ts**

```typescript
// app/components/procurement/data/receivings.ts

import type { ItemCondition } from '@/components/inventory/data/listing-entries'

export type ReceivingStatus = 'draft' | 'completed'

export interface ReceivingItem {
  id: string
  itemId: string
  purchaseOrderItemId: string
  quantityReceived: number
  condition: ItemCondition
  notes?: string
}

export interface Receiving {
  id: string
  receivingNumber: string
  purchaseOrderId: string
  status: ReceivingStatus
  receivedBy: string
  items: ReceivingItem[]
  receivedAt: string
  notes?: string
}

export const RCV_STATUS_LABELS: Record<ReceivingStatus, string> = {
  draft: 'Draft',
  completed: 'Completed',
}

export const mockReceivings: Receiving[] = [
  {
    id: 'rcv-001',
    receivingNumber: 'RCV-001',
    purchaseOrderId: 'po-001',
    status: 'completed',
    receivedBy: 'staff-3',
    items: [
      { id: 'rcvi-001', itemId: 'inv-009', purchaseOrderItemId: 'poi-001', quantityReceived: 1, condition: 'good', notes: 'First batch' },
      { id: 'rcvi-002', itemId: 'inv-008', purchaseOrderItemId: 'poi-002', quantityReceived: 100, condition: 'good' },
    ],
    receivedAt: '2026-06-25T09:00:00.000Z',
    notes: 'Partial delivery — 1 rice cooker still in transit',
  },
]
```

- [ ] **Step 4: Create issuings.ts**

```typescript
// app/components/procurement/data/issuings.ts

export type IssueStatus = 'draft' | 'completed'

export interface IssueItem {
  id: string
  itemId: string
  quantity: number
  toListing: string
  notes?: string
}

export interface Issuing {
  id: string
  issueNumber: string
  receivingId?: string
  status: IssueStatus
  issuedBy: string
  items: IssueItem[]
  issuedAt: string
  notes?: string
}

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  draft: 'Draft',
  completed: 'Completed',
}

export const mockIssuings: Issuing[] = [
  {
    id: 'iss-001',
    issueNumber: 'ISS-001',
    receivingId: 'rcv-001',
    status: 'completed',
    issuedBy: 'staff-2',
    items: [
      { id: 'issi-001', itemId: 'inv-008', quantity: 30, toListing: 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu', notes: 'Restock kopi' },
      { id: 'issi-002', itemId: 'inv-008', quantity: 70, toListing: 'The R Villa Merapi', notes: 'Restock kopi' },
    ],
    issuedAt: '2026-06-26T08:00:00.000Z',
  },
]
```

- [ ] **Step 5: Commit**

```bash
git add app/components/procurement/data/
git commit -m "feat(procurement): add data types and mock data for PR, PO, Receiving, Issuing"
```

---

### Task 2: Composables

**Files:**
- Create: `app/composables/usePurchaseRequests.ts`
- Create: `app/composables/usePurchaseOrders.ts`
- Create: `app/composables/useReceivings.ts`
- Create: `app/composables/useIssuings.ts`

- [ ] **Step 1: Create usePurchaseRequests.ts**

```typescript
// app/composables/usePurchaseRequests.ts

import type { PurchaseRequest, PurchaseRequestItem, PurchaseRequestStatus } from '@/components/procurement/data/purchase-requests'
import { computed, ref } from 'vue'
import { mockPurchaseRequests } from '@/components/procurement/data/purchase-requests'

export function usePurchaseRequests() {
  const requests = useState<PurchaseRequest[]>('purchase-requests', () =>
    mockPurchaseRequests.map(r => ({ ...r, items: r.items.map(i => ({ ...i })) })))

  const searchValue = ref('')
  const activeStatusFilter = ref<PurchaseRequestStatus | 'all'>('all')

  const filteredRequests = computed(() => {
    return requests.value.filter((req) => {
      if (activeStatusFilter.value !== 'all' && req.status !== activeStatusFilter.value)
        return false
      if (searchValue.value) {
        const q = searchValue.value.toLowerCase()
        return req.title.toLowerCase().includes(q)
          || req.requestNumber.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  const pendingApprovalCount = computed(() =>
    requests.value.filter(r => r.status === 'pending_approval').length)

  function addRequest(data: Omit<PurchaseRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'>) {
    const id = `pr-${String(requests.value.length + 1).padStart(3, '0')}`
    const num = `PR-${String(requests.value.length + 1).padStart(3, '0')}`
    const now = new Date().toISOString()
    requests.value = [...requests.value, { ...data, id, requestNumber: num, createdAt: now, updatedAt: now }]
  }

  function updateRequest(id: string, updates: Partial<PurchaseRequest>) {
    requests.value = requests.value.map(r =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)
  }

  function submitForApproval(id: string) {
    updateRequest(id, { status: 'pending_approval' })
  }

  function approveRequest(id: string, approverId: string) {
    updateRequest(id, { status: 'approved', approvedBy: approverId })
  }

  function rejectRequest(id: string, approverId: string) {
    updateRequest(id, { status: 'rejected', approvedBy: approverId })
  }

  function markConvertedToPo(id: string) {
    updateRequest(id, { status: 'converted_to_po' })
  }

  function getRequestById(id: string): PurchaseRequest | undefined {
    return requests.value.find(r => r.id === id)
  }

  function deleteRequest(id: string) {
    requests.value = requests.value.filter(r => r.id !== id)
  }

  function clearFilters() {
    searchValue.value = ''
    activeStatusFilter.value = 'all'
  }

  return {
    requests,
    filteredRequests,
    searchValue,
    activeStatusFilter,
    pendingApprovalCount,
    addRequest,
    updateRequest,
    submitForApproval,
    approveRequest,
    rejectRequest,
    markConvertedToPo,
    getRequestById,
    deleteRequest,
    clearFilters,
  }
}
```

- [ ] **Step 2: Create usePurchaseOrders.ts**

```typescript
// app/composables/usePurchaseOrders.ts

import type { PurchaseOrder, PurchaseOrderStatus } from '@/components/procurement/data/purchase-orders'
import { computed, ref } from 'vue'
import { mockPurchaseOrders } from '@/components/procurement/data/purchase-orders'

export function usePurchaseOrders() {
  const orders = useState<PurchaseOrder[]>('purchase-orders', () =>
    mockPurchaseOrders.map(o => ({ ...o, items: o.items.map(i => ({ ...i })) })))

  const searchValue = ref('')
  const activeStatusFilter = ref<PurchaseOrderStatus | 'all'>('all')

  const filteredOrders = computed(() => {
    return orders.value.filter((order) => {
      if (activeStatusFilter.value !== 'all' && order.status !== activeStatusFilter.value)
        return false
      if (searchValue.value) {
        const q = searchValue.value.toLowerCase()
        return order.poNumber.toLowerCase().includes(q)
          || order.supplier.name.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  const openPoCount = computed(() =>
    orders.value.filter(o => o.status === 'sent' || o.status === 'partially_received').length)

  function addOrder(data: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt' | 'updatedAt'>) {
    const id = `po-${String(orders.value.length + 1).padStart(3, '0')}`
    const num = `PO-${String(orders.value.length + 1).padStart(3, '0')}`
    const now = new Date().toISOString()
    orders.value = [...orders.value, { ...data, id, poNumber: num, createdAt: now, updatedAt: now }]
    return id
  }

  function updateOrder(id: string, updates: Partial<PurchaseOrder>) {
    orders.value = orders.value.map(o =>
      o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o)
  }

  function markSent(id: string) {
    updateOrder(id, { status: 'sent' })
  }

  function cancelOrder(id: string) {
    updateOrder(id, { status: 'cancelled' })
  }

  function updateReceivedQuantity(orderId: string, itemId: string, qty: number) {
    orders.value = orders.value.map(o => {
      if (o.id !== orderId)
        return o
      const updatedItems = o.items.map(i =>
        i.id === itemId ? { ...i, receivedQuantity: i.receivedQuantity + qty } : i)
      const allReceived = updatedItems.every(i => i.receivedQuantity >= i.quantity)
      const anyReceived = updatedItems.some(i => i.receivedQuantity > 0)
      return {
        ...o,
        items: updatedItems,
        status: allReceived ? 'received' as const : anyReceived ? 'partially_received' as const : o.status,
        updatedAt: new Date().toISOString(),
      }
    })
  }

  function getOrderById(id: string): PurchaseOrder | undefined {
    return orders.value.find(o => o.id === id)
  }

  function getOrdersByPrId(prId: string): PurchaseOrder[] {
    return orders.value.filter(o => o.purchaseRequestId === prId)
  }

  function clearFilters() {
    searchValue.value = ''
    activeStatusFilter.value = 'all'
  }

  return {
    orders,
    filteredOrders,
    searchValue,
    activeStatusFilter,
    openPoCount,
    addOrder,
    updateOrder,
    markSent,
    cancelOrder,
    updateReceivedQuantity,
    getOrderById,
    getOrdersByPrId,
    clearFilters,
  }
}
```

- [ ] **Step 3: Create useReceivings.ts**

```typescript
// app/composables/useReceivings.ts

import type { Receiving, ReceivingStatus } from '@/components/procurement/data/receivings'
import { computed, ref } from 'vue'
import { mockReceivings } from '@/components/procurement/data/receivings'

export function useReceivings() {
  const receivings = useState<Receiving[]>('receivings', () =>
    mockReceivings.map(r => ({ ...r, items: r.items.map(i => ({ ...i })) })))

  const searchValue = ref('')
  const activeStatusFilter = ref<ReceivingStatus | 'all'>('all')

  const filteredReceivings = computed(() => {
    return receivings.value.filter((rcv) => {
      if (activeStatusFilter.value !== 'all' && rcv.status !== activeStatusFilter.value)
        return false
      if (searchValue.value) {
        const q = searchValue.value.toLowerCase()
        return rcv.receivingNumber.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
  })

  const pendingCount = computed(() =>
    receivings.value.filter(r => r.status === 'draft').length)

  function addReceiving(data: Omit<Receiving, 'id' | 'receivingNumber'>) {
    const id = `rcv-${String(receivings.value.length + 1).padStart(3, '0')}`
    const num = `RCV-${String(receivings.value.length + 1).padStart(3, '0')}`
    receivings.value = [...receivings.value, { ...data, id, receivingNumber: num }]
    return id
  }

  function updateReceiving(id: string, updates: Partial<Receiving>) {
    receivings.value = receivings.value.map(r =>
      r.id === id ? { ...r, ...updates } : r)
  }

  function completeReceiving(id: string) {
    updateReceiving(id, { status: 'completed' })
  }

  function getReceivingById(id: string): Receiving | undefined {
    return receivings.value.find(r => r.id === id)
  }

  function getReceivingsByPoId(poId: string): Receiving[] {
    return receivings.value.filter(r => r.purchaseOrderId === poId)
  }

  function clearFilters() {
    searchValue.value = ''
    activeStatusFilter.value = 'all'
  }

  return {
    receivings,
    filteredReceivings,
    searchValue,
    activeStatusFilter,
    pendingCount,
    addReceiving,
    updateReceiving,
    completeReceiving,
    getReceivingById,
    getReceivingsByPoId,
    clearFilters,
  }
}
```

- [ ] **Step 4: Create useIssuings.ts**

```typescript
// app/composables/useIssuings.ts

import type { IssueStatus, Issuing } from '@/components/procurement/data/issuings'
import { computed, ref } from 'vue'
import { mockIssuings } from '@/components/procurement/data/issuings'

export function useIssuings() {
  const issuings = useState<Issuing[]>('issuings', () =>
    mockIssuings.map(i => ({ ...i, items: i.items.map(j => ({ ...j })) })))

  const searchValue = ref('')
  const activeStatusFilter = ref<IssueStatus | 'all'>('all')

  const filteredIssuings = computed(() => {
    return issuings.value.filter((iss) => {
      if (activeStatusFilter.value !== 'all' && iss.status !== activeStatusFilter.value)
        return false
      if (searchValue.value) {
        const q = searchValue.value.toLowerCase()
        return iss.issueNumber.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
  })

  function addIssuing(data: Omit<Issuing, 'id' | 'issueNumber'>) {
    const id = `iss-${String(issuings.value.length + 1).padStart(3, '0')}`
    const num = `ISS-${String(issuings.value.length + 1).padStart(3, '0')}`
    issuings.value = [...issuings.value, { ...data, id, issueNumber: num }]
    return id
  }

  function updateIssuing(id: string, updates: Partial<Issuing>) {
    issuings.value = issuings.value.map(i =>
      i.id === id ? { ...i, ...updates } : i)
  }

  function completeIssuing(id: string) {
    updateIssuing(id, { status: 'completed' })
  }

  function getIssuingById(id: string): Issuing | undefined {
    return issuings.value.find(i => i.id === id)
  }

  function clearFilters() {
    searchValue.value = ''
    activeStatusFilter.value = 'all'
  }

  return {
    issuings,
    filteredIssuings,
    searchValue,
    activeStatusFilter,
    addIssuing,
    updateIssuing,
    completeIssuing,
    getIssuingById,
    clearFilters,
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add app/composables/usePurchaseRequests.ts app/composables/usePurchaseOrders.ts app/composables/useReceivings.ts app/composables/useIssuings.ts
git commit -m "feat(procurement): add composables for PR, PO, Receiving, Issuing"
```

---

### Task 3: Purchase Requests Tab and Drawer

**Files:**
- Create: `app/components/procurement/ProcurementPurchaseRequestsTab.vue`
- Create: `app/components/procurement/ProcurementPurchaseRequestDrawer.vue`

- [ ] **Step 1: Create ProcurementPurchaseRequestsTab.vue**

Table with columns: Request #, Title, Items (#), Requested By, Status badge, Created. Row actions: View/Edit, Submit for Approval, Approve, Reject, Create PO. Uses `usePurchaseRequests()` composable.

Follow the pattern from `InventoryCatalogTab.vue`:
- Search input + status filter Select at top
- Table with clickable rows opening drawer
- DropdownMenu for row actions
- Status badges with color coding: draft=gray, pending_approval=amber, approved=green, rejected=red, converted_to_po=blue
- Staff name resolution via `staffMembers` from inbox data
- Date formatting with `toLocaleDateString`

- [ ] **Step 2: Create ProcurementPurchaseRequestDrawer.vue**

Sheet drawer with form:
- Header: title input, currency selector (IDR, USD, EUR, etc.)
- Line items: catalog item picker (Popover + Command with `useInventoryCatalog().items`), quantity input, estimated price input, notes
- Add/remove line items
- Footer: notes textarea, Save Draft / Submit for Approval buttons

Follow the pattern from `InventoryItemDrawer.vue`:
- `v-model:open` computed prop
- Form reset on open, populate on edit
- `watch(() => props.open, ...)` for form initialization

- [ ] **Step 3: Commit**

```bash
git add app/components/procurement/ProcurementPurchaseRequestsTab.vue app/components/procurement/ProcurementPurchaseRequestDrawer.vue
git commit -m "feat(procurement): add Purchase Requests tab and drawer"
```

---

### Task 4: Purchase Orders Tab and Drawer

**Files:**
- Create: `app/components/procurement/ProcurementPurchaseOrdersTab.vue`
- Create: `app/components/procurement/ProcurementPurchaseOrderDrawer.vue`

- [ ] **Step 1: Create ProcurementPurchaseOrdersTab.vue**

Table with columns: PO #, Supplier, Items (#), Total Amount, Currency, Status badge, Expected Delivery. Row actions: View/Edit, Mark Sent, Cancel. Status badges: draft=gray, sent=blue, partially_received=amber, received=green, cancelled=red.

- [ ] **Step 2: Create ProcurementPurchaseOrderDrawer.vue**

Sheet drawer:
- Header: poNumber (read-only), supplier name + contact, currency, expectedDeliveryDate
- Line items: item name (read-only from PR), quantity, unitPrice, receivedQuantity (progress display)
- Linked PR info shown at top
- Actions: Save Draft, Mark as Sent

- [ ] **Step 3: Commit**

```bash
git add app/components/procurement/ProcurementPurchaseOrdersTab.vue app/components/procurement/ProcurementPurchaseOrderDrawer.vue
git commit -m "feat(procurement): add Purchase Orders tab and drawer"
```

---

### Task 5: Receiving Tab and Drawer

**Files:**
- Create: `app/components/procurement/ProcurementReceivingTab.vue`
- Create: `app/components/procurement/ProcurementReceivingDrawer.vue`

- [ ] **Step 1: Create ProcurementReceivingTab.vue**

Table with columns: Receiving #, PO #, Supplier, Items (#), Received By, Status badge, Date. Row actions: View, Complete Receiving. Status badges: draft=amber, completed=green.

- [ ] **Step 2: Create ProcurementReceivingDrawer.vue**

Sheet drawer:
- Header: receivingNumber, linked PO info (poNumber + supplier), receivedBy selector
- Line items: item name, ordered qty (from PO), received qty input, condition radio (good/fair/damaged/missing), notes
- Actions: Save Draft, Complete Receiving
- On complete: calls `usePurchaseOrders().updateReceivedQuantity()` for each item, and for consumable items calls `useInventoryCatalog().updateItem()` to update stockLevel

- [ ] **Step 3: Commit**

```bash
git add app/components/procurement/ProcurementReceivingTab.vue app/components/procurement/ProcurementReceivingDrawer.vue
git commit -m "feat(procurement): add Receiving tab and drawer"
```

---

### Task 6: Issuing Tab and Drawer

**Files:**
- Create: `app/components/procurement/ProcurementIssuingTab.vue`
- Create: `app/components/procurement/ProcurementIssuingDrawer.vue`

- [ ] **Step 1: Create ProcurementIssuingTab.vue**

Table with columns: Issue #, Items (#), Issued By, Status badge, Date. Row actions: View, Complete Issuing. Status badges: draft=amber, completed=green.

- [ ] **Step 2: Create ProcurementIssuingDrawer.vue**

Sheet drawer:
- Header: issueNumber, issuedBy selector
- Line items: item name (picker from recently received items), quantity input, destination listing picker (dropdown from `BALI_LISTINGS`), notes
- Add/remove line items
- Actions: Save Draft, Complete Issue
- On complete: calls `useInventoryListings().addEntry()` or `updateEntry()` for each item+listing combination. If entry exists for that itemId+listingName, increase quantity; otherwise create new entry with condition 'good'.

- [ ] **Step 3: Commit**

```bash
git add app/components/procurement/ProcurementIssuingTab.vue app/components/procurement/ProcurementIssuingDrawer.vue
git commit -m "feat(procurement): add Issuing tab and drawer"
```

---

### Task 7: Main Procurement Page

**Files:**
- Create: `app/pages/procurement/index.vue`
- Modify: `app/constants/menus.ts` (add sidebar entry)

- [ ] **Step 1: Create procurement/index.vue**

Page with:
- Title: "Procurement" + subtitle "Manage purchase requests, orders, receiving, and issuing."
- KPI cards row (6 cols on xl): Pending PRs, Open POs, Pending Receivings, Low Stock (from `useInventoryListings().lowStockCount`)
- Tabs with 4 tab triggers: Purchase Requests, Purchase Orders, Receiving, Issuing
- Each tab renders its component: `ProcurementPurchaseRequestsTab`, `ProcurementPurchaseOrdersTab`, `ProcurementReceivingTab`, `ProcurementIssuingTab`

Follow the pattern from `app/pages/inventory/index.vue`:
```vue
<script setup lang="ts">
import { usePurchaseRequests } from '@/composables/usePurchaseRequests'
import { usePurchaseOrders } from '@/composables/usePurchaseOrders'
import { useReceivings } from '@/composables/useReceivings'
import { useInventoryListings } from '@/composables/useInventoryListings'

const activeTab = ref<'pr' | 'po' | 'rcv' | 'iss'>('pr')

const { pendingApprovalCount } = usePurchaseRequests()
const { openPoCount } = usePurchaseOrders()
const { pendingCount: pendingRcvCount } = useReceivings()
const { lowStockCount } = useInventoryListings()
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Procurement</h2>
        <p class="text-muted-foreground">Manage purchase requests, orders, receiving, and issuing.</p>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">Pending PRs</p>
        <p class="text-2xl font-bold" :class="pendingApprovalCount > 0 ? 'text-amber-600' : ''">
          {{ pendingApprovalCount }}
        </p>
      </div>
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">Open POs</p>
        <p class="text-2xl font-bold" :class="openPoCount > 0 ? 'text-blue-600' : ''">
          {{ openPoCount }}
        </p>
      </div>
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">Pending Receivings</p>
        <p class="text-2xl font-bold" :class="pendingRcvCount > 0 ? 'text-amber-600' : ''">
          {{ pendingRcvCount }}
        </p>
      </div>
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">Low Stock Items</p>
        <p class="text-2xl font-bold" :class="lowStockCount > 0 ? 'text-orange-500' : ''">
          {{ lowStockCount }}
        </p>
      </div>
    </div>

    <Tabs v-model="activeTab" class="w-full">
      <TabsList>
        <TabsTrigger value="pr">
          <Icon name="lucide:file-text" class="mr-2 h-4 w-4" />
          Purchase Requests
        </TabsTrigger>
        <TabsTrigger value="po">
          <Icon name="lucide:shopping-cart" class="mr-2 h-4 w-4" />
          Purchase Orders
        </TabsTrigger>
        <TabsTrigger value="rcv">
          <Icon name="lucide:package-check" class="mr-2 h-4 w-4" />
          Receiving
        </TabsTrigger>
        <TabsTrigger value="iss">
          <Icon name="lucide:package-minus" class="mr-2 h-4 w-4" />
          Issuing
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pr" class="mt-4">
        <ProcurementPurchaseRequestsTab />
      </TabsContent>
      <TabsContent value="po" class="mt-4">
        <ProcurementPurchaseOrdersTab />
      </TabsContent>
      <TabsContent value="rcv" class="mt-4">
        <ProcurementReceivingTab />
      </TabsContent>
      <TabsContent value="iss" class="mt-4">
        <ProcurementIssuingTab />
      </TabsContent>
    </Tabs>
  </div>
</template>
```

- [ ] **Step 2: Add sidebar navigation entry**

In `app/constants/menus.ts`, add after the Inventory entry:
```typescript
{
  title: 'Procurement',
  icon: 'i-lucide-shopping-cart',
  link: '/procurement',
  new: true,
},
```

- [ ] **Step 3: Commit**

```bash
git add app/pages/procurement/index.vue app/constants/menus.ts
git commit -m "feat(procurement): add main procurement page and sidebar navigation"
```

---

### Task 8: Cross-Module Integrations and Polish

**Files:**
- Modify: `app/composables/useReceivings.ts` (add PO update on complete)
- Modify: `app/composables/useIssuings.ts` (add inventory update on complete)
- Modify: `app/components/inventory/InventoryCatalogTab.vue` (add "Create PR" action for low stock)
- Modify: `app/components/inventory/InventoryListingsTab.vue` (add "Create PR" action for low stock)

- [ ] **Step 1: Add PO update logic to Receiving completion**

In `useReceivings.ts`, update `completeReceiving()` to also call `usePurchaseOrders().updateReceivedQuantity()` for each receiving item. This triggers PO status auto-update (partially_received or received).

```typescript
function completeReceiving(id: string) {
  const receiving = receivings.value.find(r => r.id === id)
  if (!receiving) return

  const { updateReceivedQuantity } = usePurchaseOrders()

  // Update PO received quantities
  for (const item of receiving.items) {
    updateReceivedQuantity(receiving.purchaseOrderId, item.purchaseOrderItemId, item.quantityReceived)
  }

  updateReceiving(id, { status: 'completed' })
  toast.success('Receiving completed — PO quantities updated')
}
```

- [ ] **Step 2: Add inventory update logic to Issuing completion**

In `useIssuings.ts`, update `completeIssuing()` to call `useInventoryListings()` for each issue item:
- If an entry exists for that itemId + toListing, increase quantity
- Otherwise create a new entry with condition 'good'

```typescript
function completeIssuing(id: string) {
  const issuing = issuings.value.find(i => i.id === id)
  if (!issuing) return

  const { entries, addEntry, updateEntry } = useInventoryListings()

  for (const item of issuing.items) {
    const existing = entries.value.find(
      e => e.itemId === item.itemId && e.listingName === item.toListing
    )
    if (existing) {
      updateEntry(existing.id, { quantity: existing.quantity + item.quantity })
    } else {
      addEntry({
        itemId: item.itemId,
        listingName: item.toListing,
        quantity: item.quantity,
        condition: 'good',
      })
    }
  }

  updateIssuing(id, { status: 'completed' })
  toast.success('Items issued to listings')
}
```

- [ ] **Step 3: Add "Create PR" shortcut for low stock items**

In `app/components/inventory/InventoryListingsTab.vue`, add a "Create PR" button in the row actions DropdownMenu for entries where `stockLevel !== undefined && stockLevel <= 5`. On click, navigate to `/procurement?tab=pr&itemId={itemId}` with pre-filled item.

In `app/components/inventory/InventoryCatalogTab.vue`, add a "Create PR" button in the row actions DropdownMenu for consumable items. On click, navigate to `/procurement?tab=pr&itemId={itemId}`.

In `app/pages/procurement/index.vue`, watch for the `itemId` query param and auto-open the PR drawer with that item pre-selected.

- [ ] **Step 4: Verify full workflow works**

Test the complete flow:
1. Create PR → Submit → Approve → Create PO
2. PO → Mark Sent → Create Receiving → Complete Receiving (verify PO updates)
3. Receiving → Create Issuing → Complete Issuing (verify inventory entries update)
4. Low stock item → "Create PR" → PR drawer opens with item pre-selected

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(procurement): add cross-module integrations (PO sync, inventory sync, low stock PR shortcut)"
```
