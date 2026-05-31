<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{
  listing: Listing
}>()

const router = useRouter()

const aiStatusLabel = computed(() => {
  return props.listing.aiStatus === 'active' ? 'Pause AI' : 'Activate AI'
})

const aiStatusIcon = computed(() => {
  return props.listing.aiStatus === 'active' ? 'lucide:bot' : 'lucide:bot-off'
})

function viewDetail() {
  router.push(`/listings/${props.listing.id}`)
}

function toggleListing() {}

function toggleAi() {}
</script>

<template>
  <DropdownMenu>
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
        <Icon name="lucide:toggle-right" class="size-4" />
        Deactivate Listing
      </DropdownMenuItem>
      <DropdownMenuItem class="gap-2" @click="toggleAi">
        <Icon :name="aiStatusIcon" class="size-4" />
        {{ aiStatusLabel }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
