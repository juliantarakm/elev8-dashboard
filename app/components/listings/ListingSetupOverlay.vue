<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'
import ListingSetupFieldPanel from '~/components/listings/ListingSetupFieldPanel.vue'
import ListingSetupResourcePanel from '~/components/listings/ListingSetupResourcePanel.vue'

const props = defineProps<{ listing: Listing; open: boolean }>()
const emit = defineEmits<{ 'update:open': [val: boolean]; update: [listing: Listing] }>()

const showResources = ref(false)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex flex-col bg-background">
      <!-- Header -->
      <div class="relative flex items-center justify-center border-b px-5 py-3 flex-shrink-0">
        <div class="flex flex-col items-center gap-0.5">
          <div class="flex items-center gap-2">
            <Icon name="lucide:layout-panel-left" class="size-4 text-muted-foreground" />
            <h2 class="text-base font-semibold">Listing Setup</h2>
          </div>
          <span class="text-xs text-muted-foreground truncate max-w-[200px]">{{ listing.name }}</span>
        </div>
        <div class="absolute right-4 flex items-center gap-1">
          <!-- Resources toggle (mobile only) -->
          <Button variant="ghost" size="sm" class="lg:hidden gap-1.5 text-xs" @click="showResources = !showResources">
            <Icon name="lucide:database" class="size-3.5" />
            Resources
          </Button>
          <Button variant="ghost" size="sm" class="gap-1.5" @click="emit('update:open', false)">
            <Icon name="lucide:x" class="size-4" />
            <span class="hidden sm:inline">Close</span>
          </Button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Field panel — full width on mobile, flex-1 on lg -->
        <div class="flex-1 overflow-hidden" :class="showResources ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'">
          <ListingSetupFieldPanel :listing="listing" @update="emit('update', $event)" />
        </div>

        <!-- Resource panel — sheet-like on mobile (full screen), fixed sidebar on lg -->
        <div
          class="overflow-hidden border-l"
          :class="showResources
            ? 'flex flex-col flex-1 lg:flex-none lg:w-[300px]'
            : 'hidden lg:flex lg:flex-col lg:w-[300px]'"
        >
          <ListingSetupResourcePanel :listing="listing" @update="emit('update', $event)" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
