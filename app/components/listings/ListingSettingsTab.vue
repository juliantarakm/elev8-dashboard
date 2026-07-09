<script setup lang="ts">
import type { Listing, Unit, UnitType } from '~/components/listings/data/listings'
import { toast } from 'vue-sonner'

const props = defineProps<{ listing: Listing }>()
const emit = defineEmits<{ update: [listing: Listing] }>()

const smartLock = useSmartLock()

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
  'Pool', 'WiFi', 'AC', 'Kitchen', 'Parking', 'Garden', 'Beach Access', 'Rooftop Deck',
  'Plunge Pool', 'Yoga Deck', 'Hammock Deck', 'Nature Bath', 'Ocean View', 'Cliff Deck',
  'Surfboard Storage', 'Mountain View', 'Hot Tub', 'Fireplace', 'River View', 'Bamboo Construction',
]
const amenitySearch = ref('')
const amenityPopoverOpen = ref(false)
const filteredAmenities = computed(() => {
  const available = allAmenities.filter(a => !props.listing.amenities.includes(a))
  if (!amenitySearch.value)
    return available
  return available.filter(a => a.toLowerCase().includes(amenitySearch.value.toLowerCase()))
})
function addAmenity(amenity: string) { emit('update', { ...props.listing, amenities: [...props.listing.amenities, amenity] }) }
function removeAmenity(amenity: string) { emit('update', { ...props.listing, amenities: props.listing.amenities.filter(a => a !== amenity) }) }

function otaIcon(ota: string) { return ota === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom' }
const allOtas = ['Airbnb', 'Booking.com']

// Smart Lock state
const unitTypes = computed(() => props.listing.unitTypes ?? [])
const listingLocks = computed(() => smartLock.getLocksForListing(props.listing.id))
const availableDevices = computed(() => smartLock.availableDevices.value)

const showPairDialog = ref(false)
const pairTarget = ref<{ kind: 'property' | 'room', unitId?: string, unitName?: string }>({ kind: 'property' })
const selectedDeviceId = ref('')
const newLockName = ref('')
const newLockIsMain = ref(false)
const renameLockId = ref<string | null>(null)
const renameValue = ref('')

function openPairDialog(kind: 'property' | 'room', unitId?: string, unitName?: string) {
  pairTarget.value = { kind, unitId, unitName }
  selectedDeviceId.value = ''
  newLockName.value = ''
  newLockIsMain.value = listingLocks.value.filter(l => kind === 'room' ? l.unitId === unitId : !l.unitId).length === 0
  showPairDialog.value = true
}

function handlePair() {
  if (!selectedDeviceId.value) return
  const result = smartLock.pairLock({
    seamDeviceId: selectedDeviceId.value,
    name: newLockName.value.trim(),
    assignment: pairTarget.value.kind,
    listingId: props.listing.id,
    unitId: pairTarget.value.unitId,
    isMain: newLockIsMain.value,
  })
  if (!result.success) {
    toast.error(result.error ?? 'Failed to pair lock.')
    return
  }
  toast.success(`"${result.lock!.name}" paired.`)
  showPairDialog.value = false
}

function handleUnpair(lockId: string, name: string) {
  smartLock.unpairLock(lockId)
  toast.info(`"${name}" unpaired.`)
}

function handleSetMain(lockId: string) {
  smartLock.setMainLock(lockId)
  toast.success('Main lock updated.')
}

function startRename(lockId: string, currentName: string) {
  renameLockId.value = lockId
  renameValue.value = currentName
}

function commitRename() {
  if (!renameLockId.value || !renameValue.value.trim()) {
    renameLockId.value = null
    return
  }
  smartLock.renameLock(renameLockId.value, renameValue.value.trim())
  renameLockId.value = null
  toast.success('Lock renamed.')
}

function getUnitName(unitId?: string): string {
  if (!unitId) return ''
  for (const ut of unitTypes.value) {
    const u = ut.units.find(x => x.id === unitId)
    if (u) return u.name
  }
  return ''
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">
        Distribution Channels
      </h3>
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

    <!-- Smart Locks -->
    <Card class="p-5">
      <div class="mb-4 flex items-end justify-between gap-2">
        <div>
          <h3 class="text-sm font-semibold">
            Smart Locks
          </h3>
          <p class="text-xs text-muted-foreground mt-0.5">
            Pair Seam devices to this property or specific rooms. Guest access codes can be auto-shared via the Inbox.
          </p>
        </div>
        <Button
          v-if="smartLock.isConnected.value"
          size="sm"
          class="gap-1.5"
          :disabled="availableDevices.length === 0"
          @click="openPairDialog('property')"
        >
          <Icon name="lucide:plus" class="size-3.5" />
          Add Lock
        </Button>
      </div>

      <!-- Not connected -->
      <div v-if="!smartLock.isConnected.value" class="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
        <Icon name="lucide:key-round" class="mx-auto mb-2 size-6 text-muted-foreground/60" />
        <p class="text-sm text-muted-foreground">
          Connect Seam in
          <NuxtLink to="/settings/integrations" class="text-primary underline">
            Settings → Integrations
          </NuxtLink>
          to pair smart locks.
        </p>
      </div>

      <!-- No locks yet -->
      <div v-else-if="listingLocks.length === 0" class="rounded-lg border border-dashed p-6 text-center">
        <p class="text-sm text-muted-foreground">
          No locks paired to this property yet.
        </p>
      </div>

      <!-- Lock list -->
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="lock in listingLocks"
          :key="lock.id"
          class="flex items-center gap-3 rounded-lg border p-3"
        >
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-md border"
            :class="lock.online ? 'bg-green-500/10' : 'bg-muted'"
          >
            <Icon
              :name="lock.online ? 'lucide:lock' : 'lucide:lock-open'"
              class="size-4"
              :class="lock.online ? 'text-green-600' : 'text-muted-foreground'"
            />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <input
                v-if="renameLockId === lock.id"
                v-model="renameValue"
                class="text-sm font-medium bg-transparent border-b border-primary outline-none"
                @keydown.enter="commitRename"
                @keydown.esc="renameLockId = null"
                @blur="commitRename"
              >
              <p v-else class="truncate text-sm font-medium">
                {{ lock.name }}
              </p>
              <Badge v-if="lock.isMain" variant="default" class="text-[9px] px-1 py-0">
                Main
              </Badge>
              <span
                v-if="!lock.isMain"
                class="cursor-pointer text-muted-foreground hover:text-foreground"
                title="Set as main"
                @click="handleSetMain(lock.id)"
              >
                <Icon name="lucide:star" class="size-3" />
              </span>
            </div>
            <div class="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span class="inline-flex items-center gap-0.5">
                <Icon name="lucide:battery" class="size-3" :class="lock.batteryLevel <= 20 ? 'text-amber-500' : 'text-muted-foreground'" />
                {{ lock.batteryLevel }}%
              </span>
              <span>·</span>
              <span>{{ lock.assignment === 'room' ? `Room: ${getUnitName(lock.unitId)}` : 'Property' }}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            @click="startRename(lock.id, lock.name)"
          >
            <Icon name="lucide:pencil" class="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            @click="handleUnpair(lock.id, lock.name)"
          >
            <Icon name="lucide:trash-2" class="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>

    <!-- Pair Lock Dialog -->
    <Dialog v-model:open="showPairDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pair Smart Lock</DialogTitle>
          <DialogDescription>
            Select a device from your Seam workspace to pair to
            <span v-if="pairTarget.kind === 'room'">room <strong>{{ pairTarget.unitName }}</strong></span>
            <span v-else>this property</span>.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-2">
          <div class="space-y-2">
            <Label>Seam Device</Label>
            <div v-if="availableDevices.length === 0" class="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              All available devices are already paired. Disconnect one to pair another.
            </div>
            <div v-else class="space-y-1.5 max-h-56 overflow-y-auto">
              <button
                v-for="device in availableDevices"
                :key="device.deviceId"
                type="button"
                class="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                :class="selectedDeviceId === device.deviceId ? 'border-primary bg-primary/5' : ''"
                @click="selectedDeviceId = device.deviceId; newLockName = device.name"
              >
                <Icon
                  :name="device.online ? 'lucide:wifi' : 'lucide:wifi-off'"
                  class="size-4 shrink-0"
                  :class="device.online ? 'text-green-600' : 'text-muted-foreground'"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ device.name }}</p>
                  <p class="truncate text-[11px] text-muted-foreground">
                    {{ device.model }} · {{ device.provider }}
                  </p>
                </div>
                <span
                  class="text-[11px] font-medium"
                  :class="device.batteryLevel <= 20 ? 'text-amber-600' : 'text-muted-foreground'"
                >
                  {{ device.batteryLevel }}%
                </span>
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <Label>Lock Name (optional)</Label>
            <Input v-model="newLockName" placeholder="e.g., Front Door" />
          </div>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="newLockIsMain"
              type="checkbox"
              class="size-4 rounded border-input accent-primary"
            >
            <span class="text-sm">Set as main lock for this {{ pairTarget.kind === 'room' ? 'room' : 'property' }}</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" @click="showPairDialog = false">
            Cancel
          </Button>
          <Button size="sm" :disabled="!selectedDeviceId" class="gap-1.5" @click="handlePair">
            <Icon name="lucide:link" class="size-3.5" />
            Pair Lock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
