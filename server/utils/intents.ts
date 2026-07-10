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


import * as mock from './mock-data'

export interface ToolCall {
  id: string
  name: string
  args: Record<string, any>
  displayName: string
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_upcoming_checkins: 'Looked up upcoming check-ins',
  get_upcoming_checkouts: 'Looked up upcoming check-outs',
  get_current_bookings: 'Looked up in-house guests',
  get_cleaning_schedule: 'Looked up cleaning schedule',
  get_listings_overview: 'Looked up listings',
  get_listings_performance: 'Looked up listing performance',
  get_occupancy_rate: 'Calculated occupancy',
  get_revenue_summary: 'Looked up revenue',
  get_revenue_by_listing: 'Looked up revenue by listing',
  get_repeat_guests: 'Looked up repeat guests',
  get_pending_tasks: 'Looked up open tasks',
  get_costs: 'Looked up costs',
  get_upsells: 'Looked up upsells',
}

export interface AssistantChunk {
  type: 'tool_call' | 'text' | 'finish'
  toolName?: string
  args?: Record<string, any>
  delta?: string
}

export interface ResolvedIntent {
  toolCalls: ToolCall[]
  chunks: string[]                                   // pre-stream text chunks
}

/**
 * Resolves an Intent into mock data + a list of text chunks.
 * Chunks are short (≤60 chars) to simulate typing.
 */
export function resolveIntent(intent: Intent): ResolvedIntent {
  const tc = (name: string, args: Record<string, any>): ToolCall => ({
    id: `tc-${Math.random().toString(36).slice(2, 9)}`,
    name,
    args,
    displayName: TOOL_DISPLAY_NAMES[name] ?? name,
  })

  try {
    switch (intent.action) {
      case 'upcoming_checkins': {
        const data = mock.getUpcomingCheckins(intent.params.when)
        const tool = tc('get_upcoming_checkins', intent.params)
        if (data.length === 0) {
          return { toolCalls: [tool], chunks: splitText(`No check-ins for ${intent.params.when}.`) }
        }
        const header = `You have ${data.length} check-in${data.length > 1 ? 's' : ''} ${intent.params.when}:\n\n`
        const body = data
          .map(r => `• **${r.guestName}** — ${r.listingName}, ${r.checkInTime}, ${r.nights} night${r.nights > 1 ? 's' : ''}`)
          .join('\n')
        return { toolCalls: [tool], chunks: splitText(header + body) }
      }

      case 'upcoming_checkouts': {
        const data = mock.getUpcomingCheckouts(intent.params.when)
        const tool = tc('get_upcoming_checkouts', intent.params)
        if (data.length === 0) {
          return { toolCalls: [tool], chunks: splitText(`No check-outs for ${intent.params.when}.`) }
        }
        const header = `You have ${data.length} check-out${data.length > 1 ? 's' : ''} ${intent.params.when}:\n\n`
        const body = data
          .map(r => `• **${r.guestName}** — ${r.listingName}, ${r.checkOutDate}`)
          .join('\n')
        return { toolCalls: [tool], chunks: splitText(header + body) }
      }

      case 'current_guests': {
        const data = mock.getCurrentBookings()
        const tool = tc('get_current_bookings', {})
        if (data.length === 0) {
          return { toolCalls: [tool], chunks: splitText('No guests currently in-house.') }
        }
        const header = `${data.length} guest${data.length > 1 ? 's' : ''} in-house right now:\n\n`
        const body = data
          .map(r => `• **${r.guestName}** — ${r.listingName}, until ${r.checkOutDate}`)
          .join('\n')
        return { toolCalls: [tool], chunks: splitText(header + body) }
      }

      case 'repeat_guests': {
        const data = mock.getRepeatGuests()
        const tool = tc('get_repeat_guests', {})
        const header = `${data.length} repeat guest${data.length > 1 ? 's' : ''}:\n\n`
        const body = data
          .map(g => `• **${g.name}** — ${g.stays} stays, last visit ${g.lastVisit}`)
          .join('\n')
        return { toolCalls: [tool], chunks: splitText(header + body) }
      }

      case 'cleaning_schedule': {
        const data = mock.getCleaningSchedule(intent.params.when)
        const tool = tc('get_cleaning_schedule', intent.params)
        if (data.length === 0) {
          return { toolCalls: [tool], chunks: splitText(`No cleaning scheduled.`) }
        }
        const header = `${data.length} cleaning${data.length > 1 ? 's' : ''} scheduled:\n\n`
        const body = data
          .map(c => `• **${c.listingName}** — ${c.scheduledStart}-${c.scheduledEnd}, ${c.housekeeper}, ${c.type}`)
          .join('\n')
        return { toolCalls: [tool], chunks: splitText(header + body) }
      }

      case 'open_tasks': {
        const data = mock.getOpenTasks()
        const tool = tc('get_pending_tasks', {})
        if (data.length === 0) {
          return { toolCalls: [tool], chunks: splitText('No open tasks.') }
        }
        const header = `${data.length} open task${data.length > 1 ? 's' : ''}:\n\n`
        const body = data
          .map(t => `• **${t.title}** — ${t.listingName}, ${t.priority} priority, due ${t.dueDate}`)
          .join('\n')
        return { toolCalls: [tool], chunks: splitText(header + body) }
      }

      case 'listings_overview': {
        const data = mock.getListingsOverview()
        const tool = tc('get_listings_overview', {})
        const header = `${data.length} listing${data.length > 1 ? 's' : ''} in your portfolio:\n\n`
        const body = data
          .map(l => `• **${l.name}** — ${l.location}, ${l.bedrooms} BR, sleeps ${l.maxGuests}${l.isActive ? '' : ' (inactive)'}`)
          .join('\n')
        return { toolCalls: [tool], chunks: splitText(header + body) }
      }

      case 'performance': {
        const tool = tc('get_listings_performance', {})
        const raw = mock.getRevenueByListing() ?? []
        if (raw.length === 0) {
          return { toolCalls: [tool], chunks: splitText('No listing performance data available yet.') }
        }
        const sorted = [...raw].sort((a, b) => b.revenue - a.revenue)
        const header = `Top listings by revenue:\n\n`
        const body = sorted
          .map(l => `• **${l.listingName}** — ${l.revenue.toLocaleString('de-CH')} CHF (${l.nights} nights)`)
          .join('\n')
        return { toolCalls: [tool], chunks: splitText(header + body) }
      }

      case 'occupancy': {
        const data = mock.getOccupancy(intent.params.when)
        const tool = tc('get_occupancy_rate', intent.params)
        const header = `Occupancy ${intent.params.when}: **${data.overall}%**\n\n`
        const body = data.byListing
          .map(l => `• **${l.listingName}** — ${l.occupancy}%`)
          .join('\n')
        return { toolCalls: [tool], chunks: splitText(header + body) }
      }

      case 'revenue_summary': {
        const data = mock.getRevenueSummary(intent.params.when)
        const tool = tc('get_revenue_summary', intent.params)
        const text = `Revenue ${intent.params.when}: **${data.totalRevenue.toLocaleString('de-CH')} ${data.currency}**\n\n` +
          `• ${data.reservationCount} reservations\n` +
          `• ${data.bookedNights} booked nights\n` +
          `• Average daily rate: **${data.adr} ${data.currency}**`
        return { toolCalls: [tool], chunks: splitText(text) }
      }

      case 'revenue_by_listing': {
        const data = mock.getRevenueByListing()
        const tool = tc('get_revenue_by_listing', {})
        const header = `Revenue by listing:\n\n`
        const body = data
          .map(l => `• **${l.listingName}** — ${l.revenue.toLocaleString('de-CH')} CHF (${l.nights} nights, ADR ${l.adr})`)
          .join('\n')
        return { toolCalls: [tool], chunks: splitText(header + body) }
      }

      case 'costs': {
        const data = mock.getCosts(intent.params.when)
        const tool = tc('get_costs', intent.params)
        const text = `Total costs ${intent.params.when}: **${data.totalCosts.toLocaleString('de-CH')} ${data.currency}**\n\n` +
          Object.entries(data.byCategory)
            .map(([cat, amt]) => `• ${cat}: ${amt.toLocaleString('de-CH')} ${data.currency}`)
            .join('\n')
        return { toolCalls: [tool], chunks: splitText(text) }
      }

      case 'upsells': {
        const data = mock.getUpsells(intent.params.when)
        const tool = tc('get_upsells', intent.params)
        const text = `Upsell revenue ${intent.params.when}: **${data.totalRevenue.toLocaleString('de-CH')} ${data.currency}**\n\n` +
          `• ${data.count} orders\n` +
          `• Top category: **${data.topCategory}**`
        return { toolCalls: [tool], chunks: splitText(text) }
      }

      default:
        return fallbackResponse()
    }
  }
  catch (err) {
    console.error('resolveIntent error:', err)
    return {
      toolCalls: [],
      chunks: splitText("I had trouble looking that up. Try rephrasing?"),
    }
  }
}

function fallbackResponse(): ResolvedIntent {
  return {
    toolCalls: [],
    chunks: splitText(
      "I can help with **reservations**, **cleaning**, **listings**, **occupancy**, and **revenue**.\n\n" +
      "Try: 'Show today's check-ins', 'Cleaning schedule today', or 'Revenue this month'.",
    ),
  }
}

/**
 * Splits text into chunks of ≤60 chars on word boundaries.
 * Used to simulate streaming typing.
 */
export function splitText(text: string, maxLen = 60): string[] {
  const chunks: string[] = []
  const words = text.split(/(\s+)/)                 // keep whitespace
  let current = ''
  for (const word of words) {
    if ((current + word).length > maxLen && current.length > 0) {
      chunks.push(current.trim())
      current = word.trimStart()
    }
    else {
      current += word
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}
