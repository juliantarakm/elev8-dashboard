import type { Alert, AlertSeverity } from '~/components/notifications/data/alerts'
import { formatDistanceToNow } from 'date-fns'
import { computed } from 'vue'
import { alertRouteMap, getDescription as getAlertDescription, mockAlerts } from '~/components/notifications/data/alerts'

export type SeverityFilter = 'all' | 'critical' | 'warning' | 'info'
export type NotificationKindFilter = 'all' | 'system' | 'upsell' | 'cleaning' | 'calls' | 'reviews'

function makeAlert(
  alert_id: string,
  type: Alert['type'],
  severity: AlertSeverity,
  context: Record<string, any>,
  listing_id: string | null = null,
): Alert {
  return {
    alert_id,
    type,
    severity,
    status: 'ACTIVE',
    listing_id,
    property_id: null,
    triggered_at: new Date().toISOString(),
    resolved_at: null,
    auto_resolve: true,
    resolve_condition: 'Handled from Notification Center',
    context,
  }
}

function buildSeedUpsellAlerts(): Alert[] {
  return [
    makeAlert(
      'alert-upsell-seed-001',
      'UPSELL_ORDER_REQUESTED',
      'WARNING',
      {
        orderId: 'ord-006',
        guestName: 'Cameron Skillcorn',
        serviceName: 'Airport Transfer (Ngurah Rai)',
        serviceDate: '2026-05-12',
        listing_id: null,
      },
    ),
    makeAlert(
      'alert-upsell-seed-002',
      'UPSELL_ORDER_REQUESTED',
      'WARNING',
      {
        orderId: 'ord-007',
        guestName: 'Amanda Healey',
        serviceName: 'In-Villa Spa Treatment',
        serviceDate: '2026-05-12',
        listing_id: null,
      },
    ),
    makeAlert(
      'alert-upsell-seed-003',
      'UPSELL_ORDER_APPROVED',
      'INFO',
      {
        orderId: 'ord-008',
        guestName: 'Khasan Alshalabi',
        serviceName: 'Surf Lesson at Canggu',
        serviceDate: '2026-05-12',
        listing_id: null,
      },
    ),
    makeAlert(
      'alert-upsell-seed-004',
      'UPSELL_ORDER_DECLINED',
      'WARNING',
      {
        orderId: 'ord-010',
        guestName: 'Reto Wyss',
        serviceName: 'Late Check-out (until 2pm)',
        serviceDate: '2026-05-10',
        listing_id: null,
      },
    ),
    makeAlert(
      'alert-upsell-seed-005',
      'UPSELL_PAYMENT_RECEIVED',
      'INFO',
      {
        orderId: 'ord-005',
        guestName: 'James Alizada',
        serviceName: 'Vehicle Rental',
        serviceDate: '2026-05-07',
        listing_id: null,
      },
    ),
  ]
}

function getSeededAlerts(existingAlerts: Alert[]) {
  const seedAlerts = buildSeedUpsellAlerts()
  const existingIds = new Set(existingAlerts.map(alert => alert.alert_id))

  return [...existingAlerts, ...seedAlerts.filter(alert => !existingIds.has(alert.alert_id))]
}

export function useNotifications() {
  const alerts = useState<Alert[]>('notifications-alerts', () => JSON.parse(JSON.stringify(mockAlerts)))

  const seededAlerts = getSeededAlerts(alerts.value)
  if (seededAlerts.length !== alerts.value.length) {
    alerts.value = seededAlerts
  }

  const selectedSeverity = ref<SeverityFilter>('all')
  const selectedKind = ref<NotificationKindFilter>('all')

  const activeAlerts = computed(() => alerts.value.filter(a => a.status === 'ACTIVE'))

  const unreadCount = computed(() => activeAlerts.value.length)

  const filteredAlerts = computed(() => {
    const cleaningTypes = new Set(['CLEANING_NOT_STARTED_IMMINENT', 'CLEANING_NOT_DONE_CHECKIN_PASSED', 'NO_HOUSEKEEPING_ASSIGNED'])
    const callTypes = new Set(['CALL_INCOMING', 'CALL_MISSED', 'CALL_COMPLETED'])
    const reviewTypes = new Set(['AIRBNB_REVIEW_GENERATED', 'AIRBNB_REVIEW_POSTED', 'AIRBNB_REVIEW_FAILED', 'REVIEW_GUEST_LEFT', 'REVIEW_HOST_DUE'])
    return alerts.value.filter((a) => {
      const severityMatch = selectedSeverity.value === 'all'
        || a.severity.toLowerCase() === selectedSeverity.value
      const kind = cleaningTypes.has(a.type)
        ? 'cleaning'
        : callTypes.has(a.type)
          ? 'calls'
          : reviewTypes.has(a.type)
            ? 'reviews'
            : a.type.startsWith('UPSELL_')
              ? 'upsell'
              : 'system'
      const kindMatch = selectedKind.value === 'all' || kind === selectedKind.value
      return severityMatch && kindMatch
    })
  })

  function markAsRead(alertId: string) {
    alerts.value = alerts.value.map(a =>
      a.alert_id === alertId
        ? { ...a, status: 'RESOLVED' as const, resolved_at: new Date().toISOString() }
        : a,
    )
  }

  function markAllAsRead() {
    const now = new Date().toISOString()
    alerts.value = alerts.value.map(a =>
      a.status === 'ACTIVE'
        ? { ...a, status: 'RESOLVED' as const, resolved_at: now }
        : a,
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

  function getDescription(type: Alert['type'], context: Record<string, any>): string {
    return getAlertDescription(type, context)
  }

  function createAlert(
    type: Alert['type'],
    severity: AlertSeverity,
    context: Record<string, any>,
  ) {
    const id = `alert-${type.toLowerCase()}-${String(alerts.value.length + 1).padStart(3, '0')}`
    alerts.value = [
      makeAlert(id, type, severity, context, context.listing_id ?? null),
      ...alerts.value,
    ]
  }

  function createUpsellAlert(
    type:
      | 'UPSELL_ORDER_REQUESTED'
      | 'UPSELL_ORDER_APPROVED'
      | 'UPSELL_ORDER_DECLINED'
      | 'UPSELL_PAYMENT_RECEIVED'
      | 'UPSELL_FULFILLMENT_STARTED'
      | 'UPSELL_FULFILLMENT_COMPLETED',
    context: Record<string, any>,
  ) {
    const severity: AlertSeverity
      = type === 'UPSELL_ORDER_REQUESTED' || type === 'UPSELL_ORDER_DECLINED' ? 'WARNING' : 'INFO'
    createAlert(type, severity, context)
  }

  return {
    alerts,
    activeAlerts,
    unreadCount,
    selectedSeverity,
    selectedKind,
    filteredAlerts,
    markAsRead,
    markAllAsRead,
    dismiss,
    navigateToAlert,
    getTimeAgo,
    getDescription,
    createAlert,
    createUpsellAlert,
  }
}
