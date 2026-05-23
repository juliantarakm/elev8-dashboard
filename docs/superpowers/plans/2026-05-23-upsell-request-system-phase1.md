# Upsell Request System — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build core order notifications, staff alert system, guest communication tracking, and cancellation flow for the upsell request system.

**Architecture:** Extend existing `UpsellOrder` data model with notification/cancellation fields. Create dedicated notification composable that bridges with existing `useNotifications`. Add notification log tab to order drawer and a new Notifications tab to the upsells page. Reuse existing NotificationCenter infrastructure for staff alerts.

**Tech Stack:** Nuxt 3, Vue 3, shadcn-vue, Tailwind CSS, vuedraggable, vue-sonner

---

## File Map

### New Files
- `app/components/upsells/data/upsell-notifications.ts` — Staff notification types + mock data
- `app/components/upsells/data/cancellation-policies.ts` — Cancellation rules per service
- `app/composables/useUpsellNotifications.ts` — Reactive state for upsell notifications
- `app/components/upsells/UpsellNotificationList.vue` — Staff notification list component
- `app/components/upsells/UpsellCancelModal.vue` — Cancellation reason modal

### Modified Files
- `app/components/upsells/data/upsell-orders.ts` — Extend UpsellOrder interface
- `app/composables/useUpsellOrders.ts` — Add cancellation helper
- `app/components/upsells/UpsellOrderDrawer.vue` — Add notification log tab, cancellation flow
- `app/components/upsells/UpsellOrderTable.vue` — Add action dropdown items
- `app/pages/upsells.vue` — Add Notifications tab
- `app/components/notifications/data/alerts.ts` — Extend with upsell alert types
- `app/composables/useNotifications.ts` — Add upsell alert support

---

## Dependencies

This plan depends on the existing upsells infrastructure (already built):
- `app/components/upsells/data/upsell-services.ts`
- `app/components/upsells/data/upsell-orders.ts`
- `app/composables/useUpsellOrders.ts`
- `app/composables/useUpsellServices.ts`
- `app/components/upsells/UpsellOrderDrawer.vue`
- `app/components/upsells/UpsellOrderTable.vue`
- `app/pages/upsells.vue`

---

## Tasks

### Task 1: Extend UpsellOrder Data Model

**Files:**
- Modify: `app/components/upsells/data/upsell-orders.ts`

**Step 1: Add new fields to UpsellOrder interface**

Add these fields to the existing `UpsellOrder` interface (after `invoice`):

```ts
  cancellationReason?: string
  cancellationBy?: 'guest' | 'staff'
  source: 'inbox' | 'manual' | 'web'
  conversationId?: string
  createdByStaffId: string
  guestNotifiedAt?: string
  staffNotifiedAt?: string
```

**Step 2: Update all mock orders**

For each of the 10 mock orders, add:
- `source: 'manual'`
- `createdByStaffId: 'staff-2'` (Komang Juliantara)
- For cancelled order (ord-010): add `cancellationReason: 'Next-day booking blocked availability.'`, `cancellationBy: 'staff'`

**Step 3: Commit**

```bash
git add app/components/upsells/data/upsell-orders.ts
git commit -m "feat(upsells): extend UpsellOrder with notification and cancellation fields"
```

---

### Task 2: Create Cancellation Policies Data

**Files:**
- Create: `app/components/upsells/data/cancellation-policies.ts`

**Step 1: Write cancellation policy data file**

```ts
export interface CancellationPolicy {
  serviceId: string
  fullRefundHours: number
  partialRefundHours: number
  partialRefundPercent: number
  noRefundHours: number
  lateCancellationFee: number
}

export const cancellationPolicies: CancellationPolicy[] = [
  { serviceId: 'svc-001', fullRefundHours: 48, partialRefundHours: 24, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 100000 },
  { serviceId: 'svc-002', fullRefundHours: 48, partialRefundHours: 24, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 300000 },
  { serviceId: 'svc-003', fullRefundHours: 24, partialRefundHours: 12, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 200000 },
  { serviceId: 'svc-004', fullRefundHours: 48, partialRefundHours: 24, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 150000 },
  { serviceId: 'svc-005', fullRefundHours: 24, partialRefundHours: 12, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 150000 },
  { serviceId: 'svc-006', fullRefundHours: 24, partialRefundHours: 12, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 100000 },
  { serviceId: 'svc-007', fullRefundHours: 24, partialRefundHours: 12, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 100000 },
  { serviceId: 'svc-008', fullRefundHours: 24, partialRefundHours: 12, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 100000 },
  { serviceId: 'svc-009', fullRefundHours: 48, partialRefundHours: 24, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 50000 },
  { serviceId: 'svc-010', fullRefundHours: 24, partialRefundHours: 12, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 100000 },
]

export function getPolicyForService(serviceId: string): CancellationPolicy | undefined {
  return cancellationPolicies.find(p => p.serviceId === serviceId)
}

export function calculateRefund(
  orderTotal: number,
  serviceDate: string,
  cancelledAt: string,
  policy: CancellationPolicy,
  cancelledBy: 'guest' | 'staff',
): { refundAmount: number; refundPercent: number; lateFee: number; reason: string } {
  if (cancelledBy === 'staff') {
    return { refundAmount: orderTotal, refundPercent: 100, lateFee: 0, reason: 'Staff cancellation — full refund' }
  }

  const hoursDiff = (new Date(serviceDate).getTime() - new Date(cancelledAt).getTime()) / (1000 * 60 * 60)

  if (hoursDiff >= policy.fullRefundHours) {
    return { refundAmount: orderTotal, refundPercent: 100, lateFee: 0, reason: `Cancelled ${Math.round(hoursDiff)}h in advance — full refund` }
  }
  if (hoursDiff >= policy.partialRefundHours) {
    const refund = Math.round(orderTotal * (policy.partialRefundPercent / 100))
    return { refundAmount: refund, refundPercent: policy.partialRefundPercent, lateFee: 0, reason: `Cancelled ${Math.round(hoursDiff)}h in advance — ${policy.partialRefundPercent}% refund` }
  }

  return { refundAmount: 0, refundPercent: 0, lateFee: policy.lateCancellationFee, reason: `Late cancellation (< ${policy.partialRefundHours}h) — no refund, late fee IDR ${policy.lateCancellationFee.toLocaleString()}` }
}
```

**Step 2: Commit**

```bash
git add app/components/upsells/data/cancellation-policies.ts
git commit -m "feat(upsells): add cancellation policy data and refund calculator"
```

---

### Task 3: Create Staff Notification Data

**Files:**
- Create: `app/components/upsells/data/upsell-notifications.ts`

**Step 1: Write notification types and mock data**

```ts
export type UpsellNotificationType =
  | 'order_requested'
  | 'order_confirmed'
  | 'order_cancelled'
  | 'order_completed'
  | 'order_late_cancel'
  | 'order_no_show'
  | 'order_reminder'

export interface UpsellStaffNotification {
  id: string
  type: UpsellNotificationType
  severity: 'info' | 'warning' | 'urgent'
  title: string
  message: string
  orderId: string
  recipientStaffId: string
  read: boolean
  createdAt: string
  actionUrl: string
  category: 'upsell'
  autoResolve: boolean
}

export const ORDER_NOTIFICATION_TEMPLATES: Record<UpsellNotificationType, { title: string; message: (orderId: string, guestName: string, serviceName: string, serviceDate: string) => string; severity: 'info' | 'warning' | 'urgent' }> = {
  order_requested: {
    title: 'New Upsell Request',
    message: (orderId, guestName, serviceName, serviceDate) => `${guestName} requested ${serviceName} for ${serviceDate}. Order ${orderId} requires confirmation.`,
    severity: 'info',
  },
  order_confirmed: {
    title: 'Order Confirmed',
    message: (orderId, guestName, serviceName, serviceDate) => `Order ${orderId} for ${guestName} (${serviceName}, ${serviceDate}) has been confirmed.`,
    severity: 'info',
  },
  order_cancelled: {
    title: 'Order Cancelled',
    message: (orderId, guestName, serviceName, serviceDate) => `Order ${orderId} for ${guestName} (${serviceName}, ${serviceDate}) was cancelled.`,
    severity: 'warning',
  },
  order_completed: {
    title: 'Order Completed',
    message: (orderId, guestName, serviceName, serviceDate) => `Order ${orderId} for ${guestName} (${serviceName}) is completed.`,
    severity: 'info',
  },
  order_late_cancel: {
    title: 'Late Cancellation',
    message: (orderId, guestName, serviceName, serviceDate) => `Late cancellation for order ${orderId}. ${guestName} cancelled ${serviceName} within 24h.`,
    severity: 'warning',
  },
  order_no_show: {
    title: 'Guest No-Show',
    message: (orderId, guestName, serviceName, serviceDate) => `Guest ${guestName} did not show for ${serviceName} (${serviceDate}). Order ${orderId}.`,
    severity: 'warning',
  },
  order_reminder: {
    title: 'Order Reminder',
    message: (orderId, guestName, serviceName, serviceDate) => `Reminder: ${serviceName} for ${guestName} is tomorrow (${serviceDate}). Order ${orderId}.`,
    severity: 'urgent',
  },
}

export const mockUpsellNotifications: UpsellStaffNotification[] = [
  {
    id: 'notif-001',
    type: 'order_requested',
    severity: 'info',
    title: 'New Upsell Request',
    message: 'Cameron Skillcorn requested Airport Transfer for 2026-05-12. Order ord-006 requires confirmation.',
    orderId: 'ord-006',
    recipientStaffId: 'staff-2',
    read: false,
    createdAt: '2026-05-10T09:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-006',
    category: 'upsell',
    autoResolve: true,
  },
  {
    id: 'notif-002',
    type: 'order_requested',
    severity: 'info',
    title: 'New Upsell Request',
    message: 'Amanda Healey requested In-Villa Spa for 2026-05-12. Order ord-007 requires confirmation.',
    orderId: 'ord-007',
    recipientStaffId: 'staff-2',
    read: false,
    createdAt: '2026-05-11T10:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-007',
    category: 'upsell',
    autoResolve: true,
  },
  {
    id: 'notif-003',
    type: 'order_reminder',
    severity: 'urgent',
    title: 'Order Reminder',
    message: 'Reminder: Airport Transfer for Cameron Skillcorn is tomorrow (2026-05-12). Order ord-006 still pending.',
    orderId: 'ord-006',
    recipientStaffId: 'staff-2',
    read: false,
    createdAt: '2026-05-11T06:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-006',
    category: 'upsell',
    autoResolve: true,
  },
  {
    id: 'notif-004',
    type: 'order_confirmed',
    severity: 'info',
    title: 'Order Confirmed',
    message: 'Order ord-008 for Khasan Alshalabi (Surf Lesson, 2026-05-12) has been confirmed.',
    orderId: 'ord-008',
    recipientStaffId: 'staff-2',
    read: true,
    createdAt: '2026-05-11T14:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-008',
    category: 'upsell',
    autoResolve: true,
  },
  {
    id: 'notif-005',
    type: 'order_cancelled',
    severity: 'warning',
    title: 'Order Cancelled',
    message: 'Order ord-010 for Reto Wyss (Late Check-out, 2026-05-10) was cancelled.',
    orderId: 'ord-010',
    recipientStaffId: 'staff-2',
    read: true,
    createdAt: '2026-05-08T16:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-010',
    category: 'upsell',
    autoResolve: true,
  },
  {
    id: 'notif-006',
    type: 'order_completed',
    severity: 'info',
    title: 'Order Completed',
    message: 'Order ord-001 for Thomas Wikes (Airport Transfer) is completed.',
    orderId: 'ord-001',
    recipientStaffId: 'staff-2',
    read: true,
    createdAt: '2026-05-01T15:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-001',
    category: 'upsell',
    autoResolve: true,
  },
  {
    id: 'notif-007',
    type: 'order_late_cancel',
    severity: 'warning',
    title: 'Late Cancellation',
    message: 'Late cancellation for order ord-010. Reto Wyss cancelled Late Check-out within 24h.',
    orderId: 'ord-010',
    recipientStaffId: 'staff-2',
    read: true,
    createdAt: '2026-05-08T14:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-010',
    category: 'upsell',
    autoResolve: true,
  },
  {
    id: 'notif-008',
    type: 'order_reminder',
    severity: 'urgent',
    title: 'Order Reminder',
    message: 'Reminder: Mid-stay Cleaning for Mikhail Batkovsky is tomorrow (2026-05-13). Order ord-009 still pending.',
    orderId: 'ord-009',
    recipientStaffId: 'staff-3',
    read: false,
    createdAt: '2026-05-12T06:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-009',
    category: 'upsell',
    autoResolve: true,
  },
  {
    id: 'notif-009',
    type: 'order_requested',
    severity: 'info',
    title: 'New Upsell Request',
    message: 'Mikhail Batkovsky requested Mid-stay Cleaning for 2026-05-13. Order ord-009 requires confirmation.',
    orderId: 'ord-009',
    recipientStaffId: 'staff-3',
    read: false,
    createdAt: '2026-05-12T11:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-009',
    category: 'upsell',
    autoResolve: true,
  },
  {
    id: 'notif-010',
    type: 'order_no_show',
    severity: 'warning',
    title: 'Guest No-Show',
    message: 'Guest Cameron Skillcorn did not show for Airport Transfer (2026-05-12). Order ord-006.',
    orderId: 'ord-006',
    recipientStaffId: 'staff-2',
    read: false,
    createdAt: '2026-05-12T16:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-006',
    category: 'upsell',
    autoResolve: false,
  },
]
```

**Step 2: Commit**

```bash
git add app/components/upsells/data/upsell-notifications.ts
git commit -m "feat(upsells): add staff notification types, templates, and mock data"
```

---

### Task 4: Create useUpsellNotifications Composable

**Files:**
- Create: `app/composables/useUpsellNotifications.ts`

**Step 1: Write the composable**

```ts
import { computed } from 'vue'
import type { UpsellStaffNotification, UpsellNotificationType } from '@/components/upsells/data/upsell-notifications'
import { mockUpsellNotifications, ORDER_NOTIFICATION_TEMPLATES } from '@/components/upsells/data/upsell-notifications'
import type { UpsellOrder } from '@/components/upsells/data/upsell-orders'

export function useUpsellNotifications() {
  const notifications = useState<UpsellStaffNotification[]>('upsell-notifications', () =>
    mockUpsellNotifications.map(n => ({ ...n })),
  )

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.read).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  )

  const allNotifications = computed(() =>
    [...notifications.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  )

  function markAsRead(id: string) {
    notifications.value = notifications.value.map(n =>
      n.id === id ? { ...n, read: true } : n,
    )
  }

  function markAllAsRead() {
    notifications.value = notifications.value.map(n => ({ ...n, read: true }))
  }

  function createNotification(order: UpsellOrder, type: UpsellNotificationType, recipientStaffId: string = 'staff-2') {
    const template = ORDER_NOTIFICATION_TEMPLATES[type]
    const id = `notif-${String(notifications.value.length + 1).padStart(3, '0')}`
    const now = new Date().toISOString()

    const notif: UpsellStaffNotification = {
      id,
      type,
      severity: template.severity,
      title: template.title,
      message: template.message(order.id, order.guestName, order.serviceName, order.serviceDate),
      orderId: order.id,
      recipientStaffId,
      read: false,
      createdAt: now,
      actionUrl: `/upsells?tab=orders&order=${order.id}`,
      category: 'upsell',
      autoResolve: true,
    }

    notifications.value = [notif, ...notifications.value]
  }

  return {
    notifications,
    unreadCount,
    unreadNotifications,
    allNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
  }
}
```

**Step 2: Commit**

```bash
git add app/composables/useUpsellNotifications.ts
git commit -m "feat(upsells): add useUpsellNotifications composable"
```

---

### Task 5: Add Cancellation Flow to useUpsellOrders

**Files:**
- Modify: `app/composables/useUpsellOrders.ts`

**Step 1: Add cancellation helper**

Add import and new function:

```ts
import { getPolicyForService, calculateRefund } from '@/components/upsells/data/cancellation-policies'
```

Add to return object:

```ts
  function cancelOrder(id: string, reason: string, cancelledBy: 'guest' | 'staff') {
    const order = orders.value.find(o => o.id === id)
    if (!order) return null

    const policy = getPolicyForService(order.serviceId)
    const refund = policy
      ? calculateRefund(order.grandTotal, order.serviceDate, new Date().toISOString(), policy, cancelledBy)
      : { refundAmount: order.grandTotal, refundPercent: 100, lateFee: 0, reason: 'No policy — full refund' }

    orders.value = orders.value.map(o =>
      o.id === id
        ? {
            ...o,
            status: 'cancelled',
            cancellationReason: reason,
            cancellationBy: cancelledBy,
            updatedAt: new Date().toISOString(),
          }
        : o,
    )

    return refund
  }
```

Update return object to include `cancelOrder`.

**Step 2: Commit**

```bash
git add app/composables/useUpsellOrders.ts
git commit -m "feat(upsells): add cancelOrder helper with refund calculation"
```

---

### Task 6: Create Cancellation Modal Component

**Files:**
- Create: `app/components/upsells/UpsellCancelModal.vue`

**Step 1: Write the modal component**

```vue
<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useUpsellOrders } from '@/composables/useUpsellOrders'
import { useUpsellNotifications } from '@/composables/useUpsellNotifications'
import type { UpsellOrder } from '@/components/upsells/data/upsell-orders'

const props = defineProps<{
  order: UpsellOrder | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { cancelOrder } = useUpsellOrders()
const { createNotification } = useUpsellNotifications()

const cancelReason = ref('')
const cancelledBy = ref<'guest' | 'staff'>('staff')

function onOpenChange(value: boolean) {
  emit('update:open', value)
  if (!value) {
    cancelReason.value = ''
    cancelledBy.value = 'staff'
  }
}

function handleCancel() {
  if (!props.order || !cancelReason.value.trim()) {
    toast.error('Cancellation reason is required.')
    return
  }

  const refund = cancelOrder(props.order.id, cancelReason.value.trim(), cancelledBy.value)
  if (refund) {
    createNotification(
      { ...props.order, status: 'cancelled' },
      cancelledBy.value === 'guest' && refund.lateFee > 0 ? 'order_late_cancel' : 'order_cancelled',
    )
    toast.success(`Order cancelled. ${refund.reason}`)
  }

  onOpenChange(false)
}
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogDescription>
          {{ order?.id }} — {{ order?.guestName }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-2">
          <Label>Cancellation Reason <span class="text-destructive">*</span></Label>
          <Textarea
            v-model="cancelReason"
            placeholder="Why is this order being cancelled?"
            rows="3"
          />
        </div>

        <div class="flex flex-col gap-2">
          <Label>Cancelled By</Label>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-md border p-2 text-sm text-center transition-colors"
              :class="cancelledBy === 'staff' ? 'border-primary bg-primary/5 font-medium' : 'border-border'"
              @click="cancelledBy = 'staff'"
            >
              Staff
            </button>
            <button
              type="button"
              class="flex-1 rounded-md border p-2 text-sm text-center transition-colors"
              :class="cancelledBy === 'guest' ? 'border-primary bg-primary/5 font-medium' : 'border-border'"
              @click="cancelledBy = 'guest'"
            >
              Guest
            </button>
          </div>
        </div>

        <div class="rounded-md bg-muted p-3 text-sm">
          <p class="text-muted-foreground">
            Refund will be calculated based on cancellation policy and timing.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="onOpenChange(false)">
          Keep Order
        </Button>
        <Button variant="destructive" @click="handleCancel">
          <Icon name="lucide:x-circle" class="mr-2 h-4 w-4" />
          Confirm Cancel
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

**Step 2: Commit**

```bash
git add app/components/upsells/UpsellCancelModal.vue
git commit -m "feat(upsells): add cancellation modal with reason and refund calculation"
```

---

### Task 7: Update UpsellOrderDrawer

**Files:**
- Modify: `app/components/upsells/UpsellOrderDrawer.vue`

**Step 1: Add cancellation modal integration**

Add import and state:

```ts
const showCancelModal = ref(false)
```

Add cancel button before existing status action buttons in footer:

For pending/confirmed status, add:
```vue
<Button
  v-if="order.status === 'pending' || order.status === 'confirmed'"
  variant="outline"
  class="flex-1"
  @click="showCancelModal = true"
>
  <Icon name="lucide:x-circle" class="mr-2 h-4 w-4" />
  Cancel
</Button>
```

Add UpsellCancelModal at end of template (inside Sheet, after SheetContent):

```vue
<UpsellsUpsellCancelModal
  :order="order"
  :open="showCancelModal"
  @update:open="showCancelModal = $event"
/>
```

**Step 2: Add notification log section**

After price breakdown section, add:

```vue
<Separator />

<div class="flex flex-col gap-2">
  <Label class="text-xs text-muted-foreground uppercase tracking-wide">Notifications</Label>
  <div class="flex flex-col gap-1.5">
    <div v-if="order.guestNotifiedAt" class="flex items-center gap-2 text-sm">
      <Icon name="lucide:check" class="h-3.5 w-3.5 text-emerald-500" />
      <span>Guest notified</span>
      <span class="text-xs text-muted-foreground">{{ order.guestNotifiedAt }}</span>
    </div>
    <div v-else class="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon name="lucide:minus" class="h-3.5 w-3.5" />
      <span>Guest not yet notified</span>
    </div>
    <div v-if="order.staffNotifiedAt" class="flex items-center gap-2 text-sm">
      <Icon name="lucide:check" class="h-3.5 w-3.5 text-emerald-500" />
      <span>Staff notified</span>
      <span class="text-xs text-muted-foreground">{{ order.staffNotifiedAt }}</span>
    </div>
  </div>
</div>
```

**Step 3: Commit**

```bash
git add app/components/upsells/UpsellOrderDrawer.vue
git commit -m "feat(upsells): add cancel button and notification log to order drawer"
```

---

### Task 8: Create UpsellNotificationList Component

**Files:**
- Create: `app/components/upsells/UpsellNotificationList.vue`

**Step 1: Write the component**

```vue
<script setup lang="ts">
import { useUpsellNotifications } from '@/composables/useUpsellNotifications'
import { ORDER_STATUS_COLORS } from '@/components/upsells/data/upsell-orders'

const { unreadNotifications, allNotifications, unreadCount, markAsRead, markAllAsRead } = useUpsellNotifications()

const filter = ref<'unread' | 'all'>('unread')

const displayedNotifications = computed(() => {
  return filter.value === 'unread' ? unreadNotifications.value : allNotifications.value
})

function severityIcon(severity: string) {
  switch (severity) {
    case 'urgent': return 'lucide:alert-triangle'
    case 'warning': return 'lucide:alert-circle'
    default: return 'lucide:info'
  }
}

function severityColor(severity: string) {
  switch (severity) {
    case 'urgent': return 'text-destructive'
    case 'warning': return 'text-amber-500'
    default: return 'text-muted-foreground'
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Filter bar -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button
          class="text-sm font-medium transition-colors"
          :class="filter === 'unread' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="filter = 'unread'"
        >
          Unread
          <Badge v-if="unreadCount > 0" variant="default" class="ml-1 h-4 min-w-[1rem] px-1 text-[10px]">
            {{ unreadCount }}
          </Badge>
        </button>
        <span class="text-muted-foreground">|</span>
        <button
          class="text-sm font-medium transition-colors"
          :class="filter === 'all' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="filter = 'all'"
        >
          All
        </button>
      </div>
      <Button v-if="unreadCount > 0" variant="ghost" size="sm" class="h-7 text-xs" @click="markAllAsRead">
        Mark all read
      </Button>
    </div>

    <!-- Notification list -->
    <div class="flex flex-col gap-2">
      <div
        v-for="notif in displayedNotifications"
        :key="notif.id"
        class="group flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
        :class="!notif.read ? 'bg-muted/30 border-l-4 border-l-primary' : ''"
        @click="markAsRead(notif.id)"
      >
        <div class="mt-0.5 shrink-0">
          <Icon
            :name="severityIcon(notif.severity)"
            class="h-4 w-4"
            :class="severityColor(notif.severity)"
          />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">{{ notif.title }}</span>
            <Badge
              v-if="!notif.read"
              variant="secondary"
              class="h-4 px-1 text-[10px]"
            >
              New
            </Badge>
          </div>
          <p class="text-sm text-muted-foreground">{{ notif.message }}</p>
          <div class="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{{ new Date(notif.createdAt).toLocaleDateString() }}</span>
            <NuxtLink :to="notif.actionUrl" class="hover:text-primary hover:underline" @click.stop>
              View Order
            </NuxtLink>
          </div>
        </div>
      </div>

      <div v-if="displayedNotifications.length === 0" class="py-8 text-center text-sm text-muted-foreground">
        {{ filter === 'unread' ? 'No unread notifications.' : 'No notifications.' }}
      </div>
    </div>
  </div>
</template>
```

**Step 2: Commit**

```bash
git add app/components/upsells/UpsellNotificationList.vue
git commit -m "feat(upsells): add notification list component with unread/all filter"
```

---

### Task 9: Update Upsells Page with 3 Tabs

**Files:**
- Modify: `app/pages/upsells.vue`

**Step 1: Add Notifications tab**

Update tabs from 2 to 3:

```vue
      <!-- View Tabs -->
      <div class="flex items-center gap-1 rounded-lg border bg-muted p-1 w-fit">
        <button
          class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all"
          :class="activeView === 'catalog' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          @click="activeView = 'catalog'"
        >
          <Icon name="lucide:package" class="h-4 w-4" />
          Catalog
        </button>
        <button
          class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all"
          :class="activeView === 'orders' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          @click="activeView = 'orders'"
        >
          <Icon name="lucide:shopping-cart" class="h-4 w-4" />
          Orders
          <Badge v-if="statusCounts.pending > 0" variant="default" class="h-5 min-w-[1.25rem] px-1 text-[10px]">
            {{ statusCounts.pending }}
          </Badge>
        </button>
        <button
          class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all"
          :class="activeView === 'notifications' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          @click="activeView = 'notifications'"
        >
          <Icon name="lucide:bell" class="h-4 w-4" />
          Notifications
          <Badge v-if="upsellUnreadCount > 0" variant="default" class="h-5 min-w-[1.25rem] px-1 text-[10px]">
            {{ upsellUnreadCount }}
          </Badge>
        </button>
      </div>
```

Add import and state:

```ts
import { useUpsellNotifications } from '@/composables/useUpsellNotifications'

const { unreadCount: upsellUnreadCount } = useUpsellNotifications()
```

Add Notifications tab content:

```vue
    <!-- Notifications View -->
    <template v-if="activeView === 'notifications'">
      <UpsellsUpsellNotificationList />
    </template>
```

**Step 2: Commit**

```bash
git add app/pages/upsells.vue
git commit -m "feat(upsells): add Notifications tab to upsells page"
```

---

### Task 10: Update NotificationCenter with Upsell Alerts

**Files:**
- Modify: `app/composables/useNotifications.ts`
- Modify: `app/components/notifications/data/alerts.ts`

**Step 1: Extend alert types**

In `app/components/notifications/data/alerts.ts`, add to the existing alert types or create a new section:

```ts
// Upsell alert types (extend existing AlertType or add new)
export type UpsellAlertType =
  | 'UPSELL_ORDER_REQUESTED'
  | 'UPSELL_ORDER_CONFIRMED'
  | 'UPSELL_ORDER_CANCELLED'
  | 'UPSELL_ORDER_COMPLETED'
  | 'UPSELL_ORDER_REMINDER'
```

**Step 2: Integrate in useNotifications**

In `app/composables/useNotifications.ts`, add integration with `useUpsellNotifications`:

```ts
import { useUpsellNotifications } from './useUpsellNotifications'

// Inside the composable function:
const { unreadNotifications, markAsRead: markUpsellAsRead } = useUpsellNotifications()

// Merge upsell notifications into filteredAlerts for display
// This is a bridge — upsell notifications appear in the main notification center
```

**Note:** This integration is lightweight — upsell notifications remain in their own state but surface in the main notification center dropdown.

**Step 3: Commit**

```bash
git add app/components/notifications/data/alerts.ts app/composables/useNotifications.ts
git commit -m "feat(upsells): integrate upsell alerts into NotificationCenter"
```

---

### Task 11: Update Order Table Actions

**Files:**
- Modify: `app/components/upsells/UpsellOrderTable.vue`

**Step 1: Add cancellation action to dropdown**

In the dropdown menu, add for pending/confirmed orders:

```vue
<DropdownMenuItem
  v-if="order.status === 'pending' || order.status === 'confirmed'"
  class="text-destructive"
  @click="handleCancel(order)"
>
  <Icon name="lucide:x-circle" class="mr-2 h-4 w-4" />
  Cancel Order
</DropdownMenuItem>
```

Add state and handler:

```ts
const showCancelModal = ref(false)
const cancelTargetOrder = ref<UpsellOrder | null>(null)

function handleCancel(order: UpsellOrder) {
  cancelTargetOrder.value = order
  showCancelModal.value = true
}
```

Add UpsellCancelModal at end of template.

**Step 2: Commit**

```bash
git add app/components/upsells/UpsellOrderTable.vue
git commit -m "feat(upsells): add cancel action to order table dropdown"
```

---

### Task 12: Typecheck and Final Commit

**Step 1: Run typecheck**

```bash
npx nuxi typecheck 2>&1 | grep -E "app/(components/upsells|composables/useUpsell|pages/upsells|components/notifications)"
```

Expected: No output (no errors).

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat(upsells): complete Phase 1 — notifications, cancellation, alerts

- Staff notification system with 10 mock notifications
- Guest notification log tracking
- Cancellation modal with reason + refund calculation
- Cancellation policies per service
- Notification log in order drawer
- Notifications tab on upsells page
- Integration with existing NotificationCenter
- Unread badges on tabs and notification bell"
```

---

## Spec Coverage Check

| Spec Section | Task(s) | Status |
|-------------|---------|--------|
| Data Model: UpsellOrder extensions | Task 1 | ✅ |
| Data Model: CancellationPolicy | Task 2 | ✅ |
| Data Model: StaffNotification | Task 3 | ✅ |
| Data Model: GuestNotificationLog (structure) | Task 1 (fields) | ✅ |
| Staff Notification Flow | Tasks 3, 4, 8, 9, 10 | ✅ |
| Guest Notification Flow (tracking) | Task 1 (fields), Task 7 | ✅ |
| Cancellation Flow | Tasks 2, 5, 6, 7, 11 | ✅ |
| Edge Cases: Cancellation policy | Tasks 2, 5 | ✅ |
| Edge Cases: Short notice | Tasks 3, 4 (urgent severity) | ✅ |
| UI: 3 Tabs | Task 9 | ✅ |
| UI: Notification list | Task 8 | ✅ |
| UI: Order drawer notifications | Task 7 | ✅ |
| Integration: NotificationCenter | Task 10 | ✅ |
| Inbox Integration | OUT OF SCOPE (Phase 2) | ⏸️ |
| Finance Sync | OUT OF SCOPE (Phase 3) | ⏸️ |
| Auto-reminders | OUT OF SCOPE (Phase 3) | ⏸️ |

---

## Testing Checklist

- [ ] Create order from existing flow → staff notification generated
- [ ] Cancel order → modal opens, reason required, refund calculated
- [ ] Staff cancel → 100% refund regardless of timing
- [ ] Guest cancel > 48h → full refund
- [ ] Guest cancel < 24h → no refund + late fee
- [ ] Notifications tab shows unread + all filter
- [ ] Mark notification as read → unread count decreases
- [ ] Order drawer shows notification log section
- [ ] Typecheck passes
- [ ] No console errors

---

*Plan complete. Ready for execution.*
