import type { AutoReview } from '~/components/airbnb-reviews/data/reviews'
import type { ReplyStatus, ReviewFeedItem, ReviewRecord, ReviewSource, StayOperationalRecord } from '~/components/review-hub/data/types'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { mockReviewRecords } from '~/components/review-hub/data/mock-review-records'
import { mockSorRecords } from '~/components/review-hub/data/mock-sor'
import { useAirbnbReviews } from '~/composables/useAirbnbReviews'

export type HubFilterStatus = 'all' | ReplyStatus
export type HubFilterChannel = 'all' | ReviewSource

export function useReviewHub() {
  const reviewRecords = useState<ReviewRecord[]>('review-hub-records', () => JSON.parse(JSON.stringify(mockReviewRecords)))
  const sorRecords = useState<StayOperationalRecord[]>('review-hub-sor', () => JSON.parse(JSON.stringify(mockSorRecords)))

  const { reviews: hostReviews, generateReview, approveReview: approveHostReview } = useAirbnbReviews()

  // Filters
  const searchQuery = ref('')
  const filterStatus = ref<HubFilterStatus>('all')
  const filterChannel = ref<HubFilterChannel>('all')
  const filterListing = ref<string[]>([])
  const filterRating = ref<number | null>(null)

  // Unique listings from review records
  const uniqueListings = computed(() => {
    const map = new Map<string, string>()
    reviewRecords.value.forEach(r => map.set(r.listing_id, r.listing_name))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  })

  // Merge into feed items
  const feedItems = computed<ReviewFeedItem[]>(() => {
    return reviewRecords.value.map((record) => {
      const sor = sorRecords.value.find(s => s.reservation_id === record.reservation_id) ?? null
      const hostReview = hostReviews.value.find((r: AutoReview) => r.reservation_id === record.reservation_id) ?? null
      return {
        id: record.id,
        review_record: record,
        sor,
        host_review: hostReview,
      }
    })
  })

  // Filtered feed items
  const filteredFeedItems = computed(() => {
    return feedItems.value.filter((item) => {
      const r = item.review_record

      if (filterStatus.value !== 'all' && r.reply_status !== filterStatus.value)
        return false
      if (filterChannel.value !== 'all' && r.source !== filterChannel.value)
        return false
      if (filterListing.value.length > 0 && !filterListing.value.includes('All Properties') && !filterListing.value.includes(r.listing_name))
        return false
      if (filterRating.value !== null && r.guest_rating_overall !== null) {
        const normalizedRating = r.guest_rating_max === 10 ? r.guest_rating_overall / 2 : r.guest_rating_overall
        if (normalizedRating < filterRating.value)
          return false
      }
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase()
        if (!r.guest_name.toLowerCase().includes(q) && !r.listing_name.toLowerCase().includes(q))
          return false
      }
      return true
    }).sort((a, b) => new Date(b.review_record.checkout_date).getTime() - new Date(a.review_record.checkout_date).getTime())
  })

  // Stats
  const hubStats = computed(() => ({
    needs_reply: reviewRecords.value.filter(r => r.reply_status === 'needs_reply').length,
    replied: reviewRecords.value.filter(r => r.reply_status === 'replied').length,
    total: reviewRecords.value.length,
  }))

  // Update a review record
  function updateReviewRecord(id: string, patch: Partial<ReviewRecord>) {
    reviewRecords.value = reviewRecords.value.map(r =>
      r.id === id ? { ...r, ...patch, updated_at: new Date().toISOString() } : r,
    )
  }

  // Generate AI reply draft (mock)
  async function generateReplyDraft(recordId: string): Promise<string> {
    const record = reviewRecords.value.find(r => r.id === recordId)
    if (!record) return ''

    await new Promise(resolve => setTimeout(resolve, 1500))

    const firstName = record.guest_name.split(' ')[0]
    const sor = sorRecords.value.find(s => s.reservation_id === record.reservation_id)

    const positiveReplies = [
      `Thank you so much for your wonderful review, ${firstName}! We are thrilled to hear you enjoyed your stay. Our team works hard to maintain the property, and it means a lot when guests appreciate it. We hope to welcome you back soon!`,
      `${firstName}, thank you for taking the time to leave such a kind review! We are delighted that you had a great experience. Your feedback about our communication and the property condition really made our day. Looking forward to hosting you again!`,
      `We truly appreciate your feedback, ${firstName}! It was a pleasure hosting you. We are glad the property met your expectations and that our team could assist during your stay. Hope to see you again soon!`,
    ]

    const mixedReplies = [
      `Thank you for your honest feedback, ${firstName}. We appreciate you taking the time to share your experience. We have noted your comments and will work on the areas you mentioned. We hope to have the opportunity to host you again with an improved experience.`,
      `${firstName}, thank you for your review. We are glad you enjoyed some aspects of your stay. We take your feedback seriously and will address the concerns you raised. We would love the chance to welcome you back and show you the improvements.`,
    ]

    const negativeReplies = [
      `${firstName}, we sincerely apologize for the issues you experienced during your stay. This is not the standard we aim for. We have already taken steps to address the problems you mentioned. We would appreciate the opportunity to make it right - please don't hesitate to reach out to us directly.`,
      `Thank you for your candid feedback, ${firstName}. We are sorry to hear about the difficulties during your stay. We take all feedback seriously and have implemented corrective measures. We hope you might consider giving us another chance in the future.`,
    ]

    function pickRandom<T>(arr: T[]): T {
      return arr[Math.floor(Math.random() * arr.length)]!
    }

    let draft: string
    if (record.guest_rating_overall && record.guest_rating_overall >= 4) {
      draft = pickRandom(positiveReplies)
    } else if (record.guest_rating_overall && record.guest_rating_overall >= 3) {
      draft = pickRandom(mixedReplies)
    } else {
      draft = pickRandom(negativeReplies)
    }

    return draft
  }

  // Approve reply (post it)
  function approveReply(recordId: string, replyText: string) {
    updateReviewRecord(recordId, {
      reply_status: 'replied',
      reply_text: replyText,
      reply_posted_at: new Date().toISOString(),
    })
    toast.success('Reply posted successfully.')
  }

  // Generate AI host review of guest (mock)
  async function generateHostReviewDraft(recordId: string): Promise<{ text: string, privateFeedback: string, ratings: { cleanliness: number, communication: number, house_rules: number } }> {
    const record = reviewRecords.value.find(r => r.id === recordId)
    if (!record) return { text: '', privateFeedback: '', ratings: { cleanliness: 5, communication: 5, house_rules: 5 } }

    await new Promise(resolve => setTimeout(resolve, 1500))

    const firstName = record.guest_name.split(' ')[0]
    const sor = sorRecords.value.find(s => s.reservation_id === record.reservation_id)
    const isPublicOnly = record.source === 'booking_com'

    const cleanliness = sor?.cleaning_score ?? 4
    const communication = sor?.communication_score ?? 4
    const hasFlags = sor && sor.house_rule_flags.length > 0

    const positiveReviews = [
      `${firstName} was a wonderful guest! Communicated clearly throughout the stay and left the property in excellent condition. The housekeeping team confirmed everything was well-maintained. Highly recommend to other hosts!`,
      `Had a great experience hosting ${firstName}. Prompt communication, respectful of house rules, and the property was left tidy. Would happily welcome them back anytime.`,
    ]

    const mixedReviews = [
      `${firstName} was generally a good guest. Communication was fine and they followed most house rules. The property was left in acceptable condition, though the housekeeping team noted some minor items that needed extra attention. Would consider hosting again.`,
      `Good communication from ${firstName} throughout the booking. The stay went smoothly overall. Housekeeping noted minor wear but nothing concerning. Would host again with some reservations.`,
    ]

    const negativeReviews = [
      `${firstName}'s stay had some challenges. Communication was inconsistent and the housekeeping team noted several issues during turnover. There were house rule concerns that should be noted for future hosts.`,
    ]

    const positivePrivate = [
      'No concerns at all. Excellent guest in every aspect.',
      'Top-tier guest. Left the property almost as clean as they found it.',
      'Great experience. Would welcome back without hesitation.',
      'Very respectful of the property and neighbors. Zero issues.',
    ]

    const mixedPrivate = [
      'Minor issues noted during turnover. Not dealbreakers but worth noting for future hosts.',
      'Slightly noisier than expected in the evenings. No formal complaints but worth mentioning. Otherwise fine guests.',
      'Left a few personal items behind. Minor cleaning extra needed.',
    ]

    const negativePrivate = [
      'Multiple issues during stay. Housekeeping noted significant extra cleaning required. House rule violations documented.',
      'Challenging guest experience. Recommend caution for future bookings.',
    ]

    function pickRandom<T>(arr: T[]): T {
      return arr[Math.floor(Math.random() * arr.length)]!
    }

    let text: string
    let privateFeedback = ''
    if (cleanliness >= 4 && !hasFlags) {
      text = pickRandom(positiveReviews)
      if (!isPublicOnly) privateFeedback = pickRandom(positivePrivate)
    } else if (cleanliness >= 3) {
      text = pickRandom(mixedReviews)
      if (!isPublicOnly) privateFeedback = pickRandom(mixedPrivate)
    } else {
      text = pickRandom(negativeReviews)
      if (!isPublicOnly) privateFeedback = pickRandom(negativePrivate)
    }

    // Add SOR details to private feedback (Airbnb only)
    if (!isPublicOnly) {
      if (sor?.cleaning_notes) {
        privateFeedback += ` Cleaning notes: ${sor.cleaning_notes}`
      }
      if (hasFlags) {
        privateFeedback += ` House rule flags: ${sor!.house_rule_flags.map(f => f.type).join(', ')}.`
      }
    }

    return {
      text,
      privateFeedback,
      ratings: {
        cleanliness: Math.min(5, Math.max(1, cleanliness)),
        communication: Math.min(5, Math.max(1, communication)),
        house_rules: hasFlags ? Math.max(1, 5 - sor!.house_rule_flags.length) : 5,
      },
    }
  }

  // Submit host review
  function submitHostReview(recordId: string, reviewText: string, ratings: { cleanliness: number, communication: number, house_rules: number, privateFeedback: string } | null) {
    const record = reviewRecords.value.find(r => r.id === recordId)
    if (!record) return
    const isPublicOnly = record.source === 'booking_com'
    updateReviewRecord(recordId, {
      reply_status: 'replied',
      private_feedback: ratings?.privateFeedback ?? null,
      host_review_id: `rev-${recordId.split('-')[1]}`,
    })
    toast.success(isPublicOnly ? 'Booking.com review submitted.' : 'Host review submitted successfully.')
  }

  // Clear all filters
  function clearFilters() {
    searchQuery.value = ''
    filterStatus.value = 'all'
    filterChannel.value = 'all'
    filterListing.value = []
    filterRating.value = null
  }

  // Get SOR for a reservation
  function getSor(reservationId: string): StayOperationalRecord | null {
    return sorRecords.value.find(s => s.reservation_id === reservationId) ?? null
  }

  // Get countdown days for host review window (Airbnb 14d, Booking.com 365d, Direct N/A)
  function getHostReviewCountdown(checkoutDate: string, source?: ReviewSource): number {
    const checkout = new Date(checkoutDate)
    const windowDays = source === 'booking_com' ? 365 : 14
    const deadline = new Date(checkout.getTime() + windowDays * 86400000)
    const now = new Date()
    const remaining = Math.ceil((deadline.getTime() - now.getTime()) / 86400000)
    return Math.max(0, remaining)
  }

  return {
    reviewRecords,
    sorRecords,
    feedItems,
    filteredFeedItems,
    hubStats,
    searchQuery,
    filterStatus,
    filterChannel,
    filterListing,
    filterRating,
    uniqueListings,
    updateReviewRecord,
    generateReplyDraft,
    approveReply,
    generateHostReviewDraft,
    submitHostReview,
    clearFilters,
    getSor,
    getHostReviewCountdown,
  }
}
