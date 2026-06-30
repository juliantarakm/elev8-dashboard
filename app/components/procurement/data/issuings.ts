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
