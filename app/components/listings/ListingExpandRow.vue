<script setup lang="ts">
import { toast } from 'vue-sonner'
import { listings } from '~/components/listings/data/listings'

const props = defineProps<{ listingId: string }>()

const listing = computed(() => listings.value.find(l => l.id === props.listingId)!)

function otaIcon(ota: string) {
  return ota === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom'
}

function toggleProperty() {
  const idx = listings.value.findIndex(l => l.id === props.listingId)
  if (idx === -1)
    return
  const allOff = (listings.value[idx]!.units ?? []).every(u => u.status === 'inactive')
  // if all off → turn all on; if any on → turn all off
  const newUnitStatus = allOff ? 'active' : 'inactive'
  const units = (listings.value[idx]!.units ?? []).map(u => ({
    ...u,
    status: newUnitStatus as 'active' | 'inactive',
    aiStatus: newUnitStatus === 'inactive' ? 'paused' : ('active' as 'active' | 'paused'),
  }))
  const newStatus = newUnitStatus === 'inactive' ? 'inactive' : 'active'
  listings.value[idx] = { ...listings.value[idx]!, status: newStatus, aiStatus: newStatus === 'inactive' ? 'paused' : 'active', units }
  toast[newStatus === 'inactive' ? 'info' : 'success'](`All units ${newStatus === 'inactive' ? 'deactivated' : 'activated'}`)
}

function toggleUnit(unitId: string) {
  const idx = listings.value.findIndex(l => l.id === props.listingId)
  if (idx === -1)
    return
  const units = (listings.value[idx]!.units ?? []).map((u) => {
    if (u.id !== unitId)
      return u
    const deactivating = u.status !== 'inactive'
    return {
      ...u,
      status: (deactivating ? 'inactive' : 'active') as 'active' | 'inactive',
      aiStatus: deactivating ? 'paused' : ('active' as 'active' | 'paused'),
    }
  })
  // derive property status from units
  const allOff = units.every(u => u.status === 'inactive')
  const newStatus = allOff ? 'inactive' : 'active'
  listings.value[idx] = { ...listings.value[idx]!, status: newStatus, aiStatus: allOff ? 'paused' : 'active', units }
  const toggled = units.find(u => u.id === unitId)
  toast[toggled?.status === 'inactive' ? 'info' : 'success'](`${toggled?.name} ${toggled?.status === 'inactive' ? 'deactivated' : 'activated'}`)
}

function toggleUnitAi(unitId: string) {
  const idx = listings.value.findIndex(l => l.id === props.listingId)
  if (idx === -1)
    return
  const units = (listings.value[idx]!.units ?? []).map((u) => {
    if (u.id !== unitId)
      return u
    const current = u.aiStatus ?? listing.value.aiStatus
    return { ...u, aiStatus: (current === 'active' ? 'paused' : 'active') as 'active' | 'paused' }
  })
  listings.value[idx] = { ...listings.value[idx]!, units }
}
</script>

<template>
  <div v-if="listing" class="mt-2 border-l-2 border-muted ml-1 pl-3 space-y-1">
    <!-- Property-level toggle -->
    <div class="flex items-center justify-between gap-2 py-1">
      <span class="text-xs font-medium text-muted-foreground">Property</span>
      <Switch
        :model-value="(listing.units ?? []).some(u => u.status !== 'inactive')"
        @update:model-value="toggleProperty"
      />
    </div>
    <div class="border-t border-muted" />

    <!-- Per-unit rows -->
    <div
      v-for="unit in listing.units"
      :key="unit.id"
      class="flex items-center justify-between gap-2 py-1"
    >
      <div class="flex items-center gap-1.5 min-w-0 flex-1">
        <Icon name="lucide:door-open" class="size-3 shrink-0" :class="unit.status === 'inactive' ? 'text-muted-foreground/40' : 'text-muted-foreground'" />
        <span class="text-xs truncate" :class="unit.status === 'inactive' ? 'text-muted-foreground/50 line-through' : ''">{{ unit.name }}</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <!-- AI toggle badge -->
        <button
          type="button"
          class="text-[10px] px-1.5 py-0.5 rounded transition-colors"
          :class="(unit.aiStatus ?? listing.aiStatus) === 'active' ? 'bg-[#C8A84B]/15 text-[#C8A84B]' : 'bg-muted text-muted-foreground'"
          @click.stop="toggleUnitAi(unit.id)"
        >
          {{ (unit.aiStatus ?? listing.aiStatus) === 'active' ? 'AI On' : 'AI Off' }}
        </button>
        <!-- OTA icons -->
        <template v-for="ota in (unit.otaConnected ?? listing.otaConnected)" :key="ota">
          <Icon :name="otaIcon(ota)" class="size-3" :class="unit.status === 'inactive' ? 'opacity-30' : ''" />
        </template>
        <!-- Unit toggle -->
        <Switch
          :model-value="unit.status !== 'inactive'"
          @update:model-value="toggleUnit(unit.id)"
        />
      </div>
    </div>
  </div>
</template>
