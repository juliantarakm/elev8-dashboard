<script setup lang="ts">
import type { AutoReview } from '~/components/airbnb-reviews/data/reviews'
import { format } from 'date-fns'
import { toast } from 'vue-sonner'
import { statusIcons, statusLabels } from '~/components/airbnb-reviews/data/reviews'

definePageMeta({ layout: 'default' })

const {
  config,
  filterStatus,
  filterListing,
  searchQuery,
  uniqueListings,
  filteredReviews,
  stats,
  generateReview,
  retryFailed,
} = useAirbnbReviews()

const previewOpen = ref(false)
const selectedReview = ref<AutoReview | null>(null)

function openPreview(review: AutoReview) {
  selectedReview.value = review
  previewOpen.value = true
}

async function handleGenerate(id: string) {
  await generateReview(id)
  const review = filteredReviews.value.find(r => r.id === id)
  if (review)
    openPreview(review)
}

function handleRetry(id: string) {
  retryFailed(id)
  toast.info('Retrying review generation...')
}

function handleGeneratePending() {
  filteredReviews.value.filter(r => r.status === 'pending').forEach(r => generateReview(r.id))
  toast.success('Generating all pending reviews...')
}

function statusColor(status: string) {
  switch (status) {
    case 'posted': return 'text-green-600 bg-green-50'
    case 'draft': return 'text-blue-600 bg-blue-50'
    case 'pending': return 'text-yellow-600 bg-yellow-50'
    case 'failed': return 'text-red-600 bg-red-50'
    case 'generating': return 'text-purple-600 bg-purple-50'
    default: return ''
  }
}

function ratingStars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function formatDate(date: string) {
  return format(new Date(date), 'MMM d, yyyy')
}

function getTimeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1)
    return 'Just now'
  if (hours < 24)
    return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Airbnb Reviews
        </h2>
        <p class="text-muted-foreground">
          Auto-generated guest reviews powered by AI.
          <template v-if="!config.enabled">
            <NuxtLink to="/settings/integrations" class="underline underline-offset-2 hover:text-foreground">
              Enable automation
            </NuxtLink>
            to get started.
          </template>
        </p>
      </div>
      <div class="flex gap-2">
        <Button v-if="stats.pending > 0" class="gap-2" @click="handleGeneratePending">
          <Icon name="lucide:sparkles" class="size-4" />
          Generate All Pending
        </Button>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-lg border bg-card p-4">
        <p class="text-xs font-medium text-muted-foreground">
          Pending
        </p>
        <p class="mt-1 text-2xl font-bold">
          {{ stats.pending }}
        </p>
      </div>
      <div class="rounded-lg border bg-card p-4">
        <p class="text-xs font-medium text-muted-foreground">
          Drafts
        </p>
        <p class="mt-1 text-2xl font-bold">
          {{ stats.draft }}
        </p>
      </div>
      <div class="rounded-lg border bg-card p-4">
        <p class="text-xs font-medium text-muted-foreground">
          Posted
        </p>
        <p class="mt-1 text-2xl font-bold text-green-600">
          {{ stats.posted }}
        </p>
      </div>
      <div class="rounded-lg border bg-card p-4">
        <p class="text-xs font-medium text-muted-foreground">
          Failed
        </p>
        <p class="mt-1 text-2xl font-bold text-red-600">
          {{ stats.failed }}
        </p>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative min-w-[240px] flex-1">
        <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Search guest or property..." class="h-10 pl-9" />
      </div>
      <Select v-model="filterStatus">
        <SelectTrigger class="h-10 w-[160px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All Statuses
          </SelectItem>
          <SelectItem value="pending">
            Pending
          </SelectItem>
          <SelectItem value="generating">
            Generating
          </SelectItem>
          <SelectItem value="draft">
            Draft
          </SelectItem>
          <SelectItem value="posted">
            Posted
          </SelectItem>
          <SelectItem value="failed">
            Failed
          </SelectItem>
        </SelectContent>
      </Select>
      <Select v-model="filterListing">
        <SelectTrigger class="h-10 w-[180px]">
          <SelectValue placeholder="All Properties" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All Properties
          </SelectItem>
          <SelectItem v-for="listing in uniqueListings" :key="listing.id" :value="listing.id">
            {{ listing.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Table -->
    <div class="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guest</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Checkout</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ratings</TableHead>
            <TableHead>Generated</TableHead>
            <TableHead class="text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="review in filteredReviews" :key="review.id">
            <TableCell>
              <div>
                <p class="text-sm font-medium">
                  {{ review.guest_name }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ review.nights }} night{{ review.nights !== 1 ? 's' : '' }} · {{ review.num_guests }} guest{{ review.num_guests !== 1 ? 's' : '' }}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p class="text-sm">
                  {{ review.listing_name }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ review.listing_location }}
                </p>
              </div>
            </TableCell>
            <TableCell class="text-sm">
              {{ formatDate(review.checkout_date) }}
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="statusColor(review.status)"
                >
                  <Icon :name="statusIcons[review.status]" class="size-3" :class="review.status === 'generating' && 'animate-spin'" />
                  {{ statusLabels[review.status] }}
                </span>
                <span v-if="review.manually_edited" class="text-[10px] text-muted-foreground">(edited)</span>
              </div>
            </TableCell>
            <TableCell>
              <div v-if="review.ratings" class="flex flex-col gap-0.5">
                <span class="text-xs">
                  <span class="text-yellow-500">{{ ratingStars(review.ratings.cleanliness) }}</span>
                  <span class="text-muted-foreground"> Clean</span>
                </span>
                <span class="text-xs">
                  <span class="text-yellow-500">{{ ratingStars(review.ratings.communication) }}</span>
                  <span class="text-muted-foreground"> Comm</span>
                </span>
                <span class="text-xs">
                  <span class="text-yellow-500">{{ ratingStars(review.ratings.house_rules) }}</span>
                  <span class="text-muted-foreground"> Rules</span>
                </span>
              </div>
              <span v-else class="text-xs text-muted-foreground">-</span>
            </TableCell>
            <TableCell class="text-xs text-muted-foreground">
              {{ review.generated_at ? getTimeAgo(review.generated_at) : '-' }}
            </TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-1">
                <template v-if="review.status === 'pending'">
                  <Button size="sm" variant="outline" class="h-8 gap-1.5" @click="handleGenerate(review.id)">
                    <Icon name="lucide:sparkles" class="size-3.5" />
                    Generate
                  </Button>
                </template>
                <template v-else-if="review.status === 'generating'">
                  <Button size="sm" variant="outline" disabled class="h-8 gap-1.5">
                    <Icon name="lucide:loader-circle" class="size-3.5 animate-spin" />
                    Generating...
                  </Button>
                </template>
                <template v-else-if="review.status === 'draft'">
                  <Button size="sm" variant="outline" class="h-8 gap-1.5" @click="openPreview(review)">
                    <Icon name="lucide:eye" class="size-3.5" />
                    Preview & Edit
                  </Button>
                </template>
                <template v-else-if="review.status === 'posted'">
                  <Button size="sm" variant="outline" class="h-8 gap-1.5" @click="openPreview(review)">
                    <Icon name="lucide:eye" class="size-3.5" />
                    View
                  </Button>
                </template>
                <template v-else-if="review.status === 'failed'">
                  <Button size="sm" variant="outline" class="h-8 gap-1.5 text-destructive" @click="handleRetry(review.id)">
                    <Icon name="lucide:refresh-cw" class="size-3.5" />
                    Retry
                  </Button>
                </template>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="filteredReviews.length === 0">
            <TableCell colspan="7">
              <Empty class="py-10">
                <Icon name="lucide:file-text" class="size-8 text-muted-foreground" />
                <div class="space-y-1">
                  <p class="font-medium">
                    No reviews found
                  </p>
                  <p class="text-sm text-muted-foreground">
                    Reviews will appear here after guest checkouts.
                  </p>
                </div>
              </Empty>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Preview Dialog -->
    <AirbnbReviewsPreviewDialog
      v-model:open="previewOpen"
      :review="selectedReview"
    />
  </div>
</template>
