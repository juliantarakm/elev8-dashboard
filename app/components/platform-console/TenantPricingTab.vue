<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import type { Tenant } from './data/tenants'
import { usePlatformAudit } from '~/composables/usePlatformAudit'

const props = defineProps<{ tenant: Tenant }>()
const { log } = usePlatformAudit()

onMounted(() => {
  log('view_pricing', 'tenant', props.tenant.id)
})
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Pricing overrides</CardTitle>
    </CardHeader>
    <CardContent>
      <p class="text-sm text-muted-foreground">
        Pricing override UI (propose, approval, history) ships in Phase 2.
        Tenant: <strong>{{ tenant.name }}</strong>
      </p>
    </CardContent>
  </Card>
</template>