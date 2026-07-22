// Commission rules — how the management company charges the owner for
// handling their listing. Each rule is scoped to a single (owner, listing)
// pair so it can be edited independently for shared properties.
//
// Three flavours are supported:
//   - flat:     a single percentage of revenue.
//   - tiered:   a marginal rate (e.g. 20% on the first 1,000 USD, 12% above).
//   - hybrid:   a fixed management fee plus a percentage of revenue.

export interface CommissionTier {
  /** Inclusive upper bound of this tier in the listing's statement currency. `null` = open-ended top tier. */
  upTo: number | null
  /** Percentage applied to revenue within this tier (0–100). */
  rate: number
}

interface CommissionRuleBase {
  id: string
  ownerId: string
  listingId: string
  name: string
  effectiveFrom: string
  effectiveTo?: string
}

export type CommissionRule
  = | (CommissionRuleBase & { type: 'flat', rate: number })
    | (CommissionRuleBase & { type: 'tiered', tiers: CommissionTier[] })
    | (CommissionRuleBase & { type: 'hybrid', fixedAmount: number, rate: number })

// --- Seed fixtures ----------------------------------------------------------

export const mockCommissionRules: CommissionRule[] = [
  // Wayan (lst-1): flat 20% management commission.
  {
    id: 'cr-1',
    ownerId: 'own-1',
    listingId: 'lst-1',
    name: 'Standard 20% management',
    type: 'flat',
    rate: 20,
    effectiveFrom: '2026-01-15',
  },
  // I Putu (lst-3): tiered — cheaper on the first 50M IDR, then standard.
  {
    id: 'cr-2',
    ownerId: 'own-2',
    listingId: 'lst-3',
    name: 'Tiered — 18% / 22%',
    type: 'tiered',
    tiers: [
      { upTo: 50_000_000, rate: 18 },
      { upTo: null, rate: 22 },
    ],
    effectiveFrom: '2025-12-01',
  },
  // I Putu (lst-8): hybrid — fixed base fee + 15% on revenue above.
  {
    id: 'cr-3',
    ownerId: 'own-2',
    listingId: 'lst-8',
    name: 'Hybrid — 250 USD + 15%',
    type: 'hybrid',
    fixedAmount: 250,
    rate: 15,
    effectiveFrom: '2025-12-01',
  },
  // Ni Kadek (lst-3): flat 18% (slightly lower than I Putu because of higher projected volume).
  {
    id: 'cr-4',
    ownerId: 'own-3',
    listingId: 'lst-3',
    name: 'Standard 18% management',
    type: 'flat',
    rate: 18,
    effectiveFrom: '2026-07-01',
  },
]
