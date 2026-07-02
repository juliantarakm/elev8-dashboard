import type { AutoReview, ReviewAutomationConfig, ReviewRatings, ReviewStatus } from '~/components/airbnb-reviews/data/reviews'
import { computed, ref } from 'vue'
import { defaultConfig, mockReviews } from '~/components/airbnb-reviews/data/reviews'
import { cleaningJobs } from '~/components/cleaning/data/cleaning-jobs'

const CONFIG_STORAGE_KEY = 'elev8-airbnb-review-config'

function loadConfig(): ReviewAutomationConfig {
  if (import.meta.client) {
    try {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY)
      if (raw)
        return { ...defaultConfig, ...JSON.parse(raw) }
    }
    catch { /* ignore */ }
  }
  return { ...defaultConfig }
}

function saveConfig(config: ReviewAutomationConfig) {
  if (import.meta.client) {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
    }
    catch { /* ignore */ }
  }
}

export type ReviewFilterStatus = 'all' | ReviewStatus

export function useAirbnbReviews() {
  const reviews = useState<AutoReview[]>('airbnb-reviews', () => JSON.parse(JSON.stringify(mockReviews)))
  const config = useState<ReviewAutomationConfig>('airbnb-review-config', () => loadConfig())

  watch(config, val => saveConfig(val), { deep: true })

  const filterStatus = ref<ReviewFilterStatus>('all')
  const filterListing = ref<string>('all')
  const searchQuery = ref('')

  const uniqueListings = computed(() => {
    const map = new Map<string, string>()
    reviews.value.forEach(r => map.set(r.property_id, r.listing_name))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  })

  const filteredReviews = computed(() => {
    return reviews.value.filter((r) => {
      if (filterStatus.value !== 'all' && r.status !== filterStatus.value)
        return false
      if (filterListing.value !== 'all' && r.property_id !== filterListing.value)
        return false
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase()
        if (!r.guest_name.toLowerCase().includes(q) && !r.listing_name.toLowerCase().includes(q))
          return false
      }
      return true
    }).sort((a, b) => new Date(b.checkout_date).getTime() - new Date(a.checkout_date).getTime())
  })

  const stats = computed(() => ({
    pending: reviews.value.filter(r => r.status === 'pending').length,
    draft: reviews.value.filter(r => r.status === 'draft').length,
    posted: reviews.value.filter(r => r.status === 'posted').length,
    failed: reviews.value.filter(r => r.status === 'failed').length,
    total: reviews.value.length,
  }))

  function updateConfig(patch: Partial<ReviewAutomationConfig>) {
    config.value = { ...config.value, ...patch }
  }

  function updateReview(id: string, patch: Partial<AutoReview>) {
    reviews.value = reviews.value.map(r =>
      r.id === id ? { ...r, ...patch, updated_at: new Date().toISOString() } : r,
    )
  }

  function approveReview(id: string) {
    const review = reviews.value.find(r => r.id === id)
    if (!review || !review.public_review)
      return
    updateReview(id, {
      status: 'posted',
      airbnb_review_id: `airbnb-rev-${Date.now()}`,
      posted_to_airbnb_at: new Date().toISOString(),
    })
  }

  function saveDraft(id: string, data: {
    public_review: string
    private_feedback: string
    ratings: ReviewRatings
    recommend_guest: boolean
    would_host_again: boolean
  }) {
    updateReview(id, {
      ...data,
      manually_edited: true,
      edited_at: new Date().toISOString(),
    })
  }

  async function generateReview(id: string) {
    const review = reviews.value.find(r => r.id === id)
    if (!review)
      return

    updateReview(id, { status: 'generating' })
    await new Promise(resolve => setTimeout(resolve, 1500))

    const generated = generateMockReview(review)
    updateReview(id, {
      status: 'draft',
      ...generated,
      generated_at: new Date().toISOString(),
      generation_cost: +(0.002 + Math.random() * 0.003).toFixed(4),
    })
  }

  async function regenerateReview(id: string) {
    const review = reviews.value.find(r => r.id === id)
    if (!review)
      return

    updateReview(id, { status: 'generating' })
    await new Promise(resolve => setTimeout(resolve, 1500))

    const generated = generateMockReview(review, true)
    updateReview(id, {
      status: 'draft',
      ...generated,
      generated_at: new Date().toISOString(),
      generation_cost: +(0.002 + Math.random() * 0.003).toFixed(4),
      manually_edited: false,
      edited_at: null,
    })
  }

  function retryFailed(id: string) {
    generateReview(id)
  }

  return {
    reviews,
    config,
    filterStatus,
    filterListing,
    searchQuery,
    uniqueListings,
    filteredReviews,
    stats,
    updateConfig,
    updateReview,
    approveReview,
    saveDraft,
    generateReview,
    regenerateReview,
    retryFailed,
  }
}

function generateMockReview(review: AutoReview, variant = false) {
  const firstName = review.guest_name.split(' ')[0]

  // Look up cleaning feedback if linked
  const cleaningJob = review.cleaning_job_id
    ? cleaningJobs.value.find(j => j.id === review.cleaning_job_id)
    : null
  const feedback = cleaningJob?.feedback
  const cleanlinessFromFeedback = feedback?.cleanlinessRating

  const isPositive = cleanlinessFromFeedback ? cleanlinessFromFeedback >= 4 : Math.random() > 0.2

  const positiveReviews = [
    `${firstName} was a wonderful guest! Communicated clearly throughout the stay and left the property in excellent condition. The housekeeping team confirmed everything was well-maintained. Highly recommend to other hosts!`,
    `Had a great experience hosting ${firstName}. Prompt communication, respectful of house rules, and the property was left tidy. Would happily welcome them back anytime.`,
    `${firstName} and their group were respectful guests who clearly appreciate quality vacation rentals. Good communication, on-time checkout, and minimal cleaning required. A pleasure to host!`,
    `Excellent guest experience with ${firstName}. They took great care of the property, followed all check-in/out procedures, and were easy to communicate with. Looking forward to hosting again.`,
    `${firstName} was an ideal guest - quiet, respectful, and left the place spotless. Communication was clear and timely throughout. Absolutely recommend!`,
  ]

  const mixedReviews = [
    `${firstName} was generally a good guest. Communication was fine and they followed most house rules. The property was left in acceptable condition, though the housekeeping team noted some minor items that needed extra attention. Would consider hosting again.`,
    `${firstName} enjoyed their stay and communicated well overall. The property was in decent condition after checkout. Minor note: some dishes were left unwashed, but nothing major. A reasonable guest.`,
    `Good communication from ${firstName} throughout the booking. The stay went smoothly overall. Housekeeping noted minor wear but nothing concerning. Would host again with some reservations.`,
  ]

  const positivePrivate = [
    'No concerns at all. Excellent guest in every aspect.',
    'Top-tier guest. Left the property almost as clean as they found it.',
    'Great experience. Would welcome back without hesitation.',
    'Very respectful of the property and neighbors. Zero issues.',
  ]

  const mixedPrivate = [
    'Minor issues: some dishes in the sink, towel left on the floor. Not dealbreakers but worth noting for future hosts.',
    'Slightly noisier than expected in the evenings. No formal complaints but worth mentioning. Otherwise fine guests.',
    'Left a few personal items behind. Returned without issue. Minor cleaning extra needed in the kitchen area.',
  ]

  const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  // Use cleanliness from housekeeping feedback if available
  const cleanlinessRating = cleanlinessFromFeedback ?? (isPositive
    ? 4 + (Math.random() > 0.5 ? 1 : 0)
    : 3 + (Math.random() > 0.5 ? 1 : 0))

  const communicationRating = isPositive
    ? 4 + (Math.random() > 0.3 ? 1 : 0)
    : 4 + (Math.random() > 0.5 ? 1 : 0)

  const houseRulesRating = isPositive
    ? 4 + (Math.random() > 0.4 ? 1 : 0)
    : 3 + (Math.random() > 0.5 ? 1 : 0)

  const ratings: ReviewRatings = {
    cleanliness: cleanlinessRating,
    communication: communicationRating,
    house_rules: houseRulesRating,
  }

  // Use housekeeper notes in private feedback if available
  const privateFeedback = feedback?.housekeeperNotes
    ? `${feedback.housekeeperNotes}${feedback.damages.length ? ` Damages: ${feedback.damages.join(', ')}.` : ''}${feedback.itemsLeft.length ? ` Items left: ${feedback.itemsLeft.join(', ')}.` : ''}`
    : isPositive
      ? pickRandom(positivePrivate)
      : pickRandom(mixedPrivate)

  if (isPositive) {
    return {
      public_review: pickRandom(variant ? positiveReviews.slice().reverse() : positiveReviews),
      private_feedback: privateFeedback,
      ratings,
      recommend_guest: true,
      would_host_again: true,
    }
  }

  return {
    public_review: pickRandom(variant ? mixedReviews.slice().reverse() : mixedReviews),
    private_feedback: privateFeedback,
    ratings,
    recommend_guest: Math.random() > 0.3,
    would_host_again: Math.random() > 0.3,
  }
}
