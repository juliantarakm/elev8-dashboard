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
    notes: 'Partial delivery - 1 rice cooker still in transit',
  },
]
