import { computed } from 'vue'
import type { PricingOverride, DiscountType, OverrideStatus } from '~/components/platform-console/data/pricing-overrides'
import { mockPricingOverrides } from '~/components/platform-console/data/pricing-overrides'
import { usePlatformAudit } from '~/composables/usePlatformAudit'
import { useStaffAuth } from '~/composables/useStaffAuth'
import { useTenants } from '~/composables/useTenants'

export interface ProposeInput {
  tenantId: string
  discountType: DiscountType
  value: number
  reason: string
  effectiveDate: string
  expiryDate?: string
  proposedByStaffId: string
  currency?: 'USD'
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function generateStripeCouponId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `mock_coupon_${s}`
}

export function usePricingOverrides() {
  const overrides = useState<PricingOverride[]>('pricing-overrides', () => JSON.parse(JSON.stringify(mockPricingOverrides)))
  const { log } = usePlatformAudit()
  const { requiresApproval } = useStaffAuth()
  const { byId: tenantById } = useTenants()

  function byTenant(tenantId: string): PricingOverride[] {
    return overrides.value.filter(o => o.tenantId === tenantId)
  }

  function activeFor(tenantId: string): PricingOverride | undefined {
    return overrides.value.find(o => o.tenantId === tenantId && o.status === 'active')
  }

  function hasActive(tenantId: string): boolean {
    return !!activeFor(tenantId)
  }

  const pendingApprovals = computed(() => overrides.value.filter(o => o.status === 'pending_approval'))

  function propose(input: ProposeInput): PricingOverride {
    if (hasActive(input.tenantId)) {
      throw new Error('An active override already exists for this tenant. Revoke it first.')
    }
    const tenant = tenantById(input.tenantId)
    if (tenant?.status === 'churned') {
      throw new Error('Tenant is churned — overrides are not permitted.')
    }
    if (tenant?.status === 'suspended') {
      throw new Error('Tenant is suspended — overrides are blocked.')
    }

    const id = generateId('ovr')
    const promoCodeId = generateId('pc-override')
    const needsApproval = requiresApproval(input.discountType, input.value)

    const override: PricingOverride = {
      id,
      tenantId: input.tenantId,
      promoCodeId,
      discountType: input.discountType,
      value: input.value,
      currency: input.currency ?? (input.discountType === 'fixed' ? 'USD' : undefined),
      reason: input.reason,
      proposedByStaffId: input.proposedByStaffId,
      proposedAt: new Date().toISOString(),
      stripeCouponId: needsApproval ? undefined : generateStripeCouponId(),
      effectiveDate: input.effectiveDate,
      expiryDate: input.expiryDate,
      status: needsApproval ? 'pending_approval' : 'active',
      queuedForSwitch: !!tenant?.switchingToPlan,
    }
    overrides.value = [...overrides.value, override]
    log(needsApproval ? 'override_proposed' : 'override_approved', 'override', id, {
      tenantId: input.tenantId, value: input.value, type: input.discountType,
    })
    return override
  }

  function approve(overrideId: string, approverStaffId: string): PricingOverride {
    const o = overrides.value.find(x => x.id === overrideId)
    if (!o) throw new Error('Override not found')
    if (o.status !== 'pending_approval') throw new Error('Override is not pending approval')
    if (o.proposedByStaffId === approverStaffId) throw new Error('You cannot approve your own proposal')
    const updated: PricingOverride = {
      ...o,
      approvedByStaffId: approverStaffId,
      approvedAt: new Date().toISOString(),
      stripeCouponId: o.stripeCouponId ?? generateStripeCouponId(),
      status: 'active',
    }
    overrides.value = overrides.value.map(x => x.id === overrideId ? updated : x)
    log('override_approved', 'override', overrideId, { tenantId: o.tenantId })
    return updated
  }

  function reject(overrideId: string, _approverStaffId: string, note: string): PricingOverride {
    const o = overrides.value.find(x => x.id === overrideId)
    if (!o) throw new Error('Override not found')
    if (o.status !== 'pending_approval') throw new Error('Override is not pending approval')
    const updated: PricingOverride = {
      ...o,
      rejectedAt: new Date().toISOString(),
      rejectionNote: note,
      status: 'rejected',
    }
    overrides.value = overrides.value.map(x => x.id === overrideId ? updated : x)
    log('override_rejected', 'override', overrideId, { note, tenantId: o.tenantId })
    return updated
  }

  function revoke(overrideId: string, staffId: string): PricingOverride {
    const o = overrides.value.find(x => x.id === overrideId)
    if (!o) throw new Error('Override not found')
    if (o.status !== 'active') throw new Error('Only active overrides can be revoked')
    const updated: PricingOverride = {
      ...o,
      revokedAt: new Date().toISOString(),
      revokedByStaffId: staffId,
      status: 'revoked',
    }
    overrides.value = overrides.value.map(x => x.id === overrideId ? updated : x)
    log('override_revoked', 'override', overrideId, { tenantId: o.tenantId })
    return updated
  }

  function runExpirySweep(): PricingOverride[] {
    const now = Date.now()
    const expired: PricingOverride[] = []
    overrides.value = overrides.value.map((o) => {
      if (o.status === 'active' && o.expiryDate && new Date(o.expiryDate).getTime() < now) {
        expired.push(o)
        log('override_expired', 'override', o.id, { tenantId: o.tenantId })
        return { ...o, status: 'expired' as OverrideStatus }
      }
      return o
    })
    return expired
  }

  function run7DayWarningSweep(): void {
    const sevenDays = Date.now() + 7 * 86_400_000
    const aboutToExpire = overrides.value.filter(o =>
      o.status === 'active' && o.expiryDate
      && new Date(o.expiryDate).getTime() < sevenDays
      && new Date(o.expiryDate).getTime() > Date.now(),
    )
    for (const o of aboutToExpire) {
      log('override_expired', 'override', o.id, { tenantId: o.tenantId, warning: '7-day expiry notice sent to tenant' })
    }
  }

  return {
    overrides, byTenant, activeFor, hasActive, pendingApprovals,
    propose, approve, reject, revoke,
    runExpirySweep, run7DayWarningSweep,
  }
}