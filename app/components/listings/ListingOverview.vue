<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'
import { allTags } from '~/components/listings/data/listings'

const props = defineProps<{
  listing: Listing
}>()

const emit = defineEmits<{
  update: [listing: Listing]
}>()

const stats = computed(() => [
  { label: 'Capacity', value: `${props.listing.capacity} guests`, icon: 'lucide:users' },
  { label: 'Room Type', value: props.listing.room, icon: 'lucide:bed-double' },
  { label: 'Property', value: props.listing.property, icon: 'lucide:building-2' },
  { label: 'Location', value: props.listing.location, icon: 'lucide:map-pin' },
])

function otaIcon(ota: string) {
  return ota === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom'
}

const allAmenities = [
  'Pool', 'WiFi', 'AC', 'Kitchen', 'Parking', 'Garden', 'Beach Access',
  'Rooftop Deck', 'Plunge Pool', 'Yoga Deck', 'Hammock Deck', 'Nature Bath',
  'Ocean View', 'Cliff Deck', 'Surfboard Storage', 'Mountain View', 'Hot Tub',
  'Fireplace', 'River View', 'Bamboo Construction',
]

const amenitySearch = ref('')
const amenityPopoverOpen = ref(false)

const filteredAmenities = computed(() => {
  const available = allAmenities.filter(a => !props.listing.amenities.includes(a))
  if (!amenitySearch.value) return available
  return available.filter(a => a.toLowerCase().includes(amenitySearch.value.toLowerCase()))
})

function addAmenity(amenity: string) {
  const updated = { ...props.listing, amenities: [...props.listing.amenities, amenity] }
  emit('update', updated)
}

function removeAmenity(amenity: string) {
  const updated = { ...props.listing, amenities: props.listing.amenities.filter(a => a !== amenity) }
  emit('update', updated)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div v-for="stat in stats" :key="stat.label" class="flex items-center gap-3 rounded-lg border p-4">
        <div class="flex size-9 items-center justify-center rounded-full bg-muted">
          <Icon :name="stat.icon" class="size-4 text-muted-foreground" />
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-muted-foreground">{{ stat.label }}</span>
          <span class="text-sm font-medium">{{ stat.value }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold">Amenities</h3>
          <Popover v-model:open="amenityPopoverOpen">
            <PopoverTrigger as-child>
              <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs">
                <Icon name="lucide:plus" class="size-3" />
                Add
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-56 p-0" align="end">
              <div class="p-2">
                <Input v-model="amenitySearch" placeholder="Search amenities..." class="h-7 text-xs" />
              </div>
              <ScrollArea class="h-48">
                <div class="space-y-1">
                  <div
                    v-for="amenity in filteredAmenities"
                    :key="amenity"
                    class="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    @click="addAmenity(amenity)"
                  >
                    {{ amenity }}
                  </div>
                  <p v-if="filteredAmenities.length === 0" class="px-2 py-1.5 text-xs text-muted-foreground">
                    No amenities found.
                  </p>
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="amenity in listing.amenities"
            :key="amenity"
            variant="secondary"
            class="text-xs gap-1 cursor-pointer"
            @click="removeAmenity(amenity)"
          >
            {{ amenity }}
            <Icon name="lucide:x" class="size-3" />
          </Badge>
        </div>
      </div>

      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <h3 class="text-sm font-semibold">OTA Connections</h3>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="ota in listing.otaConnected"
            :key="ota"
            class="flex items-center gap-2 rounded-full border px-3 py-1.5"
          >
            <Icon :name="otaIcon(ota)" class="size-4" />
            <span class="text-sm">{{ ota }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <h3 class="text-sm font-semibold">Tags</h3>
        <div class="flex flex-wrap gap-2">
          <Badge v-for="tag in listing.tags" :key="tag" variant="outline" class="text-xs">
            {{ tag }}
          </Badge>
        </div>
      </div>
    </div>
  </div>
</template>
