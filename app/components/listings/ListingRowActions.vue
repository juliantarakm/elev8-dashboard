<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{
  listing: Listing
}>()

const router = useRouter()

const aiStatusLabel = computed(() => {
  if (props.listing.aiStatus === 'active') return 'Pause AI'
  return 'Activate AI'
})

const aiStatusIcon = computed(() => {
  return props.listing.aiStatus === 'active' ? 'lucide:bot' : 'lucide:bot-off'
})

const listingStatus = computed(() => {
  return true
})

const listingStatusLabel = computed(() => {
  return listingStatus.value ? 'Deactivate' : 'Activate'
})

const listingStatusIcon = computed(() => {
  return listingStatus.value ? 'lucide:toggle-right' : 'lucide:toggle-left'
})

const open = ref(false)

function viewDetail() {
  open.value = false
  router.push(`/listings/${props.listing.id}`)
}

function toggleListing() {
  open.value = false
}

function toggleAi() {
  open.value = false
}
</script>

<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
        <Icon name="lucide:ellipsis-vertical" class="size-4" />
        <span class="sr-only">Open menu</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-44">
      <DropdownMenuItem class="gap-2" @click="viewDetail">
        <Icon name="lucide:eye" class="size-4" />
        View Detail
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="gap-2" @click="toggleListing">
        <Icon :name="listingStatusIcon" class="size-4" />
        {{ listingStatusLabel }} Listing
      </DropdownMenuItem>
      <DropdownMenuItem class="gap-2" @click="toggleAi">
        <Icon :name="aiStatusIcon" class="size-4" />
        {{ aiStatusLabel }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
