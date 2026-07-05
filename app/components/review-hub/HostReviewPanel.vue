<script setup lang="ts">
import type { AutoReview } from '~/components/airbnb-reviews/data/reviews'
import type { ReviewRecord, StayOperationalRecord } from '~/components/review-hub/data/types'
import { toast } from 'vue-sonner'

const props = defineProps<{
  review: ReviewRecord
  sor: StayOperationalRecord | null
  hostReview: AutoReview | null
}>()

const emit = defineEmits<{
  reviewSubmitted: []
}>()

const { generateHostReviewDraft, submitHostReview, getHostReviewCountdown } = useReviewHub()

// Only consider a host review "generated" if it has actual public_review text
const hasGeneratedData = computed(() => !!props.hostReview?.public_review)
const draftText = ref(props.hostReview?.public_review ?? '')
const privateFeedback = ref(props.hostReview?.private_feedback ?? '')
const cleanliness = ref(props.hostReview?.ratings?.cleanliness ?? 5)
const communication = ref(props.hostReview?.ratings?.communication ?? 5)
const houseRules = ref(props.hostReview?.ratings?.house_rules ?? 5)
const isGenerating = ref(false)
const isGenerated = ref(hasGeneratedData.value)
const isSubmitted = ref(props.review.reply_status === 'replied' && hasGeneratedData.value)

// Countdown (Airbnb 14d, Booking.com 365d)
const countdown = computed(() => getHostReviewCountdown(props.review.checkout_date, props.review.source))
const isExpired = computed(() => countdown.value <= 0)

// Airbnb and Booking.com support host reviews of guests (Direct does not)
const channelSupportsReview = computed(() => props.review.source === 'airbnb' || props.review.source === 'booking_com')
// Booking.com host reviews are public-only (no private feedback, no category ratings)
const isPublicOnly = computed(() => props.review.source === 'booking_com')

// SOR-based preview
const sorAvailable = computed(() => props.sor !== null && (props.sor.cleaning_score !== null || props.sor.communication_score !== null))

async function handleGenerate() {
  isGenerating.value = true
  const result = await generateHostReviewDraft(props.review.id)
  draftText.value = result.text
  if (!isPublicOnly.value) {
    privateFeedback.value = result.privateFeedback
    cleanliness.value = result.ratings.cleanliness
    communication.value = result.ratings.communication
    houseRules.value = result.ratings.house_rules
  }
  isGenerated.value = true
  isGenerating.value = false
}

function handleSubmit() {
  if (!draftText.value.trim()) return
  if (isPublicOnly.value) {
    submitHostReview(props.review.id, draftText.value, null)
  } else {
    submitHostReview(props.review.id, draftText.value, {
      cleanliness: cleanliness.value,
      communication: communication.value,
      house_rules: houseRules.value,
      privateFeedback: privateFeedback.value,
    })
  }
  isSubmitted.value = true
}

async function autoGenerate() {
  if (isExpired.value || isSubmitted.value) return
  // Reset any prior generated state so the loading state is visible
  isGenerated.value = false
  await handleGenerate()
}

function setRating(field: 'cleanliness' | 'communication' | 'houseRules', value: number) {
  if (isSubmitted.value) return
  const clamped = Math.max(1, Math.min(5, value))
  if (field === 'cleanliness') cleanliness.value = clamped
  else if (field === 'communication') communication.value = clamped
  else houseRules.value = clamped
}

defineExpose({ autoGenerate })
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <SharedAiIcon custom-class="size-4 text-[#C8A84B]" />
        <span class="text-sm font-medium">AI Host Review of Guest</span>
      </div>
      <Badge v-if="!isExpired && channelSupportsReview" variant="outline" class="gap-1 text-xs">
        <Icon name="lucide:clock" class="size-3" />
        {{ countdown }}d remaining
      </Badge>
    </div>

    <p class="text-xs text-muted-foreground">
      AI generates this review based on real Operational Record data from Elev8 and conversation summary.
    </p>

    <!-- Channel doesn't support reviews -->
    <div v-if="!channelSupportsReview" class="rounded-lg border border-dashed p-6 text-center">
      <Icon name="lucide:info" class="mx-auto size-6 text-muted-foreground" />
      <p class="mt-2 text-sm text-muted-foreground">
        Direct bookings do not support host reviews of guests.
      </p>
    </div>

    <!-- Expired -->
    <div v-else-if="isExpired" class="rounded-lg border border-dashed p-6 text-center">
      <Icon name="lucide:clock" class="mx-auto size-6 text-muted-foreground" />
      <p class="mt-2 text-sm text-muted-foreground">
        The {{ review.source === 'booking_com' ? '365-day' : '14-day' }} review window has closed. Reviews can no longer be submitted.
      </p>
    </div>

    <!-- No SOR -->
    <div v-else-if="!sorAvailable && !isGenerated" class="rounded-lg border border-dashed p-6 text-center">
      <Icon name="lucide:clipboard-x" class="mx-auto size-6 text-muted-foreground" />
      <p class="mt-2 text-sm text-muted-foreground">
        Not enough operational data to generate a review. You can write one manually.
      </p>
      <Button class="mt-4 gap-2" :disabled="isExpired" @click="isGenerated = true">
        <Icon name="lucide:pen-line" class="size-4" />
        Write Manually
      </Button>
    </div>

    <!-- Generate or edit -->
    <template v-else>
      <!-- Submitted readonly view -->
      <template v-if="isSubmitted">
        <div class="rounded-lg border bg-green-50/50 p-4">
          <div class="flex items-center gap-2 text-green-700">
            <Icon name="lucide:check-circle-2" class="size-4" />
            <span class="text-sm font-medium">Review Submitted</span>
          </div>
        </div>

        <div class="space-y-2">
          <Label class="text-sm font-medium">Public Review</Label>
          <p class="rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
            {{ draftText }}
          </p>
        </div>

        <template v-if="!isPublicOnly">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <Label class="text-sm font-medium">Private Feedback</Label>
              <Badge variant="outline" class="text-[10px]">Host-Only</Badge>
            </div>
            <p class="rounded-lg border bg-amber-50 p-3 text-sm leading-relaxed">
              {{ privateFeedback }}
            </p>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-lg border bg-card p-3 text-center">
              <p class="text-xs text-muted-foreground">Cleanliness</p>
              <p class="mt-1 text-sm font-medium">{{ cleanliness }}<span class="text-xs text-muted-foreground">/5</span></p>
            </div>
            <div class="rounded-lg border bg-card p-3 text-center">
              <p class="text-xs text-muted-foreground">Communication</p>
              <p class="mt-1 text-sm font-medium">{{ communication }}<span class="text-xs text-muted-foreground">/5</span></p>
            </div>
            <div class="rounded-lg border bg-card p-3 text-center">
              <p class="text-xs text-muted-foreground">House Rules</p>
              <p class="mt-1 text-sm font-medium">{{ houseRules }}<span class="text-xs text-muted-foreground">/5</span></p>
            </div>
          </div>
        </template>
      </template>

      <!-- Edit/Generate view -->
      <template v-else>
        <template v-if="!isGenerated">
          <div v-if="isGenerating" class="space-y-4">
            <div class="flex flex-col items-center justify-center gap-3 rounded-lg border bg-gradient-to-b from-[#C8A84B]/5 to-transparent p-8 text-center">
              <div class="flex size-10 items-center justify-center rounded-full bg-[#C8A84B]/15">
                <Icon name="lucide:loader-circle" class="size-6 animate-spin text-[#C8A84B]" />
              </div>
              <div class="space-y-1">
                <p class="text-sm font-medium">
                  Generating host review
                </p>
                <p class="text-xs text-muted-foreground">
                  ElevAI is analyzing the stay's operational record and drafting an honest review. This usually takes a few seconds.
                </p>
              </div>
            </div>
            <div class="h-20 w-full animate-pulse rounded-lg bg-muted" />
            <div v-if="!isPublicOnly" class="h-16 w-full animate-pulse rounded-lg bg-muted" />
            <div v-if="!isPublicOnly" class="grid grid-cols-3 gap-3">
              <div class="h-16 w-full animate-pulse rounded-lg bg-muted" />
              <div class="h-16 w-full animate-pulse rounded-lg bg-muted" />
              <div class="h-16 w-full animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
          <div v-else class="rounded-lg border border-dashed p-6 text-center">
            <SharedAiIcon custom-class="mx-auto size-6 text-muted-foreground" />
            <p class="mt-2 text-sm text-muted-foreground">
              Generate an honest guest review grounded in the stay's operational record.
            </p>
            <Button class="mt-4 gap-2" :disabled="isGenerating" @click="handleGenerate">
              <SharedAiIcon custom-class="size-4" />
              Generate Host Review
            </Button>
          </div>
        </template>

        <template v-else>
          <!-- Public Review Editor -->
          <div class="space-y-2">
            <Label class="text-sm font-medium">Public Review</Label>
            <Textarea
              v-model="draftText"
              :rows="4"
              :maxlength="1000"
              placeholder="Edit the review..."
              class="text-sm"
            />
            <span class="text-xs text-muted-foreground">{{ draftText.length }}/1000</span>
          </div>

          <template v-if="!isPublicOnly">
            <!-- Private Feedback (auto-generated) -->
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <Label class="text-sm font-medium">Private Feedback</Label>
                <Badge variant="outline" class="text-[10px]">Host-Only</Badge>
              </div>
              <Textarea
                v-model="privateFeedback"
                :rows="3"
                :maxlength="2000"
                placeholder="Private notes for other hosts..."
                class="text-sm"
              />
              <span class="text-xs text-muted-foreground">{{ privateFeedback.length }}/2000</span>
            </div>

            <!-- Category Ratings -->
            <div class="space-y-3">
              <Label class="text-sm font-medium">Ratings</Label>
              <div class="grid grid-cols-3 gap-3">
                <div class="rounded-lg border bg-card p-3 text-center">
                  <p class="text-xs text-muted-foreground">Cleanliness</p>
                  <div class="mt-1 inline-flex items-center gap-1">
                    <button
                      type="button"
                      class="size-6 rounded border text-sm transition-colors hover:bg-muted"
                      :disabled="isSubmitted || cleanliness <= 1"
                      @click="setRating('cleanliness', cleanliness - 1)"
                    >
                      −
                    </button>
                    <span class="min-w-[2.5rem] text-sm font-medium">{{ cleanliness }}<span class="text-xs text-muted-foreground">/5</span></span>
                    <button
                      type="button"
                      class="size-6 rounded border text-sm transition-colors hover:bg-muted"
                      :disabled="isSubmitted || cleanliness >= 5"
                      @click="setRating('cleanliness', cleanliness + 1)"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div class="rounded-lg border bg-card p-3 text-center">
                  <p class="text-xs text-muted-foreground">Communication</p>
                  <div class="mt-1 inline-flex items-center gap-1">
                    <button
                      type="button"
                      class="size-6 rounded border text-sm transition-colors hover:bg-muted"
                      :disabled="isSubmitted || communication <= 1"
                      @click="setRating('communication', communication - 1)"
                    >
                      −
                    </button>
                    <span class="min-w-[2.5rem] text-sm font-medium">{{ communication }}<span class="text-xs text-muted-foreground">/5</span></span>
                    <button
                      type="button"
                      class="size-6 rounded border text-sm transition-colors hover:bg-muted"
                      :disabled="isSubmitted || communication >= 5"
                      @click="setRating('communication', communication + 1)"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div class="rounded-lg border bg-card p-3 text-center">
                  <p class="text-xs text-muted-foreground">House Rules</p>
                  <div class="mt-1 inline-flex items-center gap-1">
                    <button
                      type="button"
                      class="size-6 rounded border text-sm transition-colors hover:bg-muted"
                      :disabled="isSubmitted || houseRules <= 1"
                      @click="setRating('houseRules', houseRules - 1)"
                    >
                      −
                    </button>
                    <span class="min-w-[2.5rem] text-sm font-medium">{{ houseRules }}<span class="text-xs text-muted-foreground">/5</span></span>
                    <button
                      type="button"
                      class="size-6 rounded border text-sm transition-colors hover:bg-muted"
                      :disabled="isSubmitted || houseRules >= 5"
                      @click="setRating('houseRules', houseRules + 1)"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Actions -->
          <div class="flex gap-2">
            <Button variant="outline" class="gap-1.5" :disabled="isGenerating" @click="handleGenerate">
              <Icon v-if="isGenerating" name="lucide:loader-circle" class="size-3.5 animate-spin" />
              <Icon v-else name="lucide:refresh-cw" class="size-3.5" />
              {{ isGenerating ? 'Regenerating...' : 'Regenerate' }}
            </Button>
            <Button class="gap-1.5" :disabled="isGenerating" @click="handleSubmit">
              <Icon name="lucide:send" class="size-3.5" />
              Submit Review
            </Button>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>
