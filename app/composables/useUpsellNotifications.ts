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
