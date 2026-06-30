export type PurchaseRequestStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'converted_to_po'

export interface PurchaseRequestItem {
  id: string
  itemId: string
  quantity: number
  estimatedPrice?: number
  notes?: string
}

export interface PurchaseRequest {
  id: string
  requestNumber: string
  title: string
  status: PurchaseRequestStatus
  requestedBy: string
  approvedBy?: string
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

export const CURRENCY_OPTIONS = ['IDR', 'USD', 'EUR', 'AUD', 'SGD', 'GBP'] as const

export const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: 'pr-001',
    requestNumber: 'PR-001',
    title: 'Restock consumables - Villa Merapi',
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
    title: 'Replace damaged coffee maker - BRATAN',
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
    title: 'New linen sets - TAMBORA',
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
    title: 'Kitchen supplies - USD order',
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
