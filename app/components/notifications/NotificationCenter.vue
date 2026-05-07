<script setup lang="ts">
import type { SeverityFilter } from '~/composables/useNotifications'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const {
  unreadCount,
  selectedSeverity,
  filteredAlerts,
  markAllAsRead,
  dismiss,
  navigateToAlert,
  startAutoResolveSimulation,
} = useNotifications()

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
        <Icon name="i-lucide-bell" class="size-5" />
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

      <!-- Notification List / Empty State -->
      <ScrollArea class="max-h-[400px]">
        <div
          v-if="filteredAlerts.length === 0"
          class="flex flex-col items-center justify-center py-12 text-muted-foreground"
        >
          <Icon name="i-lucide-bell-off" class="size-8 mb-2" />
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
