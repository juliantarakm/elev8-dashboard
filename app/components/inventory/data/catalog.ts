export type InventoryCategory =
  | 'Furniture'
  | 'Electronics'
  | 'Linen'
  | 'Kitchen'
  | 'Consumable'
  | 'Other'

export type InventoryItemType = 'permanent' | 'consumable'

export interface InventoryDocument {
  name: string
  url: string
  type: 'warranty' | 'receipt' | 'invoice' | 'other'
}

export interface InventorySupplier {
  name: string
  contact: string
}

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  type: InventoryItemType
  unit: string
  photo?: string
  purchaseValue?: number
  purchaseDate?: string
  warrantyExpiry?: string
  documents?: InventoryDocument[]
  supplier?: InventorySupplier
  notes?: string
}

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  'Furniture',
  'Electronics',
  'Linen',
  'Kitchen',
  'Consumable',
  'Other',
]

export const mockInventoryItems: InventoryItem[] = [
  {
    id: 'inv-001',
    name: 'Kasur King',
    category: 'Furniture',
    type: 'permanent',
    unit: 'pcs',
    purchaseValue: 8500000,
    purchaseDate: '2024-01-15',
    warrantyExpiry: '2027-01-15',
    supplier: { name: 'Ace Hardware Bali', contact: '+62 361 123456' },
    notes: 'King size, 180x200cm, memory foam',
  },
  {
    id: 'inv-002',
    name: 'Smart TV 55"',
    category: 'Electronics',
    type: 'permanent',
    unit: 'pcs',
    purchaseValue: 7200000,
    purchaseDate: '2024-03-10',
    warrantyExpiry: '2026-06-10',
    supplier: { name: 'Samsung Store Denpasar', contact: '+62 361 789012' },
    notes: 'Samsung 4K, HDMI + Netflix built-in',
    documents: [
      { name: 'Samsung Warranty Card.pdf', url: 'mock://warranty-smart-tv', type: 'warranty' },
      { name: 'Purchase Receipt.jpg', url: 'mock://receipt-smart-tv', type: 'receipt' },
    ],
  },
  {
    id: 'inv-003',
    name: 'Set Linen',
    category: 'Linen',
    type: 'permanent',
    unit: 'set',
    purchaseValue: 450000,
    purchaseDate: '2024-06-01',
    notes: 'Includes 2 pillowcases + 1 duvet cover',
  },
  {
    id: 'inv-004',
    name: 'Coffee Maker',
    category: 'Kitchen',
    type: 'permanent',
    unit: 'pcs',
    purchaseValue: 1200000,
    purchaseDate: '2024-02-20',
    warrantyExpiry: '2026-02-20',
    supplier: { name: 'Philips Store Bali', contact: '+62 361 345678' },
  },
  {
    id: 'inv-005',
    name: 'Sabun Mandi',
    category: 'Consumable',
    type: 'consumable',
    unit: 'botol',
    purchaseValue: 15000,
    supplier: { name: 'Tokopedia Supplier', contact: 'tokopedia.com/supplier' },
  },
  {
    id: 'inv-006',
    name: 'Shampoo',
    category: 'Consumable',
    type: 'consumable',
    unit: 'botol',
    purchaseValue: 18000,
  },
  {
    id: 'inv-007',
    name: 'Tisu Gulung',
    category: 'Consumable',
    type: 'consumable',
    unit: 'rol',
    purchaseValue: 8000,
  },
  {
    id: 'inv-008',
    name: 'Kopi Sachet',
    category: 'Consumable',
    type: 'consumable',
    unit: 'sachet',
    purchaseValue: 3500,
    supplier: { name: 'Kopi Kapal Api', contact: '+62 21 999888' },
  },
  {
    id: 'inv-009',
    name: 'Rice Cooker',
    category: 'Kitchen',
    type: 'permanent',
    unit: 'pcs',
    purchaseValue: 650000,
    purchaseDate: '2024-04-05',
    warrantyExpiry: '2026-04-05',
  },
  {
    id: 'inv-010',
    name: 'AC Split 1 PK',
    category: 'Electronics',
    type: 'permanent',
    unit: 'unit',
    purchaseValue: 4500000,
    purchaseDate: '2023-11-01',
    warrantyExpiry: '2025-11-01',
    supplier: { name: 'Daikin Authorized Bali', contact: '+62 361 556677' },
    notes: 'Daikin 1PK Inverter. Annual servicing required.',
    documents: [
      { name: 'Daikin Warranty Certificate.pdf', url: 'mock://warranty-ac-split', type: 'warranty' },
      { name: 'Installation Receipt.pdf', url: 'mock://receipt-ac-split', type: 'receipt' },
    ],
  },
  {
    id: 'inv-011',
    name: 'Bantal Tidur',
    category: 'Linen',
    type: 'permanent',
    unit: 'pcs',
    purchaseValue: 120000,
    purchaseDate: '2024-06-01',
  },
  {
    id: 'inv-012',
    name: 'Handuk Mandi',
    category: 'Linen',
    type: 'permanent',
    unit: 'pcs',
    purchaseValue: 85000,
    purchaseDate: '2024-06-01',
  },
]
