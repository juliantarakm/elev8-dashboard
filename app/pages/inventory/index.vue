<script setup lang="ts">
import { computed } from 'vue'
import { useInventoryCatalog } from '@/composables/useInventoryCatalog'
import { useInventoryListings } from '@/composables/useInventoryListings'

const activeTab = ref<'catalog' | 'listings'>('catalog')

const { items } = useInventoryCatalog()
const { entries, lowStockCount } = useInventoryListings()

const totalAssetValue = computed(() =>
  items.value
    .filter(i => i.type === 'permanent')
    .reduce((sum, i) => sum + (i.purchaseValue ?? 0), 0),
)

const expiringSoonCount = computed(() => {
  const now = new Date()
  return items.value.filter((i) => {
    if (!i.warrantyExpiry) return false
    const diff = (new Date(i.warrantyExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 30
  }).length
})

const damagedCount = computed(() =>
  entries.value.filter(e => e.condition === 'damaged' || e.condition === 'missing').length,
)
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Inventory
        </h2>
        <p class="text-muted-foreground">
          Track assets and supplies across your property listings.
        </p>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">Total Items</p>
        <p class="text-2xl font-bold">{{ items.length }}</p>
      </div>
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">Total Asset Value</p>
        <p class="text-2xl font-bold">IDR {{ totalAssetValue.toLocaleString('id-ID') }}</p>
      </div>
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">Warranty Expiring / Expired</p>
        <p
          class="text-2xl font-bold"
          :class="expiringSoonCount > 0 ? 'text-amber-600' : ''"
        >
          {{ expiringSoonCount }}
        </p>
      </div>
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">Damaged / Missing</p>
        <p
          class="text-2xl font-bold"
          :class="damagedCount > 0 ? 'text-destructive' : ''"
        >
          {{ damagedCount }}
        </p>
      </div>
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">Low Stock</p>
        <p
          class="text-2xl font-bold"
          :class="lowStockCount > 0 ? 'text-orange-500' : ''"
        >
          {{ lowStockCount }}
        </p>
      </div>
    </div>

    <Tabs v-model="activeTab" class="w-full">
      <TabsList>
        <TabsTrigger value="catalog">
          <Icon name="lucide:package" class="mr-2 h-4 w-4" />
          Catalog
        </TabsTrigger>
        <TabsTrigger value="listings">
          <Icon name="lucide:building-2" class="mr-2 h-4 w-4" />
          Per-Listing
        </TabsTrigger>
      </TabsList>

      <TabsContent value="catalog" class="mt-4">
        <InventoryCatalogTab />
      </TabsContent>

      <TabsContent value="listings" class="mt-4">
        <InventoryListingsTab />
      </TabsContent>
    </Tabs>
  </div>
</template>
