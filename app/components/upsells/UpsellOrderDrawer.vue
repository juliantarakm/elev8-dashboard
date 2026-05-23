<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useUpsellOrders } from '@/composables/useUpsellOrders'
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from '@/components/upsells/data/upsell-orders'
import type { OrderStatus, UpsellOrder } from '@/components/upsells/data/upsell-orders'

const props = defineProps<{
  order: UpsellOrder | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { updateStatus } = useUpsellOrders()

function onOpenChange(value: boolean) {
  emit('update:open', value)
}

function handleStatusChange(status: OrderStatus) {
  if (!props.order) return
  updateStatus(props.order.id, status)
  toast.success(`Order marked as ${ORDER_STATUS_LABELS[status]}.`)
}

function formatCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('id-ID')}`
}
</script>

<template>
  <Sheet :open="open" @update:open="onOpenChange">
    <SheetContent class="flex w-full flex-col gap-0 sm:max-w-md overflow-hidden">
      <SheetHeader class="shrink-0 border-b px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <SheetTitle>{{ order?.id ?? 'Order' }}</SheetTitle>
            <SheetDescription v-if="order">
              {{ order.serviceName }}
            </SheetDescription>
          </div>
          <Badge
            v-if="order"
            variant="secondary"
            class="gap-1"
            :class="ORDER_STATUS_COLORS[order.status]"
          >
            {{ ORDER_STATUS_LABELS[order.status] }}
          </Badge>
        </div>
      </SheetHeader>

      <ScrollArea class="min-h-0 flex-1 overflow-y-auto">
        <div v-if="order" class="flex flex-col gap-5 p-6">
          <!-- Guest Info -->
          <div class="flex flex-col gap-2">
            <Label class="text-xs text-muted-foreground uppercase tracking-wide">Guest</Label>
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {{ order.guestName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() }}
              </div>
              <div>
                <p class="text-sm font-medium">{{ order.guestName }}</p>
                <p class="text-xs text-muted-foreground">{{ order.guestEmail }}</p>
              </div>
            </div>
          </div>

          <Separator />

          <!-- Stay Info -->
          <div class="flex flex-col gap-2">
            <Label class="text-xs text-muted-foreground uppercase tracking-wide">Stay</Label>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-muted-foreground">Reservation</span>
                <p class="font-medium">{{ order.reservationId }}</p>
              </div>
              <div>
                <span class="text-muted-foreground">Channel</span>
                <p class="font-medium">{{ order.channel }}</p>
              </div>
              <div>
                <span class="text-muted-foreground">Check-in</span>
                <p class="font-medium">{{ order.checkInDate }}</p>
              </div>
              <div>
                <span class="text-muted-foreground">Check-out</span>
                <p class="font-medium">{{ order.checkOutDate }}</p>
              </div>
              <div>
                <span class="text-muted-foreground">Service Date</span>
                <p class="font-medium">
                  <template v-if="order.serviceEndDate">
                    {{ order.serviceDate }} – {{ order.serviceEndDate }}
                  </template>
                  <template v-else>
                    {{ order.serviceDate }}
                  </template>
                </p>
              </div>
              <div class="col-span-2">
                <span class="text-muted-foreground">Listing</span>
                <p class="font-medium">{{ order.listing }}</p>
              </div>
            </div>
          </div>

          <Separator />

          <!-- Invoice -->
          <div v-if="order.invoice" class="flex flex-col gap-2">
            <Label class="text-xs text-muted-foreground uppercase tracking-wide">Invoice</Label>
            <div class="flex items-center justify-between rounded-md border p-3">
              <div class="flex items-center gap-2">
                <Icon name="lucide:file-text" class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm font-medium">{{ order.invoice }}</span>
              </div>
              <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs">
                <Icon name="lucide:download" class="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>

          <Separator v-if="order.invoice" />

          <!-- Items -->
          <div class="flex flex-col gap-2">
            <Label class="text-xs text-muted-foreground uppercase tracking-wide">Items Ordered</Label>
            <div class="flex flex-col gap-2">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p class="text-sm font-medium">{{ item.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ formatCurrency(item.price, order.currency) }} × {{ item.quantity }}
                  </p>
                </div>
                <span class="text-sm font-semibold">
                  {{ formatCurrency(item.price * item.quantity, order.currency) }}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <!-- Price Breakdown -->
          <div class="flex flex-col gap-2">
            <Label class="text-xs text-muted-foreground uppercase tracking-wide">Price Breakdown</Label>
            <div class="flex flex-col gap-1 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Subtotal</span>
                <span>{{ formatCurrency(order.subtotal, order.currency) }}</span>
              </div>
              <div v-if="order.taxAmount > 0" class="flex justify-between">
                <span class="text-muted-foreground">Tax</span>
                <span>{{ formatCurrency(order.taxAmount, order.currency) }}</span>
              </div>
              <div v-if="order.serviceAmount > 0" class="flex justify-between">
                <span class="text-muted-foreground">Service</span>
                <span>{{ formatCurrency(order.serviceAmount, order.currency) }}</span>
              </div>
              <Separator class="my-1" />
              <div class="flex justify-between text-base font-semibold">
                <span>Grand Total</span>
                <span>{{ formatCurrency(order.grandTotal, order.currency) }}</span>
              </div>
            </div>
          </div>

          <Separator />

          <!-- Notes -->
          <div v-if="order.notes" class="flex flex-col gap-2">
            <Label class="text-xs text-muted-foreground uppercase tracking-wide">Notes</Label>
            <p class="text-sm">{{ order.notes }}</p>
          </div>

          <!-- Staff -->
          <div v-if="order.staffAssigned" class="flex flex-col gap-2">
            <Label class="text-xs text-muted-foreground uppercase tracking-wide">Assigned To</Label>
            <p class="text-sm">{{ order.staffAssigned }}</p>
          </div>
        </div>
      </ScrollArea>

      <!-- Footer Actions -->
      <div v-if="order" class="border-t shrink-0 px-6 py-4">
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <Button
              v-if="order.status === 'pending'"
              variant="outline"
              class="flex-1"
              @click="handleStatusChange('cancelled')"
            >
              <Icon name="lucide:x-circle" class="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              v-if="order.status === 'pending'"
              class="flex-1"
              @click="handleStatusChange('confirmed')"
            >
              <Icon name="lucide:check-circle" class="mr-2 h-4 w-4" />
              Confirm
            </Button>
            <Button
              v-if="order.status === 'confirmed'"
              variant="outline"
              class="flex-1"
              @click="handleStatusChange('cancelled')"
            >
              <Icon name="lucide:x-circle" class="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              v-if="order.status === 'confirmed'"
              class="flex-1"
              @click="handleStatusChange('completed')"
            >
              <Icon name="lucide:check-check" class="mr-2 h-4 w-4" />
              Complete
            </Button>
            <Button
              v-if="order.status === 'cancelled'"
              class="w-full"
              @click="handleStatusChange('pending')"
            >
              <Icon name="lucide:rotate-ccw" class="mr-2 h-4 w-4" />
              Reopen Order
            </Button>
            <Button
              v-if="order.status === 'completed'"
              variant="outline"
              class="w-full"
              disabled
            >
              <Icon name="lucide:check-check" class="mr-2 h-4 w-4" />
              Completed
            </Button>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
