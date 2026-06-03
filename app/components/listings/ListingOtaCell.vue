<script setup lang="ts">
import { listings } from '~/components/listings/data/listings'

const props = defineProps<{ listingId: string }>()

function otaIcon(ota: string) {
  return ota === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom'
}

const live = computed(() => listings.value.find(l => l.id === props.listingId))
const otas = computed(() => live.value?.otaConnected ?? [])
const inactive = computed(() => {
  if (!live.value) return false
  if (live.value.unitType === 'multi') return (live.value.units ?? []).every(u => u.status === 'inactive')
  return live.value.status === 'inactive'
})
</script>

<template>
  <div class="flex items-center gap-2" :class="inactive ? 'opacity-40' : ''">
    <Icon v-for="ota in otas" :key="ota" :name="otaIcon(ota)" class="size-4" />
  </div>
</template>
