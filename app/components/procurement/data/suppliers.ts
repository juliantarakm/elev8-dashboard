export type SupplierCategory = 'Kitchen' | 'Linen' | 'Electronics' | 'Furniture' | 'Cleaning' | 'General' | 'Other'

export interface Supplier {
  id: string
  name: string
  contact: string
  email?: string
  address?: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  category?: SupplierCategory
  notes?: string
}

export const SUPPLIER_CATEGORIES: SupplierCategory[] = [
  'Kitchen',
  'Linen',
  'Electronics',
  'Furniture',
  'Cleaning',
  'General',
  'Other',
]

export const mockSuppliers: Supplier[] = [
  {
    id: 'sup-001',
    name: 'Ace Hardware Bali',
    contact: '+62 361 123456',
    email: 'info@acehardwarebali.com',
    address: 'Jl. Sunset Road No. 88, Seminyak',
    category: 'General',
    notes: 'Main supplier for furniture and home improvement',
  },
  {
    id: 'sup-002',
    name: 'Samsung Store Denpasar',
    contact: '+62 361 789012',
    email: 'sales@samsungdenpasar.com',
    address: 'Jl. Teuku Umar No. 45, Denpasar',
    bankName: 'BCA',
    accountNumber: '1234567890',
    accountHolder: 'PT Samsung Elektronik Bali',
    category: 'Electronics',
  },
  {
    id: 'sup-003',
    name: 'Philips Store Bali',
    contact: '+62 361 345678',
    category: 'Kitchen',
    notes: 'Kitchen appliances and electronics',
  },
  {
    id: 'sup-004',
    name: 'Daikin Authorized Bali',
    contact: '+62 361 556677',
    email: 'service@daikinbali.com',
    address: 'Jl. By Pass Ngurah Rai No. 120, Kuta',
    bankName: 'Mandiri',
    accountNumber: '9876543210',
    accountHolder: 'PT Daikin Air Conditioning Bali',
    category: 'Electronics',
    notes: 'AC sales and servicing. Annual maintenance contracts available.',
  },
  {
    id: 'sup-005',
    name: 'Tokopedia Supplier',
    contact: 'tokopedia.com/supplier',
    email: 'bulk@tokopedia.com',
    category: 'General',
    notes: 'Online marketplace - consumables and cleaning supplies',
  },
  {
    id: 'sup-006',
    name: 'Kopi Kapal Api',
    contact: '+62 21 999888',
    email: 'order@kapalapi.co.id',
    category: 'Kitchen',
    bankName: 'BNI',
    accountNumber: '5551234567',
    accountHolder: 'PT Kapal Api Global',
    notes: 'Bulk coffee sachet orders. Min order 500 sachets.',
  },
  {
    id: 'sup-007',
    name: 'Amazon US Kitchen Supplies',
    contact: 'orders@amazon.com',
    category: 'Kitchen',
    notes: 'International supplier - USD payments. Delivery 2-3 weeks.',
  },
  {
    id: 'sup-008',
    name: 'Bali Linen House',
    contact: '+62 361 222333',
    email: 'sales@balilinenhouse.com',
    address: 'Jl. Gatot Subroto No. 15, Denpasar',
    bankName: 'BRI',
    accountNumber: '1112223334',
    accountHolder: 'CV Bali Linen House',
    category: 'Linen',
    notes: 'Bed sheets, towels, pillowcases. Bulk discounts available.',
  },
]
