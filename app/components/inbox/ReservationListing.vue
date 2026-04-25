<script lang="ts" setup>
import type { ListingDetails } from '~/components/inbox/data/conversations'

interface ReservationListingProps {
  listing: ListingDetails
}

const props = defineProps<ReservationListingProps>()
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <div class="font-semibold text-sm">{{ listing.name }}</div>
      <div class="text-sm text-muted-foreground">{{ listing.property }}</div>
      <div class="text-sm text-muted-foreground">{{ listing.room }}</div>
    </div>

    <div class="space-y-2">
      <div class="text-sm font-medium">Amenities</div>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="amenity of listing.amenities"
          :key="amenity"
          class="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
        >
          {{ amenity }}
        </span>
      </div>
    </div>
  </div>
</template>