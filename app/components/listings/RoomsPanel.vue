<script setup lang="ts">
import type { Listing, Unit, UnitType } from '~/components/listings/data/listings'
import { toast } from 'vue-sonner'
import { getUnits } from '~/components/listings/data/listings'
import ListingSetupFieldPanel from '~/components/listings/ListingSetupFieldPanel.vue'
import UnitTypeManager from '~/components/listings/UnitTypeManager.vue'

const props = defineProps<{ listing: Listing }>()
const emit = defineEmits<{ update: [listing: Listing] }>()

const unitTypes = computed(() => props.listing.unitTypes ?? [])
const units = computed(() => getUnits(props.listing))

const activeUnitId = ref(props.listing.activeUnitId ?? units.value[0]?.id ?? '')

// Keep selection valid when units change
watch(units, (next) => {
  if (!next.some(u => u.id === activeUnitId.value))
    activeUnitId.value = next[0]?.id ?? ''
}, { immediate: true })

const activeUnit = computed(() => units.value.find(u => u.id === activeUnitId.value))
const activeUnitType = computed(() =>
  unitTypes.value.find(ut => ut.units.some(u => u.id === activeUnitId.value)) ?? null,
)

function selectUnit(id: string) {
  activeUnitId.value = id
}

const showAddRoom = ref(false)
const newRoomName = ref('')
const newRoomTypeId = ref(unitTypes.value[0]?.id ?? '')

watch(showAddRoom, (open) => {
  if (open) {
    newRoomName.value = ''
    newRoomTypeId.value = activeUnitType.value?.id ?? unitTypes.value[0]?.id ?? ''
  }
})

function addRoom() {
  const name = newRoomName.value.trim()
  const typeId = newRoomTypeId.value
  if (!name || !typeId)
    return
  const targetType = unitTypes.value.find(t => t.id === typeId)
  if (!targetType)
    return
  const newUnit: Unit = {
    id: `un-${Date.now()}`,
    name,
    identifier: `${targetType.identifier || targetType.name.toLowerCase().replace(/\s+/g, '')}${targetType.units.length + 1}`,
  }
  emit('update', {
    ...props.listing,
    unitTypes: unitTypes.value.map(t =>
      t.id === typeId ? { ...t, units: [...t.units, newUnit] } : t,
    ),
  })
  activeUnitId.value = newUnit.id
  showAddRoom.value = false
  toast.success(`"${name}" added to ${targetType.name}`)
}

const showTypesDialog = ref(false)

function removeRoom(unitId: string) {
  const unit = units.value.find(u => u.id === unitId)
  if (!unit)
    return
  emit('update', {
    ...props.listing,
    unitTypes: unitTypes.value.map(t => ({
      ...t,
      units: t.units.filter(u => u.id !== unitId),
    })),
  })
  if (activeUnitId.value === unitId) {
    const remaining = units.value.filter(u => u.id !== unitId)
    activeUnitId.value = remaining[0]?.id ?? ''
  }
  toast.success(`"${unit.name}" removed`)
}

const expandedTypes = ref<Set<string>>(new Set(unitTypes.value.map(t => t.id)))

function toggleType(id: string) {
  const next = new Set(expandedTypes.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expandedTypes.value = next
}

const smartLock = useSmartLock()
function getRoomLockCount(unitId: string): number {
  return smartLock.getLockCount(props.listing.id, unitId)
}
</script>

<template>
  <div class="flex h-full min-h-0">
    <!-- Sidebar: rooms grouped by type -->
    <div class="w-[240px] flex-shrink-0 border-r flex flex-col bg-muted/20">
      <div class="px-3 py-3 border-b flex-shrink-0">
        <h3 class="text-sm font-semibold">
          Rooms
        </h3>
        <p class="text-[10px] text-muted-foreground mt-0.5">
          {{ units.length }} room{{ units.length !== 1 ? 's' : '' }} across {{ unitTypes.length }} type{{ unitTypes.length !== 1 ? 's' : '' }}
        </p>
      </div>

      <div class="flex-1 overflow-y-auto min-h-0">
        <div v-if="unitTypes.length === 0" class="px-3 py-6 text-center">
          <Icon name="lucide:layers" class="size-6 text-muted-foreground/50 mx-auto mb-2" />
          <p class="text-xs text-muted-foreground">
            No room types yet
          </p>
        </div>

        <div v-else class="flex flex-col py-1">
          <div v-for="ut in unitTypes" :key="ut.id" class="flex flex-col">
            <!-- Type header -->
            <button
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              @click="toggleType(ut.id)"
            >
              <Icon
                name="lucide:chevron-right"
                class="size-3 transition-transform shrink-0"
                :class="expandedTypes.has(ut.id) ? 'rotate-90' : ''"
              />
              <Icon name="lucide:layers" class="size-3 shrink-0" />
              <span class="flex-1 text-left truncate">{{ ut.name }}</span>
              <span class="text-[10px] text-muted-foreground">{{ ut.units.length }}</span>
            </button>

            <!-- Rooms in this type -->
            <div v-if="expandedTypes.has(ut.id)" class="flex flex-col">
              <button
                v-for="unit in ut.units"
                :key="unit.id"
                type="button"
                class="group flex items-center gap-1.5 pl-7 pr-2 py-1.5 text-xs hover:bg-accent transition-colors w-full text-left"
                :class="activeUnitId === unit.id ? 'bg-accent text-accent-foreground font-medium' : ''"
                @click="selectUnit(unit.id)"
              >
                <Icon
                  :name="activeUnitId === unit.id ? 'lucide:door-open' : 'lucide:door-closed'"
                  class="size-3 shrink-0"
                  :class="activeUnitId === unit.id ? 'text-primary' : 'text-muted-foreground'"
                />
                <span class="flex-1 truncate" :class="unit.status === 'inactive' ? 'text-muted-foreground line-through' : ''">
                  {{ unit.name }}
                </span>
                <span
                  v-if="getRoomLockCount(unit.id) > 0"
                  class="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-700"
                  :title="`${getRoomLockCount(unit.id)} smart lock${getRoomLockCount(unit.id) !== 1 ? 's' : ''} paired`"
                >
                  <Icon name="lucide:lock" class="size-2.5" />
                  {{ getRoomLockCount(unit.id) }}
                </span>
                <button
                  v-if="ut.units.length > 1"
                  type="button"
                  class="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  @click.stop="removeRoom(unit.id)"
                >
                  <Icon name="lucide:x" class="size-3" />
                </button>
              </button>

              <!-- No rooms placeholder -->
              <p v-if="ut.units.length === 0" class="pl-7 pr-3 py-1.5 text-[10px] text-muted-foreground italic">
                No rooms in this type
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar footer actions -->
      <div class="border-t p-3 flex flex-col gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="default"
          class="w-full gap-2 text-sm justify-start h-10"
          @click="showAddRoom = true"
        >
          <Icon name="lucide:plus" class="size-4" />
          Add Room
        </Button>
        <Button
          variant="ghost"
          size="default"
          class="w-full gap-2 text-sm justify-start h-10 text-muted-foreground"
          @click="showTypesDialog = true"
        >
          <Icon name="lucide:settings-2" class="size-4" />
          Manage Room Types
        </Button>
      </div>
    </div>

    <!-- Main area: room editor -->
    <div class="flex-1 min-w-0 flex flex-col">
      <div v-if="activeUnit" class="flex-1 min-h-0">
        <ListingSetupFieldPanel
          :listing="listing"
          view-mode="unit"
          :active-unit-id="activeUnitId"
          @update="emit('update', $event)"
        />
      </div>
      <div v-else class="flex-1 flex items-center justify-center">
        <div class="text-center max-w-sm px-6">
          <Icon name="lucide:door-open" class="size-10 text-muted-foreground/50 mx-auto mb-3" />
          <p class="text-sm font-medium">
            No room selected
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            Add a room or pick one from the sidebar to start editing.
          </p>
          <Button size="sm" class="mt-4 gap-1.5" @click="showAddRoom = true">
            <Icon name="lucide:plus" class="size-3.5" />
            Add your first room
          </Button>
        </div>
      </div>
    </div>

    <!-- Add Room Dialog -->
    <Dialog v-model:open="showAddRoom">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Room</DialogTitle>
          <DialogDescription>
            Add a new room to one of your room types.
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4 py-2">
          <div class="flex flex-col gap-1.5">
            <Label>Room Type</Label>
            <Select :model-value="newRoomTypeId" @update:model-value="(v) => newRoomTypeId = String(v)">
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="ut in unitTypes" :key="ut.id" :value="ut.id">
                  {{ ut.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Room Name *</Label>
            <Input v-model="newRoomName" placeholder="e.g., Master Suite, Garden Unit" @keydown.enter="addRoom" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" @click="showAddRoom = false">
            Cancel
          </Button>
          <Button size="sm" :disabled="!newRoomName.trim() || !newRoomTypeId" @click="addRoom">
            <Icon name="lucide:check" class="size-3.5 mr-1.5" />
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Manage Room Types Dialog -->
    <Dialog v-model:open="showTypesDialog">
      <DialogContent class="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader class="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle class="flex items-center gap-2">
            <Icon name="lucide:settings-2" class="size-4" />
            Manage Room Types
          </DialogTitle>
          <DialogDescription>
            Add, edit, or remove room types for {{ listing.name }}.
          </DialogDescription>
        </DialogHeader>
        <div class="flex-1 overflow-y-auto min-h-0 px-6 py-4">
          <UnitTypeManager :listing="listing" @update="emit('update', $event)" />
        </div>
        <DialogFooter class="px-6 py-4 border-t flex-shrink-0">
          <Button size="sm" @click="showTypesDialog = false">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
