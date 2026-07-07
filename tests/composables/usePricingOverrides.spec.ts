import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePricingOverrides } from '~/composables/usePricingOverrides'

describe('usePricingOverrides', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() })
  })

  it('seeds with mock data', () => {
    const { overrides } = usePricingOverrides()
    expect(overrides.value.length).toBeGreaterThan(0)
  })

  it('hasActive detects existing active override', () => {
    const { hasActive } = usePricingOverrides()
    expect(hasActive('t-1')).toBe(true)
    expect(hasActive('t-3')).toBe(false)
  })

  it('propose under threshold creates active with coupon', () => {
    const { propose, hasActive } = usePricingOverrides()
    expect(hasActive('t-3')).toBe(false)
    const o = propose({
      tenantId: 't-3', discountType: 'percent', value: 10,
      reason: 'Small retention offer for a small tenant test',
      effectiveDate: new Date().toISOString(),
      proposedByStaffId: 'staff-3',
    })
    expect(o.status).toBe('active')
    expect(o.stripeCouponId).toMatch(/^mock_coupon_/)
  })

  it('propose over threshold creates pending_approval without coupon', () => {
    const { propose } = usePricingOverrides()
    const o = propose({
      tenantId: 't-3', discountType: 'percent', value: 25,
      reason: 'Over-threshold test that is long enough to pass',
      effectiveDate: new Date().toISOString(),
      proposedByStaffId: 'staff-3',
    })
    expect(o.status).toBe('pending_approval')
    expect(o.stripeCouponId).toBeUndefined()
  })

  it('propose blocks when active override already exists', () => {
    const { propose } = usePricingOverrides()
    expect(() => propose({
      tenantId: 't-1', discountType: 'percent', value: 5,
      reason: 'Should fail because t-1 already has active',
      effectiveDate: new Date().toISOString(),
      proposedByStaffId: 'staff-3',
    })).toThrow(/already exists/)
  })

  it('approve requires non-proposer', () => {
    const { propose, approve } = usePricingOverrides()
    const o = propose({
      tenantId: 't-3', discountType: 'percent', value: 25,
      reason: 'Need approval - testing self-approve block',
      effectiveDate: new Date().toISOString(),
      proposedByStaffId: 'staff-3',
    })
    expect(() => approve(o.id, 'staff-3')).toThrow(/cannot approve your own/)
    const approved = approve(o.id, 'staff-2')
    expect(approved.status).toBe('active')
  })

  it('reject writes note', () => {
    const { propose, reject } = usePricingOverrides()
    const o = propose({
      tenantId: 't-3', discountType: 'percent', value: 30,
      reason: 'Will be rejected with reviewer note attached',
      effectiveDate: new Date().toISOString(),
      proposedByStaffId: 'staff-3',
    })
    const r = reject(o.id, 'staff-2', 'Too aggressive')
    expect(r.status).toBe('rejected')
    expect(r.rejectionNote).toBe('Too aggressive')
  })

  it('revoke flips active to revoked', () => {
    const { revoke, overrides } = usePricingOverrides()
    expect(overrides.value.find(o => o.id === 'ovr-active-1')!.status).toBe('active')
    const r = revoke('ovr-active-1', 'staff-1')
    expect(r.status).toBe('revoked')
  })

  it('runExpirySweep flips past-expiry active to expired', () => {
    const { overrides, runExpirySweep } = usePricingOverrides()
    overrides.value = [...overrides.value, {
      id: 'ovr-test-expire', tenantId: 't-5', promoCodeId: 'pc-test',
      discountType: 'percent', value: 5, reason: 'For sweep test long enough',
      proposedByStaffId: 'staff-3', proposedAt: new Date().toISOString(),
      approvedByStaffId: 'staff-2', approvedAt: new Date().toISOString(),
      stripeCouponId: 'mock_test', effectiveDate: new Date(Date.now() - 10 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() - 1000).toISOString(),
      status: 'active',
    }]
    runExpirySweep()
    expect(overrides.value.find(o => o.id === 'ovr-test-expire')!.status).toBe('expired')
  })

  it('blocks churned tenant', () => {
    const { propose } = usePricingOverrides()
    expect(() => propose({
      tenantId: 't-8', discountType: 'percent', value: 10,
      reason: 'Churned tenant test should be blocked',
      effectiveDate: new Date().toISOString(),
      proposedByStaffId: 'staff-3',
    })).toThrow(/churned/)
  })

  it('blocks suspended tenant', () => {
    const { propose } = usePricingOverrides()
    expect(() => propose({
      tenantId: 't-5', discountType: 'percent', value: 10,
      reason: 'Suspended tenant test should be blocked',
      effectiveDate: new Date().toISOString(),
      proposedByStaffId: 'staff-3',
    })).toThrow(/suspended/)
  })
})