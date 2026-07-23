<script setup lang="ts">
import { useOwnerPortal } from '~/composables/useOwnerPortal'
import PortalKpiCard from './PortalKpiCard.vue'
import PortalPropertyPicker from './PortalPropertyPicker.vue'

const portal = useOwnerPortal()
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">
          Owner dashboard
        </h1><p class="text-sm text-muted-foreground">
          Your property performance at a glance.
        </p>
      </div><PortalPropertyPicker v-model="portal.selectedPropertyId.value" :properties="portal.assignedProperties.value" />
    </div>
    <div v-if="portal.propertyMetrics.value" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <PortalKpiCard v-for="metric in portal.dashboardMetricDescriptors.value" :key="metric.key" :label="metric.label" :value="metric.value" />
      <PortalKpiCard label="Owner-use nights" :value="String(portal.ownerUseNights.value)" />
    </div>
    <div v-else class="rounded-lg border p-6 text-sm text-muted-foreground">
      No dashboard data available.
    </div>
    <div v-if="portal.propertyMetrics.value && portal.canViewDashboardField('upcomingReservations')" class="rounded-lg border bg-card p-4">
      <h2 class="font-medium">
        Upcoming reservations
      </h2><div class="mt-3 divide-y">
        <div v-for="reservation in portal.propertyMetrics.value.upcomingReservations" :key="reservation.id" class="flex justify-between py-3 text-sm">
          <span>{{ reservation.guestName }}</span><span class="text-muted-foreground">{{ reservation.checkIn }} · {{ reservation.nights }} nights</span>
        </div>
      </div>
    </div>
  </section>
</template>
