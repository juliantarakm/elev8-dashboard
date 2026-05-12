<script setup lang="ts">
import { revenueStats } from '@/components/finance/data/revenue'

const activeTab = useState<string>('finance-active-tab', () => 'overview')

function formatCHF(amount: number) {
  return `CHF ${amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Page header -->
    <div>
      <h2 class="text-2xl font-bold tracking-tight">
        Finance
      </h2>
      <p class="text-sm text-muted-foreground">
        Revenue, costs, and operational spending across all listings.
      </p>
    </div>

    <!-- Summary cards (page-level) -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <div class="rounded-lg border bg-card p-5">
        <p class="text-sm text-muted-foreground">
          Total Revenue (May)
        </p>
        <p class="mt-1 text-2xl font-bold tracking-tight">
          {{ formatCHF(revenueStats.totalRevenue) }}
        </p>
      </div>
      <div class="rounded-lg border bg-card p-5">
        <p class="text-sm text-muted-foreground">
          ADR (last 30 days)
        </p>
        <p class="mt-1 text-2xl font-bold tracking-tight">
          {{ formatCHF(revenueStats.adrLast30Days) }}
        </p>
      </div>
      <div class="rounded-lg border bg-card p-5">
        <p class="text-sm text-muted-foreground">
          Occupancy Rate
        </p>
        <p class="mt-1 text-2xl font-bold tracking-tight">
          {{ revenueStats.occupancyPct }}%
        </p>
      </div>
      <div class="rounded-lg border bg-card p-5">
        <p class="text-sm text-muted-foreground">
          Total Reservations
        </p>
        <p class="mt-1 text-2xl font-bold tracking-tight">
          {{ revenueStats.totalReservations }}
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <Tabs v-model="activeTab">
      <TabsList>
        <TabsTrigger value="overview">
          Overview
        </TabsTrigger>
        <TabsTrigger value="revenue">
          Revenue
        </TabsTrigger>
        <TabsTrigger value="reservations">
          Reservations
        </TabsTrigger>
        <TabsTrigger value="costs">
          Costs
        </TabsTrigger>
        <TabsTrigger value="integrations">
          Integrations
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" class="mt-4">
        <FinanceOverviewTab />
      </TabsContent>

      <TabsContent value="revenue" class="mt-4">
        <FinanceRevenueTab />
      </TabsContent>

      <TabsContent value="reservations" class="mt-4">
        <FinanceReservationsTab />
      </TabsContent>

      <TabsContent value="costs" class="mt-4">
        <FinanceCostsTab />
      </TabsContent>

      <TabsContent value="integrations" class="mt-4">
        <FinanceIntegrationsTab />
      </TabsContent>
    </Tabs>
  </div>
</template>
