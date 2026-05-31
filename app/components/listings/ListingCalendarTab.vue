<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing }>()

const bookingStatusColors: Record<string, string> = {
  confirmed: 'default',
  pending: 'secondary',
  cancelled: 'destructive',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const sortedBookings = computed(() =>
  [...props.listing.bookings].sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">All Bookings</h3>
      <div class="flex flex-col gap-3">
        <div
          v-for="booking in sortedBookings"
          :key="booking.id"
          class="flex items-center justify-between rounded-lg border p-4"
        >
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium">{{ booking.guestName }}</span>
            <span class="text-xs text-muted-foreground">
              {{ formatDate(booking.checkIn) }} → {{ formatDate(booking.checkOut) }} · {{ booking.nights }} nights
            </span>
            <span class="text-xs text-muted-foreground">via {{ booking.source }}</span>
          </div>
          <div class="flex flex-col items-end gap-1">
            <Badge :variant="(bookingStatusColors[booking.status] as any)" class="text-xs capitalize">{{ booking.status }}</Badge>
            <span class="text-sm font-medium">${{ booking.revenue }}</span>
          </div>
        </div>
        <p v-if="sortedBookings.length === 0" class="text-sm text-muted-foreground text-center py-4">No bookings yet</p>
      </div>
    </Card>

    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">Blocked Dates</h3>
      <div v-if="listing.blockedDates.length > 0" class="flex flex-wrap gap-2">
        <Badge v-for="date in listing.blockedDates" :key="date" variant="outline" class="text-xs">
          {{ formatDate(date) }}
        </Badge>
      </div>
      <p v-else class="text-sm text-muted-foreground">No blocked dates.</p>
    </Card>
  </div>
</template>
