<script setup lang="ts">
import { useUpsellNotifications } from '@/composables/useUpsellNotifications'

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
