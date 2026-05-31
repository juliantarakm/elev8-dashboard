<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{
  listing: Listing
}>()

const emit = defineEmits<{
  update: [listing: Listing]
}>()

const activeSubTab = ref('details')

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

function otaIcon(ota: string) {
  return ota === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom'
}

const allOtas = ['Airbnb', 'Booking.com']
</script>

<template>
  <Tabs v-model="activeSubTab">
    <TabsList>
      <TabsTrigger value="details">Details</TabsTrigger>
      <TabsTrigger value="channels">Distribution Channels</TabsTrigger>
    </TabsList>

    <TabsContent value="details" class="mt-4">
      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <h3 class="text-sm font-semibold">Listing Details</h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <Label for="name">Listing Name</Label>
            <Input id="name" v-model="editForm.name" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="location">Location</Label>
            <Input id="location" v-model="editForm.location" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="capacity">Capacity</Label>
            <Input id="capacity" v-model.number="editForm.capacity" type="number" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="room">Room Type</Label>
            <Input id="room" v-model="editForm.room" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="property">Property</Label>
            <Input id="property" v-model="editForm.property" />
          </div>
        </div>
        <div class="flex justify-end">
          <Button size="sm" @click="saveDetails">Save Changes</Button>
        </div>
      </div>
    </TabsContent>

    <TabsContent value="channels" class="mt-4">
      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <h3 class="text-sm font-semibold">Distribution Channels</h3>
        <div class="flex flex-col gap-3">
          <div
            v-for="ota in allOtas"
            :key="ota"
            class="flex items-center justify-between rounded-lg border p-4"
          >
            <div class="flex items-center gap-3">
              <Icon :name="otaIcon(ota)" class="size-5" />
              <span class="text-sm font-medium">{{ ota }}</span>
            </div>
            <Badge :variant="listing.otaConnected.includes(ota) ? 'default' : 'secondary'" class="text-xs">
              {{ listing.otaConnected.includes(ota) ? 'Connected' : 'Not Connected' }}
            </Badge>
          </div>
        </div>
      </div>
    </TabsContent>
  </Tabs>
</template>
