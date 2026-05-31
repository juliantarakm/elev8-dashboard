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
}

export const listings: Listing[] = [
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
  },
]

export const allTags = [...new Set(listings.flatMap(l => l.tags))].sort()

export const allLocations = [...new Set(listings.map(l => l.location))].sort()

export const allProperties = [...new Set(listings.map(l => l.property))].sort()

export const allOtas = [...new Set(listings.flatMap(l => l.otaConnected))].sort()

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
