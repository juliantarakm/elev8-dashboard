import type { Alert } from '~/components/notifications/data/alerts'
import { mockAlerts, alertRouteMap, getDescription as getDesc } from '~/components/notifications/data/alerts'
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

  function getDescription(type: Alert['type'], context: Alert['context']): string {
    return getDesc(type, context)
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
