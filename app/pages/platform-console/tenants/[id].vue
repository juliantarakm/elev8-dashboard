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
    <TenantDetailHeader :tenant="tenant" />
    <div class="p-6">
      <Tabs default-value="billing" class="w-full">
        <TabsList>
          <RoleGate action="view_billing">
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </RoleGate>
          <RoleGate action="view_pricing">
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </RoleGate>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <RoleGate action="view_billing">
          <TabsContent value="billing" class="mt-4">
            <TenantBillingTab :tenant="tenant" />
          </TabsContent>
        </RoleGate>
        <RoleGate action="view_pricing">
          <TabsContent value="pricing" class="mt-4">
            <TenantPricingTab :tenant="tenant" />
          </TabsContent>
        </RoleGate>
        <TabsContent value="users" class="mt-4">
          <TenantUsersTab :tenant="tenant" />
        </TabsContent>
        <TabsContent value="activity" class="mt-4">
          <TenantActivityTab :tenant="tenant" />
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>