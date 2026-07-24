// Owner-portal reservation data.
//
// Distinct from owner stays: these are the public-facing reservations
// guests book through any channel (read-only here) plus the owner's own
// personal-use blocks (read-write).

export type OwnerReservationType = 'guest' | 'owner_block'

export type OwnerReservationChannel = 'airbnb' | 'booking' | 'direct' | 'vrbo'

export type OwnerReservationStatus = 'confirmed' | 'pending' | 'cancelled'

export interface OwnerReservation {
  id: string
  type: OwnerReservationType
  listingId: string
  /** ISO date `YYYY-MM-DD` (check-in night, inclusive). */
  checkIn: string
  /** ISO date `YYYY-MM-DD` (check-out day, exclusive). */
  checkOut: string
  /** Guest bookings: visible channel + guest name. */
  guestName?: string
  channel?: OwnerReservationChannel
  /** Owner blocks: free-text label. */
  note?: string
  status: OwnerReservationStatus
}

export interface OwnerReservationDay {
  key: string
  date: Date
  weekday: string
  inMonth: boolean
  isToday: boolean
}

export interface OwnerReservationBar {
  id: string
  type: OwnerReservationType
  listingId: string
  guestName?: string
  channel?: OwnerReservationChannel
  note?: string
  status: OwnerReservationStatus
  startDay: number
  endDay: number
  /** 1-based row index inside the listing's mini-grid (multi-row allowed for overlap). */
  row: number
  /** Indicates the bar's first segment wraps onto the previous/next week. */
  wrapsForward: boolean
  wrapsBackward: boolean
}
