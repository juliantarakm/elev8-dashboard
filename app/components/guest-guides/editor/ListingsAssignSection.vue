<script setup lang="ts">
import { computed, ref } from 'vue'
import { listings } from '~/components/listings/data/listings'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Badge } from '~/components/ui/badge'

const props = defineProps<{
  guideId: string
}>()

const { guides, updateGuide } = useGuestGuides()
const guide = computed(() => guides.value.find(g => g.id === props.guideId))
const assigned = computed({
  get: () => guide.value?.assignedListingIds ?? [],
  set: (v: string[]) => {
    if (guide.value) updateGuide(guide.value.id, { assignedListingIds: v })
  },
})

const popoverOpen = ref(false)
const search = ref('')

const filteredListings = computed(() => {
  if (!search.value) return listings.value
  const q = search.value.toLowerCase()
  return listings.value.filter(l =>
    l.name?.toLowerCase().includes(q)
    || l.property?.toLowerCase().includes(q)
    || l.location?.toLowerCase().includes(q),
  )
})

function toggle(listingId: string) {
  if (assigned.value.includes(listingId)) {
    assigned.value = assigned.value.filter(id => id !== listingId)
  } else {
    assigned.value = [...assigned.value, listingId]
  }
}

function clearAll() {
  assigned.value = []
}
</script>

<template>
  <div>
    <div class="mb-2 flex items-center justify-between">
      <h3 class="text-sm font-medium text-muted-foreground">Assigned Listings</h3>
      <Popover v-model:open="popoverOpen">
        <PopoverTrigger as-child>
          <Button variant="ghost" size="sm" class="h-6 px-2 text-xs">
            + Assign
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-72 p-0" align="start">
          <div class="p-2 border-b">
            <Input v-model="search" placeholder="Search listings..." class="h-8" />
          </div>
          <ScrollArea class="h-64">
            <div class="p-1">
              <div
                v-for="listing in filteredListings"
                :key="listing.id"
                class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                @click="toggle(listing.id)"
              >
                <div
                  class="flex size-4 items-center justify-center rounded-[4px] border"
                  :class="assigned.includes(listing.id)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input'"
                >
                  <Icon v-if="assigned.includes(listing.id)" name="lucide:check" class="size-3" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="truncate">{{ listing.name }}</div>
                  <div class="text-xs text-muted-foreground truncate">{{ listing.property }} · {{ listing.location }}</div>
                </div>
              </div>
              <div v-if="filteredListings.length === 0" class="py-4 text-center text-xs text-muted-foreground">
                No listings match.
              </div>
            </div>
          </ScrollArea>
          <div v-if="assigned.length > 0" class="border-t p-2">
            <Button variant="ghost" size="sm" class="w-full text-xs" @click="clearAll">
              Clear all ({{ assigned.length }})
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>

    <div v-if="assigned.length === 0" class="text-xs text-muted-foreground italic px-1 py-2">
      No listings assigned yet.
    </div>
    <div v-else class="flex flex-wrap gap-1">
      <Badge
        v-for="id in assigned"
        :key="id"
        variant="secondary"
        class="cursor-pointer"
        @click="toggle(id)"
      >
        {{ listings.find(l => l.id === id)?.name ?? id }}
        <Icon name="lucide:x" class="ml-1 size-3" />
      </Badge>
    </div>
  </div>
</template>
