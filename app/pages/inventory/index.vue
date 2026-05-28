<script setup lang="ts">
const activeTab = ref<'catalog' | 'listings'>('catalog')
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
