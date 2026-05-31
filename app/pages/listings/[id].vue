<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'
import { listings } from '~/components/listings/data/listings'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const listingIndex = computed(() => listings.findIndex(l => l.id === route.params.id))
const listing = computed(() => listingIndex.value !== -1 ? listings[listingIndex.value] : undefined)

function updateListing(updated: Listing) {
  if (listingIndex.value !== -1) {
    listings[listingIndex.value] = updated
  }
}

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
    <ListingHero :listing="listing" />

    <Tabs v-model="activeTab">
      <TabsList>
        <TabsTrigger value="overview">
          <Icon name="lucide:layout-grid" class="mr-2 size-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Icon name="lucide:settings" class="mr-2 size-4" />
          Property Settings
        </TabsTrigger>
        <TabsTrigger value="schedule">
          <Icon name="lucide:clock" class="mr-2 size-4" />
          AI Schedule
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" class="mt-4">
        <ListingOverview :listing="listing" @update="updateListing" />
      </TabsContent>

      <TabsContent value="settings" class="mt-4">
        <ListingPropertySettings :listing="listing" @update="updateListing" />
      </TabsContent>

      <TabsContent value="schedule" class="mt-4">
        <ListingAiSchedule :listing="listing" @update="updateListing" />
      </TabsContent>
    </Tabs>
  </div>
</template>
