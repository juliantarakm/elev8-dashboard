import type { Alert } from '~/components/notifications/data/alerts'
import { computed } from 'vue'

export function useUpsellNotifications() {
  const { alerts, createUpsellAlert, markAsRead, markAllAsRead, unreadCount } = useNotifications()

  const upsellAlerts = computed(() =>
    alerts.value.filter(a => a.type.startsWith('UPSELL_')),
  )

  const unreadNotifications = computed(() =>
    upsellAlerts.value.filter(a => a.status === 'ACTIVE'),
  )

  const allNotifications = computed(() => [...upsellAlerts.value].sort((a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime()))

  function createNotification(
    order: {
      id: string
      guestName: string
      serviceName: string
      serviceDate: string
      listing?: string
    },
    type: Extract<Alert['type'], `UPSELL_${string}`>,
  ) {
    createUpsellAlert(type, {
      orderId: order.id,
      guestName: order.guestName,
      serviceName: order.serviceName,
      serviceDate: order.serviceDate,
      listing_id: order.listing ?? null,
      listing_name: order.listing ?? undefined,
    })
  }

  return {
    notifications: upsellAlerts,
    unreadCount,
    unreadNotifications,
    allNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
  }
}
