// app/components/users/data/permissions.ts

export type PermissionModule =
  | 'dashboard'
  | 'inbox'
  | 'listings'
  | 'reservations'
  | 'tasks'
  | 'cleaning'
  | 'operations'
  | 'upsells'
  | 'reviews'
  | 'finance'
  | 'inventory'
  | 'journeys'
  | 'payment_requests'
  | 'guest_guides'
  | 'reports'
  | 'settings'

export interface ModulePermissions {
  dashboardView: boolean
  dashboardEdit: boolean
  mobileView: boolean
  mobileEdit: boolean
}

export const PERMISSION_MODULES: { id: PermissionModule; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'listings', label: 'Listings' },
  { id: 'reservations', label: 'Reservations' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'operations', label: 'Operations' },
  { id: 'upsells', label: 'Upsells' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'finance', label: 'Finance' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'journeys', label: 'Journeys' },
  { id: 'payment_requests', label: 'Payment Requests' },
  { id: 'guest_guides', label: 'Guest Guides' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
]

// Default permissions for an empty role (deny everything)
export function emptyModulePermissions(): ModulePermissions {
  return {
    dashboardView: false,
    dashboardEdit: false,
    mobileView: false,
    mobileEdit: false,
  }
}

// Convenience helpers
export function hasAnyAccess(p: ModulePermissions): boolean {
  return p.dashboardView || p.dashboardEdit || p.mobileView || p.mobileEdit
}

export function defaultPerms(): Record<PermissionModule, ModulePermissions> {
  return PERMISSION_MODULES.reduce(
    (acc, m) => ({ ...acc, [m.id]: emptyModulePermissions() }),
    {} as Record<PermissionModule, ModulePermissions>,
  )
}
