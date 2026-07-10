export type Domain = 'reservations' | 'cleaning' | 'listings' | 'finance'

export interface Intent {
  domain: Domain
  action: string
  params: Record<string, any>
}

interface IntentRule {
  domain: Domain
  action: string
  keywords: string[]
  extractParams: (text: string) => Record<string, any>
  priority: number
}

function extractDateParam(text: string): Record<string, any> {
  const lower = text.toLowerCase()
  if (lower.includes('tomorrow')) return { when: 'tomorrow' }
  if (lower.includes('today')) return { when: 'today' }
  if (lower.includes('yesterday')) return { when: 'yesterday' }
  if (lower.includes('this week') || lower.includes('next week') || lower.includes('week')) {
    return { when: 'week' }
  }
  if (lower.includes('this month') || lower.includes('next month') || lower.includes('month')) {
    return { when: 'month' }
  }
  return { when: 'month' }
}


const RULES: IntentRule[] = [
  // Reservations & guests
  {
    domain: 'reservations',
    action: 'upcoming_checkins',
    keywords: ['check-in', 'checkin', 'arriving', 'arrival'],
    extractParams: extractDateParam,
    priority: 10,
  },
  {
    domain: 'reservations',
    action: 'upcoming_checkouts',
    keywords: ['check-out', 'checkout', 'leaving', 'departure'],
    extractParams: extractDateParam,
    priority: 10,
  },
  {
    domain: 'reservations',
    action: 'current_guests',
    keywords: ['in-house', 'in house', 'currently', 'staying now', 'right now'],
    extractParams: () => ({}),
    priority: 10,
  },
  {
    domain: 'reservations',
    action: 'repeat_guests',
    keywords: ['repeat guest', 'returning guest', 'loyal guest'],
    extractParams: () => ({}),
    priority: 10,
  },
  // Cleaning & operations
  {
    domain: 'cleaning',
    action: 'cleaning_schedule',
    keywords: ['cleaning', 'clean', 'housekeeping'],
    extractParams: extractDateParam,
    priority: 10,
  },
  {
    domain: 'cleaning',
    action: 'open_tasks',
    keywords: ['open task', 'pending task', 'unfinished task', 'overdue task'],
    extractParams: () => ({}),
    priority: 10,
  },
  // Listings & occupancy
  {
    domain: 'listings',
    action: 'listings_overview',
    keywords: ['listing', 'properties', 'portfolio', 'all villas'],
    extractParams: () => ({}),
    priority: 10,
  },
  {
    domain: 'listings',
    action: 'occupancy',
    keywords: ['occupancy', 'booked', 'utilization', 'vacancy'],
    extractParams: extractDateParam,
    priority: 10,
  },
  {
    domain: 'listings',
    action: 'performance',
    keywords: ['performance', 'best listing', 'top listing', 'worst listing'],
    extractParams: () => ({}),
    priority: 10,
  },
  // Finance
  {
    domain: 'finance',
    action: 'revenue_summary',
    keywords: ['revenue', 'income', 'earnings', 'how much money'],
    extractParams: extractDateParam,
    priority: 10,
  },
  {
    domain: 'finance',
    action: 'revenue_by_listing',
    keywords: ['revenue by listing', 'revenue per property', 'earnings by listing'],
    extractParams: extractDateParam,
    priority: 12,                                // more specific than revenue_summary
  },
  {
    domain: 'finance',
    action: 'costs',
    keywords: ['cost', 'expense', 'spending'],
    extractParams: extractDateParam,
    priority: 10,
  },
  {
    domain: 'finance',
    action: 'upsells',
    keywords: ['upsell', 'add-on', 'extra service'],
    extractParams: extractDateParam,
    priority: 10,
  },
]

export function matchQuery(text: string): Intent | null {
  const normalized = text.toLowerCase().trim()
  if (!normalized) return null

  const matches: { rule: IntentRule; score: number }[] = []
  for (const rule of RULES) {
    const score = rule.keywords.reduce((acc, kw) => acc + (normalized.includes(kw) ? 1 : 0), 0)
    if (score > 0) {
      matches.push({ rule, score: score * rule.priority })
    }
  }

  if (matches.length === 0) return null

  // Pick the highest-scoring rule. Ties broken by priority (already in score).
  matches.sort((a, b) => b.score - a.score)
  const winner = matches[0].rule
  return {
    domain: winner.domain,
    action: winner.action,
    params: winner.extractParams(normalized),
  }
}
