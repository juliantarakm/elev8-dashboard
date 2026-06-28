<script setup lang="ts">
interface ChangelogEntry {
  version: string
  date: string
  badge?: string
  changes: {
    type: 'feature' | 'improvement' | 'fix'
    description: string
  }[]
}

const entries: ChangelogEntry[] = [
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
    badge: '',
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

function badgeVariant(type: ChangelogEntry['changes'][number]['type']) {
  if (type === 'feature') return 'default'
  if (type === 'improvement') return 'secondary'
  return 'outline'
}

function badgeLabel(type: ChangelogEntry['changes'][number]['type']) {
  if (type === 'feature') return 'New'
  if (type === 'improvement') return 'Improved'
  return 'Fixed'
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <div class="flex flex-col gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Changelog
        </h2>
        <p class="text-muted-foreground">
          Track every update, feature, and improvement to Elev8.
        </p>
      </div>

      <div class="relative mt-4">
        <!-- Timeline line -->
        <div class="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

        <div class="space-y-8">
          <div
            v-for="entry in entries"
            :key="entry.version"
            class="relative pl-8"
          >
            <!-- Timeline dot -->
            <div class="absolute left-0 top-1.5 flex items-center justify-center">
              <div class="size-[15px] rounded-full border-[3px] border-primary bg-background" />
            </div>

            <!-- Version header -->
            <div class="mb-1 flex items-baseline gap-3">
              <h3 class="text-lg font-semibold tracking-tight">
                v{{ entry.version }}
              </h3>
              <span class="text-xs text-muted-foreground">{{ entry.date }}</span>
              <Badge
                v-if="entry.badge"
                variant="default"
                class="text-[10px] px-1.5 py-0 h-5"
              >
                {{ entry.badge }}
              </Badge>
            </div>

            <!-- Changes list -->
            <ul class="space-y-2">
              <li
                v-for="(change, i) in entry.changes"
                :key="i"
                class="flex items-start gap-2 text-sm"
              >
                <Badge
                  :variant="badgeVariant(change.type)"
                  class="shrink-0 text-[10px] px-1.5 py-0 h-5 mt-0.5 min-w-[52px] text-center"
                >
                  {{ badgeLabel(change.type) }}
                </Badge>
                <span class="text-foreground">{{ change.description }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
