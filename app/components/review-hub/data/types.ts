// Review Hub - Type Definitions

// --- Review Source (Channel) ---
export type ReviewSource = 'airbnb' | 'booking_com' | 'direct'

// --- Reply Status (for ReviewRecord) ---
export type ReplyStatus = 'needs_reply' | 'replied'

// --- Guest Rating Categories ---
export interface GuestRatingCategories {
  cleanliness: number
  communication: number
  check_in: number
  accuracy: number
  location: number
  value: number
}

// Booking.com uses 1-10 scale with these categories
export interface BookingComRatingCategories {
  value: number | null
  clean: number | null
  location: number | null
  comfort: number | null
  facilities: number | null
  staff: number | null
  wifi?: number | null
}

// --- ReviewRecord (guest reviews from all channels) ---
export interface ReviewRecord {
  id: string
  reservation_id: string
  source: ReviewSource
  listing_id: string
  listing_name: string
  listing_location: string
  unit_id: string | null
  guest_name: string
  num_guests: number
  nights: number
  guest_rating_overall: number | null
  guest_rating_max: number | null // e.g. 5 for Airbnb, 10 for Booking.com
  guest_rating_categories: Partial<GuestRatingCategories> | Partial<BookingComRatingCategories>
  guest_review_text: string | null
  private_feedback: string | null
  review_received_at: string | null
  language_detected: string | null
  reply_status: ReplyStatus
  reply_text: string | null
  reply_posted_at: string | null
  host_review_id: string | null
  sor_id: string | null
  checkout_date: string
  created_at: string
  updated_at: string
}

// --- Stay Operational Record ---
export type BadgeLevel = 'green' | 'amber' | 'red'

export interface StayOperationalRecord {
  id: string
  reservation_id: string
  listing_id: string
  cleaning_score: number | null
  cleaning_notes: string | null
  cleaning_duration_delta: number | null
  house_rule_flags: HouseRuleFlag[]
  communication_score: number | null
  communication_summary: string | null
  computed_at: string
}

export interface HouseRuleFlag {
  id: string
  reservation_id: string
  type: 'extra_guest' | 'unregistered_pet' | 'smoking' | 'noise' | 'damage' | 'early_late_unapproved' | 'other'
  severity: 'low' | 'medium' | 'high'
  evidence_url: string | null
  reported_by: 'housekeeping' | 'pm' | 'smart_lock_log' | 'guest_inbox'
  reported_at: string
  resolution_status: 'open' | 'resolved_onsite' | 'disputed'
}

// --- Unified Feed Item ---
export interface ReviewFeedItem {
  id: string
  review_record: ReviewRecord
  sor: StayOperationalRecord | null
  host_review: any | null
}

// --- Badge Level Helpers ---
export function getCleaningBadgeLevel(score: number | null): BadgeLevel | null {
  if (score === null) return null
  if (score >= 4) return 'green'
  if (score >= 3) return 'amber'
  return 'red'
}

export function getHouseRulesBadgeLevel(flags: HouseRuleFlag[]): BadgeLevel {
  if (flags.length === 0) return 'green'
  const hasHigh = flags.some(f => f.severity === 'high')
  if (hasHigh) return 'red'
  const hasMedium = flags.some(f => f.severity === 'medium')
  if (hasMedium) return 'amber'
  return 'amber'
}

export function getCommunicationBadgeLevel(score: number | null): BadgeLevel | null {
  if (score === null) return null
  if (score >= 4) return 'green'
  if (score >= 3) return 'amber'
  return 'red'
}

// --- Badge Level Colors ---
export const badgeLevelColors: Record<BadgeLevel, { bg: string, text: string, border: string }> = {
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
}

// --- Reply Status Labels ---
export const replyStatusLabels: Record<ReplyStatus, string> = {
  needs_reply: 'Needs Reply',
  replied: 'Replied',
}

// --- Reply Status Icons ---
export const replyStatusIcons: Record<ReplyStatus, string> = {
  needs_reply: 'lucide:message-circle',
  replied: 'lucide:check-circle-2',
}

// --- Reply Status Colors ---
export const replyStatusColors: Record<ReplyStatus, { bg: string, text: string }> = {
  needs_reply: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  replied: { bg: 'bg-green-50', text: 'text-green-700' },
}

// --- Channel Labels ---
export const channelLabels: Record<ReviewSource, string> = {
  airbnb: 'Airbnb',
  booking_com: 'Booking.com',
  direct: 'Direct',
}

// --- Channel Icons ---
export const channelIcons: Record<ReviewSource, string> = {
  airbnb: 'logos:airbnb',
  booking_com: 'simple-icons:bookingdotcom',
  direct: 'lucide:globe',
}
