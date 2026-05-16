<script setup lang="ts">
import { mockListings, mockStaff } from '@/components/finance/data/costs'

const filterListing = defineModel<string>('filterListing', { default: 'all' })
const filterType = defineModel<string>('filterType', { default: 'all' })
const filterSynced = defineModel<string>('filterSynced', { default: 'all' })
const filterIntegration = defineModel<string>('filterIntegration', { default: 'all' })
const filterStaff = defineModel<string>('filterStaff', { default: 'all' })
const filterDateFrom = defineModel<string>('filterDateFrom', { default: '' })
const filterDateTo = defineModel<string>('filterDateTo', { default: '' })

const emit = defineEmits<{ clear: [] }>()
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <!-- Listing -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-muted-foreground">Listing</label>
      <Select v-model="filterListing">
        <SelectTrigger class="h-8 w-40 text-sm">
          <SelectValue placeholder="All listings" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All listings
          </SelectItem>
          <SelectItem v-for="l in mockListings" :key="l" :value="l">
            {{ l }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Type -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-muted-foreground">Type</label>
      <Select v-model="filterType">
        <SelectTrigger class="h-8 w-36 text-sm">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All types
          </SelectItem>
          <SelectItem value="Manual">
            Manual
          </SelectItem>
          <SelectItem value="Cleaning">
            Cleaning
          </SelectItem>
          <SelectItem value="Activity">
            Activity
          </SelectItem>
          <SelectItem value="Task">
            Task
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Sync status -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-muted-foreground">Sync</label>
      <Select v-model="filterSynced">
        <SelectTrigger class="h-8 w-36 text-sm">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All
          </SelectItem>
          <SelectItem value="synced">
            Synced
          </SelectItem>
          <SelectItem value="unsynced">
            Not synced
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Integration -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-muted-foreground">Integration</label>
      <Select v-model="filterIntegration">
        <SelectTrigger class="h-8 w-36 text-sm">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="jurnal">Jurnal</SelectItem>
          <SelectItem value="bexio">Bexio</SelectItem>
          <SelectItem value="none">Not mapped</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Staff -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-muted-foreground">Staff</label>
      <Select v-model="filterStaff">
        <SelectTrigger class="h-8 w-40 text-sm">
          <SelectValue placeholder="All staff" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All staff
          </SelectItem>
          <SelectItem v-for="s in mockStaff" :key="s.id" :value="s.id">
            {{ s.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Date range -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-muted-foreground">From</label>
      <Input v-model="filterDateFrom" type="date" class="h-8 w-36 text-sm" />
    </div>
    <div class="flex flex-col gap-1">
      <label class="text-xs text-muted-foreground">To</label>
      <Input v-model="filterDateTo" type="date" class="h-8 w-36 text-sm" />
    </div>

    <!-- Clear -->
    <Button variant="ghost" size="sm" class="h-8 self-end" @click="emit('clear')">
      Clear filters
    </Button>

    <!-- Actions slot (e.g. Export CSV) -->
    <div class="ml-auto self-end">
      <slot />
    </div>
  </div>
</template>
