import { ref } from 'vue'

export type PromoCodeDiscountType = '%' | 'fixed'

export type PromoCodeStatus = 'active' | 'inactive' | 'expired'

export interface PromoCode {
  id: string
  code: string
  description?: string
  discountType: PromoCodeDiscountType
  value: number
  currency?: string | null
  active: boolean
  validFrom?: string | null
  validUntil?: string | null
  usageLimit?: number | null
  redemptionCount: number
  createdAt: string
  updatedAt: string
  // Present when this promo code backs a Platform Console pricing override.
  // Joins the code to its PricingOverride record.
  internalOverrideId?: string
}

// Analytics scaffold — per-usage-site counter.
// Tracks which widget or website (later) a promo code is attached to,
// plus per-source redemption counts for future analytics breakdown.
export interface WidgetPromoCodeLink {
  promoCodeId: string
  source: 'widget' | 'website'
  sourceId: string
  usageCount: number
  addedAt: string
}

export const promoCodes = ref<PromoCode[]>([
  {
    id: 'promo-welcome10',
    code: 'WELCOME10',
    description: 'Welcome discount for new guests',
    discountType: '%',
    value: 10,
    currency: null,
    active: true,
    validFrom: null,
    validUntil: null,
    usageLimit: null,
    redemptionCount: 3,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
])

export const widgetPromoCodeLinks = ref<WidgetPromoCodeLink[]>([
  {
    promoCodeId: 'promo-welcome10',
    source: 'widget',
    sourceId: 'bk-widget-1',
    usageCount: 3,
    addedAt: '2026-01-01T00:00:00Z',
  },
])

export function generatePromoId(): string {
  return `promo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function isPromoCodeExpired(code: PromoCode, now: Date = new Date()): boolean {
  if (!code.validUntil)
    return false
  return new Date(code.validUntil).getTime() < now.getTime()
}

export function isPromoCodeStarted(code: PromoCode, now: Date = new Date()): boolean {
  if (!code.validFrom)
    return true
  return new Date(code.validFrom).getTime() <= now.getTime()
}

export function getPromoCodeStatus(code: PromoCode, now: Date = new Date()): PromoCodeStatus {
  if (!code.active)
    return 'inactive'
  if (isPromoCodeExpired(code, now))
    return 'expired'
  if (!isPromoCodeStarted(code, now))
    return 'inactive'
  return 'active'
}

export function formatPromoDiscount(code: PromoCode): string {
  if (code.discountType === '%')
    return `${code.value}%`
  return `${code.value}`
}
