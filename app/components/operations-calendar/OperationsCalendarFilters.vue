<script setup lang="ts">
import type { CalendarEventType, OperationsFilters } from '~/components/operations-calendar/data/operations-calendar'
import { eventTypeLabels, getCalendarListings } from '~/components/operations-calendar/data/operations-calendar'

const props = defineProps<{
  filters: OperationsFilters
}>()

const emit = defineEmits<{
  'update:filters': [filters: OperationsFilters]
  'clear': []
}>()

const calendarListings = computed(() => getCalendarListings())
const tagSearch = ref('')
const tagPopoverOpen = ref(false)

const eventTypes: CalendarEventType[] = ['guest_stay', 'cleaning', 'task']

const allTags = computed(() => {
  const tags = new Set(calendarListings.value.flatMap(l => l.tags))
  return [...tags].sort()
})

const filteredTags = computed(() => {
  const q = tagSearch.value.trim().toLowerCase()
  if (!q)
    return allTags.value
  return allTags.value.filter(t => t.toLowerCase().includes(q))
})

function updateSearch(value: string | number) {
  emit('update:filters', { ...props.filters, listingSearch: String(value) })
}

function toggleTag(tag: string) {
  const current = props.filters.listingTags
  const next = current.includes(tag)
    ? current.filter(t => t !== tag)
    : [...current, tag]
  emit('update:filters', { ...props.filters, listingTags: next })
}

function toggleEventType(type: CalendarEventType) {
  const current = props.filters.eventTypes
  const next = current.includes(type)
    ? current.filter(t => t !== type)
    : [...current, type]
  emit('update:filters', { ...props.filters, eventTypes: next })
}

function clear() {
  emit('clear')
}
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <div class="relative">
      <Icon name="lucide:search" class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        :model-value="filters.listingSearch"
        placeholder="Search listings..."
        class="h-9 w-64 pl-9 text-sm"
        @update:model-value="updateSearch"
      />
    </div>

    <Popover v-model:open="tagPopoverOpen">
      <PopoverTrigger as-child>
        <Button variant="outline" size="sm" :class="filters.listingTags.length > 0 ? 'border-primary text-primary' : ''">
          <Icon name="lucide:tag" class="mr-2 h-4 w-4" />
          Tags
          <span v-if="filters.listingTags.length" class="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
            {{ filters.listingTags.length }}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-56 p-0" align="start">
        <div class="border-b px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Filter by tag
        </div>
        <div class="p-2">
          <Input v-model="tagSearch" placeholder="Search tags..." class="mb-2 h-8 text-xs" />
          <div class="max-h-48 overflow-y-auto">
            <div
              v-for="tag in filteredTags"
              :key="tag"
              class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
            >
              <Checkbox
                :id="`tag-${tag}`"
                :checked="filters.listingTags.includes(tag)"
                @update:checked="toggleTag(tag)"
              />
              <label :for="`tag-${tag}`" class="flex-1 cursor-pointer text-sm">
                {{ tag }}
              </label>
            </div>
            <p v-if="filteredTags.length === 0" class="px-2 py-3 text-sm text-muted-foreground">
              No tags found.
            </p>
          </div>
          <Button v-if="filters.listingTags.length" variant="ghost" size="sm" class="mt-2 h-7 w-full text-xs text-muted-foreground" @click="emit('update:filters', { ...filters, listingTags: [] })">
            Clear tags
          </Button>
        </div>
      </PopoverContent>
    </Popover>

    <Popover>
      <PopoverTrigger as-child>
        <Button variant="outline" size="sm">
          <Icon name="lucide:filter" class="mr-2 h-4 w-4" />
          Event types
          <span v-if="filters.eventTypes.length" class="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
            {{ filters.eventTypes.length }}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-56 p-0" align="start">
        <div class="border-b px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Filter by event type
        </div>
        <div class="p-2">
          <div
            v-for="type in eventTypes"
            :key="type"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
          >
            <Checkbox
              :id="`type-${type}`"
              :checked="filters.eventTypes.includes(type)"
              @update:checked="toggleEventType(type)"
            />
            <label :for="`type-${type}`" class="flex-1 cursor-pointer text-sm">
              {{ eventTypeLabels[type] }}
            </label>
          </div>
        </div>
      </PopoverContent>
    </Popover>

    <Button variant="ghost" size="sm" @click="clear">
      <Icon name="lucide:x" class="mr-2 h-4 w-4" />
      Clear filters
    </Button>
  </div>
</template>
