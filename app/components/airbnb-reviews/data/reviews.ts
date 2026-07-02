export type ReviewStatus = 'pending' | 'generating' | 'draft' | 'posted' | 'failed'
export type ToneMode = 'balanced' | 'gentle' | 'data-driven'
export type HostLanguage = 'en' | 'de' | 'fr' | 'id' | 'es' | 'it' | 'pt'

export interface ReviewRatings {
  cleanliness: number
  communication: number
  house_rules: number
}

export interface AutoReview {
  id: string
  booking_id: string
  property_id: string
  tenant_id: string
  guest_name: string
  checkout_date: string
  listing_name: string
  listing_location: string
  num_guests: number
  nights: number

  // Generation
  status: ReviewStatus
  generated_at: string | null
  ai_model: string
  generation_cost: number | null

  // Settings used
  host_language: HostLanguage
  strict_mode: boolean
  tone_mode: ToneMode

  // Generated content
  public_review: string | null
  private_feedback: string | null
  ratings: ReviewRatings | null
  recommend_guest: boolean | null
  would_host_again: boolean | null

  // Editing
  manually_edited: boolean
  edited_at: string | null

  // Airbnb
  airbnb_review_id: string | null
  posted_to_airbnb_at: string | null

  // Audit
  created_at: string
  updated_at: string
}

export interface ReviewAutomationConfig {
  enabled: boolean
  host_language: HostLanguage
  tone_mode: ToneMode
  strict_mode: boolean
  auto_post: boolean
  review_delay_hours: number
}

export const defaultConfig: ReviewAutomationConfig = {
  enabled: false,
  host_language: 'en',
  tone_mode: 'balanced',
  strict_mode: false,
  auto_post: false,
  review_delay_hours: 24,
}

export const hostLanguageOptions: { value: HostLanguage, label: string, flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'de', label: 'German', flag: '🇩🇪' },
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'id', label: 'Indonesian', flag: '🇮🇩' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'it', label: 'Italian', flag: '🇮🇹' },
  { value: 'pt', label: 'Portuguese', flag: '🇵🇹' },
]

export const toneModeOptions: { value: ToneMode, label: string, description: string, icon: string }[] = [
  { value: 'balanced', label: 'Balanced', description: 'Honest and factual reviews', icon: 'lucide:scale' },
  { value: 'gentle', label: 'Gentle', description: 'Softer, more diplomatic phrasing', icon: 'lucide:heart' },
  { value: 'data-driven', label: 'Data-Driven', description: 'Focus on measurable facts only', icon: 'lucide:bar-chart-3' },
]

export const statusLabels: Record<ReviewStatus, string> = {
  pending: 'Pending',
  generating: 'Generating',
  draft: 'Draft',
  posted: 'Posted',
  failed: 'Failed',
}

export const statusVariants: Record<ReviewStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  generating: 'secondary',
  draft: 'default',
  posted: 'default',
  failed: 'destructive',
}

export const statusIcons: Record<ReviewStatus, string> = {
  pending: 'lucide:clock',
  generating: 'lucide:loader-circle',
  draft: 'lucide:file-edit',
  posted: 'lucide:check-circle-2',
  failed: 'lucide:alert-circle',
}

const now = Date.now()
const hour = 3600000
const day = 86400000

export const mockReviews: AutoReview[] = [
  {
    id: 'rev-001',
    booking_id: 'res-001',
    property_id: 'listing-villa-1',
    tenant_id: 'tenant-1',
    guest_name: 'Sarah Chen',
    checkout_date: new Date(now - 2 * day).toISOString().slice(0, 10),
    listing_name: 'Villa Kayu',
    listing_location: 'Seminyak, Bali',
    num_guests: 2,
    nights: 3,
    status: 'posted',
    generated_at: new Date(now - 2 * day + 24 * hour).toISOString(),
    ai_model: 'gpt-4-turbo',
    generation_cost: 0.0032,
    host_language: 'en',
    strict_mode: false,
    tone_mode: 'balanced',
    public_review: 'Sarah was a wonderful guest! She communicated clearly, arrived on time, and left the property in excellent condition. The housekeeping team noted how tidy everything was - a true pleasure to host. We\'d happily welcome Sarah back anytime!',
    private_feedback: 'No concerns. Excellent guest in all aspects. Minor note: requested early check-in but was very understanding when we explained availability.',
    ratings: { cleanliness: 5, communication: 5, house_rules: 5 },
    recommend_guest: true,
    would_host_again: true,
    manually_edited: false,
    edited_at: null,
    airbnb_review_id: 'airbnb-rev-98234',
    posted_to_airbnb_at: new Date(now - 2 * day + 24 * hour + 60000).toISOString(),
    created_at: new Date(now - 2 * day).toISOString(),
    updated_at: new Date(now - 2 * day + 24 * hour + 60000).toISOString(),
  },
  {
    id: 'rev-002',
    booking_id: 'res-002',
    property_id: 'listing-villa-2',
    tenant_id: 'tenant-1',
    guest_name: 'Thomas Mueller',
    checkout_date: new Date(now - 1 * day).toISOString().slice(0, 10),
    listing_name: 'Villa Cendana',
    listing_location: 'Canggu, Bali',
    num_guests: 4,
    nights: 5,
    status: 'draft',
    generated_at: new Date(now - 12 * hour).toISOString(),
    ai_model: 'gpt-4-turbo',
    generation_cost: 0.0041,
    host_language: 'en',
    strict_mode: false,
    tone_mode: 'balanced',
    public_review: 'Thomas and his group were respectful guests who enjoyed their stay at Villa Cendana. Communication was prompt and clear. The property was left in good condition overall, with minor items that the housekeeping team addressed quickly. We appreciate their stay and hope they enjoyed Bali!',
    private_feedback: 'Guests left some dishes in the sink and one towel on the pool deck. Minor issues, but overall a positive experience. One guest was slightly noisy past 10pm on two evenings - no formal complaints received but worth noting.',
    ratings: { cleanliness: 4, communication: 5, house_rules: 4 },
    recommend_guest: true,
    would_host_again: true,
    manually_edited: false,
    edited_at: null,
    airbnb_review_id: null,
    posted_to_airbnb_at: null,
    created_at: new Date(now - 1 * day).toISOString(),
    updated_at: new Date(now - 12 * hour).toISOString(),
  },
  {
    id: 'rev-003',
    booking_id: 'res-003',
    property_id: 'listing-villa-3',
    tenant_id: 'tenant-1',
    guest_name: 'Lisa Wang',
    checkout_date: new Date(now - 1 * day).toISOString().slice(0, 10),
    listing_name: 'Villa Sari',
    listing_location: 'Ubud, Bali',
    num_guests: 2,
    nights: 7,
    status: 'draft',
    generated_at: new Date(now - 6 * hour).toISOString(),
    ai_model: 'gpt-4-turbo',
    generation_cost: 0.0038,
    host_language: 'en',
    strict_mode: false,
    tone_mode: 'balanced',
    public_review: 'Lisa was a delightful guest during her week-long stay at Villa Sari. She took wonderful care of the property and left it in pristine condition. Communication was excellent throughout, and she followed all house rules perfectly. Highly recommend hosting Lisa!',
    private_feedback: 'Absolutely no issues. One of the best guests we have hosted. Very respectful of the property and neighbors. Left a nice handwritten thank-you note.',
    ratings: { cleanliness: 5, communication: 5, house_rules: 5 },
    recommend_guest: true,
    would_host_again: true,
    manually_edited: false,
    edited_at: null,
    airbnb_review_id: null,
    posted_to_airbnb_at: null,
    created_at: new Date(now - 1 * day).toISOString(),
    updated_at: new Date(now - 6 * hour).toISOString(),
  },
  {
    id: 'rev-004',
    booking_id: 'res-004',
    property_id: 'listing-villa-1',
    tenant_id: 'tenant-1',
    guest_name: 'James Richardson',
    checkout_date: new Date().toISOString().slice(0, 10),
    listing_name: 'Villa Kayu',
    listing_location: 'Seminyak, Bali',
    num_guests: 3,
    nights: 2,
    status: 'pending',
    generated_at: null,
    ai_model: 'gpt-4-turbo',
    generation_cost: null,
    host_language: 'en',
    strict_mode: false,
    tone_mode: 'balanced',
    public_review: null,
    private_feedback: null,
    ratings: null,
    recommend_guest: null,
    would_host_again: null,
    manually_edited: false,
    edited_at: null,
    airbnb_review_id: null,
    posted_to_airbnb_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rev-005',
    booking_id: 'res-005',
    property_id: 'listing-villa-2',
    tenant_id: 'tenant-1',
    guest_name: 'Elena Kowalski',
    checkout_date: new Date(now - 5 * day).toISOString().slice(0, 10),
    listing_name: 'Villa Cendana',
    listing_location: 'Canggu, Bali',
    num_guests: 1,
    nights: 4,
    status: 'failed',
    generated_at: null,
    ai_model: 'gpt-4-turbo',
    generation_cost: null,
    host_language: 'en',
    strict_mode: false,
    tone_mode: 'balanced',
    public_review: null,
    private_feedback: null,
    ratings: null,
    recommend_guest: null,
    would_host_again: null,
    manually_edited: false,
    edited_at: null,
    airbnb_review_id: null,
    posted_to_airbnb_at: null,
    created_at: new Date(now - 5 * day).toISOString(),
    updated_at: new Date(now - 5 * day + 24 * hour).toISOString(),
  },
  {
    id: 'rev-006',
    booking_id: 'res-006',
    property_id: 'listing-villa-1',
    tenant_id: 'tenant-1',
    guest_name: 'Marco Rossi',
    checkout_date: new Date(now - 3 * day).toISOString().slice(0, 10),
    listing_name: 'Villa Kayu',
    listing_location: 'Seminyak, Bali',
    num_guests: 2,
    nights: 6,
    status: 'posted',
    generated_at: new Date(now - 3 * day + 24 * hour).toISOString(),
    ai_model: 'gpt-4-turbo',
    generation_cost: 0.0035,
    host_language: 'en',
    strict_mode: false,
    tone_mode: 'balanced',
    public_review: 'Marco and his partner were excellent guests at Villa Kayu. They were communicative, respectful of the property, and left everything in great order. The housekeeping team confirmed the villa was well-maintained during their week-long stay. Happy to recommend Marco to other hosts!',
    private_feedback: 'No issues at all. Great guests who clearly respect vacation rentals. They even folded the towels before checkout.',
    ratings: { cleanliness: 5, communication: 5, house_rules: 5 },
    recommend_guest: true,
    would_host_again: true,
    manually_edited: true,
    edited_at: new Date(now - 3 * day + 25 * hour).toISOString(),
    airbnb_review_id: 'airbnb-rev-10421',
    posted_to_airbnb_at: new Date(now - 3 * day + 25 * hour + 60000).toISOString(),
    created_at: new Date(now - 3 * day).toISOString(),
    updated_at: new Date(now - 3 * day + 25 * hour + 60000).toISOString(),
  },
]
