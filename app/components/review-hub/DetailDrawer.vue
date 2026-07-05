<script setup lang="ts">
import type { ReviewFeedItem } from '~/components/review-hub/data/types'
import HostReviewPanel from '~/components/review-hub/HostReviewPanel.vue'

const props = defineProps<{
  open: boolean
  item: ReviewFeedItem | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = useVModel(props, 'open', emit)

const { reviewRecords, getSor, getHostReviewCountdown } = useReviewHub()

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

const hostReviewPanelRef = ref<InstanceType<typeof HostReviewPanel> | null>(null)

function generateHostReview() {
  nextTick(() => {
    hostReviewPanelRef.value?.autoGenerate()
  })
}

defineExpose({ generateHostReview })

// Auto-trigger host review generation when opening a Booking.com record that
// needs a host review (not expired, not already generated/submitted).
watch(() => props.open, (isOpen) => {
  if (!isOpen || !review.value) return
  if (review.value.source !== 'booking_com') return
  if (review.value.reply_status !== 'needs_reply') return
  if (getHostReviewCountdown(review.value.checkout_date, review.value.source) <= 0) return
  generateHostReview()
})
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle v-if="review" class="flex items-center gap-3">
          <span>{{ review.guest_name }}</span>
          <ReviewHubSourceBadge :source="review.source" />
          <ReviewHubStatusChip :status="review.reply_status" />
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

        <Separator />

        <!-- Host Review -->
        <ReviewHubHostReviewPanel
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
