export type AlertType =
  | 'SMART_LOCK_DEAD'
  | 'SMART_LOCK_OFFLINE'
  | 'SMART_LOCK_CODE_FAILED'
  | 'CHANNEL_DISCONNECTED'
  | 'DOUBLE_BOOKING'
  | 'CLEANING_NOT_STARTED_IMMINENT'
  | 'CLEANING_NOT_DONE_CHECKIN_PASSED'
  | 'STRIPE_DISCONNECTED'
  | 'DEPOSIT_FAILED_AT_CHECKIN'
  | 'BOOKING_QUOTA_EMPTY'
  | 'BRIDGE_OFFLINE'
  | 'SMART_LOCK_BATTERY_CRITICAL'
  | 'SMART_LOCK_BATTERY_LOW'
  | 'NO_HOUSEKEEPING_ASSIGNED'
  | 'TASK_OVERDUE'
  | 'RATE_PLAN_UNMAPPED'
  | 'BOOKING_QUOTA_LOW'
  | 'DYNAMIC_TEMPLATE_FAILED'

export type AlertSeverity = 'CRITICAL' | 'WARNING'

export interface Alert {
  alert_id: string
  type: AlertType
  severity: AlertSeverity
  status: 'ACTIVE' | 'RESOLVED'
  listing_id: string | null
  property_id: string | null
  triggered_at: string
  resolved_at: string | null
  auto_resolve: boolean
  resolve_condition: string
  context: Record<string, any>
}

export const alertDisplayLabels: Record<AlertType, string> = {
  SMART_LOCK_DEAD: 'Smart Lock — Battery Dead',
  SMART_LOCK_OFFLINE: 'Smart Lock — Offline',
  SMART_LOCK_CODE_FAILED: 'Smart Lock — Access Code Not Generated',
  CHANNEL_DISCONNECTED: 'Channel Manager — Disconnected',
  DOUBLE_BOOKING: 'Double Booking Detected',
  CLEANING_NOT_STARTED_IMMINENT: 'Cleaning Not Started — Check-in in 2 Hours',
  CLEANING_NOT_DONE_CHECKIN_PASSED: 'Cleaning Incomplete — Guest Checking In Now',
  STRIPE_DISCONNECTED: 'Stripe — Payment Connection Lost',
  DEPOSIT_FAILED_AT_CHECKIN: 'Security Deposit — Payment Failed',
  BOOKING_QUOTA_EMPTY: 'Booking Quota — 0 Remaining',
  BRIDGE_OFFLINE: 'Elev8 Bridge — Offline',
  SMART_LOCK_BATTERY_CRITICAL: 'Smart Lock — Battery Critical',
  SMART_LOCK_BATTERY_LOW: 'Smart Lock — Battery Low',
  NO_HOUSEKEEPING_ASSIGNED: 'No Housekeeping Assigned — Check-out Today',
  TASK_OVERDUE: 'Task Overdue',
  RATE_PLAN_UNMAPPED: 'Booking.com — Rate Plan Unmapped',
  BOOKING_QUOTA_LOW: 'Booking Quota — Running Low',
  DYNAMIC_TEMPLATE_FAILED: 'Automated Message — Failed to Send',
}

export const alertRouteMap: Partial<Record<AlertType, string>> = {
  SMART_LOCK_DEAD: '/',
  SMART_LOCK_OFFLINE: '/',
  SMART_LOCK_CODE_FAILED: '/',
  CHANNEL_DISCONNECTED: '/',
  DOUBLE_BOOKING: '/inbox',
  CLEANING_NOT_STARTED_IMMINENT: '/tasks',
  CLEANING_NOT_DONE_CHECKIN_PASSED: '/tasks',
  STRIPE_DISCONNECTED: '/settings/account',
  DEPOSIT_FAILED_AT_CHECKIN: '/inbox',
  BOOKING_QUOTA_EMPTY: '/',
  BRIDGE_OFFLINE: '/',
  SMART_LOCK_BATTERY_CRITICAL: '/',
  SMART_LOCK_BATTERY_LOW: '/',
  NO_HOUSEKEEPING_ASSIGNED: '/tasks',
  TASK_OVERDUE: '/tasks',
  RATE_PLAN_UNMAPPED: '/',
  BOOKING_QUOTA_LOW: '/',
  DYNAMIC_TEMPLATE_FAILED: '/',
}

export function getDescription(type: AlertType, context: Record<string, any>): string {
  switch (type) {
    case 'SMART_LOCK_DEAD':
    case 'SMART_LOCK_OFFLINE':
    case 'SMART_LOCK_BATTERY_CRITICAL':
    case 'SMART_LOCK_BATTERY_LOW':
      return `Lock${context.lock_names?.length ? `s: ${context.lock_names.join(', ')}` : ''}${context.next_checkin_at ? ' — next check-in soon' : ''}`
    case 'SMART_LOCK_CODE_FAILED':
      return `${context.guest_name || 'Guest'} — code not generated`
    case 'CHANNEL_DISCONNECTED':
      return `${context.channel_name || 'Channel'} — ${context.affected_listing_names?.length || 0} listing(s) affected`
    case 'DOUBLE_BOOKING':
      return `${context.listing_name || 'Property'} — ${context.reservation_a_guest} / ${context.reservation_b_guest}`
    case 'CLEANING_NOT_STARTED_IMMINENT':
    case 'CLEANING_NOT_DONE_CHECKIN_PASSED':
      return `${context.listing_name || 'Property'}${context.assigned_to ? ` — assigned to ${context.assigned_to}` : ' — unassigned'}`
    case 'STRIPE_DISCONNECTED':
      return `${context.pending_payments_count || 0} pending payment(s)`
    case 'DEPOSIT_FAILED_AT_CHECKIN':
      return `${context.guest_name || 'Guest'} — ${context.currency || 'USD'} ${context.deposit_amount || 0}`
    case 'BOOKING_QUOTA_EMPTY':
      return `Auto-refill ${context.auto_refill_failed ? 'failed' : 'attempted'}`
    case 'BRIDGE_OFFLINE':
      return `${context.affected_automations_count || 0} automation(s) affected`
    case 'NO_HOUSEKEEPING_ASSIGNED':
      return `${context.listing_name || 'Property'} — check-out today`
    case 'TASK_OVERDUE':
      return context.task_title || 'Overdue task'
    case 'RATE_PLAN_UNMAPPED':
      return `${context.listing_name || 'Property'} — ${context.unmapped_plans?.length || 0} unmapped plan(s)`
    case 'BOOKING_QUOTA_LOW':
      return `${context.percentage_remaining || 0}% remaining`
    case 'DYNAMIC_TEMPLATE_FAILED':
      return `${context.template_name || 'Template'} — ${context.guest_name || 'Guest'}`
    default:
      return ''
  }
}

export const mockAlerts: Alert[] = [
  {
    alert_id: 'alert-1',
    type: 'SMART_LOCK_DEAD',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    listing_id: 'listing-villa-1',
    property_id: null,
    triggered_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    resolved_at: null,
    auto_resolve: true,
    resolve_condition: 'Battery level returns above 20%',
    context: { lock_ids: ['lock-1', 'lock-2'], lock_names: ['Main Gate', 'Pool Gate'], battery_levels: [0, 2], next_checkin_at: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString() },
  },
  {
    alert_id: 'alert-2',
    type: 'CLEANING_NOT_STARTED_IMMINENT',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    listing_id: 'listing-villa-2',
    property_id: null,
    triggered_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    resolved_at: null,
    auto_resolve: true,
    resolve_condition: 'Cleaning status changes to In Progress or Completed',
    context: { listing_id: 'listing-villa-2', listing_name: 'Villa Cendana', reservation_id: 'res-2', checkin_at: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), assigned_to: null },
  },
  {
    alert_id: 'alert-3',
    type: 'STRIPE_DISCONNECTED',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    listing_id: null,
    property_id: null,
    triggered_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    resolved_at: null,
    auto_resolve: true,
    resolve_condition: 'Stripe reconnected successfully',
    context: { disconnected_since: new Date(Date.now() - 1000 * 60 * 120).toISOString(), pending_payments_count: 12 },
  },
  {
    alert_id: 'alert-4',
    type: 'TASK_OVERDUE',
    severity: 'WARNING',
    status: 'ACTIVE',
    listing_id: 'listing-villa-1',
    property_id: null,
    triggered_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    resolved_at: null,
    auto_resolve: true,
    resolve_condition: 'Task status changes to Done',
    context: { task_id: 'task-1', task_title: 'Fix pool pump', assigned_to: 'Wayan', due_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), listing_id: 'listing-villa-1', listing_name: 'Villa Kayu' },
  },
  {
    alert_id: 'alert-5',
    type: 'NO_HOUSEKEEPING_ASSIGNED',
    severity: 'WARNING',
    status: 'ACTIVE',
    listing_id: 'listing-villa-3',
    property_id: null,
    triggered_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    resolved_at: null,
    auto_resolve: true,
    resolve_condition: 'A staff member is assigned to the cleaning',
    context: { listing_id: 'listing-villa-3', listing_name: 'Villa Sari', checkout_at: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), next_checkin_at: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString() },
  },
  {
    alert_id: 'alert-6',
    type: 'SMART_LOCK_BATTERY_LOW',
    severity: 'WARNING',
    status: 'ACTIVE',
    listing_id: 'listing-villa-2',
    property_id: null,
    triggered_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    resolved_at: null,
    auto_resolve: true,
    resolve_condition: 'Battery returns above 20%, or escalates',
    context: { lock_ids: ['lock-3'], lock_names: ['Front Door'], battery_levels: [15], next_checkin_at: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString() },
  },
  {
    alert_id: 'alert-7',
    type: 'DOUBLE_BOOKING',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    listing_id: 'listing-villa-1',
    property_id: null,
    triggered_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    resolved_at: null,
    auto_resolve: false,
    resolve_condition: 'Host manually resolves',
    context: { listing_id: 'listing-villa-1', listing_name: 'Villa Kayu', reservation_a_id: 'res-a', reservation_a_guest: 'John Doe', reservation_b_id: 'res-b', reservation_b_guest: 'Jane Smith', overlap_start: '2026-05-10T14:00:00Z', overlap_end: '2026-05-12T11:00:00Z' },
  },
]
