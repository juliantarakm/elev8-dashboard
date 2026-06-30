<script setup lang="ts">
import { usePurchaseRequests } from '@/composables/usePurchaseRequests'
import { usePurchaseOrders } from '@/composables/usePurchaseOrders'
import { useReceivings } from '@/composables/useReceivings'
import { useInventoryListings } from '@/composables/useInventoryListings'

const activeTab = ref<'pr' | 'po' | 'rcv' | 'iss'>('pr')

const { pendingApprovalCount } = usePurchaseRequests()
const { openPoCount } = usePurchaseOrders()
const { pendingCount: pendingRcvCount } = useReceivings()
const { lowStockCount } = useInventoryListings()
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Procurement
        </h2>
        <p class="text-muted-foreground">
          Manage purchase requests, orders, receiving, and issuing.
        </p>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">
          Pending PRs
        </p>
        <p
          class="text-2xl font-bold"
          :class="pendingApprovalCount > 0 ? 'text-amber-600' : ''"
        >
          {{ pendingApprovalCount }}
        </p>
      </div>
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">
          Open POs
        </p>
        <p
          class="text-2xl font-bold"
          :class="openPoCount > 0 ? 'text-blue-600' : ''"
        >
          {{ openPoCount }}
        </p>
      </div>
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">
          Pending Receivings
        </p>
        <p
          class="text-2xl font-bold"
          :class="pendingRcvCount > 0 ? 'text-amber-600' : ''"
        >
          {{ pendingRcvCount }}
        </p>
      </div>
      <div class="rounded-lg border p-4">
        <p class="text-sm text-muted-foreground">
          Low Stock Items
        </p>
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
        <TabsTrigger value="pr">
          <Icon name="lucide:file-text" class="mr-2 h-4 w-4" />
          Purchase Requests
        </TabsTrigger>
        <TabsTrigger value="po">
          <Icon name="lucide:shopping-cart" class="mr-2 h-4 w-4" />
          Purchase Orders
        </TabsTrigger>
        <TabsTrigger value="rcv">
          <Icon name="lucide:package-check" class="mr-2 h-4 w-4" />
          Receiving
        </TabsTrigger>
        <TabsTrigger value="iss">
          <Icon name="lucide:package-minus" class="mr-2 h-4 w-4" />
          Issuing
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pr" class="mt-4">
        <ProcurementPurchaseRequestsTab />
      </TabsContent>
      <TabsContent value="po" class="mt-4">
        <ProcurementPurchaseOrdersTab />
      </TabsContent>
      <TabsContent value="rcv" class="mt-4">
        <ProcurementReceivingTab />
      </TabsContent>
      <TabsContent value="iss" class="mt-4">
        <ProcurementIssuingTab />
      </TabsContent>
    </Tabs>
  </div>
</template>
