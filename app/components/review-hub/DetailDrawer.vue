<script setup lang="ts">
import type { ReviewFeedItem } from '~/components/review-hub/data/types'
import HostReviewPanel from '~/components/review-hub/HostReviewPanel.vue'
import ReplyPanel from '~/components/review-hub/ReplyPanel.vue'

const props = defineProps<{
  open: boolean
  item: ReviewFeedItem | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = useVModel(props, 'open', emit)

const { reviewRecords, getSor, getHostReviewCountdown, isGuestReviewHidden, isGuestReviewVisible, getComputedStatus } = useReviewHub()

// Always use live record from composable so state mutations are reflected
const review = computed(() => {
  if (!props.item) return null
  return reviewRecords.value.find(r => r.id === props.item!.review_record.id) ?? props.item.review_record
})
const sor = computed(() => {
  if (!props.item) return null
  return getSor(props.item.review_record.reservation_id)
})

const hostReview = computed(() => props.item?.host_review ?? null)

// HostReviewPanel only shown when relevant:
// - Already submitted (show readonly view)
// - Airbnb: during double-blind (guest review still hidden)
// - Booking.com: within 365-day window
const showHostReviewPanel = computed(() => {
  if (!review.value) return false
  if (review.value.host_review_id) return true
  if (review.value.source === 'airbnb') return isGuestReviewHidden(review.value)
  if (review.value.source === 'booking_com') return getHostReviewCountdown(review.value.checkout_date, 'booking_com') > 0
  return false
})

const hostReviewPanelRef = ref<InstanceType<typeof HostReviewPanel> | null>(null)

function generateHostReview() {
  nextTick(() => {
    hostReviewPanelRef.value?.autoGenerate()
  })
}

defineExpose({ generateHostReview })
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle v-if="review" class="flex items-center gap-3">
          <span>{{ review.guest_name }}</span>
          <ReviewHubSourceBadge :source="review.source" />
          <ReviewHubStatusChip :status="getComputedStatus(review)" />
        </DialogTitle>
        <DialogDescription v-if="review">
          {{ review.listing_name }} · Checkout {{ review.checkout_date }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="review" class="space-y-6">
        <!-- Guest Review -->
        <ReviewHubDetailGuestPanel :review="review" />

        <Separator />

        <!-- SOR -->
        <ReviewHubDetailSorPanel :sor="sor" />

        <!-- Reply to Guest (when guest has actually left a review and it's visible) -->
        <template v-if="isGuestReviewVisible(review) && (review.guest_review_text || review.guest_rating_overall)">
          <Separator />
          <ReplyPanel :review="review" :sor="sor" @reply-posted="isOpen = false" />
        </template>

        <Separator />

        <!-- Host Review (only during double-blind window, or if already submitted) -->
        <ReviewHubHostReviewPanel
          v-if="showHostReviewPanel"
          ref="hostReviewPanelRef"
          :review="review"
          :sor="sor"
          :host-review="hostReview"
          @review-submitted="isOpen = false"
        />
      </div>
    </DialogContent>
  </Dialog>
</template>
