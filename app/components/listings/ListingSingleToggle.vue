<script setup lang="ts">
import { listings } from '~/components/listings/data/listings'
import { toast } from 'vue-sonner'

const props = defineProps<{ listingId: string }>()

const listing = computed(() => listings.value.find(l => l.id === props.listingId)!)

function toggle() {
  const idx = listings.value.findIndex(l => l.id === props.listingId)
  if (idx === -1) return
  const isMulti = listings.value[idx]!.unitType === 'multi'
  const newStatus = listing.value.status === 'inactive' ? 'active' : 'inactive'
  if (isMulti) {
    const isOn = (listings.value[idx]!.units ?? []).some(u => u.status !== 'inactive')
    const newUnitStatus = isOn ? 'inactive' : 'active'
    const units = (listings.value[idx]!.units ?? []).map(u => ({
      ...u,
      status: newUnitStatus as 'active' | 'inactive',
      aiStatus: newUnitStatus === 'inactive' ? 'paused' : ('active' as 'active' | 'paused'),
    }))
    listings.value[idx] = { ...listings.value[idx]!, status: newUnitStatus, aiStatus: newUnitStatus === 'inactive' ? 'paused' : 'active', units }
    toast[newUnitStatus === 'inactive' ? 'info' : 'success'](`Listing ${newUnitStatus === 'inactive' ? 'deactivated' : 'activated'}`)
  }
  else {
    listings.value[idx] = { ...listings.value[idx]!, status: newStatus, aiStatus: newStatus === 'inactive' ? 'paused' : 'active' }
    toast[newStatus === 'inactive' ? 'info' : 'success'](`Listing ${newStatus === 'inactive' ? 'deactivated' : 'activated'}`)
  }
}
</script>

<template>
  <Switch
    v-if="listing"
    :model-value="listing.unitType === 'multi' ? (listing.units ?? []).some(u => u.status !== 'inactive') : listing.status !== 'inactive'"
    @update:model-value="toggle"
  />
</template>
