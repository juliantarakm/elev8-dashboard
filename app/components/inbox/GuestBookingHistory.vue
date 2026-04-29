<script lang="ts" setup>
import type { GuestBookingHistoryItem } from '~/components/inbox/data/conversations'
import { format } from 'date-fns'

interface GuestBookingHistoryProps {
  bookings: GuestBookingHistoryItem[]
}

const props = defineProps<GuestBookingHistoryProps>()

const sortedBookings = computed(() =>
  [...props.bookings].sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()),
)

function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'd MMM yyyy')
}

function formatPrice(item: GuestBookingHistoryItem) {
  if (item.currency === 'IDR') {
    return `IDR ${item.totalPrice.toLocaleString()}`
  }
  return `${item.currency} ${item.totalPrice.toLocaleString()}`
}

function renderStars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}
</script>

<template>
  <div v-if="sortedBookings.length === 0" class="flex flex-col items-center justify-center py-8 text-center">
    <Icon name="lucide:clock" class="size-8 text-muted-foreground mb-2" />
    <p class="text-sm text-muted-foreground">No previous bookings</p>
  </div>

  <div v-else class="space-y-3">
    <div
      v-for="booking in sortedBookings"
      :key="booking.id"
      class="rounded-lg border p-3 space-y-2.5"
    >
      <!-- Header: date | nights | value -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-3 text-xs">
          <div class="flex items-center gap-1 text-muted-foreground">
            <Icon name="lucide:calendar" class="size-3" />
            <span>{{ formatDate(booking.checkIn) }}</span>
          </div>
          <div class="flex items-center gap-1 text-muted-foreground">
            <Icon name="lucide:moon" class="size-3" />
            <span>{{ booking.nights }}n</span>
          </div>
        </div>
        <span class="text-sm font-semibold">{{ formatPrice(booking) }}</span>
      </div>

      <!-- Listing name -->
      <div class="flex items-center gap-1.5">
        <Icon name="lucide:home" class="size-3 shrink-0 text-muted-foreground" />
        <span class="text-xs truncate">{{ booking.listingName }}</span>
      </div>

      <!-- Reviews -->
      <div v-if="booking.hostReviewOfGuest || booking.guestReviewOfProperty" class="space-y-2">
        <!-- Host review of guest -->
        <div v-if="booking.hostReviewOfGuest" class="rounded bg-muted/50 p-2 space-y-0.5">
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Host → Guest</span>
            <span class="text-[10px] text-amber-500 leading-none">{{ renderStars(booking.hostReviewOfGuest.rating) }}</span>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed">{{ booking.hostReviewOfGuest.text }}</p>
        </div>

        <!-- Guest review of property -->
        <div v-if="booking.guestReviewOfProperty" class="rounded bg-muted/50 p-2 space-y-0.5">
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Guest → Property</span>
            <span class="text-[10px] text-amber-500 leading-none">{{ renderStars(booking.guestReviewOfProperty.rating) }}</span>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed">{{ booking.guestReviewOfProperty.text }}</p>
        </div>
      </div>

      <!-- Booking link -->
      <a
        :href="booking.bookingUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1 text-[11px] text-primary hover:underline"
      >
        <Icon name="lucide:external-link" class="size-3" />
        View booking
      </a>
    </div>
  </div>
</template>
