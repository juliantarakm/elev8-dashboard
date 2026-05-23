<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useUpsellOrders } from '@/composables/useUpsellOrders'
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from '@/components/upsells/data/upsell-orders'
import type { OrderStatus, UpsellOrder } from '@/components/upsells/data/upsell-orders'

const emit = defineEmits<{
  openDrawer: [order: UpsellOrder]
}>()

const { filteredOrders, statusCounts, updateStatus, filterStatus, searchValue } = useUpsellOrders()

function openDetail(order: UpsellOrder) {
  emit('openDrawer', order)
}

function handleStatusChange(id: string, status: OrderStatus) {
  updateStatus(id, status)
  toast.success(`Order marked as ${ORDER_STATUS_LABELS[status]}.`)
}

function formatCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('id-ID')}`
}

const statusOptions: { label: string, value: OrderStatus | 'all', count: number }[] = [
  { label: 'All', value: 'all', count: statusCounts.value.all },
  { label: 'Pending', value: 'pending', count: statusCounts.value.pending },
  { label: 'Confirmed', value: 'confirmed', count: statusCounts.value.confirmed },
  { label: 'Completed', value: 'completed', count: statusCounts.value.completed },
  { label: 'Cancelled', value: 'cancelled', count: statusCounts.value.cancelled },
]
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Status filter pills -->
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="opt in statusOptions"
        :key="opt.value"
        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
        :class="
          filterStatus === opt.value
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        "
        @click="filterStatus = opt.value"
      >
        {{ opt.label }}
        <span
          class="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold"
          :class="filterStatus === opt.value ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground'"
        >
          {{ opt.count }}
        </span>
      </button>
      <div class="ml-auto flex items-center gap-2">
        <Input
          v-model="searchValue"
          placeholder="Search guest, service, reservation..."
          class="h-8 w-64 text-sm"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Guest</TableHead>
            <TableHead>Service</TableHead>
            <TableHead class="text-right">Total</TableHead>
            <TableHead class="text-center">Status</TableHead>
            <TableHead class="text-center">Service Date</TableHead>
            <TableHead class="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="filteredOrders.length === 0">
            <TableCell colspan="7" class="py-12 text-center text-sm text-muted-foreground">
              No orders match the selected filters.
            </TableCell>
          </TableRow>
          <TableRow
            v-for="order in filteredOrders"
            :key="order.id"
            class="cursor-pointer hover:bg-muted/50"
            @click="openDetail(order)"
          >
            <TableCell>
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium">{{ order.id }}</span>
                <span class="text-xs text-muted-foreground">{{ order.reservationId }}</span>
              </div>
            </TableCell>
            <TableCell>
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium">{{ order.guestName }}</span>
                <span class="max-w-48 truncate text-xs text-muted-foreground">{{ order.listing }}</span>
              </div>
            </TableCell>
            <TableCell>
              <div class="flex flex-col gap-0.5">
                <span class="text-sm">{{ order.serviceName }}</span>
                <span class="text-xs text-muted-foreground">
                  {{ order.items.length }} {{ order.items.length === 1 ? 'item' : 'items' }}
                </span>
              </div>
            </TableCell>
            <TableCell class="text-right font-semibold tabular-nums whitespace-nowrap">
              <span :class="order.status === 'cancelled' ? 'line-through text-muted-foreground' : ''">
                {{ formatCurrency(order.grandTotal, order.currency) }}
              </span>
            </TableCell>
            <TableCell class="text-center">
              <Badge
                variant="secondary"
                class="gap-1 text-xs"
                :class="ORDER_STATUS_COLORS[order.status]"
              >
                {{ ORDER_STATUS_LABELS[order.status] }}
              </Badge>
            </TableCell>
            <TableCell class="text-center">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium">
                  <template v-if="order.serviceEndDate">
                    {{ order.serviceDate }} – {{ order.serviceEndDate }}
                  </template>
                  <template v-else>
                    {{ order.serviceDate }}
                  </template>
                </span>
                <span class="text-xs text-muted-foreground">Ordered {{ order.orderDate }}</span>
              </div>
            </TableCell>
            <TableCell @click.stop>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-7 w-7" aria-label="Order actions">
                    <Icon name="lucide:ellipsis" class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="openDetail(order)">
                    <Icon name="lucide:eye" class="mr-2 h-4 w-4" />
                    View Detail
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    v-if="order.status === 'pending'"
                    @click="handleStatusChange(order.id, 'confirmed')"
                  >
                    <Icon name="lucide:check-circle" class="mr-2 h-4 w-4 text-emerald-500" />
                    Confirm Order
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="order.status === 'confirmed'"
                    @click="handleStatusChange(order.id, 'completed')"
                  >
                    <Icon name="lucide:check-check" class="mr-2 h-4 w-4 text-slate-500" />
                    Mark Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="order.status === 'pending' || order.status === 'confirmed'"
                    @click="handleStatusChange(order.id, 'cancelled')"
                  >
                    <Icon name="lucide:x-circle" class="mr-2 h-4 w-4 text-destructive" />
                    Cancel Order
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="order.status === 'cancelled'"
                    @click="handleStatusChange(order.id, 'pending')"
                  >
                    <Icon name="lucide:rotate-ccw" class="mr-2 h-4 w-4" />
                    Reopen Order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
