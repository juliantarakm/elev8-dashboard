export interface AiSchedule {
  enabled: boolean
  repeatType: 'weekly' | 'monthly'
  activeDays: number[]
  activeHours: {
    start: string
    end: string
  }
}

export interface ListingStats {
  monthlyRevenue: number
  revenueTrend: number
  occupancyRate: number
  occupancyTrend: number
  avgRating: number
  totalReviews: number
}

export interface ListingPricing {
  nightlyRate: number
  cleaningFee: number
  serviceFee: number
  weeklyDiscount: number
  monthlyDiscount: number
  seasonalRates: Array<{ startDate: string; endDate: string; rate: number; label: string }>
}

export interface Booking {
  id: string
  guestName: string
  checkIn: string
  checkOut: string
  nights: number
  status: 'confirmed' | 'pending' | 'cancelled'
  revenue: number
  source: string
}

export interface Review {
  id: string
  guestName: string
  date: string
  rating: number
  text: string
  hostReply?: string
  categories: {
    cleanliness: number
    communication: number
    location: number
    value: number
  }
}

export interface MaintenanceTask {
  id: string
  title: string
  date: string
  assignedTo: string
  status: 'pending' | 'in_progress' | 'completed'
  type: 'cleaning' | 'repair' | 'inspection'
}

export interface ListingMaintenance {
  cleaningSchedule: Array<{ task: string; frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' }>
  tasks: MaintenanceTask[]
}

export interface Listing {
  id: string
  name: string
  property: string
  location: string
  tags: string[]
  otaConnected: string[]
  amenities: string[]
  room: string
  capacity: number
  aiStatus: 'active' | 'paused' | 'not_set'
  unitType: 'single' | 'multi'
  photos: string[]
  aiSchedule: AiSchedule
  stats: ListingStats
  pricing: ListingPricing
  bookings: Booking[]
  blockedDates: string[]
  reviews: Review[]
  maintenance: ListingMaintenance
}

export const listings = ref<Listing[]>([
  {
    id: 'lst-1',
    name: '5BR Pool the R Villa Luwa – Serene near Canggu',
    property: 'Canggu Properties',
    location: 'Canggu, Bali',
    tags: ['Canggu', 'Pool', '4BR'],
    otaConnected: ['Airbnb'],
    amenities: ['Pool', 'WiFi', 'AC', 'Kitchen', 'Parking', 'Garden'],
    room: 'Master Suite',
    capacity: 10,
    aiStatus: 'active',
    unitType: 'multi',
    photos: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: true,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: {
      monthlyRevenue: 4280,
      revenueTrend: 12,
      occupancyRate: 78,
      occupancyTrend: 5,
      avgRating: 4.8,
      totalReviews: 24,
    },
    pricing: {
      nightlyRate: 185,
      cleaningFee: 45,
      serviceFee: 25,
      weeklyDiscount: 10,
      monthlyDiscount: 20,
      seasonalRates: [
        { startDate: '2026-07-01', endDate: '2026-08-31', rate: 220, label: 'Peak Season' },
        { startDate: '2026-12-20', endDate: '2027-01-05', rate: 250, label: 'Holiday' },
      ],
    },
    bookings: [
      { id: 'bk-1', guestName: 'Sarah Mitchell', checkIn: '2026-06-05', checkOut: '2026-06-09', nights: 4, status: 'confirmed', revenue: 740, source: 'Airbnb' },
      { id: 'bk-2', guestName: 'James Kim', checkIn: '2026-06-12', checkOut: '2026-06-15', nights: 3, status: 'confirmed', revenue: 555, source: 'Booking.com' },
      { id: 'bk-3', guestName: 'Emma Wilson', checkIn: '2026-06-20', checkOut: '2026-06-25', nights: 5, status: 'pending', revenue: 925, source: 'Airbnb' },
    ],
    blockedDates: ['2026-06-10', '2026-06-11'],
    reviews: [
      { id: 'rv-1', guestName: 'Sarah Mitchell', date: '2026-05-20', rating: 5, text: 'Amazing villa! The pool was perfect and staff was incredibly helpful. Would definitely come back.', categories: { cleanliness: 5, communication: 5, location: 4, value: 5 } },
      { id: 'rv-2', guestName: 'David Lee', date: '2026-05-10', rating: 4, text: 'Great location and beautiful property. WiFi could be better but overall a wonderful stay.', hostReply: 'Thank you David! We have upgraded our WiFi since your visit.', categories: { cleanliness: 4, communication: 5, location: 5, value: 4 } },
      { id: 'rv-3', guestName: 'Anna Chen', date: '2026-04-28', rating: 5, text: 'Absolutely stunning property. The garden is beautiful and the rooms are spacious and clean.', categories: { cleanliness: 5, communication: 5, location: 5, value: 5 } },
    ],
    maintenance: {
      cleaningSchedule: [
        { task: 'Pool cleaning', frequency: 'daily' },
        { task: 'Garden maintenance', frequency: 'weekly' },
        { task: 'Deep clean', frequency: 'biweekly' },
        { task: 'AC filter replacement', frequency: 'monthly' },
      ],
      tasks: [
        { id: 'mt-1', title: 'Fix leaking faucet - Master bathroom', date: '2026-06-03', assignedTo: 'Wayan Adi', status: 'pending', type: 'repair' },
        { id: 'mt-2', title: 'Pre-arrival deep clean', date: '2026-06-04', assignedTo: 'Made Surya', status: 'in_progress', type: 'cleaning' },
        { id: 'mt-3', title: 'Pool pump inspection', date: '2026-05-28', assignedTo: 'Wayan Adi', status: 'completed', type: 'inspection' },
      ],
    },
  },
  {
    id: 'lst-2',
    name: 'Apartments Pool',
    property: 'Seminyak Suites',
    location: 'Seminyak, Bali',
    tags: ['Seminyak', 'Rooftop'],
    otaConnected: ['Booking.com'],
    amenities: ['Pool', 'WiFi', 'AC', 'Kitchen', 'Rooftop Deck'],
    room: 'Studio Suite',
    capacity: 4,
    aiStatus: 'active',
    unitType: 'multi',
    photos: [
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: true,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
  {
    id: 'lst-3',
    name: 'The R Pererenan Mezzanine Studio + Plunge Pool',
    property: 'Canggu Properties',
    location: 'Pererenan, Bali',
    tags: ['Canggu', 'Beachfront', 'Pool'],
    otaConnected: ['Airbnb'],
    amenities: ['Plunge Pool', 'WiFi', 'AC', 'Beach Access'],
    room: 'Mezzanine Studio',
    capacity: 2,
    aiStatus: 'active',
    unitType: 'multi',
    photos: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: true,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
  {
    id: 'lst-4',
    name: 'The R Villa Merapi',
    property: 'Umalas Villas',
    location: 'Umalas, Bali',
    tags: ['Umalas', 'Pool', 'Private'],
    otaConnected: ['Airbnb'],
    amenities: ['Pool', 'WiFi', 'AC', 'Kitchen', 'Garden', 'Parking'],
    room: '4-Bedroom Villa',
    capacity: 8,
    aiStatus: 'active',
    unitType: 'multi',
    photos: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: true,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
  {
    id: 'lst-5',
    name: 'Nomad Mansion Garden',
    property: 'Ubud Retreats',
    location: 'Ubud, Bali',
    tags: ['Ubud', 'Rice Terrace', 'Yoga'],
    otaConnected: ['Airbnb'],
    amenities: ['WiFi', 'AC', 'Garden', 'Yoga Deck'],
    room: 'Garden Room',
    capacity: 2,
    aiStatus: 'paused',
    unitType: 'single',
    photos: [
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: false,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
  {
    id: 'lst-6',
    name: 'Nomad Mansion Pool',
    property: 'Ubud Retreats',
    location: 'Ubud, Bali',
    tags: ['Ubud', 'Pool'],
    otaConnected: ['Booking.com'],
    amenities: ['Pool', 'WiFi', 'AC', 'Kitchen'],
    room: 'Pool Villa',
    capacity: 4,
    aiStatus: 'active',
    unitType: 'multi',
    photos: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: true,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
  {
    id: 'lst-7',
    name: 'Apartments Main',
    property: 'Seminyak Suites',
    location: 'Seminyak, Bali',
    tags: ['Seminyak', 'Rooftop'],
    otaConnected: ['Booking.com', 'Airbnb'],
    amenities: ['WiFi', 'AC', 'Rooftop Deck', 'Kitchen'],
    room: '1-Bedroom Suite',
    capacity: 3,
    aiStatus: 'active',
    unitType: 'multi',
    photos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: true,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
  {
    id: 'lst-8',
    name: 'Villa Sunset Cliff',
    property: 'Uluwatu Villas',
    location: 'Uluwatu, Bali',
    tags: ['Uluwatu', 'Cliff', 'Ocean View', 'Sunset'],
    otaConnected: ['Airbnb'],
    amenities: ['Pool', 'WiFi', 'AC', 'Ocean View', 'Cliff Deck'],
    room: '3-Bedroom Villa',
    capacity: 6,
    aiStatus: 'not_set',
    unitType: 'single',
    photos: [
      'https://images.unsplash.com/photo-1499793983394-12dec4e36d3b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: false,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
  {
    id: 'lst-9',
    name: 'Jungle Treehouse Retreat',
    property: 'Ubud Retreats',
    location: 'Ubud, Bali',
    tags: ['Ubud', 'Jungle', 'Unique'],
    otaConnected: ['Booking.com'],
    amenities: ['WiFi', 'Jungle View', 'Hammock Deck', 'Nature Bath'],
    room: 'Treehouse',
    capacity: 2,
    aiStatus: 'active',
    unitType: 'multi',
    photos: [
      'https://images.unsplash.com/photo-1515496281361-44a3de5b3482?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: true,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
  {
    id: 'lst-10',
    name: 'Beachfront Bungalow Seminyak',
    property: 'Seminyak Suites',
    location: 'Seminyak, Bali',
    tags: ['Seminyak', 'Beachfront', 'Pool'],
    otaConnected: ['Airbnb'],
    amenities: ['Pool', 'WiFi', 'AC', 'Beach Access', 'Kitchen'],
    room: 'Bungalow',
    capacity: 4,
    aiStatus: 'active',
    unitType: 'multi',
    photos: [
      'https://images.unsplash.com/photo-1573755111591-8a8e12c93f74?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: true,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
  {
    id: 'lst-11',
    name: 'Villa Rice Terrace Jimbaran',
    property: 'Jimbaran Villas',
    location: 'Jimbaran, Bali',
    tags: ['Jimbaran', 'Rice Terrace', 'Pool'],
    otaConnected: ['Booking.com'],
    amenities: ['Pool', 'WiFi', 'AC', 'Garden', 'Rice Terrace View'],
    room: '2-Bedroom Villa',
    capacity: 5,
    aiStatus: 'paused',
    unitType: 'single',
    photos: [
      'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: false,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
  {
    id: 'lst-12',
    name: 'Surf Shack Canggu',
    property: 'Canggu Properties',
    location: 'Canggu, Bali',
    tags: ['Canggu', 'Beachfront', 'Surf'],
    otaConnected: ['Airbnb'],
    amenities: ['WiFi', 'AC', 'Surfboard Storage', 'Beach Access'],
    room: 'Studio',
    capacity: 2,
    aiStatus: 'active',
    unitType: 'multi',
    photos: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1468413253725-0d5181091126?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: true,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
  {
    id: 'lst-13',
    name: 'Volcano View Villa Kintamani',
    property: 'Kintamani Villas',
    location: 'Kintamani, Bali',
    tags: ['Kintamani', 'Mountain', 'Unique'],
    otaConnected: ['Booking.com'],
    amenities: ['WiFi', 'AC', 'Mountain View', 'Hot Tub', 'Fireplace'],
    room: '3-Bedroom Villa',
    capacity: 6,
    aiStatus: 'not_set',
    unitType: 'single',
    photos: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: false,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
  {
    id: 'lst-14',
    name: 'The R Canggu Riverside',
    property: 'Canggu Properties',
    location: 'Canggu, Bali',
    tags: ['Canggu', 'River', 'Pool'],
    otaConnected: ['Airbnb', 'Booking.com'],
    amenities: ['Pool', 'WiFi', 'AC', 'River View', 'Garden'],
    room: '2-Bedroom Suite',
    capacity: 4,
    aiStatus: 'active',
    unitType: 'multi',
    photos: [
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: true,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
  {
    id: 'lst-15',
    name: 'Luxury Penthouse Seminyak',
    property: 'Seminyak Suites',
    location: 'Seminyak, Bali',
    tags: ['Seminyak', 'Luxury', 'Rooftop'],
    otaConnected: ['Airbnb'],
    amenities: ['Pool', 'WiFi', 'AC', 'Rooftop Deck', 'Kitchen', 'Ocean View'],
    room: 'Penthouse',
    capacity: 6,
    aiStatus: 'active',
    unitType: 'multi',
    photos: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: true,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
  {
    id: 'lst-16',
    name: 'Eco Bamboo House Ubud',
    property: 'Ubud Retreats',
    location: 'Ubud, Bali',
    tags: ['Ubud', 'Eco', 'Unique', 'Bamboo'],
    otaConnected: ['Booking.com'],
    amenities: ['WiFi', 'Bamboo Construction', 'Nature Bath', 'Garden'],
    room: 'Bamboo Suite',
    capacity: 2,
    aiStatus: 'active',
    unitType: 'multi',
    photos: [
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&h=600&fit=crop',
    ],
    aiSchedule: {
      enabled: true,
      repeatType: 'weekly',
      activeDays: [1, 2, 3, 4, 5],
      activeHours: { start: '08:00', end: '22:00' },
    },
    stats: { monthlyRevenue: 2800, revenueTrend: 5, occupancyRate: 65, occupancyTrend: 2, avgRating: 4.5, totalReviews: 12 },
    pricing: { nightlyRate: 120, cleaningFee: 30, serviceFee: 20, weeklyDiscount: 8, monthlyDiscount: 15, seasonalRates: [] },
    bookings: [],
    blockedDates: [],
    reviews: [],
    maintenance: { cleaningSchedule: [], tasks: [] },
  },
])

export const allTags = computed(() => [...new Set(listings.value.flatMap(l => l.tags))].sort())

export const allLocations = computed(() => [...new Set(listings.value.map(l => l.location))].sort())

export const allProperties = computed(() => [...new Set(listings.value.map(l => l.property))].sort())

export const allOtas = computed(() => [...new Set(listings.value.flatMap(l => l.otaConnected))].sort())

export const aiStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'not_set', label: 'Not Set' },
]

export const aiStatusLabels: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  not_set: 'Not Set',
}
