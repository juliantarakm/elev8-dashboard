<script setup lang="ts">
import type { HubFilterChannel, HubFilterStatus } from '~/composables/useReviewHub'
import { channelLabels, replyStatusLabels } from '~/components/review-hub/data/types'

defineProps<{
  uniqueListings: { id: string, name: string }[]
}>()

const emit = defineEmits<{
  clear: []
}>()

const searchQuery = defineModel<string>('searchQuery', { default: '' })
const filterStatus = defineModel<HubFilterStatus>('filterStatus', { default: 'all' })
const filterChannel = defineModel<HubFilterChannel>('filterChannel', { default: 'all' })
const filterListing = defineModel<string[]>('filterListing', { default: () => [] })

const hasActiveFilters = computed(() => {
  const hasListing = filterListing.value.length > 0 && !filterListing.value.includes('All Properties')
  return filterStatus.value !== 'all' || filterChannel.value !== 'all' || hasListing || searchQuery.value.trim() !== ''
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <!-- Search -->
    <div class="relative w-[280px]">
      <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input v-model="searchQuery" placeholder="Search guest or property..." class="h-10 pl-9" />
    </div>

    <!-- Status -->
    <Select v-model="filterStatus">
      <SelectTrigger class="h-10 w-[170px]">
        <SelectValue placeholder="All Statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          All Statuses
        </SelectItem>
        <SelectItem v-for="(label, key) in replyStatusLabels" :key="key" :value="key">
          {{ label }}
        </SelectItem>
      </SelectContent>
    </Select>

    <!-- Channel -->
    <Select v-model="filterChannel">
      <SelectTrigger class="h-10 w-[150px]">
        <SelectValue placeholder="All Channels" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          All Channels
        </SelectItem>
        <SelectItem v-for="(label, key) in channelLabels" :key="key" :value="key">
          {{ label }}
        </SelectItem>
      </SelectContent>
    </Select>

    <!-- Property Picker (multi-select with search + tags) -->
    <SharedPropertyPicker v-model="filterListing" />

    <!-- Clear -->
    <Button v-if="hasActiveFilters" variant="ghost" size="sm" class="h-10 gap-1.5" @click="emit('clear')">
      <Icon name="lucide:x" class="size-3.5" />
      Clear
    </Button>
  </div>
</template>
