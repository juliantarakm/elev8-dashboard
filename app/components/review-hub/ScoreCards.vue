<script setup lang="ts">
import { getDisplayScore, getCategoryDisplayLabel } from '~/components/review-hub/data/types'

const { filteredFeedItems } = useReviewHub()

interface ScoreAggregate {
  category: string
  label: string
  avg: number
  count: number
}

const aggregate = computed<ScoreAggregate[]>(() => {
  const byCategory = new Map<string, { total: number, count: number }>()

  filteredFeedItems.value.forEach((item) => {
    const r = item.review_record
    if (!r.scores || r.scores.length === 0) return
    r.scores.forEach((s) => {
      const existing = byCategory.get(s.category)
      if (existing) {
        existing.total += s.score
        existing.count += 1
      } else {
        byCategory.set(s.category, { total: s.score, count: 1 })
      }
    })
  })

  return Array.from(byCategory.entries())
    .map(([cat, data]) => ({
      category: cat,
      label: getCategoryDisplayLabel(cat),
      avg: Math.round((data.total / data.count) * 10) / 10,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
})

const overallAvg = computed(() => {
  const items = filteredFeedItems.value.filter(i => i.review_record.guest_rating_overall !== null)
  if (items.length === 0) return null
  const sum = items.reduce((acc, i) => acc + i.review_record.guest_rating_overall!, 0)
  return Math.round((sum / items.length) * 10) / 10
})

const overallCount = computed(() =>
  filteredFeedItems.value.filter(i => i.review_record.guest_rating_overall !== null).length,
)

const totalReviews = computed(() => filteredFeedItems.value.length)
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <!-- Overall -->
    <div class="rounded-lg border bg-card p-3">
      <p class="text-[10px] uppercase tracking-wider text-muted-foreground">Overall</p>
      <p class="mt-1 text-2xl font-bold">
        {{ overallAvg !== null ? getDisplayScore(overallAvg, 'airbnb').replace('.0', '') : '-' }}
      </p>
      <p class="text-xs text-muted-foreground">{{ overallCount }} reviews</p>
    </div>

    <!-- Per Category -->
    <div
      v-for="cat in aggregate.slice(0, 3)"
      :key="cat.category"
      class="rounded-lg border bg-card p-3"
    >
      <p class="text-[10px] uppercase tracking-wider text-muted-foreground">{{ cat.label }}</p>
      <p class="mt-1 text-2xl font-bold">
        {{ cat.avg.toFixed(1) }}
      </p>
      <p class="text-xs text-muted-foreground">{{ cat.count }} reviews</p>
    </div>
  </div>
</template>
