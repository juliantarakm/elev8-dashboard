# Upsell Request System — Phase 2: Inbox Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate upsell order creation directly into the Inbox chat thread, allowing staff to create orders without leaving the conversation.

**Architecture:** Extend Conversation model with `linkedUpsellOrderIds`. Create a mini drawer component (`UpsellOrderCreator`) embedded in the inbox thread. Staff clicks a button → drawer opens with guest/reservation info pre-filled → selects service/items/date → order created → linked to conversation.

**Tech Stack:** Nuxt 3, Vue 3, shadcn-vue, existing Inbox module patterns

---

## File Map

### New Files
- `app/components/inbox/UpsellOrderCreator.vue` — Mini drawer for creating orders from chat

### Modified Files
- `app/components/inbox/data/conversations.ts` — Add `linkedUpsellOrderIds` to Conversation
- `app/composables/useInbox.ts` — Add helpers for linked upsell orders
- `app/components/inbox/ReplyBox.vue` — Add "Create Upsell Order" button
- `app/components/inbox/Thread.vue` — Show linked orders in thread header
- `app/composables/useUpsellOrders.ts` — Add `createOrder` helper
- `app/composables/useUpsellNotifications.ts` — Auto-create notification on inbox order

---

## Dependencies

This plan depends on Phase 1 (completed):
- `useUpsellNotifications` composable
- `useUpsellOrders` composable
- `UpsellService` data with availability field
- `cancellationPolicies` data

---

## Tasks

### Task 1: Extend Conversation Data Model

**File:**
- Modify: `app/components/inbox/data/conversations.ts`

**Step 1: Add linkedUpsellOrderIds field**

Add to the `Conversation` interface (after `cleaningStatus`):

```ts
  linkedUpsellOrderIds?: string[]
```

**Step 2: Update all 6 mock conversations**

For each conversation in `conversationsData`, add:
- `linkedUpsellOrderIds: []` (default empty)

For conversation with `id: 'conv-005'` (Cameron Skillcorn, who has ord-004 and ord-006):
```ts
linkedUpsellOrderIds: ['ord-004', 'ord-006']
```

For conversation with `id: 'conv-001'` (if it matches Thomas Wikes / ord-001):
```ts
linkedUpsellOrderIds: ['ord-001']
```

Check the conversation IDs against reservation IDs in mock orders to find matches.

**Step 3: Commit**

```bash
git add app/components/inbox/data/conversations.ts
git commit -m "feat(inbox): add linkedUpsellOrderIds to Conversation model"
```

---

### Task 2: Add Linked Order Helpers to useInbox

**File:**
- Modify: `app/composables/useInbox.ts`

**Step 1: Add imports**

```ts
import type { UpsellOrder } from '~/components/upsells/data/upsell-orders'
import { useUpsellOrders } from './useUpsellOrders'
```

**Step 2: Add helper functions**

Inside `useInbox()` composable, add:

```ts
function getLinkedOrders(conversationId: string): UpsellOrder[] {
  const { orders } = useUpsellOrders()
  const conv = conversations.value.find(c => c.id === conversationId)
  if (!conv?.linkedUpsellOrderIds?.length)
    return []
  return orders.value.filter(o => conv.linkedUpsellOrderIds!.includes(o.id))
}

function linkOrderToConversation(conversationId: string, orderId: string) {
  conversations.value = conversations.value.map(c =>
    c.id === conversationId
      ? { ...c, linkedUpsellOrderIds: [...(c.linkedUpsellOrderIds || []), orderId] }
      : c,
  )
}
```

**Step 3: Add to return object**

```ts
    getLinkedOrders,
    linkOrderToConversation,
```

**Step 4: Commit**

```bash
git add app/composables/useInbox.ts
git commit -m "feat(inbox): add getLinkedOrders and linkOrderToConversation helpers"
```

---

### Task 3: Create UpsellOrderCreator Component

**File:**
- Create: `app/components/inbox/UpsellOrderCreator.vue`

**Step 1: Write the mini drawer component**

```vue
<script setup lang="ts">
import type { Conversation } from '@/components/inbox/data/conversations'
import type { UpsellService } from '@/components/upsells/data/upsell-services'
import { toast } from 'vue-sonner'
import { BALI_LISTINGS } from '@/components/upsells/data/upsell-services'
import { useInbox } from '@/composables/useInbox'
import { useUpsellNotifications } from '@/composables/useUpsellNotifications'
import { useUpsellOrders } from '@/composables/useUpsellOrders'
import { useUpsellServices } from '@/composables/useUpsellServices'

const props = defineProps<{
  conversation: Conversation | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { linkOrderToConversation } = useInbox()
const { addOrder, orders } = useUpsellOrders()
const { services } = useUpsellServices()
const { createNotification } = useUpsellNotifications()

const selectedService = ref<UpsellService | null>(null)
const selectedItems = ref<string[]>([])
const serviceDate = ref('')
const notes = ref('')

const filteredServices = computed(() =>
  services.value.filter(s => s.status === 'active'),
)

function onOpenChange(value: boolean) {
  emit('update:open', value)
  if (!value)
    resetForm()
}

function resetForm() {
  selectedService.value = null
  selectedItems.value = []
  serviceDate.value = ''
  notes.value = ''
}

function toggleItem(itemId: string) {
  if (selectedItems.value.includes(itemId)) {
    selectedItems.value = selectedItems.value.filter(id => id !== itemId)
  }
  else {
    selectedItems.value = [...selectedItems.value, itemId]
  }
}

function handleCreate() {
  if (!props.conversation || !selectedService.value || selectedItems.value.length === 0 || !serviceDate.value) {
    toast.error('Please fill in all required fields.')
    return
  }

  const items = selectedService.value.items
    .filter(i => selectedItems.value.includes(i.id))
    .map(i => ({ ...i, quantity: 1 }))

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const taxAmount = selectedService.value.pricingEnabled ? Math.round(subtotal * (selectedService.value.taxPercent / 100)) : 0
  const serviceAmount = selectedService.value.pricingEnabled ? Math.round(subtotal * (selectedService.value.servicePercent / 100)) : 0
  const grandTotal = subtotal + taxAmount + serviceAmount

  const isAlways = selectedService.value.availability === 'always'

  const orderData = {
    reservationId: props.conversation.reservationId,
    guestName: props.conversation.guestName,
    guestEmail: undefined,
    serviceId: selectedService.value.id,
    serviceName: selectedService.value.name,
    serviceCategory: selectedService.value.category,
    items,
    subtotal,
    taxAmount,
    serviceAmount,
    grandTotal,
    currency: selectedService.value.currency,
    status: isAlways ? 'confirmed' : 'pending',
    orderDate: new Date().toISOString().split('T')[0],
    serviceDate: serviceDate.value,
    checkInDate: props.conversation.checkIn,
    checkOutDate: props.conversation.checkOut,
    listing: props.conversation.listingName,
    channel: props.conversation.otaSource,
    notes: notes.value,
    source: 'inbox' as const,
    conversationId: props.conversation.id,
    createdByStaffId: 'staff-2',
    assignedListings: [props.conversation.listingName],
    availability: selectedService.value.availability,
  }

  addOrder(orderData)

  // Get the newly created order
  const newOrder = orders.value[orders.value.length - 1]

  // Link to conversation
  linkOrderToConversation(props.conversation.id, newOrder.id)

  // Create staff notification
  if (!isAlways) {
    createNotification(newOrder, 'order_requested')
  }
  else {
    createNotification(newOrder, 'order_confirmed')
  }

  toast.success(`Order created${isAlways ? ' and confirmed' : ' — pending confirmation'}.`)
  onOpenChange(false)
}
</script>

<template>
  <Sheet :open="open" @update:open="onOpenChange">
    <SheetContent side="right" class="flex w-full flex-col gap-0 sm:max-w-md overflow-hidden">
      <SheetHeader class="shrink-0 border-b px-6 py-4">
        <SheetTitle>Create Upsell Order</SheetTitle>
        <SheetDescription v-if="conversation">
          For {{ conversation.guestName }} — {{ conversation.listingName }}
        </SheetDescription>
      </SheetHeader>

      <ScrollArea class="min-h-0 flex-1 overflow-y-auto">
        <div v-if="conversation" class="flex flex-col gap-5 p-6">
          <!-- Guest Info -->
          <div class="rounded-md border p-3">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {{ conversation.guestInitials }}
              </div>
              <div>
                <p class="text-sm font-medium">
                  {{ conversation.guestName }}
                </p>
                <p class="text-xs text-muted-foreground">
                  Res: {{ conversation.reservationId }}
                </p>
              </div>
            </div>
          </div>

          <!-- Service Selection -->
          <div class="flex flex-col gap-2">
            <Label>Service <span class="text-destructive">*</span></Label>
            <Select v-model="selectedService">
              <SelectTrigger>
                <SelectValue placeholder="Select a service..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="svc in filteredServices"
                  :key="svc.id"
                  :value="svc"
                >
                  <div class="flex items-center gap-2">
                    <span>{{ svc.name }}</span>
                    <Badge v-if="svc.availability === 'by_request'" variant="outline" class="text-xs">
                      By Request
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Items -->
          <div v-if="selectedService" class="flex flex-col gap-2">
            <Label>Items <span class="text-destructive">*</span></Label>
            <div class="flex flex-col gap-2">
              <label
                v-for="item in selectedService.items"
                :key="item.id"
                class="flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                :class="selectedItems.includes(item.id) ? 'border-primary bg-primary/5' : 'border-border'"
              >
                <Checkbox
                  :checked="selectedItems.includes(item.id)"
                  @update:checked="toggleItem(item.id)"
                />
                <div class="flex-1">
                  <p class="text-sm font-medium">{{ item.name }}</p>
                  <p v-if="item.description" class="text-xs text-muted-foreground">{{ item.description }}</p>
                </div>
                <span class="text-sm font-medium">
                  {{ item.price.toLocaleString() }} {{ selectedService.currency }}
                </span>
              </label>
            </div>
          </div>

          <!-- Service Date -->
          <div class="flex flex-col gap-2">
            <Label>Service Date <span class="text-destructive">*</span></Label>
            <Input
              v-model="serviceDate"
              type="date"
              :min="conversation.checkIn"
              :max="conversation.checkOut"
            />
            <p class="text-xs text-muted-foreground">
              Stay: {{ conversation.checkIn }} — {{ conversation.checkOut }}
            </p>
          </div>

          <!-- Notes -->
          <div class="flex flex-col gap-2">
            <Label>Notes</Label>
            <Textarea
              v-model="notes"
              placeholder="Any special requests or details..."
              rows="2"
            />
          </div>

          <!-- Summary -->
          <div v-if="selectedService && selectedItems.length > 0" class="rounded-md border bg-muted p-3">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Subtotal</span>
              <span>{{ selectedService.items.filter(i => selectedItems.includes(i.id)).reduce((s, i) => s + i.price, 0).toLocaleString() }} {{ selectedService.currency }}</span>
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ selectedService.availability === 'always' ? 'Auto-confirmed' : 'Requires confirmation' }}
            </p>
          </div>
        </div>
      </ScrollArea>

      <div class="border-t shrink-0 px-6 py-4">
        <div class="flex items-center gap-2">
          <Button variant="outline" class="flex-1" @click="onOpenChange(false)">
            Cancel
          </Button>
          <Button
            class="flex-1"
            :disabled="!selectedService || selectedItems.length === 0 || !serviceDate"
            @click="handleCreate"
          >
            <Icon name="lucide:shopping-cart" class="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
```

**Step 2: Commit**

```bash
git add app/components/inbox/UpsellOrderCreator.vue
git commit -m "feat(inbox): add UpsellOrderCreator mini drawer component"
```

---

### Task 4: Update ReplyBox with Create Order Button

**File:**
- Modify: `app/components/inbox/ReplyBox.vue`

**Step 1: Add button next to send button**

Find the send button area (around line 200-220, the bottom action bar). Add a "Create Upsell Order" button before the send button:

```vue
<Button
  variant="outline"
  size="sm"
  class="h-9 gap-1.5"
  @click="showOrderCreator = true"
>
  <Icon name="lucide:shopping-cart" class="h-4 w-4" />
  <span class="hidden sm:inline">Upsell</span>
</Button>
```

Add state:
```ts
const showOrderCreator = ref(false)
```

Add import:
```ts
import { useInbox } from '@/composables/useInbox'
```

**Step 2: Add UpsellOrderCreator at end of template**

```vue
<InboxUpsellOrderCreator
  :conversation="selectedConversation"
  :open="showOrderCreator"
  @update:open="showOrderCreator = $event"
/>
```

But wait — ReplyBox doesn't have access to `selectedConversation`. We need to get it from useInbox:

```ts
const { selectedConversation } = useInbox()
```

**Step 3: Commit**

```bash
git add app/components/inbox/ReplyBox.vue
git commit -m "feat(inbox): add Create Upsell Order button to ReplyBox"
```

---

### Task 5: Update Thread.vue to Show Linked Orders

**File:**
- Modify: `app/components/inbox/Thread.vue`

**Step 1: Add linked orders display**

Add import:
```ts
import { useInbox } from '@/composables/useInbox'
```

Get linked orders:
```ts
const { getLinkedOrders, selectedConversation } = useInbox()

const linkedOrders = computed(() => {
  if (!selectedConversation.value)
    return []
  return getLinkedOrders(selectedConversation.value.id)
})
```

**Step 2: Add orders section in thread header**

Find the thread header area (around line 100-150, the area with guest name and tabs). Add after the guest info:

```vue
<!-- Linked Upsell Orders -->
<div v-if="linkedOrders.length > 0" class="flex flex-wrap items-center gap-2 px-4 pb-2">
  <span class="text-xs text-muted-foreground">Orders:</span>
  <Badge
    v-for="order in linkedOrders"
    :key="order.id"
    variant="secondary"
    class="cursor-pointer gap-1 text-xs"
    :class="{
      'bg-emerald-50 text-emerald-700': order.status === 'confirmed',
      'bg-amber-50 text-amber-700': order.status === 'pending',
      'bg-slate-100 text-slate-700': order.status === 'completed',
      'bg-destructive/10 text-destructive': order.status === 'cancelled',
    }"
    @click="navigateToOrder(order.id)"
  >
    <Icon
      :name="order.status === 'pending' ? 'lucide:clock' : order.status === 'confirmed' ? 'lucide:check-circle' : order.status === 'completed' ? 'lucide:check-check' : 'lucide:x-circle'"
      class="h-3 w-3"
    />
    {{ order.serviceName }}
  </Badge>
</div>
```

Add navigate helper:
```ts
function navigateToOrder(orderId: string) {
  navigateTo(`/upsells?tab=orders&order=${orderId}`)
}
```

**Step 3: Commit**

```bash
git add app/components/inbox/Thread.vue
git commit -m "feat(inbox): show linked upsell orders in thread header"
```

---

### Task 6: Add createOrder Helper to useUpsellOrders

**File:**
- Modify: `app/composables/useUpsellOrders.ts`

**Step 1: Add createOrder function**

The current `addService` pattern uses `Omit<UpsellService, ...>`. We need a similar `createOrder` that accepts `Omit<UpsellOrder, 'id' | 'createdAt' | 'updatedAt' | 'invoice'>`.

But `addOrder` already exists from Phase 1. Check if it's correctly typed. If the `addOrder` signature doesn't match what UpsellOrderCreator sends, update it.

The `UpsellOrderCreator` sends:
```ts
{
  reservationId, guestName, guestEmail?, serviceId, serviceName,
  serviceCategory, items, subtotal, taxAmount, serviceAmount,
  grandTotal, currency, status, orderDate, serviceDate, checkInDate,
  checkOutDate, listing, channel, notes, source, conversationId,
  createdByStaffId, assignedListings, availability
}
```

Make sure `addOrder` accepts this shape. The `availability` field might not be in `UpsellOrder` interface — check and fix if needed.

Wait, `availability` is on `UpsellService`, not `UpsellOrder`. The order doesn't need `availability` field — the service already has it. Remove `availability` from the order data sent in UpsellOrderCreator.

**Step 2: Commit**

```bash
git add app/composables/useUpsellOrders.ts
git commit -m "fix(upsells): ensure addOrder accepts inbox-created order shape"
```

---

### Task 7: Typecheck and Final Commit

**Step 1: Run typecheck**

```bash
npx nuxi typecheck 2>&1 | grep -E "app/(components/inbox|components/upsells|composables/useInbox|composables/useUpsell|pages/upsells)"
```

Expected: No output.

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat(upsells): complete Phase 2 — Inbox integration

- Create upsell orders directly from chat thread
- Mini drawer with service/item/date selection
- Guest/reservation info auto-filled from conversation
- Orders linked to conversations via linkedUpsellOrderIds
- Linked orders displayed as badges in thread header
- Status-aware coloring (pending/confirmed/completed/cancelled)
- Click badge → navigate to order detail
- Auto-notification on inbox order creation"
```

---

## Testing Checklist

- [ ] Open inbox thread → see "Upsell" button in reply bar
- [ ] Click "Upsell" → mini drawer opens with guest info pre-filled
- [ ] Select service → items appear → select items
- [ ] Pick service date (between check-in and check-out)
- [ ] Click "Create Order" → toast confirmation
- [ ] For `always` service → order auto-confirmed
- [ ] For `by_request` service → order pending + staff notification
- [ ] Thread header now shows order badge with service name
- [ ] Click order badge → navigates to `/upsells?tab=orders`
- [ ] Order appears in Orders table
- [ ] Typecheck passes

---

## Spec Coverage

| PRD Section | Implemented |
|-------------|-------------|
| Inbox Integration: Create order button | ✅ Task 4 |
| Inbox Integration: Mini drawer | ✅ Task 3 |
| Inbox Integration: Auto-fill guest info | ✅ Task 3 |
| Inbox Integration: Link to conversation | ✅ Tasks 1, 2, 3 |
| Inbox Integration: Show order in thread | ✅ Task 5 |
| Guest Notifications (from inbox) | ✅ Task 3 (auto-notify) |
| Staff Notifications (from inbox) | ✅ Task 3 (auto-notify) |

---

*Plan complete. Ready for execution.*
