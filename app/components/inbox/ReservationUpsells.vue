<script lang="ts" setup>
import type { UpsellItem } from '~/components/inbox/data/conversations'
import { cn } from '~/lib/utils'

interface ReservationUpsellsProps {
  upsells: UpsellItem[]
}

const props = defineProps<ReservationUpsellsProps>()

const statusConfig: Record<string, { label: string, class: string }> = {
  confirmed: { label: 'Confirmed', class: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  cancelled: { label: 'Cancelled', class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
}

function formatPrice(item: UpsellItem): string {
  if (item.currency === 'IDR') {
    return `IDR ${item.price.toLocaleString()}`
  }
  return `${item.currency} ${item.price}`
}
</script>

<template>
  <div v-if="upsells.length === 0" class="flex flex-col items-center justify-center py-8 text-center">
    <Icon name="lucide:shopping-bag" class="size-8 text-muted-foreground mb-2" />
    <p class="text-sm text-muted-foreground">No upsells purchased</p>
  </div>

  <div v-else class="space-y-3">
    <div
      v-for="item in upsells"
      :key="item.id"
      class="rounded-lg border p-3 space-y-1.5"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="font-medium text-sm">{{ item.name }}</div>
          <div class="text-xs text-muted-foreground">{{ item.description }}</div>
        </div>
        <span :class="cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0', statusConfig[item.status].class)">
          {{ statusConfig[item.status].label }}
        </span>
      </div>
      <div class="flex items-center justify-between text-xs">
        <span class="text-muted-foreground">{{ new Date(item.purchasedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</span>
        <span class="font-semibold">{{ formatPrice(item) }}</span>
      </div>
    </div>
  </div>
</template>
