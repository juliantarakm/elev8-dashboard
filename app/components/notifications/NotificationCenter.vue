<script setup lang="ts">
import type { Alert } from '~/components/notifications/data/alerts'
import type { SeverityFilter } from '~/composables/useNotifications'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'vue-sonner'
import NotificationItem from './NotificationItem.vue'

const popoverOpen = ref(false)

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

function handleNavigate(alert: Alert) {
  navigateToAlert(alert)
  popoverOpen.value = false
}

function handleMarkAllRead() {
  markAllAsRead()
  toast.success('All notifications marked as read')
}

function handleDismiss(alertId: string) {
  dismiss(alertId)
  toast.info('Notification dismissed')
}
</script>

<template>
  <Popover v-model:open="popoverOpen">
    <PopoverTrigger as-child>
      <Button variant="ghost" size="icon" class="relative size-8" aria-label="Notifications" aria-haspopup="true">
        <Icon name="i-lucide-bell" class="size-5" />
        <Badge
          v-if="unreadCount > 0"
          class="absolute -top-1.5 -right-1.5 h-4 min-w-4 rounded-full px-1 text-[10px] leading-none"
          variant="default"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </Badge>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[380px] p-0" align="end" :side-offset="8">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3">
        <h3 class="text-sm font-semibold">Notifications</h3>
        <button
          v-if="unreadCount > 0"
          class="text-xs text-muted-foreground hover:text-foreground transition-colors"
          @click="handleMarkAllRead"
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
          @click="handleNavigate(alert)"
          @dismiss="handleDismiss"
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
