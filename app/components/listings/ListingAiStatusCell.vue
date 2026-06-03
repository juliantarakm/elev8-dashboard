<script setup lang="ts">
import { listings } from '~/components/listings/data/listings'

const props = defineProps<{ listingId: string }>()

const aiStatusIcon: Record<string, string> = {
  active: 'lucide:bot',
  paused: 'lucide:bot-off',
  not_set: 'lucide:bot-off',
}
const aiStatusColor: Record<string, string> = {
  active: 'text-green-600',
  paused: 'text-amber-500',
  not_set: 'text-muted-foreground',
}
const aiStatusLabels: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  not_set: 'Not Set',
}

const live = computed(() => listings.value.find(l => l.id === props.listingId))
const status = computed(() => live.value?.aiStatus ?? 'not_set')
const inactive = computed(() => {
  if (!live.value) return false
  if (live.value.unitType === 'multi') return (live.value.units ?? []).every(u => u.status === 'inactive')
  return live.value.status === 'inactive'
})
</script>

<template>
  <div class="flex items-center gap-1.5" :class="inactive ? 'opacity-40' : ''">
    <Icon :name="aiStatusIcon[status] || 'lucide:bot'" class="size-4" :class="aiStatusColor[status] || ''" />
    <span class="text-sm">{{ aiStatusLabels[status] || status }}</span>
  </div>
</template>
