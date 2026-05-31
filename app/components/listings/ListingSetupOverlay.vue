<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'
import ListingSetupFieldPanel from '~/components/listings/ListingSetupFieldPanel.vue'
import ListingSetupResourcePanel from '~/components/listings/ListingSetupResourcePanel.vue'

const props = defineProps<{ listing: Listing; open: boolean }>()
const emit = defineEmits<{ 'update:open': [val: boolean]; update: [listing: Listing] }>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex flex-col bg-background">
      <div class="flex items-center justify-between border-b px-5 py-3 flex-shrink-0">
        <div class="flex items-center gap-3">
          <Icon name="lucide:layout-panel-left" class="size-5 text-muted-foreground" />
          <h2 class="text-base font-semibold">Listing Setup</h2>
          <span class="text-sm text-muted-foreground">{{ listing.name }}</span>
        </div>
        <Button variant="ghost" size="sm" class="gap-1.5" @click="emit('update:open', false)">
          <Icon name="lucide:x" class="size-4" />
          Close
        </Button>
      </div>

      <div class="flex flex-1 overflow-hidden">
        <div class="flex-1 overflow-hidden">
          <ListingSetupFieldPanel :listing="listing" @update="emit('update', $event)" />
        </div>
        <div class="w-[300px] shrink-0 border-l overflow-hidden">
          <ListingSetupResourcePanel :listing="listing" @update="emit('update', $event)" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
