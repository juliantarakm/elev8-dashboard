<script setup lang="ts">
import { Card, CardContent } from '~/components/ui/card'
import type { Tenant } from './data/tenants'
import { usePlatformAudit } from '~/composables/usePlatformAudit'

const props = defineProps<{ tenant: Tenant }>()
const { log, byTenant } = usePlatformAudit()
onMounted(() => log('view_activity', 'tenant', props.tenant.id))

const activity = computed(() => byTenant(props.tenant.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
</script>

<template>
  <Card>
    <CardContent class="p-0">
      <div v-if="!activity.length" class="p-8 text-center text-sm text-muted-foreground">
        No activity recorded yet for this tenant.
      </div>
      <div v-else class="divide-y">
        <div v-for="e in activity" :key="e.id" class="flex items-start gap-3 p-4">
          <div class="mt-0.5 size-2 rounded-full bg-primary" />
          <div class="flex-1">
            <div class="text-sm">
              <span class="font-medium">{{ e.actorRole }}</span>
              · <code class="text-xs">{{ e.action }}</code>
            </div>
            <div class="text-xs text-muted-foreground">{{ e.createdAt }}</div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>