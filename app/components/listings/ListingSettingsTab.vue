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

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const schedule = computed(() => props.listing.aiSchedule)
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

function toggleAi() {
  const newStatus = props.listing.aiStatus === 'active' ? 'paused' : 'active'
  emit('update', { ...props.listing, aiStatus: newStatus, aiSchedule: { ...schedule.value, enabled: newStatus === 'active' } })
}
function updateSchedule(patch: Partial<typeof schedule.value>) {
  emit('update', { ...props.listing, aiSchedule: { ...schedule.value, ...patch } })
}
function toggleDay(day: number) {
  const days = schedule.value.activeDays.includes(day)
    ? schedule.value.activeDays.filter(d => d !== day)
    : [...schedule.value.activeDays, day]
  updateSchedule({ activeDays: days })
}
const previewHours = computed(() => {
  const start = parseInt(schedule.value.activeHours.start.split(':')[0]!)
  const end = parseInt(schedule.value.activeHours.end.split(':')[0]!)
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    active: start <= end ? (i >= start && i < end) : (i >= start || i < end),
  }))
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">Property Details</h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <Label>Listing Name</Label>
          <Input v-model="editForm.name" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Location</Label>
          <Input v-model="editForm.location" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Capacity</Label>
          <Input v-model.number="editForm.capacity" type="number" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Room Type</Label>
          <Input v-model="editForm.room" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Property</Label>
          <Input v-model="editForm.property" />
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <Button size="sm" @click="saveDetails">Save Changes</Button>
      </div>
    </Card>

    <Separator />

    <Card class="p-5">
      <div class="flex items-center justify-between mb-4">
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
                >{{ amenity }}</div>
                <p v-if="filteredAmenities.length === 0" class="px-2 py-1.5 text-xs text-muted-foreground">No amenities found.</p>
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
    </Card>

    <Separator />

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

    <Separator />

    <Card class="p-5">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-full" :class="listing.aiStatus === 'active' ? 'bg-[#C8A84B]/10' : 'bg-muted'">
            <Icon :name="listing.aiStatus === 'active' ? 'lucide:bot' : 'lucide:bot-off'" class="size-5" :class="listing.aiStatus === 'active' ? 'text-[#C8A84B]' : 'text-muted-foreground'" />
          </div>
          <div>
            <p class="text-sm font-semibold">ElevAI {{ listing.aiStatus === 'active' ? 'Active' : 'Paused' }}</p>
            <p class="text-xs text-muted-foreground">Automated guest messaging</p>
          </div>
        </div>
        <Switch :checked="listing.aiStatus === 'active'" @update:checked="toggleAi" />
      </div>

      <div v-if="schedule.enabled" class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-2">
          <Label>Repeat</Label>
          <Select :model-value="schedule.repeatType" @update:model-value="(val) => updateSchedule({ repeatType: val as 'weekly' | 'monthly' })">
            <SelectTrigger class="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex flex-col gap-2">
          <Label>Active Days</Label>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="(day, index) in dayNames"
              :key="index"
              variant="outline"
              size="sm"
              class="h-9 w-12 text-xs"
              :class="schedule.activeDays.includes(index) ? 'border-primary text-primary bg-primary/5' : ''"
              @click="toggleDay(index)"
            >{{ day }}</Button>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <Label>Active Hours</Label>
          <div class="flex items-center gap-3">
            <Select :model-value="schedule.activeHours.start" @update:model-value="(val) => updateSchedule({ activeHours: { ...schedule.activeHours, start: val as string } })">
              <SelectTrigger class="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="h in hours" :key="h" :value="h">{{ h }}</SelectItem>
              </SelectContent>
            </Select>
            <span class="text-sm text-muted-foreground">to</span>
            <Select :model-value="schedule.activeHours.end" @update:model-value="(val) => updateSchedule({ activeHours: { ...schedule.activeHours, end: val as string } })">
              <SelectTrigger class="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="h in hours" :key="h" :value="h">{{ h }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="mt-2">
            <p class="text-xs text-muted-foreground mb-2">24h Preview</p>
            <div class="flex gap-0.5">
              <div
                v-for="item in previewHours"
                :key="item.hour"
                class="flex-1 h-6 rounded-sm transition-colors"
                :class="item.active ? 'bg-[#C8A84B]' : 'bg-muted'"
                :title="`${String(item.hour).padStart(2, '0')}:00`"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
