<script setup lang="ts">
import type { CleaningJobPriority, CleaningJobStatus } from '~/components/cleaning/data/cleaning-jobs'
import { cleanerOptions, cleaningJobPriorityLabels, cleaningJobStatusLabels } from '~/components/cleaning/data/cleaning-jobs'

const props = defineProps<{
  listingIds: string[]
  cleanerIds: string[]
  statuses: CleaningJobStatus[]
  priorities: CleaningJobPriority[]
}>()

const emit = defineEmits<{
  'update:listingIds': [value: string[]]
  'update:cleanerIds': [value: string[]]
  'update:statuses': [value: CleaningJobStatus[]]
  'update:priorities': [value: CleaningJobPriority[]]
  'clear': []
}>()

const filterOpen = ref(false)

function toggleStringValue(current: string[], value: string) {
  return current.includes(value) ? current.filter(entry => entry !== value) : [...current, value]
}

function toggleStatus(status: CleaningJobStatus) {
  emit('update:statuses', toggleStringValue(props.statuses, status) as CleaningJobStatus[])
}

function togglePriority(priority: CleaningJobPriority) {
  emit('update:priorities', toggleStringValue(props.priorities, priority) as CleaningJobPriority[])
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <Popover v-model:open="filterOpen">
      <PopoverTrigger as-child>
        <Button variant="outline" size="sm" class="gap-2">
          <Icon name="lucide:sliders-horizontal" class="size-4" />
          Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-80 p-0" align="start" :side-offset="6">
        <div class="border-b px-4 py-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold">
                Cleaning filters
              </p>
              <p class="text-xs text-muted-foreground">
                Filter by listing, cleaner, status, and priority.
              </p>
            </div>
            <Button variant="ghost" size="sm" class="h-7 text-xs" @click="emit('clear')">
              Clear
            </Button>
          </div>
        </div>

        <div class="grid gap-4 p-4">
          <div class="grid gap-2">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <div class="flex flex-wrap gap-2">
              <Button
                v-for="([value, label]) in Object.entries(cleaningJobStatusLabels)"
                :key="value"
                size="sm"
                :variant="statuses.includes(value as CleaningJobStatus) ? 'default' : 'outline'"
                class="h-8"
                @click="toggleStatus(value as CleaningJobStatus)"
              >
                {{ label }}
              </Button>
            </div>
          </div>

          <div class="grid gap-2">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Priority
            </p>
            <div class="flex flex-wrap gap-2">
              <Button
                v-for="([value, label]) in Object.entries(cleaningJobPriorityLabels)"
                :key="value"
                size="sm"
                :variant="priorities.includes(value as CleaningJobPriority) ? 'default' : 'outline'"
                class="h-8"
                @click="togglePriority(value as CleaningJobPriority)"
              >
                {{ label }}
              </Button>
            </div>
          </div>

          <div class="grid gap-2">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cleaner
            </p>
            <div class="space-y-1.5">
              <label v-for="cleaner in cleanerOptions" :key="cleaner.id" class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                <Checkbox
                  :checked="cleanerIds.includes(cleaner.id)"
                  @update:checked="emit('update:cleanerIds', toggleStringValue(cleanerIds, cleaner.id))"
                />
                <span>{{ cleaner.name }} · {{ cleaner.role }}</span>
              </label>
            </div>
          </div>

          <div class="grid gap-2">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Listing IDs
            </p>
            <Input
              :model-value="listingIds.join(', ')"
              placeholder="Comma-separated listing IDs"
              @update:model-value="emit('update:listingIds', typeof $event === 'string' ? $event.split(',').map(v => v.trim()).filter(Boolean) : [])"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>
