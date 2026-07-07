export type TenantStatus = 'active' | 'suspended' | 'churned' | 'switching'
export type TenantPlan = 'per_booking' | 'per_property'
export type PackageTier = 'starter' | 'growth' | 'pro' | 'enterprise'
export type Region = 'id' | 'ch' | 'th' | 'pt' | 'other'

export interface Tenant {
  id: string
  name: string
  logoText: string
  status: TenantStatus
  switchingToPlan?: TenantPlan
  plan: TenantPlan
  packageTier: PackageTier
  hasChannelManager: boolean
  region: Region
  isInternal: boolean
  mrrUsd: number | null
  quotaRemaining: number | null
  quotaTotal: number | null
  activeUnits: number
  lastLoginAt: string
  createdAt: string
  contractEndDate?: string
  billingCycleDay: number
  contactEmail: string
  contactName: string
  activeOverridesCount: number
  liveBannersCount: number
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString()

export const mockTenants: Tenant[] = [
  {
    id: 't-1', name: 'Bali Villas Co.', logoText: 'BV', status: 'active',
    plan: 'per_property', packageTier: 'pro', hasChannelManager: true, region: 'id',
    isInternal: false, mrrUsd: 899, quotaRemaining: null, quotaTotal: null,
    activeUnits: 32, lastLoginAt: daysAgo(0), createdAt: daysAgo(420),
    contractEndDate: daysFromNow(280), billingCycleDay: 1,
    contactEmail: 'admin@balivillas.com', contactName: 'Wayan Pratama',
    activeOverridesCount: 1, liveBannersCount: 1,
  },
  {
    id: 't-2', name: 'Swiss Alpine Retreats', logoText: 'SA', status: 'active',
    plan: 'per_property', packageTier: 'enterprise', hasChannelManager: true, region: 'ch',
    isInternal: false, mrrUsd: 2499, quotaRemaining: null, quotaTotal: null,
    activeUnits: 78, lastLoginAt: daysAgo(1), createdAt: daysAgo(900),
    contractEndDate: daysFromNow(120), billingCycleDay: 15,
    contactEmail: 'gm@swissalpine.ch', contactName: 'Hans Müller',
    activeOverridesCount: 0, liveBannersCount: 2,
  },
  {
    id: 't-3', name: 'Canggu Surf Hostel', logoText: 'CS', status: 'active',
    plan: 'per_booking', packageTier: 'starter', hasChannelManager: false, region: 'id',
    isInternal: false, mrrUsd: null, quotaRemaining: 38, quotaTotal: 50,
    activeUnits: 4, lastLoginAt: daysAgo(2), createdAt: daysAgo(60),
    billingCycleDay: 1,
    contactEmail: 'host@canggu-surf.id', contactName: 'Made Wirawan',
    activeOverridesCount: 0, liveBannersCount: 0,
  },
  {
    id: 't-4', name: 'Lisbon Heritage Suites', logoText: 'LH', status: 'switching',
    switchingToPlan: 'per_property', plan: 'per_booking',
    packageTier: 'growth', hasChannelManager: true, region: 'pt',
    isInternal: false, mrrUsd: null, quotaRemaining: 187, quotaTotal: 250,
    activeUnits: 12, lastLoginAt: daysAgo(0), createdAt: daysAgo(365),
    billingCycleDay: 10,
    contactEmail: 'admin@lisbonheritage.pt', contactName: 'Sofia Costa',
    activeOverridesCount: 0, liveBannersCount: 0,
  },
  {
    id: 't-5', name: 'Phuket Beach Bungalows', logoText: 'PB', status: 'suspended',
    plan: 'per_property', packageTier: 'starter', hasChannelManager: false, region: 'th',
    isInternal: false, mrrUsd: 99, quotaRemaining: null, quotaTotal: null,
    activeUnits: 2, lastLoginAt: daysAgo(14), createdAt: daysAgo(200),
    contractEndDate: daysFromNow(45), billingCycleDay: 1,
    contactEmail: 'ops@phuketbeach.th', contactName: 'Niran Suk',
    activeOverridesCount: 0, liveBannersCount: 0,
  },
  {
    id: 't-6', name: 'Chamonix Chalet Group', logoText: 'CC', status: 'active',
    plan: 'per_property', packageTier: 'growth', hasChannelManager: true, region: 'ch',
    isInternal: false, mrrUsd: 449, quotaRemaining: null, quotaTotal: null,
    activeUnits: 14, lastLoginAt: daysAgo(3), createdAt: daysAgo(500),
    contractEndDate: daysFromNow(200), billingCycleDay: 20,
    contactEmail: 'admin@chamonixchalet.ch', contactName: 'Pierre Dubois',
    activeOverridesCount: 0, liveBannersCount: 1,
  },
  {
    id: 't-7', name: 'Ubud Wellness Retreat', logoText: 'UW', status: 'active',
    plan: 'per_booking', packageTier: 'enterprise', hasChannelManager: true, region: 'id',
    isInternal: false, mrrUsd: null, quotaRemaining: 920, quotaTotal: 1000,
    activeUnits: 22, lastLoginAt: daysAgo(0), createdAt: daysAgo(800),
    billingCycleDay: 1,
    contactEmail: 'team@ubudwellness.id', contactName: 'Ketut Sari',
    activeOverridesCount: 1, liveBannersCount: 0,
  },
  {
    id: 't-8', name: 'Porto Riverside Hostel', logoText: 'PR', status: 'churned',
    plan: 'per_booking', packageTier: 'starter', hasChannelManager: false, region: 'pt',
    isInternal: false, mrrUsd: 0, quotaRemaining: null, quotaTotal: null,
    activeUnits: 0, lastLoginAt: daysAgo(120), createdAt: daysAgo(700),
    billingCycleDay: 1,
    contactEmail: '-', contactName: '-',
    activeOverridesCount: 0, liveBannersCount: 0,
  },
  {
    id: 't-9', name: 'Elev8 Internal Demo', logoText: 'EI', status: 'active',
    plan: 'per_property', packageTier: 'enterprise', hasChannelManager: true, region: 'other',
    isInternal: true, mrrUsd: 0, quotaRemaining: null, quotaTotal: null,
    activeUnits: 5, lastLoginAt: daysAgo(0), createdAt: daysAgo(30),
    contractEndDate: daysFromNow(365), billingCycleDay: 1,
    contactEmail: 'demo@elev8.io', contactName: 'Elev8 QA',
    activeOverridesCount: 0, liveBannersCount: 0,
  },
  {
    id: 't-10', name: 'Seminyak Luxury Villas', logoText: 'SL', status: 'active',
    plan: 'per_property', packageTier: 'growth', hasChannelManager: true, region: 'id',
    isInternal: false, mrrUsd: 549, quotaRemaining: null, quotaTotal: null,
    activeUnits: 18, lastLoginAt: daysAgo(1), createdAt: daysAgo(550),
    contractEndDate: daysFromNow(180), billingCycleDay: 5,
    contactEmail: 'admin@seminyakvillas.id', contactName: 'Gede Putra',
    activeOverridesCount: 0, liveBannersCount: 0,
  },
]

export const TENANT_PLAN_LABEL: Record<TenantPlan, string> = {
  per_booking: 'Per Booking',
  per_property: 'Per Property',
}

export const TIER_LABEL: Record<PackageTier, string> = {
  starter: 'Starter', growth: 'Growth', pro: 'Pro', enterprise: 'Enterprise',
}

export const REGION_LABEL: Record<Region, string> = {
  id: 'Indonesia', ch: 'Switzerland', th: 'Thailand', pt: 'Portugal', other: 'Other',
}

export const TENANT_STATUS_LABEL: Record<TenantStatus, string> = {
  active: 'Active', suspended: 'Suspended', churned: 'Churned', switching: 'Switching',
}