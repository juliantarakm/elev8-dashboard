export type CostType = 'Manual' | 'Cleaning' | 'Activity'
export type CostStatus = 'Pending' | 'Approved' | 'Rejected'
export type CostSource = 'Manual' | 'Cleaning' | 'Activity'
export type CostCategory = 'Cleaning Supplies' | 'Maintenance' | 'Consumables' | 'Other'

export interface CostEntry {
  id: string
  date: string
  listing: string
  type: CostType
  source: CostSource
  category: CostCategory
  amount: number
  currency: string
  staff: string
  staffId: string
  status: CostStatus
  invoice?: string
  note?: string
  duration?: number
  rejectionReason?: string
  linkedCleaningId?: string
  linkedActivityId?: string
  linkedReservation?: string
}

export const mockStaff = [
  { id: 'staff-2', name: 'Made Surya', role: 'Housekeeping' },
  { id: 'staff-3', name: 'Wayan Adi', role: 'Maintenance' },
  { id: 'staff-4', name: 'Ni Luh Ayu', role: 'Housekeeping' },
  { id: 'staff-5', name: 'Gede Putra', role: 'Maintenance' },
]

export const mockListings = [
  'Villa Saba',
  'The Layar 1',
  'Jungle House',
  'Villa Mana',
  'Alaya Ubud',
]

export const mockCosts: CostEntry[] = [
  {
    id: 'cost-1',
    date: '2026-05-08',
    listing: 'Villa Saba',
    type: 'Manual',
    source: 'Manual',
    category: 'Cleaning Supplies',
    amount: 185000,
    currency: 'IDR',
    staff: 'Made Surya',
    staffId: 'staff-2',
    status: 'Pending',
    invoice: 'receipt_villa_saba_may8.jpg',
    note: 'Laundry detergent and floor cleaner for deep clean.',
  },
  {
    id: 'cost-2',
    date: '2026-05-07',
    listing: 'The Layar 1',
    type: 'Cleaning',
    source: 'Cleaning',
    category: 'Other',
    amount: 93750,
    currency: 'IDR',
    staff: 'Made Surya',
    staffId: 'staff-2',
    status: 'Approved',
    duration: 150,
    linkedCleaningId: 'clean-42',
    linkedReservation: 'res-7',
  },
  {
    id: 'cost-3',
    date: '2026-05-06',
    listing: 'Jungle House',
    type: 'Manual',
    source: 'Manual',
    category: 'Maintenance',
    amount: 320000,
    currency: 'IDR',
    staff: 'Wayan Adi',
    staffId: 'staff-3',
    status: 'Approved',
    invoice: 'invoice_plumbing_jungle_may6.pdf',
    note: 'Shower head replacement in main bathroom.',
  },
  {
    id: 'cost-4',
    date: '2026-05-05',
    listing: 'Villa Mana',
    type: 'Activity',
    source: 'Activity',
    category: 'Other',
    amount: 62500,
    currency: 'IDR',
    staff: 'Ni Luh Ayu',
    staffId: 'staff-4',
    status: 'Approved',
    duration: 100,
    linkedActivityId: 'act-18',
    note: 'Pool cleaning activity.',
  },
  {
    id: 'cost-5',
    date: '2026-05-04',
    listing: 'Villa Saba',
    type: 'Manual',
    source: 'Manual',
    category: 'Consumables',
    amount: 145000,
    currency: 'IDR',
    staff: 'Made Surya',
    staffId: 'staff-2',
    status: 'Rejected',
    invoice: 'receipt_consumables_may4.jpg',
    note: 'Toiletries restock.',
    rejectionReason: 'Amount seems too high for listed items. Please resubmit with itemized breakdown.',
  },
  {
    id: 'cost-6',
    date: '2026-05-03',
    listing: 'Alaya Ubud',
    type: 'Cleaning',
    source: 'Cleaning',
    category: 'Other',
    amount: 112500,
    currency: 'IDR',
    staff: 'Ni Luh Ayu',
    staffId: 'staff-4',
    status: 'Approved',
    duration: 180,
    linkedCleaningId: 'clean-38',
    linkedReservation: 'res-5',
  },
  {
    id: 'cost-7',
    date: '2026-05-02',
    listing: 'The Layar 1',
    type: 'Manual',
    source: 'Manual',
    category: 'Maintenance',
    amount: 480000,
    currency: 'IDR',
    staff: 'Gede Putra',
    staffId: 'staff-5',
    status: 'Pending',
    note: 'AC filter cleaning — all three units.',
  },
  {
    id: 'cost-8',
    date: '2026-05-01',
    listing: 'Jungle House',
    type: 'Cleaning',
    source: 'Cleaning',
    category: 'Other',
    amount: 75000,
    currency: 'IDR',
    staff: 'Made Surya',
    staffId: 'staff-2',
    status: 'Approved',
    duration: 120,
    linkedCleaningId: 'clean-35',
  },
]
