# Notification Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build bell icon notification dropdown for CRITICAL and WARNING alerts in the header.

**Architecture:** Follows inbox module pattern — composable for shared state, data file for types + mock data, two components (bell/dropdown + notification row). Popover-based dropdown, not DropdownMenu.

**Tech Stack:** Nuxt 3, Vue 3, shadcn-vue (Popover, Badge, Button, ScrollArea, Separator), Tailwind CSS v4, date-fns, lucide icons

---

### Task 1: Types and Mock Data

**Files:**
- Create: `app/components/notifications/data/alerts.ts`

- [ ] **Step 1: Define AlertType union and Alert interface**

Create the file with Alert type and related types:

```ts
export type AlertType =
  | 'SMART_LOCK_DEAD'
  | 'SMART_LOCK_OFFLINE'
  | 'SMART_LOCK_CODE_FAILED'
  | 'CHANNEL_DISCONNECTED'
  | 'DOUBLE_BOOKING'
  | 'CLEANING_NOT_STARTED_IMMINENT'
  | 'CLEANING_NOT_DONE_CHECKIN_PASSED'
  | 'STRIPE_DISCONNECTED'
  | 'DEPOSIT_FAILED_AT_CHECKIN'
  | 'BOOKING_QUOTA_EMPTY'
  | 'BRIDGE_OFFLINE'
  | 'SMART_LOCK_BATTERY_CRITICAL'
  | 'SMART_LOCK_BATTERY_LOW'
  | 'NO_HOUSEKEEPING_ASSIGNED'
  | 'TASK_OVERDUE'
  | 'RATE_PLAN_UNMAPPED'
  | 'BOOKING_QUOTA_LOW'
  | 'DYNAMIC_TEMPLATE_FAILED'

export type AlertSeverity = 'CRITICAL' | 'WARNING'

export interface Alert {
  alert_id: string
  type: AlertType
  severity: AlertSeverity
  status: 'ACTIVE' | 'RESOLVED'
  listing_id: string | null
  property_id: string | null
  triggered_at: string
  resolved_at: string | null
  auto_resolve: boolean
  resolve_condition: string
  context: Record<string, any>
}
```

- [ ] **Step 2: Add display labels and route mapping**

```ts
export const alertDisplayLabels: Record<AlertType, string> = {
  SMART_LOCK_DEAD: 'Smart Lock — Battery Dead',
  SMART_LOCK_OFFLINE: 'Smart Lock — Offline',
  SMART_LOCK_CODE_FAILED: 'Smart Lock — Access Code Not Generated',
  CHANNEL_DISCONNECTED: 'Channel Manager — Disconnected',
  DOUBLE_BOOKING: 'Double Booking Detected',
  CLEANING_NOT_STARTED_IMMINENT: 'Cleaning Not Started — Check-in in 2 Hours',
  CLEANING_NOT_DONE_CHECKIN_PASSED: 'Cleaning Incomplete — Guest Checking In Now',
  STRIPE_DISCONNECTED: 'Stripe — Payment Connection Lost',
  DEPOSIT_FAILED_AT_CHECKIN: 'Security Deposit — Payment Failed',
  BOOKING_QUOTA_EMPTY: 'Booking Quota — 0 Remaining',
  BRIDGE_OFFLINE: 'Elev8 Bridge — Offline',
  SMART_LOCK_BATTERY_CRITICAL: 'Smart Lock — Battery Critical',
  SMART_LOCK_BATTERY_LOW: 'Smart Lock — Battery Low',
  NO_HOUSEKEEPING_ASSIGNED: 'No Housekeeping Assigned — Check-out Today',
  TASK_OVERDUE: 'Task Overdue',
  RATE_PLAN_UNMAPPED: 'Booking.com — Rate Plan Unmapped',
  BOOKING_QUOTA_LOW: 'Booking Quota — Running Low',
  DYNAMIC_TEMPLATE_FAILED: 'Automated Message — Failed to Send',
}

export const alertRouteMap: Partial<Record<AlertType, string>> = {
  SMART_LOCK_DEAD: '/',
  SMART_LOCK_OFFLINE: '/',
  SMART_LOCK_CODE_FAILED: '/',
  CHANNEL_DISCONNECTED: '/',
  DOUBLE_BOOKING: '/inbox',
  CLEANING_NOT_STARTED_IMMINENT: '/tasks',
  CLEANING_NOT_DONE_CHECKIN_PASSED: '/tasks',
  STRIPE_DISCONNECTED: '/settings/account',
  DEPOSIT_FAILED_AT_CHECKIN: '/inbox',
  BOOKING_QUOTA_EMPTY: '/',
  BRIDGE_OFFLINE: '/',
  SMART_LOCK_BATTERY_CRITICAL: '/',
  SMART_LOCK_BATTERY_LOW: '/',
  NO_HOUSEKEEPING_ASSIGNED: '/tasks',
  TASK_OVERDUE: '/tasks',
  RATE_PLAN_UNMAPPED: '/',
  BOOKING_QUOTA_LOW: '/',
  DYNAMIC_TEMPLATE_FAILED: '/',
}

export function getDescription(type: AlertType, context: Record<string, any>): string {
  // Generate one-line description from context
  switch (type) {
    case 'SMART_LOCK_DEAD':
    case 'SMART_LOCK_OFFLINE':
    case 'SMART_LOCK_BATTERY_CRITICAL':
    case 'SMART_LOCK_BATTERY_LOW':
      return `Lock${context.lock_names?.length ? `s: ${context.lock_names.join(', ')}` : ''}${context.next_checkin_at ? ' — next check-in soon' : ''}`
    case 'SMART_LOCK_CODE_FAILED':
      return `${context.guest_name || 'Guest'} — code not generated`
    case 'CHANNEL_DISCONNECTED':
      return `${context.channel_name || 'Channel'} — ${context.affected_listing_names?.length || 0} listing(s) affected`
    case 'DOUBLE_BOOKING':
      return `${context.listing_name || 'Property'} — ${context.reservation_a_guest} / ${context.reservation_b_guest}`
    case 'CLEANING_NOT_STARTED_IMMINENT':
    case 'CLEANING_NOT_DONE_CHECKIN_PASSED':
      return `${context.listing_name || 'Property'}${context.assigned_to ? ` — assigned to ${context.assigned_to}` : ' — unassigned'}`
    case 'STRIPE_DISCONNECTED':
      return `${context.pending_payments_count || 0} pending payment(s)`
    case 'DEPOSIT_FAILED_AT_CHECKIN':
      return `${context.guest_name || 'Guest'} — ${context.currency || 'USD'} ${context.deposit_amount || 0}`
    case 'BOOKING_QUOTA_EMPTY':
      return `Auto-refill ${context.auto_refill_failed ? 'failed' : 'attempted'}`
    case 'BRIDGE_OFFLINE':
      return `${context.affected_automations_count || 0} automation(s) affected`
    case 'NO_HOUSEKEEPING_ASSIGNED':
      return `${context.listing_name || 'Property'} — check-out today`
    case 'TASK_OVERDUE':
      return context.task_title || 'Overdue task'
    case 'RATE_PLAN_UNMAPPED':
      return `${context.listing_name || 'Property'} — ${context.unmapped_plans?.length || 0} unmapped plan(s)`
    case 'BOOKING_QUOTA_LOW':
      return `${context.percentage_remaining || 0}% remaining`
    case 'DYNAMIC_TEMPLATE_FAILED':
      return `${context.template_name || 'Template'} — ${context.guest_name || 'Guest'}`
    default:
      return ''
  }
}
```

- [ ] **Step 3: Export mock alerts**

```ts
export const mockAlerts: Alert[] = [
  {
    alert_id: 'alert-1',
    type: 'SMART_LOCK_DEAD',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    listing_id: 'listing-villa-1',
    property_id: null,
    triggered_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    resolved_at: null,
    auto_resolve: true,
    resolve_condition: 'Battery level returns above 20%',
    context: { lock_ids: ['lock-1', 'lock-2'], lock_names: ['Main Gate', 'Pool Gate'], battery_levels: [0, 2], next_checkin_at: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString() },
  },
  {
    alert_id: 'alert-2',
    type: 'CLEANING_NOT_STARTED_IMMINENT',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    listing_id: 'listing-villa-2',
    property_id: null,
    triggered_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    resolved_at: null,
    auto_resolve: true,
    resolve_condition: 'Cleaning status changes to In Progress or Completed',
    context: { listing_id: 'listing-villa-2', listing_name: 'Villa Cendana', reservation_id: 'res-2', checkin_at: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), assigned_to: null },
  },
  {
    alert_id: 'alert-3',
    type: 'STRIPE_DISCONNECTED',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    listing_id: null,
    property_id: null,
    triggered_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    resolved_at: null,
    auto_resolve: true,
    resolve_condition: 'Stripe reconnected successfully',
    context: { disconnected_since: new Date(Date.now() - 1000 * 60 * 120).toISOString(), pending_payments_count: 12 },
  },
  {
    alert_id: 'alert-4',
    type: 'TASK_OVERDUE',
    severity: 'WARNING',
    status: 'ACTIVE',
    listing_id: 'listing-villa-1',
    property_id: null,
    triggered_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    resolved_at: null,
    auto_resolve: true,
    resolve_condition: 'Task status changes to Done',
    context: { task_id: 'task-1', task_title: 'Fix pool pump', assigned_to: 'Wayan', due_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), listing_id: 'listing-villa-1', listing_name: 'Villa Kayu' },
  },
  {
    alert_id: 'alert-5',
    type: 'NO_HOUSEKEEPING_ASSIGNED',
    severity: 'WARNING',
    status: 'ACTIVE',
    listing_id: 'listing-villa-3',
    property_id: null,
    triggered_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    resolved_at: null,
    auto_resolve: true,
    resolve_condition: 'A staff member is assigned to the cleaning',
    context: { listing_id: 'listing-villa-3', listing_name: 'Villa Sari', checkout_at: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), next_checkin_at: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString() },
  },
  {
    alert_id: 'alert-6',
    type: 'SMART_LOCK_BATTERY_LOW',
    severity: 'WARNING',
    status: 'ACTIVE',
    listing_id: 'listing-villa-2',
    property_id: null,
    triggered_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    resolved_at: null,
    auto_resolve: true,
    resolve_condition: 'Battery returns above 20%, or escalates',
    context: { lock_ids: ['lock-3'], lock_names: ['Front Door'], battery_levels: [15], next_checkin_at: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString() },
  },
  {
    alert_id: 'alert-7',
    type: 'DOUBLE_BOOKING',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    listing_id: 'listing-villa-1',
    property_id: null,
    triggered_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    resolved_at: null,
    auto_resolve: false,
    resolve_condition: 'Host manually resolves',
    context: { listing_id: 'listing-villa-1', listing_name: 'Villa Kayu', reservation_a_id: 'res-a', reservation_a_guest: 'John Doe', reservation_b_id: 'res-b', reservation_b_guest: 'Jane Smith', overlap_start: '2026-05-10T14:00:00Z', overlap_end: '2026-05-12T11:00:00Z' },
  },
]
```

- [ ] **Step 4: Commit**

```sh
git add app/components/notifications/data/alerts.ts
git commit -m "feat(notifications): add Alert types and mock data"
```

---

### Task 2: Notification State Composable

**Files:**
- Create: `app/composables/useNotifications.ts`

- [ ] **Step 1: Create the composable with state and actions**

```ts
import type { Alert, AlertSeverity } from '~/components/notifications/data/alerts'
import { mockAlerts, alertRouteMap, getDescription } from '~/components/notifications/data/alerts'
import { formatDistanceToNow } from 'date-fns'

export type SeverityFilter = 'all' | 'critical' | 'warning'

export function useNotifications() {
  const alerts = useState<Alert[]>('notifications-alerts', () =>
    JSON.parse(JSON.stringify(mockAlerts))
  )

  const selectedSeverity = ref<SeverityFilter>('all')

  const activeAlerts = computed(() =>
    alerts.value.filter(a => a.status === 'ACTIVE')
  )

  const unreadCount = computed(() => activeAlerts.value.length)

  const filteredAlerts = computed(() => {
    const active = activeAlerts.value
    if (selectedSeverity.value === 'all') return active
    return active.filter(a =>
      a.severity === selectedSeverity.value.toUpperCase()
    )
  })

  function markAsRead(alertId: string) {
    alerts.value = alerts.value.map(a =>
      a.alert_id === alertId
        ? { ...a, status: 'RESOLVED' as const, resolved_at: new Date().toISOString() }
        : a
    )
  }

  function markAllAsRead() {
    const now = new Date().toISOString()
    alerts.value = alerts.value.map(a =>
      a.status === 'ACTIVE'
        ? { ...a, status: 'RESOLVED' as const, resolved_at: now }
        : a
    )
  }

  function dismiss(alertId: string) {
    markAsRead(alertId)
  }

  function navigateToAlert(alert: Alert) {
    markAsRead(alert.alert_id)
    const route = alertRouteMap[alert.type] || '/'
    navigateTo(route)
  }

  function getTimeAgo(isoString: string): string {
    return formatDistanceToNow(new Date(isoString), { addSuffix: true })
  }

  // Auto-resolve simulation
  function startAutoResolveSimulation() {
    const autoAlerts = alerts.value.filter(a => a.status === 'ACTIVE' && a.auto_resolve)
    autoAlerts.forEach((alert, index) => {
      setTimeout(() => {
        const current = alerts.value.find(a => a.alert_id === alert.alert_id)
        if (current && current.status === 'ACTIVE') {
          markAsRead(alert.alert_id)
        }
      }, 10000 + index * 3000)
    })
  }

  return {
    alerts,
    activeAlerts,
    unreadCount,
    selectedSeverity,
    filteredAlerts,
    markAsRead,
    markAllAsRead,
    dismiss,
    navigateToAlert,
    getTimeAgo,
    startAutoResolveSimulation,
    getDescription,
  }
}
```

- [ ] **Step 2: Commit**

```sh
git add app/composables/useNotifications.ts
git commit -m "feat(notifications): add useNotifications composable"
```

---

### Task 3: NotificationItem Component

**Files:**
- Create: `app/components/notifications/NotificationItem.vue`

- [ ] **Step 1: Create the notification item component**

```vue
<script setup lang="ts">
import type { Alert } from '~/components/notifications/data/alerts'

const props = defineProps<{
  alert: Alert
}>()

const emit = defineEmits<{
  click: [alert: Alert]
  dismiss: [alertId: string]
}>()

const { getTimeAgo, getDescription } = useNotifications()

const severityClasses = computed(() => {
  return props.alert.severity === 'CRITICAL'
    ? {
        bg: 'bg-red-50/50 hover:bg-red-50',
        border: 'border-l-4 border-red-500',
        dot: 'text-red-500',
      }
    : {
        bg: 'bg-amber-50/50 hover:bg-amber-50',
        border: 'border-l-4 border-amber-500',
        dot: 'text-amber-500',
      }
})

function handleClick() {
  emit('click', props.alert)
}

function handleDismiss(e: MouseEvent) {
  e.stopPropagation()
  emit('dismiss', props.alert.alert_id)
}
</script>

<template>
  <div
    class="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
    :class="[severityClasses.bg, severityClasses.border]"
    @click="handleClick"
  >
    <Icon
      name="lucide:circle"
      :class="['mt-0.5 size-2.5 shrink-0 fill-current', severityClasses.dot]"
    />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium truncate">
        {{ $alertDisplayLabels[alert.type] }}
      </p>
      <p class="text-xs text-muted-foreground truncate mt-0.5">
        {{ getDescription(alert.type, alert.context) }}
      </p>
      <p class="text-xs text-muted-foreground/70 mt-0.5">
        {{ getTimeAgo(alert.triggered_at) }}
      </p>
    </div>
    <button
      class="shrink-0 size-5 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      @click="handleDismiss"
    >
      <Icon name="lucide:x" class="size-3" />
    </button>
  </div>
</template>
```

Wait — the `$alertDisplayLabels` approach won't work in `<script setup>`. Let me fix:

```vue
<script setup lang="ts">
import type { Alert } from '~/components/notifications/data/alerts'
import { alertDisplayLabels } from '~/components/notifications/data/alerts'

const props = defineProps<{
  alert: Alert
}>()

const emit = defineEmits<{
  click: [alert: Alert]
  dismiss: [alertId: string]
}>()

const { getTimeAgo, getDescription } = useNotifications()

const severityClasses = computed(() => {
  return props.alert.severity === 'CRITICAL'
    ? {
        bg: 'bg-red-50/50 hover:bg-red-50',
        border: 'border-l-4 border-red-500',
        dot: 'text-red-500',
      }
    : {
        bg: 'bg-amber-50/50 hover:bg-amber-50',
        border: 'border-l-4 border-amber-500',
        dot: 'text-amber-500',
      }
})

function handleClick() {
  emit('click', props.alert)
}

function handleDismiss(e: MouseEvent) {
  e.stopPropagation()
  emit('dismiss', props.alert.alert_id)
}

const displayLabel = computed(() => alertDisplayLabels[props.alert.type])
const description = computed(() => getDescription(props.alert.type, props.alert.context))
</script>

<template>
  <div
    class="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
    :class="[severityClasses.bg, severityClasses.border]"
    @click="handleClick"
  >
    <Icon
      name="lucide:circle"
      :class="['mt-0.5 size-2.5 shrink-0 fill-current', severityClasses.dot]"
    />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium truncate">
        {{ displayLabel }}
      </p>
      <p class="text-xs text-muted-foreground truncate mt-0.5">
        {{ description }}
      </p>
      <p class="text-xs text-muted-foreground/70 mt-0.5">
        {{ getTimeAgo(props.alert.triggered_at) }}
      </p>
    </div>
    <button
      class="shrink-0 size-5 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      @click="handleDismiss"
    >
      <Icon name="lucide:x" class="size-3" />
    </button>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```sh
git add app/components/notifications/NotificationItem.vue
git commit -m "feat(notifications): add NotificationItem component"
```

---

### Task 4: NotificationCenter Component

**Files:**
- Create: `app/components/notifications/NotificationCenter.vue`

- [ ] **Step 1: Create the NotificationCenter component with bell icon and popover**

```vue
<script setup lang="ts">
import type { SeverityFilter } from '~/composables/useNotifications'
import { Button } from '~/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'

const {
  unreadCount,
  selectedSeverity,
  filteredAlerts,
  markAllAsRead,
  dismiss,
  navigateToAlert,
  startAutoResolveSimulation,
} = useNotifications()

// Import NotificationItem directly (it's in the same module)
import NotificationItem from './NotificationItem.vue'

onMounted(() => {
  startAutoResolveSimulation()
})

const tabs: { label: string; value: SeverityFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'Warning', value: 'warning' },
]
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="ghost" size="icon" class="relative size-8">
        <Icon name="lucide:bell" class="size-5" />
        <span
          v-if="unreadCount > 0"
          class="absolute -top-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[380px] p-0" align="end" side-offset="8">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3">
        <h3 class="text-sm font-semibold">Notifications</h3>
        <button
          v-if="unreadCount > 0"
          class="text-xs text-muted-foreground hover:text-foreground transition-colors"
          @click="markAllAsRead()"
        >
          Mark All Read
        </button>
      </div>

      <Separator />

      <!-- Filter Tabs -->
      <div class="flex gap-1 px-4 py-2">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="px-3 py-1 text-xs font-medium rounded-full transition-colors"
          :class="selectedSeverity === tab.value
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground'"
          @click="selectedSeverity = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <Separator />

      <!-- Notification List or Empty State -->
      <ScrollArea class="max-h-[400px]">
        <div v-if="filteredAlerts.length === 0" class="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Icon name="lucide:bell-off" class="size-8 mb-2" />
          <p class="text-sm">No notifications</p>
        </div>
        <NotificationItem
          v-for="alert in filteredAlerts"
          :key="alert.alert_id"
          :alert="alert"
          @click="navigateToAlert(alert)"
          @dismiss="dismiss"
        />
      </ScrollArea>

      <Separator />

      <!-- Footer -->
      <div class="px-4 py-2.5">
        <button class="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center">
          View all notifications
        </button>
      </div>
    </PopoverContent>
  </Popover>
</template>
```

- [ ] **Step 2: Commit**

```sh
git add app/components/notifications/NotificationCenter.vue
git commit -m "feat(notifications): add NotificationCenter with bell icon and popover"
```

---

### Task 5: Integrate into Header

**Files:**
- Modify: `app/components/layout/Header.vue`

- [ ] **Step 1: Add NotificationCenter before user menu**

Current header:
```vue
<script setup lang="ts">
</script>

<template>
  <header class="...">
    <SidebarTrigger />
    <div class="ml-auto">
      <LayoutHeaderUserMenu />
    </div>
  </header>
</template>
```

Menjadi:
```vue
<script setup lang="ts">
</script>

<template>
  <header class="sticky top-0 md:peer-data-[variant=inset]:top-2 z-10 h-(--header-height) flex items-center gap-4 border-b bg-background px-4 md:px-6 md:rounded-tl-xl md:rounded-tr-xl">
    <SidebarTrigger />
    <div class="ml-auto flex items-center gap-1">
      <NotificationCenter />
      <LayoutHeaderUserMenu />
    </div>
  </header>
</template>
```

- [ ] **Step 2: Commit**

```sh
git add app/components/layout/Header.vue
git commit -m "feat(notifications): integrate NotificationCenter into header"
```

---

### Task 6: Verify Build

- [ ] **Step 1: Run dev server and verify**

```sh
npm run dev
```

Navigate to localhost:3000/dashboard. Verify:
- Bell icon visible in header with badge showing unread count
- Click bell opens popover with 7 mock notifications
- Filter tabs work (All / Critical / Warning)
- Mark All Read resolves all notifications
- Dismiss (X) resolves single notification
- Klik notification navigates to appropriate route
- Auto-resolve simulation clears some notifications after ~10-15 seconds
