<script setup lang="ts">
import type { ReviewRecord } from '~/components/review-hub/data/types'
import { format } from 'date-fns'
import { channelIcons, channelLabels } from '~/components/review-hub/data/types'

const props = defineProps<{
  review: ReviewRecord
}>()

const ratingsExpanded = ref(false)

const sourceIcon = computed(() => channelIcons[props.review.source])
const sourceLabel = computed(() => channelLabels[props.review.source])

// Airbnb double-blind: review hidden until host submits their review of the guest
const isReviewHidden = computed(() => {
  return props.review.source === 'airbnb' && !props.review.host_review_id
})

const ratingMax = computed(() => props.review.guest_rating_max ?? 5)

function formatDate(date: string) {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

const categoryEntries = computed(() => {
  if (!props.review.guest_rating_categories) return []

  if (props.review.source === 'booking_com') {
    const labels: Record<string, string> = {
      value: 'Value',
      clean: 'Clean',
      location: 'Location',
      comfort: 'Comfort',
      facilities: 'Facilities',
      staff: 'Staff',
      wifi: 'WiFi',
    }
    return Object.entries(props.review.guest_rating_categories)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => ({ key: k, label: labels[k] ?? k, value: v as number | null }))
  }

  const labels: Record<string, string> = {
    cleanliness: 'Cleanliness',
    communication: 'Communication',
    check_in: 'Check-in',
    accuracy: 'Accuracy',
    location: 'Location',
    value: 'Value',
  }
  return Object.entries(props.review.guest_rating_categories)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => ({ key: k, label: labels[k] ?? k, value: v as number | null }))
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon :name="sourceIcon" class="size-4" />
        <span class="text-sm font-medium">{{ sourceLabel }} Review</span>
      </div>
      <span v-if="review.language_detected" class="text-xs text-muted-foreground">
        Language: {{ review.language_detected.toUpperCase() }}
      </span>
    </div>

    <!-- Rating Accordion (hidden during Airbnb double-blind) -->
    <template v-if="!isReviewHidden">
      <button
        v-if="review.guest_rating_overall"
        type="button"
        class="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
        @click="ratingsExpanded = !ratingsExpanded"
      >
        <div class="flex items-center gap-3">
          <span class="text-3xl font-bold">{{ review.guest_rating_overall }}<span class="text-base font-normal text-muted-foreground">/{{ ratingMax }}</span></span>
          <p class="text-xs text-muted-foreground">Overall Rating</p>
        </div>
        <Icon
          name="lucide:chevron-down"
          class="size-4 text-muted-foreground transition-transform"
          :class="ratingsExpanded && 'rotate-180'"
        />
      </button>
      <div v-else class="text-sm text-muted-foreground">
        Guest hasn't left a review yet.
      </div>

      <!-- Category Ratings -->
      <div v-if="categoryEntries.length > 0 && ratingsExpanded" class="grid grid-cols-3 gap-2">
        <div v-for="cat in categoryEntries" :key="cat.key" class="rounded-lg border bg-card p-2 text-center">
          <p class="text-[10px] text-muted-foreground">
            {{ cat.label }}
          </p>
          <p class="mt-0.5 text-sm font-medium">
            {{ cat.value !== null ? `${cat.value}/${ratingMax}` : 'N/A' }}
          </p>
        </div>
      </div>
    </template>

    <!-- Review Text (hidden during Airbnb double-blind) -->
    <template v-if="isReviewHidden">
      <div class="rounded-lg border border-dashed bg-muted/30 p-4 text-center">
        <Icon name="lucide:eye-off" class="mx-auto size-5 text-muted-foreground" />
        <p class="mt-2 text-sm text-muted-foreground">
          The review is hidden until you provide feedback for the guest.
        </p>
        <p class="mt-1 text-xs text-muted-foreground">
          Submit your host review to reveal the guest's feedback.
        </p>
      </div>
    </template>
    <template v-else>
      <div v-if="review.guest_review_text" class="rounded-lg border bg-muted/30 p-4">
        <p class="text-sm leading-relaxed">
          "{{ review.guest_review_text }}"
        </p>
        <p v-if="review.review_received_at" class="mt-2 text-xs text-muted-foreground">
          Received {{ formatDate(review.review_received_at) }}
        </p>
      </div>
    </template>
  </div>
</template>
