<script setup lang="ts">
import { useTenants } from '~/composables/useTenants'
import { usePlatformBanners } from '~/composables/usePlatformBanners'

// Demo: wire to t-1 + Admin role so banners render in the tenant dashboard for the demo.
const { byId } = useTenants()
const { liveBannersForTenant, dismiss } = usePlatformBanners()

const tenant = byId('t-1')
const userRole = 'Admin' as any
const banners = computed(() => tenant ? liveBannersForTenant(tenant.id, userRole) : [])

function dismissBanner(id: string) {
  if (tenant) dismiss(id, tenant.id)
}
</script>

<template>
  <div v-if="banners.length" class="space-y-2 px-6 pt-4">
    <PlatformConsoleBannerCard
      v-for="b in banners"
      :key="b.id"
      :banner="b"
      :on-dismiss="() => dismissBanner(b.id)"
    />
  </div>
</template>