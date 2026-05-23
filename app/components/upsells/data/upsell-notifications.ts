export type UpsellNotificationType =
  | 'order_requested'
  | 'order_confirmed'
  | 'order_cancelled'
  | 'order_completed'
  | 'order_late_cancel'
  | 'order_no_show'
  | 'order_reminder'

export interface UpsellStaffNotification {
  id: string
  type: UpsellNotificationType
  severity: 'info' | 'warning' | 'urgent'
  title: string
  message: string
  orderId: string
  recipientStaffId: string
  read: boolean
  createdAt: string
  actionUrl: string
  category: 'upsell'
  autoResolve: boolean
}

export const ORDER_NOTIFICATION_TEMPLATES: Record<UpsellNotificationType, { title: string; message: (orderId: string, guestName: string, serviceName: string, serviceDate: string) => string; severity: 'info' | 'warning' | 'urgent' }> = {
  order_requested: {
    title: 'New Upsell Request',
    message: (orderId, guestName, serviceName, serviceDate) => `${guestName} requested ${serviceName} for ${serviceDate}. Order ${orderId} requires confirmation.`,
    severity: 'info',
  },
  order_confirmed: {
    title: 'Order Confirmed',
    message: (orderId, guestName, serviceName, serviceDate) => `Order ${orderId} for ${guestName} (${serviceName}, ${serviceDate}) has been confirmed.`,
    severity: 'info',
  },
  order_cancelled: {
    title: 'Order Cancelled',
    message: (orderId, guestName, serviceName, serviceDate) => `Order ${orderId} for ${guestName} (${serviceName}, ${serviceDate}) was cancelled.`,
    severity: 'warning',
  },
  order_completed: {
    title: 'Order Completed',
    message: (orderId, guestName, serviceName, serviceDate) => `Order ${orderId} for ${guestName} (${serviceName}) is completed.`,
    severity: 'info',
  },
  order_late_cancel: {
    title: 'Late Cancellation',
    message: (orderId, guestName, serviceName, serviceDate) => `Late cancellation for order ${orderId}. ${guestName} cancelled ${serviceName} within 24h.`,
    severity: 'warning',
  },
  order_no_show: {
    title: 'Guest No-Show',
    message: (orderId, guestName, serviceName, serviceDate) => `Guest ${guestName} did not show for ${serviceName} (${serviceDate}). Order ${orderId}.`,
    severity: 'warning',
  },
  order_reminder: {
    title: 'Order Reminder',
    message: (orderId, guestName, serviceName, serviceDate) => `Reminder: ${serviceName} for ${guestName} is tomorrow (${serviceDate}). Order ${orderId}.`,
    severity: 'urgent',
  },
}

export const mockUpsellNotifications: UpsellStaffNotification[] = [
  {
    id: 'notif-001', type: 'order_requested', severity: 'info', title: 'New Upsell Request',
    message: 'Cameron Skillcorn requested Airport Transfer for 2026-05-12. Order ord-006 requires confirmation.',
    orderId: 'ord-006', recipientStaffId: 'staff-2', read: false, createdAt: '2026-05-10T09:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-006', category: 'upsell', autoResolve: true,
  },
  {
    id: 'notif-002', type: 'order_requested', severity: 'info', title: 'New Upsell Request',
    message: 'Amanda Healey requested In-Villa Spa for 2026-05-12. Order ord-007 requires confirmation.',
    orderId: 'ord-007', recipientStaffId: 'staff-2', read: false, createdAt: '2026-05-11T10:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-007', category: 'upsell', autoResolve: true,
  },
  {
    id: 'notif-003', type: 'order_reminder', severity: 'urgent', title: 'Order Reminder',
    message: 'Reminder: Airport Transfer for Cameron Skillcorn is tomorrow (2026-05-12). Order ord-006 still pending.',
    orderId: 'ord-006', recipientStaffId: 'staff-2', read: false, createdAt: '2026-05-11T06:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-006', category: 'upsell', autoResolve: true,
  },
  {
    id: 'notif-004', type: 'order_confirmed', severity: 'info', title: 'Order Confirmed',
    message: 'Order ord-008 for Khasan Alshalabi (Surf Lesson, 2026-05-12) has been confirmed.',
    orderId: 'ord-008', recipientStaffId: 'staff-2', read: true, createdAt: '2026-05-11T14:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-008', category: 'upsell', autoResolve: true,
  },
  {
    id: 'notif-005', type: 'order_cancelled', severity: 'warning', title: 'Order Cancelled',
    message: 'Order ord-010 for Reto Wyss (Late Check-out, 2026-05-10) was cancelled.',
    orderId: 'ord-010', recipientStaffId: 'staff-2', read: true, createdAt: '2026-05-08T16:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-010', category: 'upsell', autoResolve: true,
  },
  {
    id: 'notif-006', type: 'order_completed', severity: 'info', title: 'Order Completed',
    message: 'Order ord-001 for Thomas Wikes (Airport Transfer) is completed.',
    orderId: 'ord-001', recipientStaffId: 'staff-2', read: true, createdAt: '2026-05-01T15:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-001', category: 'upsell', autoResolve: true,
  },
  {
    id: 'notif-007', type: 'order_late_cancel', severity: 'warning', title: 'Late Cancellation',
    message: 'Late cancellation for order ord-010. Reto Wyss cancelled Late Check-out within 24h.',
    orderId: 'ord-010', recipientStaffId: 'staff-2', read: true, createdAt: '2026-05-08T14:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-010', category: 'upsell', autoResolve: true,
  },
  {
    id: 'notif-008', type: 'order_reminder', severity: 'urgent', title: 'Order Reminder',
    message: 'Reminder: Mid-stay Cleaning for Mikhail Batkovsky is tomorrow (2026-05-13). Order ord-009 still pending.',
    orderId: 'ord-009', recipientStaffId: 'staff-3', read: false, createdAt: '2026-05-12T06:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-009', category: 'upsell', autoResolve: true,
  },
  {
    id: 'notif-009', type: 'order_requested', severity: 'info', title: 'New Upsell Request',
    message: 'Mikhail Batkovsky requested Mid-stay Cleaning for 2026-05-13. Order ord-009 requires confirmation.',
    orderId: 'ord-009', recipientStaffId: 'staff-3', read: false, createdAt: '2026-05-12T11:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-009', category: 'upsell', autoResolve: true,
  },
  {
    id: 'notif-010', type: 'order_no_show', severity: 'warning', title: 'Guest No-Show',
    message: 'Guest Cameron Skillcorn did not show for Airport Transfer (2026-05-12). Order ord-006.',
    orderId: 'ord-006', recipientStaffId: 'staff-2', read: false, createdAt: '2026-05-12T16:00:00Z',
    actionUrl: '/upsells?tab=orders&order=ord-006', category: 'upsell', autoResolve: false,
  },
]
