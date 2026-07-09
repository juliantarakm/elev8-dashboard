<script setup lang="ts">
definePageMeta({ layout: 'platform-console' })

const { tenants } = useTenants()
const router = useRouter()

function openTenant(id: string) {
  router.push(`/platform-console/tenants/${id}`)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between px-6 pt-6">
      <div>
        <h2 class="text-2xl font-semibold tracking-tight">Tenants</h2>
        <p class="text-sm text-muted-foreground">All property managers using Elev8</p>
      </div>
    </div>
    <PlatformConsoleTenantDirectoryTable :tenants="tenants" @row-click="openTenant" />
  </div>
</template>