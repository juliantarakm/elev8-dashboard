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

export interface UpsellItem {
  id: string
  name: string
  price: number
}

export interface UpsellService {
  id: string
  name: string
  description: string
  category: UpsellCategory
  currency: string
  image?: string
  youtubeLinks: string[]
  internalNotes: string
  notificationUsers: string[]
  pricingEnabled: boolean
  taxPercent: number
  servicePercent: number
  items: UpsellItem[]
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
    currency: 'IDR',
    youtubeLinks: [],
    internalNotes: 'Coordinate with driver 24h before arrival. Confirm flight number.',
    notificationUsers: ['Komang Juliantara'],
    pricingEnabled: true,
    taxPercent: 11,
    servicePercent: 5,
    items: [
      { id: 'itm-001a', name: 'Standard Sedan', price: 350000 },
      { id: 'itm-001b', name: 'SUV (up to 5 pax)', price: 500000 },
      { id: 'itm-001c', name: 'Minivan (up to 8 pax)', price: 650000 },
    ],
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
    currency: 'IDR',
    youtubeLinks: [],
    internalNotes: 'Confirm dietary restrictions 48h before. Chef arrives 2h before dinner.',
    notificationUsers: ['Komang Juliantara'],
    pricingEnabled: true,
    taxPercent: 11,
    servicePercent: 5,
    items: [
      { id: 'itm-002a', name: 'Balinese Set Menu', price: 1500000 },
      { id: 'itm-002b', name: 'Seafood BBQ', price: 1800000 },
      { id: 'itm-002c', name: 'Western Fine Dining', price: 2200000 },
    ],
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
    currency: 'IDR',
    youtubeLinks: [],
    internalNotes: '',
    notificationUsers: [],
    pricingEnabled: true,
    taxPercent: 11,
    servicePercent: 0,
    items: [
      { id: 'itm-003a', name: 'Balinese Massage', price: 800000 },
      { id: 'itm-003b', name: 'Aromatherapy Massage', price: 900000 },
      { id: 'itm-003c', name: 'Body Scrub + Massage', price: 1100000 },
    ],
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
    currency: 'IDR',
    youtubeLinks: [],
    internalNotes: 'Pickup at 8am. Bring sunscreen and comfortable shoes.',
notificationUsers: ['Komang Juliantara'],
    pricingEnabled: true,
    taxPercent: 11,
    servicePercent: 5,
    items: [
      { id: 'itm-004a', name: 'Group Tour (shared)', price: 600000 },
      { id: 'itm-004b', name: 'Private Tour', price: 950000 },
    ],
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
    currency: 'IDR',
    youtubeLinks: [],
    internalNotes: '',
    notificationUsers: [],
    pricingEnabled: true,
    taxPercent: 11,
    servicePercent: 0,
    items: [
      { id: 'itm-005a', name: 'Beginner Lesson', price: 500000 },
      { id: 'itm-005b', name: 'Intermediate Lesson', price: 600000 },
      { id: 'itm-005c', name: 'Private 1-on-1', price: 850000 },
    ],
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
    currency: 'IDR',
    youtubeLinks: [],
    internalNotes: 'Check next-day booking before confirming.',
    notificationUsers: [],
    pricingEnabled: true,
    taxPercent: 11,
    servicePercent: 0,
    items: [
      { id: 'itm-006a', name: 'Late Check-out', price: 450000 },
    ],
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
    currency: 'IDR',
    youtubeLinks: [],
    internalNotes: 'Check prior-night booking before confirming.',
    notificationUsers: [],
    pricingEnabled: true,
    taxPercent: 11,
    servicePercent: 0,
    items: [
      { id: 'itm-007a', name: 'Early Check-in', price: 450000 },
    ],
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'svc-008',
    name: 'Vehicle Rental',
    description: 'Vehicle rental delivered to your villa. Includes basic insurance. Perfect for exploring Bali at your own pace.',
    category: 'Vehicle Rental',
    currency: 'IDR',
    youtubeLinks: [],
    internalNotes: 'Collect passport copy for car rental. Scooter requires international license.',
    notificationUsers: ['Komang Juliantara'],
    pricingEnabled: true,
    taxPercent: 11,
    servicePercent: 5,
    items: [
      { id: 'itm-008a', name: 'Scooter (Automatic)', price: 120000 },
      { id: 'itm-008b', name: 'Honda Scoopy', price: 150000 },
      { id: 'itm-008c', name: 'Toyota Avanza', price: 450000 },
      { id: 'itm-008d', name: 'Toyota Innova', price: 650000 },
    ],
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-03-10T14:00:00Z',
    updatedAt: '2026-05-10T16:00:00Z',
  },
  {
    id: 'svc-009',
    name: 'Baby Equipment Setup',
    description: 'Baby equipment delivered and set up in your villa prior to arrival.',
    category: 'Baby',
    currency: 'IDR',
    youtubeLinks: [],
    internalNotes: 'Set up before guest arrival. Confirm equipment availability.',
    notificationUsers: [],
    pricingEnabled: true,
    taxPercent: 11,
    servicePercent: 0,
    items: [
      { id: 'itm-009a', name: 'Baby Crib', price: 250000 },
      { id: 'itm-009b', name: 'High Chair', price: 150000 },
      { id: 'itm-009c', name: 'Baby Crib + High Chair Bundle', price: 350000 },
    ],
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
    currency: 'IDR',
    youtubeLinks: [],
    internalNotes: 'Schedule when guests are out on excursion if possible.',
    notificationUsers: ['Made Surya'],
    pricingEnabled: true,
    taxPercent: 11,
    servicePercent: 0,
    items: [
      { id: 'itm-010a', name: 'Standard Cleaning', price: 400000 },
      { id: 'itm-010b', name: 'Deep Clean + Laundry', price: 600000 },
    ],
    assignedListings: BALI_LISTINGS,
    status: 'active',
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-04-01T09:00:00Z',
  },
]
