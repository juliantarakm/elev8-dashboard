import { computed } from 'vue'
import type { Tenant, TenantStatus } from '~/components/platform-console/data/tenants'
import { mockTenants } from '~/components/platform-console/data/tenants'
import { usePlatformAudit } from '~/composables/usePlatformAudit'

export function useTenants() {
  const tenants = useState<Tenant[]>('platform-tenants', () => JSON.parse(JSON.stringify(mockTenants)))

  function byId(id: string): Tenant | undefined {
    return tenants.value.find(t => t.id === id)
  }

  const statusCounts = computed(() => {
    const counts: Record<TenantStatus, number> = { active: 0, suspended: 0, churned: 0, switching: 0 }
    for (const t of tenants.value) counts[t.status]++
    return counts
  })

  function suspend(tenantId: string, reason: string): void {
    tenants.value = tenants.value.map(t =>
      t.id === tenantId ? { ...t, status: 'suspended' as TenantStatus } : t,
    )
    const { log } = usePlatformAudit()
    log('override_revoked', 'tenant', tenantId, { reason, action: 'suspend' })
  }

  function markChurning(tenantId: string, targetPlan: 'per_booking' | 'per_property'): void {
    tenants.value = tenants.value.map(t =>
      t.id === tenantId ? { ...t, switchingToPlan: targetPlan } : t,
    )
  }

  function completePlanSwitch(tenantId: string): void {
    tenants.value = tenants.value.map(t => {
      if (t.id !== tenantId || !t.switchingToPlan) return t
      return { ...t, plan: t.switchingToPlan, switchingToPlan: undefined }
    })
  }

  return { tenants, byId, statusCounts, suspend, markChurning, completePlanSwitch }
}