<script setup lang="ts">
import type { UpsellService } from '@/components/upsells/data/upsell-services'

const drawerOpen = ref(false)
const selectedService = ref<UpsellService | null>(null)

function openDrawer(service: UpsellService | null) {
  selectedService.value = service
  drawerOpen.value = true
}
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Upsells
        </h2>
        <p class="text-muted-foreground">
          Manage upsell services offered to your guests.
        </p>
      </div>
      <Button size="sm" @click="openDrawer(null)">
        <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
        Add Service
      </Button>
    </div>

    <UpsellsUpsellFilterBar />

    <UpsellsUpsellTable @open-drawer="openDrawer" />

    <UpsellsUpsellDrawer
      :service="selectedService"
      :open="drawerOpen"
      @update:open="drawerOpen = $event"
    />
  </div>
</template>
