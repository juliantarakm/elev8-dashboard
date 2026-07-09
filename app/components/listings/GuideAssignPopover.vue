<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Badge } from '~/components/ui/badge'
import { toast } from 'vue-sonner'

const props = defineProps<{
  listingId: string
  listingName?: string
}>()

const { guides, updateGuide } = useGuestGuides()

// Find the guide currently assigned to this listing
const currentGuide = computed(() =>
  guides.value.find(g => g.assignedListingIds.includes(props.listingId)),
)

const popoverOpen = ref(false)
const search = ref('')

const filteredGuides = computed(() => {
  const all = guides.value
  if (!search.value) return all
  const q = search.value.toLowerCase()
  return all.filter(g =>
    g.title.toLowerCase().includes(q)
    || g.description?.toLowerCase().includes(q),
  )
})

function assignGuide(guideId: string) {
  // First, unassign this listing from any other guide
  guides.value.forEach(g => {
    if (g.id !== guideId && g.assignedListingIds.includes(props.listingId)) {
      updateGuide(g.id, {
        assignedListingIds: g.assignedListingIds.filter(id => id !== props.listingId),
      })
    }
  })
  // Then, assign to the new guide (add if not already there)
  const target = guides.value.find(g => g.id === guideId)
  if (target && !target.assignedListingIds.includes(props.listingId)) {
    updateGuide(guideId, {
      assignedListingIds: [...target.assignedListingIds, props.listingId],
    })
  }
  popoverOpen.value = false
  toast.success(`Assigned ${target?.title} to ${props.listingName ?? 'this listing'}`)
}

function unassign() {
  guides.value.forEach(g => {
    if (g.assignedListingIds.includes(props.listingId)) {
      updateGuide(g.id, {
        assignedListingIds: g.assignedListingIds.filter(id => id !== props.listingId),
      })
    }
  })
  toast.success('Guide unassigned')
}
</script>

<template>
  <Popover v-model:open="popoverOpen">
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm">
        <Icon name="lucide:repeat" class="mr-1 size-3.5" />
        {{ currentGuide ? 'Change' : 'Assign guide' }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-80 p-0" align="end">
      <div class="p-2 border-b">
        <Input v-model="search" placeholder="Search guides..." class="h-8" />
      </div>
      <ScrollArea class="h-72">
        <div class="p-1">
          <div
            v-for="guide in filteredGuides"
            :key="guide.id"
            class="flex items-start gap-2 px-2 py-2 rounded hover:bg-muted cursor-pointer"
            @click="assignGuide(guide.id)"
          >
            <Icon
              :name="currentGuide?.id === guide.id ? 'lucide:check-circle-2' : 'lucide:book-open'"
              class="size-4 mt-0.5"
              :class="currentGuide?.id === guide.id ? 'text-primary' : 'text-muted-foreground'"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-sm truncate">{{ guide.title }}</span>
                <Badge variant="outline" class="text-xs">{{ guide.status }}</Badge>
              </div>
              <div v-if="guide.description" class="text-xs text-muted-foreground truncate">
                {{ guide.description }}
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ guide.assignedListingIds.length }} listing{{ guide.assignedListingIds.length === 1 ? '' : 's' }}
              </div>
            </div>
          </div>
          <div v-if="filteredGuides.length === 0" class="py-4 text-center text-xs text-muted-foreground">
            No guides match.
          </div>
        </div>
      </ScrollArea>
      <div v-if="currentGuide" class="border-t p-2">
        <Button variant="ghost" size="sm" class="w-full text-xs text-destructive" @click="unassign">
          Unassign current guide
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</template>
