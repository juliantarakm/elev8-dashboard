export interface MockReservation {
  id: string
  guestName: string
  nationality: string
  listingName: string
  checkInTime: string
  checkOutDate: string
  nights: number
  guests: number
  totalAmount: number
  currency: 'CHF'
  /** Whether guest verification (ID, online check-in) is complete. Defaults true. */
  verified?: boolean
}

export interface MockCleaning {
  id: string
  listingName: string
  date: string
  scheduledStart: string
  scheduledEnd: string
  housekeeper: string
  type: 'standard' | 'deep' | 'checkout'
  status: 'scheduled' | 'in_progress' | 'completed'
}

export interface MockListing {
  id: string
  name: string
  location: string
  bedrooms: number
  maxGuests: number
  isActive: boolean
  basePricePerNight: number
  currency: 'CHF'
}

export interface MockRevenue {
  totalRevenue: number
  currency: 'CHF'
  adr: number
  bookedNights: number
  reservationCount: number
}

export interface MockTask {
  id: string
  title: string
  listingName: string
  priority: 'high' | 'medium' | 'low'
  status: 'not_started' | 'in_progress' | 'completed'
  dueDate: string
  assignedTo: string
}

const RESERVATIONS_TODAY: MockReservation[] = [
  {
    id: 'res-101',
    guestName: 'Anna Schmidt',
    nationality: 'DE',
    listingName: 'Villa Sunset',
    checkInTime: '14:00',
    checkOutDate: '2026-07-15',
    nights: 5,
    guests: 4,
    totalAmount: 2450,
    currency: 'CHF',
    verified: false,
  },
  {
    id: 'res-102',
    guestName: 'Yuki Tanaka',
    nationality: 'JP',
    listingName: 'Villa Bamboo',
    checkInTime: '16:30',
    checkOutDate: '2026-07-14',
    nights: 4,
    guests: 2,
    totalAmount: 1680,
    currency: 'CHF',
  },
  {
    id: 'res-103',
    guestName: 'Marc Weber',
    nationality: 'NL',
    listingName: 'Villa Oasis',
    checkInTime: '19:00',
    checkOutDate: '2026-07-17',
    nights: 7,
    guests: 6,
    totalAmount: 4200,
    currency: 'CHF',
    verified: false,
  },
  {
    id: 'res-105',
    guestName: 'Klaus Mueller',
    nationality: 'DE',
    listingName: 'Villa Sunset',
    checkInTime: '12:00',
    checkOutDate: '2026-07-15',
    nights: 5,
    guests: 3,
    totalAmount: 2450,
    currency: 'CHF',
  },
]

const RESERVATIONS_TOMORROW: MockReservation[] = [
  {
    id: 'res-104',
    guestName: 'Sophie Laurent',
    nationality: 'FR',
    listingName: 'Villa Sunset',
    checkInTime: '15:00',
    checkOutDate: '2026-07-16',
    nights: 3,
    guests: 2,
    totalAmount: 60,
    currency: 'CHF',
  },
]

const RESERVATIONS_CHECKOUTS_TODAY: MockReservation[] = [
  {
    id: 'res-099',
    guestName: 'Hans Müller',
    nationality: 'DE',
    listingName: 'Villa Bamboo',
    checkInTime: '11:00',
    checkOutDate: '2026-07-10',
    nights: 6,
    guests: 3,
    totalAmount: 2520,
    currency: 'CHF',
  },
  {
    id: 'res-100',
    guestName: 'Emma Thompson',
    nationality: 'GB',
    listingName: 'Villa Oasis',
    checkInTime: '11:00',
    checkOutDate: '2026-07-10',
    nights: 4,
    guests: 2,
    totalAmount: 1680,
    currency: 'CHF',
  },
]

const CURRENT_GUESTS: MockReservation[] = [
  {
    id: 'res-098',
    guestName: 'Liam O\'Brien',
    nationality: 'IE',
    listingName: 'Villa Sunset',
    checkInTime: '15:00',
    checkOutDate: '2026-07-12',
    nights: 4,
    guests: 2,
    totalAmount: 1680,
    currency: 'CHF',
  },
  {
    id: 'res-097',
    guestName: 'Maria Garcia',
    nationality: 'ES',
    listingName: 'Villa Bamboo',
    checkInTime: '16:00',
    checkOutDate: '2026-07-13',
    nights: 5,
    guests: 3,
    totalAmount: 2100,
    currency: 'CHF',
  },
]

const REPEAT_GUESTS = [
  { name: 'Anna Schmidt', stays: 4, totalSpend: 9800, lastVisit: '2026-03-15' },
  { name: 'Hans Müller', stays: 3, totalSpend: 7560, lastVisit: '2026-05-20' },
  { name: 'Emma Thompson', stays: 2, totalSpend: 3360, lastVisit: '2026-06-01' },
]

const CLEANING_TODAY: MockCleaning[] = [
  {
    id: 'cln-201',
    listingName: 'Villa Bamboo',
    date: '2026-07-10',
    scheduledStart: '11:00',
    scheduledEnd: '14:00',
    housekeeper: 'Made Surya',
    type: 'checkout',
    status: 'in_progress',
  },
  {
    id: 'cln-202',
    listingName: 'Villa Oasis',
    date: '2026-07-10',
    scheduledStart: '11:30',
    scheduledEnd: '14:30',
    housekeeper: 'Wayan Sari',
    type: 'checkout',
    status: 'scheduled',
  },
  {
    id: 'cln-203',
    listingName: 'Villa Sunset',
    date: '2026-07-10',
    scheduledStart: '13:00',
    scheduledEnd: '15:00',
    housekeeper: 'Made Surya',
    type: 'standard',
    status: 'scheduled',
  },
]

const CLEANING_THIS_WEEK: MockCleaning[] = [
  ...CLEANING_TODAY,
  {
    id: 'cln-204',
    listingName: 'Villa Sunset',
    date: '2026-07-11',
    scheduledStart: '10:00',
    scheduledEnd: '13:00',
    housekeeper: 'Ketut Dewi',
    type: 'checkout',
    status: 'scheduled',
  },
  {
    id: 'cln-205',
    listingName: 'Villa Bamboo',
    date: '2026-07-12',
    scheduledStart: '11:00',
    scheduledEnd: '14:00',
    housekeeper: 'Made Surya',
    type: 'standard',
    status: 'scheduled',
  },
]

const LISTINGS: MockListing[] = [
  { id: 'lst-1', name: 'Villa Sunset', location: 'Canggu, Bali', bedrooms: 3, maxGuests: 6, isActive: true, basePricePerNight: 490, currency: 'CHF' },
  { id: 'lst-2', name: 'Villa Bamboo', location: 'Ubud, Bali', bedrooms: 2, maxGuests: 4, isActive: true, basePricePerNight: 380, currency: 'CHF' },
  { id: 'lst-3', name: 'Villa Oasis', location: 'Seminyak, Bali', bedrooms: 4, maxGuests: 8, isActive: true, basePricePerNight: 620, currency: 'CHF' },
  { id: 'lst-4', name: 'Villa Tropics', location: 'Canggu, Bali', bedrooms: 3, maxGuests: 6, isActive: true, basePricePerNight: 510, currency: 'CHF' },
  { id: 'lst-5', name: 'Villa Lotus', location: 'Ubud, Bali', bedrooms: 2, maxGuests: 4, isActive: false, basePricePerNight: 410, currency: 'CHF' },
]

const OPEN_TASKS: MockTask[] = [
  { id: 'tsk-301', title: 'Replace pool filter at Villa Sunset', listingName: 'Villa Sunset', priority: 'high', status: 'not_started', dueDate: '2026-07-10', assignedTo: 'Wayan Adi' },
  { id: 'tsk-302', title: 'Restock toiletries — all villas', listingName: 'All', priority: 'medium', status: 'in_progress', dueDate: '2026-07-11', assignedTo: 'Made Surya' },
  { id: 'tsk-303', title: 'Fix AC unit in Villa Bamboo master', listingName: 'Villa Bamboo', priority: 'high', status: 'in_progress', dueDate: '2026-07-10', assignedTo: 'Wayan Adi' },
]

const REVENUE_THIS_MONTH: MockRevenue = {
  totalRevenue: 48_750,
  currency: 'CHF',
  adr: 487,
  bookedNights: 100,
  reservationCount: 24,
}

const REVENUE_BY_LISTING = [
  { listingName: 'Villa Sunset', revenue: 14_700, adr: 525, nights: 28 },
  { listingName: 'Villa Bamboo', revenue: 9_120, adr: 380, nights: 24 },
  { listingName: 'Villa Oasis', revenue: 18_600, adr: 620, nights: 30 },
  { listingName: 'Villa Tropics', revenue: 6_330, adr: 510, nights: 18 },
]

const COSTS_THIS_MONTH = {
  totalCosts: 12_400,
  currency: 'CHF' as const,
  byCategory: {
    cleaning: 4_200,
    maintenance: 3_100,
    utilities: 2_800,
    consumables: 1_500,
    other: 800,
  },
}

const UPSELLS_THIS_MONTH = {
  totalRevenue: 3_840,
  currency: 'CHF' as const,
  count: 18,
  topCategory: 'Airport Transport',
}

const OCCUPANCY_THIS_MONTH = {
  overall: 67,                                      // percentage
  byListing: [
    { listingName: 'Villa Sunset', occupancy: 78 },
    { listingName: 'Villa Bamboo', occupancy: 65 },
    { listingName: 'Villa Oasis', occupancy: 82 },
    { listingName: 'Villa Tropics', occupancy: 55 },
  ],
}

// Query functions ----------------------------------------------------------

export function getUpcomingCheckins(when: string): MockReservation[] {
  if (when === 'tomorrow') return RESERVATIONS_TOMORROW
  return RESERVATIONS_TODAY
}

export function getUpcomingCheckouts(_when: string): MockReservation[] {
  return RESERVATIONS_CHECKOUTS_TODAY
}

export function getCurrentBookings(): MockReservation[] {
  return CURRENT_GUESTS
}

export function getRepeatGuests() {
  return REPEAT_GUESTS
}

export function getCleaningSchedule(when: string): MockCleaning[] {
  if (when === 'week') return CLEANING_THIS_WEEK
  return CLEANING_TODAY
}

export function getOpenTasks(): MockTask[] {
  return OPEN_TASKS
}

export function getListingsOverview(): MockListing[] {
  return LISTINGS
}

export function getOccupancy(when: string) {
  if (when === 'week') {
    return {
      overall: 71,
      byListing: OCCUPANCY_THIS_MONTH.byListing.map(l => ({ ...l, occupancy: l.occupancy + 4 })),
    }
  }
  return OCCUPANCY_THIS_MONTH
}

export function getRevenueSummary(_when: string): MockRevenue {
  return REVENUE_THIS_MONTH
}

export function getRevenueByListing() {
  return REVENUE_BY_LISTING
}

export function getCosts(_when: string) {
  return COSTS_THIS_MONTH
}

export function getUpsells(_when: string) {
  return UPSELLS_THIS_MONTH
}

// ---------------------------------------------------------------------------
// Findings detection
// ---------------------------------------------------------------------------
// "Findings" are anomalies the AI surfaces in the empty-state of the
// assistant panel — things a property manager should look at before the
// day starts (unverified guests, suspicious pricing, overlapping bookings).
// v1 runs over mock reservations; in v2 this would call the real database.

export type FindingType = 'unverified_guest' | 'impossible_rate' | 'double_booking'
export type FindingSeverity = 'warning' | 'critical'

export interface FindingDetail {
  label: string
  value: string
}

export interface Finding {
  id: string
  type: FindingType
  severity: FindingSeverity
  title: string
  description: string
  listingName: string
  reservationId?: string
  /** Short sentence explaining why this was flagged. */
  reason: string
  /** Key/value data the user can scan to verify the anomaly. */
  details: FindingDetail[]
  /** Pre-built follow-up prompt the user can send to investigate. */
  prompt: string
}

const UPCOMING_RESERVATIONS: MockReservation[] = [
  ...RESERVATIONS_TODAY,
  ...RESERVATIONS_TOMORROW,
  ...CURRENT_GUESTS,
]

/** Compute the check-in date for a reservation (YYYY-MM-DD). */
function getCheckinDate(r: MockReservation): string {
  const d = new Date(r.checkOutDate)
  d.setDate(d.getDate() - r.nights)
  return d.toISOString().slice(0, 10)
}

export function getFindings(): Finding[] {
  const findings: Finding[] = []

  // 1) Unverified guests on upcoming check-ins.
  for (const r of [...RESERVATIONS_TODAY, ...RESERVATIONS_TOMORROW]) {
    if (r.verified === false) {
      const when = RESERVATIONS_TODAY.includes(r) ? 'today' : 'tomorrow'
      const checkinDate = getCheckinDate(r)
      findings.push({
        id: `finding-unverified-${r.id}`,
        type: 'unverified_guest',
        severity: 'warning',
        title: `${r.guestName} isn't verified yet`,
        description: `Check-in ${when} at ${r.listingName}, ${r.guests} guest${r.guests > 1 ? 's' : ''}`,
        listingName: r.listingName,
        reservationId: r.id,
        reason: `${r.guestName} hasn't completed online check-in or submitted ID for ${r.nationality} passport verification.`,
        details: [
          { label: 'Listing', value: r.listingName },
          { label: 'Check-in', value: `${checkinDate} · ${r.checkInTime}` },
          { label: 'Nights', value: String(r.nights) },
          { label: 'Guests', value: String(r.guests) },
          { label: 'Total', value: `${r.totalAmount.toLocaleString('de-CH')} ${r.currency}` },
          { label: 'Nationality', value: r.nationality },
        ],
        prompt: `Which guests arriving today haven't been verified?`,
      })
    }
  }

  // 2) Impossible rate — per-night total far from the listing's base price.
  for (const r of UPCOMING_RESERVATIONS) {
    const listing = LISTINGS.find(l => l.name === r.listingName)
    if (!listing) continue
    const ratePerNight = r.totalAmount / r.nights
    const base = listing.basePricePerNight
    if (ratePerNight < base * 0.5 || ratePerNight > base * 2) {
      const deviationPct = Math.round(((ratePerNight - base) / base) * 100)
      const direction = deviationPct > 0 ? `+${deviationPct}%` : `${deviationPct}%`
      findings.push({
        id: `finding-rate-${r.id}`,
        type: 'impossible_rate',
        severity: 'critical',
        title: `Unusual rate for ${r.guestName}`,
        description: `${r.totalAmount} CHF / ${r.nights} nights at ${r.listingName} (base ${base} CHF/night)`,
        listingName: r.listingName,
        reservationId: r.id,
        reason: `Booked rate (${Math.round(ratePerNight)} CHF/night) deviates ${direction} from listing base (${base} CHF/night). Likely a data-entry error or stale rate.`,
        details: [
          { label: 'Booked rate', value: `${Math.round(ratePerNight)} CHF/night` },
          { label: 'Listing base', value: `${base} CHF/night` },
          { label: 'Deviation', value: direction },
          { label: 'Total', value: `${r.totalAmount.toLocaleString('de-CH')} ${r.currency}` },
          { label: 'Nights', value: String(r.nights) },
          { label: 'Check-in', value: `${getCheckinDate(r)} · ${r.checkInTime}` },
        ],
        prompt: `Show revenue by listing`,
      })
    }
  }

  // 3) Double booking — overlapping date ranges at the same listing.
  const byListing = new Map<string, MockReservation[]>()
  for (const r of UPCOMING_RESERVATIONS) {
    const arr = byListing.get(r.listingName) ?? []
    arr.push(r)
    byListing.set(r.listingName, arr)
  }
  for (const [listingName, reservations] of byListing) {
    for (let i = 0; i < reservations.length; i++) {
      for (let j = i + 1; j < reservations.length; j++) {
        const a = reservations[i]!
        const b = reservations[j]!
        const aStart = getCheckinDate(a)
        const aEnd = a.checkOutDate
        const bStart = getCheckinDate(b)
        const bEnd = b.checkOutDate
        // Inclusive start, exclusive end (industry standard for stay dates).
        if (aStart < bEnd && bStart < aEnd) {
          findings.push({
            id: `finding-double-${a.id}-${b.id}`,
            type: 'double_booking',
            severity: 'critical',
            title: `Overlapping bookings at ${listingName}`,
            description: `${a.guestName} (until ${aEnd}) and ${b.guestName} (from ${bStart})`,
            listingName,
            reservationId: a.id,
            reason: `Both reservations overlap on ${bStart} → ${aEnd}. Only one guest can occupy the property at a time.`,
            details: [
              { label: `${a.guestName} · ${a.id}`, value: `${aStart} → ${aEnd} (${a.nights} nights, ${a.totalAmount} CHF)` },
              { label: `${b.guestName} · ${b.id}`, value: `${bStart} → ${bEnd} (${b.nights} nights, ${b.totalAmount} CHF)` },
              { label: 'Overlap', value: `${bStart} → ${aEnd}` },
              { label: 'Listing', value: listingName },
            ],
            prompt: `Show today's check-ins`,
          })
        }
      }
    }
  }

  return findings
}