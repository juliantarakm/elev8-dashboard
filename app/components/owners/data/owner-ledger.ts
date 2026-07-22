// Owner ledger — the rolled-up monthly financial record per (owner, listing,
// period). This is the source of truth that owner statements are generated
// from. One entry per period so the dashboard can render a monthly chart.
//
// Each entry carries all the inputs the owner dashboard needs to render
// gross/net revenue, occupancy, ADR, booking sources, ratings and upcoming
// reservations, plus a prior-period adjustment for the new fixture requirement.

export type OwnerLedgerSource = 'airbnb' | 'booking_com' | 'direct' | 'agoda' | 'vrbo' | 'expedia'

export interface OwnerLedgerSourceBreakdown {
  source: OwnerLedgerSource
  revenue: number
  reservations: number
  nights: number
}

export interface OwnerLedgerUpcomingReservation {
  id: string
  guestName: string
  checkIn: string
  checkOut: string
  nights: number
  source: OwnerLedgerSource
  totalAmount: number
}

export interface OwnerLedgerEntry {
  id: string
  ownerId: string
  listingId: string
  /** YYYY-MM period this entry covers. */
  period: string
  currency: string
  grossRevenue: number
  expenses: number
  taxes: number
  platformFees: number
  sources: OwnerLedgerSourceBreakdown[]
  occupiedNights: number
  availableNights: number
  /** Sum of reservation nightly rates during the period (avg daily rate input). */
  nightlyRateSum: number
  /** Number of reservations that contributed to `nightlyRateSum`. */
  reservationCount: number
  averageRating: number
  ratingsCount: number
  upcomingReservations: OwnerLedgerUpcomingReservation[]
  /** True when this entry is a correction to a prior period (e.g. retroactive platform fee change). */
  isPriorPeriodAdjustment: boolean
  /** Required when isPriorPeriodAdjustment is true — the period being corrected. */
  adjustsPeriod?: string
  adjustmentReason?: string
  createdAt: string
  updatedAt: string
}

// --- Pure statement calculation helpers -------------------------------------
//
// A statement is built from a `StatementInput` — the five signed magnitudes a
// payout is derived from. Expenses/commission/taxes are supplied as positive
// magnitudes (they are subtracted); adjustments are signed (added as-is).

export interface StatementInput {
  grossRevenue: number
  operatingExpenses: number
  commission: number
  taxesAndFees: number
  adjustments: number
}

export interface StatementTotals extends StatementInput {
  /** grossRevenue − operatingExpenses − commission − taxesAndFees + adjustments. */
  netPayout: number
}

/** Round a currency amount to two decimals at the domain boundary. */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Scale every property amount by an ownership share (e.g. 0.4 for a 40% co-owner)
 * before rolling up owner totals. Rounds each field at the domain boundary.
 */
export function applyOwnershipShare(input: StatementInput, share: number): StatementInput {
  return {
    grossRevenue: roundCurrency(input.grossRevenue * share),
    operatingExpenses: roundCurrency(input.operatingExpenses * share),
    commission: roundCurrency(input.commission * share),
    taxesAndFees: roundCurrency(input.taxesAndFees * share),
    adjustments: roundCurrency(input.adjustments * share),
  }
}

/** Compute the net payout from a statement input, rounding at the boundary. */
export function calculateStatementTotals(input: StatementInput): StatementTotals {
  return {
    grossRevenue: roundCurrency(input.grossRevenue),
    operatingExpenses: roundCurrency(input.operatingExpenses),
    commission: roundCurrency(input.commission),
    taxesAndFees: roundCurrency(input.taxesAndFees),
    adjustments: roundCurrency(input.adjustments),
    netPayout: roundCurrency(
      input.grossRevenue
      - input.operatingExpenses
      - input.commission
      - input.taxesAndFees
      + input.adjustments,
    ),
  }
}

/**
 * Convert a ledger entry into a statement input. The commission is supplied by
 * the caller (via `calculateCommission`), and any prior-period `adjustments`
 * default to zero. Taxes and platform fees are combined into `taxesAndFees`.
 */
export function ledgerEntryToStatementInput(
  entry: OwnerLedgerEntry,
  commission: number,
  adjustments = 0,
): StatementInput {
  return {
    grossRevenue: entry.grossRevenue,
    operatingExpenses: entry.expenses,
    commission,
    taxesAndFees: entry.taxes + entry.platformFees,
    adjustments,
  }
}

// --- Seed fixtures ----------------------------------------------------------

export const mockOwnerLedgerEntries: OwnerLedgerEntry[] = [
  // Wayan — lst-1, June 2026 (current period, mirrored in the draft statement).
  {
    id: 'led-1',
    ownerId: 'own-1',
    listingId: 'lst-1',
    period: '2026-06',
    currency: 'IDR',
    grossRevenue: 38_500_000,
    expenses: 3_500_000,
    taxes: 1_925_000,
    platformFees: 2_310_000,
    sources: [
      { source: 'airbnb', revenue: 24_200_000, reservations: 4, nights: 18 },
      { source: 'booking_com', revenue: 14_300_000, reservations: 2, nights: 9 },
    ],
    occupiedNights: 27,
    availableNights: 30,
    nightlyRateSum: 38_500_000,
    reservationCount: 6,
    averageRating: 4.7,
    ratingsCount: 5,
    upcomingReservations: [
      { id: 'up-1', guestName: 'Hiroshi Tanaka', checkIn: '2026-07-08', checkOut: '2026-07-12', nights: 4, source: 'airbnb', totalAmount: 7_400_000 },
      { id: 'up-2', guestName: 'Sophie Laurent', checkIn: '2026-07-15', checkOut: '2026-07-19', nights: 4, source: 'booking_com', totalAmount: 6_800_000 },
    ],
    isPriorPeriodAdjustment: false,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-07-01T08:00:00.000Z',
  },
  // Wayan — lst-1, May 2026 (closed period).
  {
    id: 'led-2',
    ownerId: 'own-1',
    listingId: 'lst-1',
    period: '2026-05',
    currency: 'IDR',
    grossRevenue: 42_000_000,
    expenses: 3_800_000,
    taxes: 2_100_000,
    platformFees: 2_520_000,
    sources: [
      { source: 'airbnb', revenue: 27_500_000, reservations: 5, nights: 22 },
      { source: 'direct', revenue: 14_500_000, reservations: 1, nights: 5 },
    ],
    occupiedNights: 27,
    availableNights: 31,
    nightlyRateSum: 42_000_000,
    reservationCount: 6,
    averageRating: 4.8,
    ratingsCount: 6,
    upcomingReservations: [],
    isPriorPeriodAdjustment: false,
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-02T08:00:00.000Z',
  },
  // I Putu — lst-8, June 2026.
  {
    id: 'led-3',
    ownerId: 'own-2',
    listingId: 'lst-8',
    period: '2026-06',
    currency: 'USD',
    grossRevenue: 9_400,
    expenses: 320,
    taxes: 470,
    platformFees: 564,
    sources: [
      { source: 'booking_com', revenue: 6_400, reservations: 4, nights: 18 },
      { source: 'airbnb', revenue: 3_000, reservations: 2, nights: 10 },
    ],
    occupiedNights: 28,
    availableNights: 30,
    nightlyRateSum: 9_400,
    reservationCount: 6,
    averageRating: 4.6,
    ratingsCount: 5,
    upcomingReservations: [
      { id: 'up-3', guestName: 'Emily Carter', checkIn: '2026-07-04', checkOut: '2026-07-08', nights: 4, source: 'booking_com', totalAmount: 1_360 },
    ],
    isPriorPeriodAdjustment: false,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-07-01T08:00:00.000Z',
  },
  // I Putu — lst-3, June 2026 (50% co-owner share, IDR — same listing/period as led-5).
  {
    id: 'led-4',
    ownerId: 'own-2',
    listingId: 'lst-3',
    period: '2026-06',
    currency: 'IDR',
    grossRevenue: 110_000_000,
    expenses: 2_900_000,
    taxes: 5_500_000,
    platformFees: 6_600_000,
    sources: [
      { source: 'airbnb', revenue: 68_000_000, reservations: 3, nights: 13 },
      { source: 'booking_com', revenue: 42_000_000, reservations: 2, nights: 8 },
    ],
    occupiedNights: 21,
    availableNights: 30,
    nightlyRateSum: 110_000_000,
    reservationCount: 5,
    averageRating: 4.9,
    ratingsCount: 4,
    upcomingReservations: [
      { id: 'up-4', guestName: 'Daniel Park', checkIn: '2026-07-22', checkOut: '2026-07-26', nights: 4, source: 'airbnb', totalAmount: 24_000_000 },
    ],
    isPriorPeriodAdjustment: false,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-07-01T08:00:00.000Z',
  },
  // Ni Kadek — lst-3, June 2026 (50% co-owner share, IDR — identical underlying numbers as led-4).
  {
    id: 'led-5',
    ownerId: 'own-3',
    listingId: 'lst-3',
    period: '2026-06',
    currency: 'IDR',
    grossRevenue: 110_000_000,
    expenses: 2_900_000,
    taxes: 5_500_000,
    platformFees: 6_600_000,
    sources: [
      { source: 'airbnb', revenue: 68_000_000, reservations: 3, nights: 13 },
      { source: 'booking_com', revenue: 42_000_000, reservations: 2, nights: 8 },
    ],
    occupiedNights: 21,
    availableNights: 30,
    nightlyRateSum: 110_000_000,
    reservationCount: 5,
    averageRating: 4.9,
    ratingsCount: 4,
    upcomingReservations: [
      { id: 'up-4', guestName: 'Daniel Park', checkIn: '2026-07-22', checkOut: '2026-07-26', nights: 4, source: 'airbnb', totalAmount: 24_000_000 },
    ],
    isPriorPeriodAdjustment: false,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-07-01T08:00:00.000Z',
  },
  // Prior-period adjustment — Wayan's April 2026 platform fee was understated by 180k IDR.
  // Pure platform-fee correction: grossRevenue untouched, platformFees +180,000 to recover
  // the missed Airbnb host fee. The adjustmentReason + adjustsPeriod fields make the
  // correction intent explicit for downstream UI/auditing.
  {
    id: 'led-6',
    ownerId: 'own-1',
    listingId: 'lst-1',
    period: '2026-04',
    currency: 'IDR',
    grossRevenue: 0,
    expenses: 0,
    taxes: 0,
    platformFees: 180_000,
    sources: [],
    occupiedNights: 0,
    availableNights: 0,
    nightlyRateSum: 0,
    reservationCount: 0,
    averageRating: 0,
    ratingsCount: 0,
    upcomingReservations: [],
    isPriorPeriodAdjustment: true,
    adjustsPeriod: '2026-04',
    adjustmentReason: 'Platform-fee correction — +180,000 IDR Airbnb host fee understated in April statement; correction added to platformFees, grossRevenue untouched.',
    createdAt: '2026-06-12T08:00:00.000Z',
    updatedAt: '2026-06-12T08:00:00.000Z',
  },
]
