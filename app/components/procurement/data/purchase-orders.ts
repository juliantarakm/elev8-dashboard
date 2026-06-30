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
  purchaseRequestId?: string
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
