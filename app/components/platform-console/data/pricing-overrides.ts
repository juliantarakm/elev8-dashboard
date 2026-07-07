export type OverrideStatus = 'pending_approval' | 'active' | 'expired' | 'revoked' | 'rejected'
export type DiscountType = 'percent' | 'fixed'

export interface PricingOverride {
  id: string
  tenantId: string
  promoCodeId: string
  discountType: DiscountType
  value: number
  currency?: 'USD'
  reason: string
  proposedByStaffId: string
  proposedAt: string
  approvedByStaffId?: string
  approvedAt?: string
  rejectedAt?: string
  rejectionNote?: string
  revokedAt?: string
  revokedByStaffId?: string
  stripeCouponId?: string
  effectiveDate: string
  expiryDate?: string
  status: OverrideStatus
  queuedForSwitch?: boolean
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString()

export const mockPricingOverrides: PricingOverride[] = [
  {
    id: 'ovr-active-1', tenantId: 't-1', promoCodeId: 'pc-override-t-1',
    discountType: 'percent', value: 10, currency: 'USD',
    reason: 'Renewal retention — long-term customer, 10% loyalty discount',
    proposedByStaffId: 'staff-3', proposedAt: daysAgo(40),
    approvedByStaffId: 'staff-2', approvedAt: daysAgo(40),
    stripeCouponId: 'mock_coupon_a1b2c3d4', effectiveDate: daysAgo(30),
    expiryDate: daysFromNow(60), status: 'active',
  },
  {
    id: 'ovr-active-2', tenantId: 't-7', promoCodeId: 'pc-override-t-7',
    discountType: 'fixed', value: 100, currency: 'USD',
    reason: 'Volume commitment — 22 units, fixed $100/mo off',
    proposedByStaffId: 'staff-3', proposedAt: daysAgo(80),
    approvedByStaffId: 'staff-2', approvedAt: daysAgo(80),
    stripeCouponId: 'mock_coupon_e5f6g7h8', effectiveDate: daysAgo(70),
    expiryDate: daysFromNow(30), status: 'active',
  },
  {
    id: 'ovr-pending-1', tenantId: 't-6', promoCodeId: 'pc-override-t-6-pending',
    discountType: 'percent', value: 25,
    reason: 'Acquisition incentive — strong referrals, aggressive discount',
    proposedByStaffId: 'staff-3', proposedAt: daysAgo(1),
    effectiveDate: daysFromNow(0), expiryDate: daysFromNow(180), status: 'pending_approval',
  },
  {
    id: 'ovr-expired-1', tenantId: 't-2', promoCodeId: 'pc-override-t-2-old',
    discountType: 'percent', value: 5,
    reason: 'Initial 6-month onboarding discount',
    proposedByStaffId: 'staff-3', proposedAt: daysAgo(220),
    approvedByStaffId: 'staff-2', approvedAt: daysAgo(220),
    stripeCouponId: 'mock_coupon_i9j0k1l2', effectiveDate: daysAgo(210),
    expiryDate: daysAgo(30), status: 'expired',
  },
  {
    id: 'ovr-revoked-1', tenantId: 't-10', promoCodeId: 'pc-override-t-10-revoked',
    discountType: 'fixed', value: 30,
    reason: 'Originally applied for Q1 campaign — campaign ended early',
    proposedByStaffId: 'staff-3', proposedAt: daysAgo(120),
    approvedByStaffId: 'staff-2', approvedAt: daysAgo(120),
    revokedAt: daysAgo(30), revokedByStaffId: 'staff-1',
    stripeCouponId: 'mock_coupon_m3n4o5p6', effectiveDate: daysAgo(110),
    expiryDate: daysFromNow(60), status: 'revoked',
  },
  {
    id: 'ovr-rejected-1', tenantId: 't-3', promoCodeId: 'pc-override-t-3-rejected',
    discountType: 'percent', value: 40,
    reason: 'Requested trial extension at deep discount',
    proposedByStaffId: 'staff-3', proposedAt: daysAgo(10),
    rejectedAt: daysAgo(9), rejectionNote: 'Discount too aggressive for starter tier. Re-propose at ≤15%.',
    effectiveDate: daysFromNow(0), status: 'rejected',
  },
  {
    id: 'ovr-hist-1', tenantId: 't-1', promoCodeId: 'pc-hist-1',
    discountType: 'fixed', value: 50,
    reason: 'Q4 2025 retention — renewed early',
    proposedByStaffId: 'staff-3', proposedAt: daysAgo(180),
    approvedByStaffId: 'staff-2', approvedAt: daysAgo(180),
    stripeCouponId: 'mock_coupon_q7r8s9t0', effectiveDate: daysAgo(170),
    expiryDate: daysAgo(20), status: 'expired',
  },
  {
    id: 'ovr-hist-2', tenantId: 't-1', promoCodeId: 'pc-hist-2',
    discountType: 'percent', value: 8,
    reason: 'Mid-term adjustment — early upgrade incentive',
    proposedByStaffId: 'staff-3', proposedAt: daysAgo(90),
    approvedByStaffId: 'staff-2', approvedAt: daysAgo(90),
    stripeCouponId: 'mock_coupon_u1v2w3x4', effectiveDate: daysAgo(85),
    expiryDate: daysAgo(15), status: 'expired',
  },
]