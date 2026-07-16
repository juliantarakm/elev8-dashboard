export type ChangelogChangeType = 'feature' | 'improvement' | 'fix'

export interface ChangelogChange {
  type: ChangelogChangeType
  description: string
}

export interface ChangelogEntry {
  version: string
  date: string
  badge?: string
  changes: ChangelogChange[]
}

export const changelogEntries: ChangelogEntry[] = [
  {
    version: '1.5.0',
    date: 'June 25, 2026',
    badge: 'Latest',
    changes: [
      { type: 'feature', description: 'WhatsApp integration: multi-account OAuth with listing assignment' },
      { type: 'feature', description: 'Booking Engine v2: simplified create flow with split v1/v2' },
      { type: 'improvement', description: 'Journeys: removed Integration step, generalized PropertyPicker to shared component' },
    ],
  },
  {
    version: '1.4.0',
    date: 'June 10, 2026',
    changes: [
      { type: 'feature', description: 'Booking widgets: WYSIWYG editor, seasonal pricing, length-of-stay discounts' },
      { type: 'feature', description: 'Booking widgets: contact field configuration (required/optional/hidden)' },
      { type: 'improvement', description: 'Payment requests: share dialog with WhatsApp & email sharing' },
    ],
  },
  {
    version: '1.3.0',
    date: 'May 25, 2026',
    changes: [
      { type: 'feature', description: 'Journeys: AI-powered builder with review screen' },
      { type: 'feature', description: 'Journeys: If/Else branching with Hard Requirement support' },
      { type: 'feature', description: 'Journeys: conditions modal with 14 rule types' },
      { type: 'improvement', description: 'Operations calendar: week/day toggle with event filtering' },
    ],
  },
  {
    version: '1.2.0',
    date: 'May 10, 2026',
    changes: [
      { type: 'feature', description: 'Payment requests: full lifecycle (create, cancel, duplicate, share)' },
      { type: 'feature', description: 'Payment requests: guest search from inbox & previous requests' },
      { type: 'feature', description: 'Operations calendar: weekly grid with cleaning jobs & tasks' },
      { type: 'improvement', description: 'Payment requests: fee calculator with card/manual mode' },
    ],
  },
  {
    version: '1.1.0',
    date: 'April 25, 2026',
    changes: [
      { type: 'feature', description: 'Guest messaging inbox with 4-panel layout' },
      { type: 'feature', description: 'Inbox: conversation list, chat view, reservation sidebar, guest profile' },
      { type: 'feature', description: 'Inbox: AI-written message detection with ElevAI branding' },
      { type: 'feature', description: 'Inbox: multi-select listing & tag filters' },
      { type: 'improvement', description: 'Listings: AI Schedule tab with weekly/monthly repeat configuration' },
    ],
  },
  {
    version: '1.0.0',
    date: 'April 1, 2026',
    changes: [
      { type: 'feature', description: 'Initial release of Elev8 dashboard' },
      { type: 'feature', description: 'Property listings management with photo gallery & amenities' },
      { type: 'feature', description: 'Finance overview with revenue & expense tracking' },
      { type: 'feature', description: 'Inventory management system' },
      { type: 'feature', description: 'User settings (profile, account, display, notifications)' },
    ],
  },
]

// Latest release — used by the dashboard popup and badge UIs.
// Update this whenever a new entry is added at the top of `changelogEntries`.
// Non-null assertion is safe: `changelogEntries` is always seeded with at least one entry.
export const latestChangelogEntry: ChangelogEntry = changelogEntries[0]!

export function changelogBadgeVariant(type: ChangelogChangeType): 'default' | 'secondary' | 'outline' {
  if (type === 'feature') return 'default'
  if (type === 'improvement') return 'secondary'
  return 'outline'
}

export function changelogBadgeLabel(type: ChangelogChangeType): string {
  if (type === 'feature') return 'New'
  if (type === 'improvement') return 'Improved'
  return 'Fixed'
}