export type UpsellCategory =
  | 'Vehicle Rental'
  | 'Airport Transport'
  | 'Private Chef'
  | 'Spa'
  | 'Activity'
  | 'Late Check-out'
  | 'Early Check-in'
  | 'Mid-stay Cleaning'
  | 'Office Equipment'
  | 'Baby'
  | 'Miscellaneous'
  | 'Pet'

export interface UpsellService {
  id: string
  name: string
  description: string
  category: UpsellCategory
  price: number
  currency: string
  image?: string
  assignedListings: string[]
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export const UPSPELL_CATEGORIES: UpsellCategory[] = [
  'Airport Transport',
  'Vehicle Rental',
  'Private Chef',
  'Spa',
  'Activity',
  'Late Check-out',
  'Early Check-in',
  'Mid-stay Cleaning',
  'Office Equipment',
  'Baby',
  'Pet',
  'Miscellaneous',
]

export const BALI_LISTINGS = [
  'The R Pererenan Mezzanine Studio + Plunge Pool',
  'Cozy 2BR - the R Villa Sinabung w/ Pool in Sanur',
  'The R Villa Merapi',
  'TAMBORA - The R Tambora: Stylish 3BR Tropical Escape',
  'The R Loft - Cosy Suite Kalmantan incl Breakfast',
  'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu',
  'KABA - Stylish 2BR the R Villa Kaba-Kerobokan+Pool/Bikes',
  'The R Apartments Studio walk to the Beach',
  'Tranquil the R Villa Patuha-Pool/Rice Field Views',
  'Cozy Meets Luxe – 3BR the R Villa Ranakah Stay',
  'Tropical 2BR the R Villa Dempo w/Pool - Pererenan',
  '2BR-Tropical Escape at Villa Toba | Pool & Bikes',
  '5BR Pool the R Villa Luwa – Serene near Canggu',
  'Modern 2BR the R Villa Swantika w/Pool - Pererenan',
  'The R Pererenan Mezzanine Apartment w/ balcony',
  'The R Villa Samalas | 4BR Retreat in Pererenan',
]

export const mockUpsellServices: UpsellService[] = [
  {
    id: 'svc-001',
    name: 'Airport Transfer (Ngurah Rai)',
    description: 'Private airport transfer from Ngurah Rai International Airport to your villa. Includes meet & greet, luggage assistance, and cold towels upon arrival.',
    category: 'Airport Transport',
    price: 350000,
    currency: 'IDR',
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-04-20T10:30:00Z',
  },
  {
    id: 'svc-002',
    name: 'Private Chef - Dinner',
    description: 'Experience a private dinner prepared by a local Balinese chef at your villa. Choose from Balinese, Indonesian, or Western menu. Includes appetizer, main course, dessert for up to 4 guests.',
    category: 'Private Chef',
    price: 1500000,
    currency: 'IDR',
    assignedListings: ['TAMBORA - The R Tambora: Stylish 3BR Tropical Escape', 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu', 'Cozy Meets Luxe – 3BR the R Villa Ranakah Stay', '5BR Pool the R Villa Luwa – Serene near Canggu', 'The R Villa Samalas | 4BR Retreat in Pererenan'],
    status: 'active',
    createdAt: '2026-01-20T09:00:00Z',
    updatedAt: '2026-05-01T14:00:00Z',
  },
  {
    id: 'svc-003',
    name: 'In-Villa Spa Treatment',
    description: 'Relaxing in-villa spa treatment with professional therapists. Choose from Balinese massage, aromatherapy, or body scrub. 90-minute session.',
    category: 'Spa',
    price: 800000,
    currency: 'IDR',
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-03-15T11:00:00Z',
  },
  {
    id: 'svc-004',
    name: 'Ubud Rice Terrace Tour',
    description: 'Full-day guided tour to Tegallalang Rice Terraces, Tirta Empul water temple, and Ubud Monkey Forest. Includes private driver, lunch, and entrance fees.',
    category: 'Activity',
    price: 600000,
    currency: 'IDR',
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-02-10T12:00:00Z',
    updatedAt: '2026-04-05T09:30:00Z',
  },
  {
    id: 'svc-005',
    name: 'Surf Lesson at Canggu',
    description: '2-hour surf lesson with certified instructor at Canggu or Batu Bolong beach. Includes surfboard rental, rash guard, and bottled water. Suitable for beginners.',
    category: 'Activity',
    price: 500000,
    currency: 'IDR',
    assignedListings: ['The R Apartments Studio walk to the Beach', 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu', '5BR Pool the R Villa Luwa – Serene near Canggu', 'The R Villa Samalas | 4BR Retreat in Pererenan', 'Tropical 2BR the R Villa Dempo w/Pool - Pererenan'],
    status: 'active',
    createdAt: '2026-02-15T08:00:00Z',
    updatedAt: '2026-04-10T15:00:00Z',
  },
  {
    id: 'svc-006',
    name: 'Late Check-out (until 2pm)',
    description: 'Extend your check-out time until 2:00 PM. Subject to availability and next-day bookings.',
    category: 'Late Check-out',
    price: 450000,
    currency: 'IDR',
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'svc-007',
    name: 'Early Check-in (from 10am)',
    description: 'Check in early from 10:00 AM instead of the standard 3:00 PM. Subject to availability and prior-night bookings.',
    category: 'Early Check-in',
    price: 450000,
    currency: 'IDR',
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'svc-008',
    name: 'Scooter Rental (Daily)',
    description: 'Automatic scooter rental delivered to your villa. Includes helmet, basic insurance, and unlimited mileage. Perfect for exploring Bali at your own pace.',
    category: 'Vehicle Rental',
    price: 120000,
    currency: 'IDR',
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-03-10T14:00:00Z',
    updatedAt: '2026-05-10T16:00:00Z',
  },
  {
    id: 'svc-009',
    name: 'Baby Crib Setup',
    description: 'Baby crib with clean linens, high chair, and baby-proofing kit setup in your villa prior to arrival.',
    category: 'Baby',
    price: 250000,
    currency: 'IDR',
    assignedListings: ['TAMBORA - The R Tambora: Stylish 3BR Tropical Escape', 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu', 'KABA - Stylish 2BR the R Villa Kaba-Kerobokan+Pool/Bikes', 'Cozy Meets Luxe – 3BR the R Villa Ranakah Stay', '5BR Pool the R Villa Luwa – Serene near Canggu'],
    status: 'active',
    createdAt: '2026-03-20T11:00:00Z',
    updatedAt: '2026-04-15T08:00:00Z',
  },
  {
    id: 'svc-010',
    name: 'Mid-stay Deep Cleaning',
    description: 'Thorough mid-stay cleaning service including fresh linens, towel replacement, and full villa refresh. Recommended for stays of 5+ nights.',
    category: 'Mid-stay Cleaning',
    price: 400000,
    currency: 'IDR',
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-04-01T09:00:00Z',
  },
]
