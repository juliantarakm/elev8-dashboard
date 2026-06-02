<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing }>()
const emit = defineEmits<{ update: [listing: Listing] }>()

const editForm = ref({
  name: props.listing.name,
  location: props.listing.location,
  capacity: props.listing.capacity,
  room: props.listing.room,
  property: props.listing.property,
})

watch(() => props.listing, (l) => {
  editForm.value = { name: l.name, location: l.location, capacity: l.capacity, room: l.room, property: l.property }
})

function saveDetails() {
  emit('update', { ...props.listing, ...editForm.value, capacity: Number(editForm.value.capacity) })
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
function addAmenity(amenity: string) { emit('update', { ...props.listing, amenities: [...props.listing.amenities, amenity] }) }
function removeAmenity(amenity: string) { emit('update', { ...props.listing, amenities: props.listing.amenities.filter(a => a !== amenity) }) }

function otaIcon(ota: string) { return ota === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom' }
const allOtas = ['Airbnb', 'Booking.com']
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">Distribution Channels</h3>
      <div class="flex flex-col gap-3">
        <div v-for="ota in allOtas" :key="ota" class="flex items-center justify-between rounded-lg border p-4">
          <div class="flex items-center gap-3">
            <Icon :name="otaIcon(ota)" class="size-5" />
            <span class="text-sm font-medium">{{ ota }}</span>
          </div>
          <Badge :variant="listing.otaConnected.includes(ota) ? 'default' : 'secondary'" class="text-xs">
            {{ listing.otaConnected.includes(ota) ? 'Connected' : 'Not Connected' }}
          </Badge>
        </div>
      </div>
    </Card>
  </div>
</template>
