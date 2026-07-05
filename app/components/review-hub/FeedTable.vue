<script setup lang="ts">
import type { ReviewFeedItem } from '~/components/review-hub/data/types'
import { format } from 'date-fns'

defineProps<{
  items: ReviewFeedItem[]
}>()

const emit = defineEmits<{
  select: [item: ReviewFeedItem]
  generate: [item: ReviewFeedItem]
}>()

const { getHostReviewCountdown } = useReviewHub()

const generatingIds = ref<Set<string>>(new Set())
const isGenerating = (id: string) => generatingIds.value.has(id)

async function handleGenerate(item: ReviewFeedItem) {
  generatingIds.value.add(item.id)
  emit('generate', item)
  // Clear after the drawer has had time to open and the panel takes over the loading state
  await new Promise(resolve => setTimeout(resolve, 800))
  generatingIds.value.delete(item.id)
}

function formatDate(date: string) {
  return format(new Date(date), 'MMM d, yyyy')
}

// Airbnb double-blind: rating hidden until host submits their review
function isRatingHidden(item: ReviewFeedItem) {
  return item.review_record.source === 'airbnb' && !item.review_record.host_review_id
}

function ratingDisplay(rating: number | null, max: number | null) {
  if (rating === null) return '-'
  return `${rating}/${max ?? 5}`
}

// Host review window expired (Airbnb 14d, Booking.com 365d) — only relevant for channels that support host reviews
function isHostReviewExpired(item: ReviewFeedItem) {
  const r = item.review_record
  if (r.source === 'direct') return true
  return getHostReviewCountdown(r.checkout_date, r.source) <= 0
}
</script>

<template>
  <div class="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Guest</TableHead>
          <TableHead>Property</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Checkout</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Stay Report</TableHead>
          <TableHead>Status</TableHead>
          <TableHead class="text-right">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="item in items"
          :key="item.id"
          class="cursor-pointer hover:bg-muted/50"
          @click="emit('select', item)"
        >
          <TableCell>
            <div>
              <p class="text-sm font-medium">
                {{ item.review_record.guest_name }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ item.review_record.nights }} night{{ item.review_record.nights !== 1 ? 's' : '' }} · {{ item.review_record.num_guests }} guest{{ item.review_record.num_guests !== 1 ? 's' : '' }}
              </p>
            </div>
          </TableCell>
          <TableCell>
            <div>
              <p class="text-sm">
                {{ item.review_record.listing_name }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ item.review_record.listing_location }}
              </p>
            </div>
          </TableCell>
          <TableCell>
            <ReviewHubSourceBadge :source="item.review_record.source" />
          </TableCell>
          <TableCell class="text-sm">
            {{ formatDate(item.review_record.checkout_date) }}
          </TableCell>
          <TableCell>
            <div v-if="item.review_record.guest_rating_overall && !isRatingHidden(item)" class="flex items-center gap-1.5">
              <span class="text-sm font-medium">{{ ratingDisplay(item.review_record.guest_rating_overall, item.review_record.guest_rating_max) }}</span>
            </div>
            <div v-else-if="isRatingHidden(item)" class="flex items-center gap-1.5 text-muted-foreground">
              <Icon name="lucide:eye-off" class="size-3.5" />
              <span class="text-xs">Hidden</span>
            </div>
            <span v-else class="text-xs text-muted-foreground">-</span>
          </TableCell>
          <TableCell>
            <ReviewHubMiniBadges :sor="item.sor" />
          </TableCell>
          <TableCell>
            <ReviewHubStatusChip :status="item.review_record.reply_status" />
          </TableCell>
          <TableCell class="text-right">
            <Button
              v-if="item.review_record.reply_status === 'needs_reply'"
              size="sm"
              class="h-8 gap-1.5"
              :disabled="isHostReviewExpired(item) || isGenerating(item.id)"
              :title="isHostReviewExpired(item) ? `${item.review_record.source === 'booking_com' ? '365' : '14'}-day review window closed` : ''"
              @click.stop="handleGenerate(item)"
            >
              <Icon v-if="isGenerating(item.id)" name="lucide:loader-circle" class="size-3.5 animate-spin" />
              <SharedAiIcon v-else custom-class="size-3.5" />
              {{ isGenerating(item.id) ? 'Generating...' : 'Generate' }}
            </Button>
            <Button v-else size="sm" variant="outline" class="h-8 gap-1.5" @click.stop="emit('select', item)">
              <Icon name="lucide:eye" class="size-3.5" />
              View
            </Button>
          </TableCell>
        </TableRow>
        <TableRow v-if="items.length === 0">
          <TableCell colspan="8">
            <Empty class="py-10">
              <Icon name="lucide:message-square-text" class="size-8 text-muted-foreground" />
              <div class="space-y-1">
                <p class="font-medium">
                  No reviews found
                </p>
                <p class="text-sm text-muted-foreground">
                  Guest reviews will appear here after checkouts.
                </p>
              </div>
            </Empty>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
