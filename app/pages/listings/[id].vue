<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'
import { listings } from '~/components/listings/data/listings'
import ListingHeroCompact from '~/components/listings/ListingHeroCompact.vue'
import ListingOverviewTab from '~/components/listings/ListingOverviewTab.vue'
import ListingPricingTab from '~/components/listings/ListingPricingTab.vue'
import ListingCalendarTab from '~/components/listings/ListingCalendarTab.vue'
import ListingReviewsTab from '~/components/listings/ListingReviewsTab.vue'
import ListingMaintenanceTab from '~/components/listings/ListingMaintenanceTab.vue'
import ListingSettingsTab from '~/components/listings/ListingSettingsTab.vue'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const listingIndex = computed(() => listings.value.findIndex(l => l.id === route.params.id))
const listing = computed(() => listingIndex.value !== -1 ? listings.value[listingIndex.value] : undefined)

function updateListing(updated: Listing) {
  if (listingIndex.value !== -1) {
    listings.value[listingIndex.value] = updated
  }
}

const activeRoomId = computed(() => listing.value?.activeRoomId ?? listing.value?.rooms?.[0]?.id ?? null)
const activeRoom = computed(() => listing.value?.rooms?.find(r => r.id === activeRoomId.value) ?? null)

const activeTab = ref('overview')
</script>

<template>
  <div v-if="!listing" class="flex flex-col items-center justify-center gap-4 py-24">
    <Icon name="lucide:alert-circle" class="size-12 text-muted-foreground" />
    <h2 class="text-lg font-semibold">Listing not found</h2>
    <Button variant="outline" size="sm" @click="router.push('/listings')">
      <Icon name="lucide:arrow-left" class="size-4" />
      Back to Listings
    </Button>
  </div>

  <div v-else class="flex flex-col gap-6">
    <ListingHeroCompact :listing="listing" @update="updateListing" />

    <Tabs v-model="activeTab" :key="activeRoomId ?? 'no-room'">
      <TabsList>
        <TabsTrigger value="overview">
          <Icon name="lucide:layout-grid" class="mr-1.5 size-3.5" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="pricing">
          <Icon name="lucide:dollar-sign" class="mr-1.5 size-3.5" />
          Pricing
        </TabsTrigger>
        <TabsTrigger value="calendar">
          <Icon name="lucide:calendar" class="mr-1.5 size-3.5" />
          Calendar
        </TabsTrigger>
        <TabsTrigger value="reviews">
          <Icon name="lucide:star" class="mr-1.5 size-3.5" />
          Reviews
        </TabsTrigger>
        <TabsTrigger value="maintenance">
          <Icon name="lucide:wrench" class="mr-1.5 size-3.5" />
          Maintenance
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Icon name="lucide:settings" class="mr-1.5 size-3.5" />
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" class="mt-6">
        <ListingOverviewTab :listing="listing" :active-room="activeRoom" @switch-tab="activeTab = $event" />
      </TabsContent>

      <TabsContent value="pricing" class="mt-6">
        <ListingPricingTab :listing="listing" :active-room="activeRoom" @update="updateListing" />
      </TabsContent>

      <TabsContent value="calendar" class="mt-6">
        <ListingCalendarTab :listing="listing" :active-room="activeRoom" />
      </TabsContent>

      <TabsContent value="reviews" class="mt-6">
        <ListingReviewsTab :listing="listing" :active-room="activeRoom" @update="updateListing" />
      </TabsContent>

      <TabsContent value="maintenance" class="mt-6">
        <ListingMaintenanceTab :listing="listing" :active-room="activeRoom" @update="updateListing" />
      </TabsContent>

      <TabsContent value="settings" class="mt-6">
        <ListingSettingsTab :listing="listing" @update="updateListing" />
      </TabsContent>
    </Tabs>
  </div>
</template>
