export type ItemCondition = 'good' | 'fair' | 'damaged' | 'missing'

export interface ListingInventoryEntry {
  id: string
  itemId: string
  listingName: string
  quantity: number
  condition: ItemCondition
  stockLevel?: number
  notes?: string
  lastUpdated: string
}

export const mockListingEntries: ListingInventoryEntry[] = [
  {
    id: 'entry-001',
    itemId: 'inv-001',
    listingName: 'The R Villa Merapi',
    quantity: 3,
    condition: 'good',
    lastUpdated: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'entry-002',
    itemId: 'inv-002',
    listingName: 'The R Villa Merapi',
    quantity: 2,
    condition: 'good',
    lastUpdated: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'entry-003',
    itemId: 'inv-003',
    listingName: 'The R Villa Merapi',
    quantity: 6,
    condition: 'fair',
    notes: '2 set perlu diganti bulan depan',
    lastUpdated: '2026-05-18T10:30:00.000Z',
  },
  {
    id: 'entry-004',
    itemId: 'inv-010',
    listingName: 'The R Villa Merapi',
    quantity: 4,
    condition: 'good',
    lastUpdated: '2026-05-15T09:00:00.000Z',
  },
  {
    id: 'entry-005',
    itemId: 'inv-005',
    listingName: 'The R Villa Merapi',
    quantity: 12,
    condition: 'good',
    stockLevel: 2,
    lastUpdated: '2026-05-22T07:45:00.000Z',
  },
  {
    id: 'entry-006',
    itemId: 'inv-006',
    listingName: 'The R Villa Merapi',
    quantity: 12,
    condition: 'good',
    stockLevel: 3,
    lastUpdated: '2026-05-22T07:45:00.000Z',
  },
  {
    id: 'entry-007',
    itemId: 'inv-007',
    listingName: 'The R Villa Merapi',
    quantity: 24,
    condition: 'good',
    stockLevel: 10,
    lastUpdated: '2026-05-22T07:45:00.000Z',
  },
  {
    id: 'entry-008',
    itemId: 'inv-001',
    listingName: 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu',
    quantity: 3,
    condition: 'good',
    lastUpdated: '2026-05-19T11:00:00.000Z',
  },
  {
    id: 'entry-009',
    itemId: 'inv-004',
    listingName: 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu',
    quantity: 1,
    condition: 'damaged',
    notes: 'Karafe retak, perlu penggantian',
    lastUpdated: '2026-05-21T14:20:00.000Z',
  },
  {
    id: 'entry-010',
    itemId: 'inv-009',
    listingName: 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu',
    quantity: 1,
    condition: 'good',
    lastUpdated: '2026-05-10T09:00:00.000Z',
  },
  {
    id: 'entry-011',
    itemId: 'inv-008',
    listingName: 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu',
    quantity: 30,
    condition: 'good',
    stockLevel: 12,
    lastUpdated: '2026-05-22T08:00:00.000Z',
  },
  {
    id: 'entry-012',
    itemId: 'inv-011',
    listingName: 'TAMBORA - The R Tambora: Stylish 3BR Tropical Escape',
    quantity: 6,
    condition: 'good',
    lastUpdated: '2026-05-17T10:00:00.000Z',
  },
  {
    id: 'entry-013',
    itemId: 'inv-012',
    listingName: 'TAMBORA - The R Tambora: Stylish 3BR Tropical Escape',
    quantity: 8,
    condition: 'fair',
    notes: '3 handuk mulai lusuh',
    lastUpdated: '2026-05-17T10:00:00.000Z',
  },
]
