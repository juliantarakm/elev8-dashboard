<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'

definePageMeta({ layout: 'platform-console' })

const route = useRoute()
const { byId } = useTenants()

const tenantId = computed(() => route.params.id as string)
const tenant = computed(() => byId(tenantId.value))

if (!tenant.value) {
  throw createError({ statusCode: 404, statusMessage: 'Tenant not found' })
}
</script>

<template>
  <div v-if="tenant">
    <PlatformConsoleTenantDetailHeader :tenant="tenant" />
    <div class="p-6">
      <Tabs default-value="billing" class="w-full">
        <TabsList>
          <PlatformConsoleRoleGate action="view_billing">
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </PlatformConsoleRoleGate>
          <PlatformConsoleRoleGate action="view_pricing">
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </PlatformConsoleRoleGate>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <PlatformConsoleRoleGate action="view_billing">
          <TabsContent value="billing" class="mt-4">
            <PlatformConsoleTenantBillingTab :tenant="tenant" />
          </TabsContent>
        </PlatformConsoleRoleGate>
        <PlatformConsoleRoleGate action="view_pricing">
          <TabsContent value="pricing" class="mt-4">
            <PlatformConsoleTenantPricingTab :tenant="tenant" />
          </TabsContent>
        </PlatformConsoleRoleGate>
        <TabsContent value="users" class="mt-4">
          <PlatformConsoleTenantUsersTab :tenant="tenant" />
        </TabsContent>
        <TabsContent value="activity" class="mt-4">
          <PlatformConsoleTenantActivityTab :tenant="tenant" />
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>