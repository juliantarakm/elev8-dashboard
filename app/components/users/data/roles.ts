// app/components/users/data/roles.ts
import type { PermissionModule, ModulePermissions } from './permissions'
import { defaultPerms } from './permissions'

export type RoleId =
  | 'role-admin' | 'role-general-manager' | 'role-listing-manager'
  | 'role-guest-experience-manager' | 'role-quality-manager' | 'role-back-office'
  | 'role-finance-hr' | 'role-housekeeping-manager'
  | 'role-housekeeping' | 'role-gardener' | 'role-pool' | 'role-engineering'
  | 'role-electrician' | 'role-it-team' | 'role-laundry' | 'role-owner'

export type WeekDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
export const WEEK_DAYS: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const ALL_DAYS: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const WEEKDAY_DAYS: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export interface WorkingHours {
  scheduleType: 'flexible' | 'fixed'
  startTime?: string
  endTime?: string
  days: WeekDay[]
}

export interface Role {
  id: RoleId
  name: string
  description: string
  workingHours: WorkingHours
  defaultPermissions: Record<PermissionModule, ModulePermissions>
}

// Helpers to build permission maps concisely
function fullAccess(modules: PermissionModule[]): Record<PermissionModule, ModulePermissions> {
  const base = defaultPerms()
  for (const m of modules) {
    base[m] = { dashboardView: true, dashboardEdit: true, mobileView: false, mobileEdit: false }
  }
  return base
}

function viewOnly(modules: PermissionModule[]): Record<PermissionModule, ModulePermissions> {
  const base = defaultPerms()
  for (const m of modules) {
    base[m] = { dashboardView: true, dashboardEdit: false, mobileView: false, mobileEdit: false }
  }
  return base
}

function viewPlusEdit(viewMods: PermissionModule[], editMods: PermissionModule[]): Record<PermissionModule, ModulePermissions> {
  const base = viewOnly(viewMods)
  for (const m of editMods) {
    base[m] = { dashboardView: true, dashboardEdit: true, mobileView: false, mobileEdit: false }
  }
  return base
}

const ALL_MODULES: PermissionModule[] = [
  'dashboard', 'inbox', 'listings', 'reservations', 'tasks', 'cleaning',
  'operations', 'upsells', 'reviews', 'finance', 'inventory', 'journeys',
  'payment_requests', 'guest_guides', 'reports', 'settings',
]

export const defaultRoles: Role[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Tenant administrator with full access to every module, settings, and configuration.',
    workingHours: { scheduleType: 'flexible', days: ALL_DAYS },
    defaultPermissions: fullAccess(ALL_MODULES),
  },
  {
    id: 'role-general-manager',
    name: 'General Manager',
    description: 'Oversees all daily operations of the properties. Has broad access to manage staff, financials, guest relations, and property maintenance.',
    workingHours: { scheduleType: 'flexible', days: ALL_DAYS },
    defaultPermissions: viewPlusEdit(
      ALL_MODULES.filter(m => m !== 'settings'),
      ['dashboard', 'inbox', 'listings', 'reservations', 'tasks', 'cleaning', 'operations', 'upsells', 'reviews', 'finance', 'inventory', 'journeys', 'payment_requests', 'guest_guides', 'reports'],
    ),
  },
  {
    id: 'role-listing-manager',
    name: 'Listing Manager',
    description: 'Manages property listings on all booking platforms. Responsible for pricing, availability, and marketing content to maximize occupancy and revenue.',
    workingHours: { scheduleType: 'flexible', days: ALL_DAYS },
    defaultPermissions: viewPlusEdit(
      ['inbox', 'finance', 'reports', 'dashboard'],
      ['listings', 'reservations', 'reviews'],
    ),
  },
  {
    id: 'role-guest-experience-manager',
    name: 'Guest Experience Manager',
    description: 'Ensures a five-star guest experience from check-in to check-out. Handles all guest communication, special requests, and resolves any issues that arise during their stay.',
    workingHours: { scheduleType: 'flexible', days: ALL_DAYS },
    defaultPermissions: viewPlusEdit(
      ['listings', 'cleaning', 'operations', 'reports', 'dashboard'],
      ['inbox', 'reservations', 'reviews'],
    ),
  },
  {
    id: 'role-quality-manager',
    name: 'Quality Manager',
    description: 'Responsible for upholding property standards. Conducts regular inspections, manages guest feedback, and coordinates with other teams to ensure consistent quality control.',
    workingHours: { scheduleType: 'fixed', startTime: '10:00', endTime: '18:00', days: WEEKDAY_DAYS },
    defaultPermissions: viewPlusEdit(
      ['listings', 'reviews', 'operations', 'inbox', 'reports', 'dashboard'],
      ['tasks'],
    ),
  },
  {
    id: 'role-back-office',
    name: 'Back Office',
    description: 'Handles administrative tasks, data entry, and general support for management. Can access reports and company documents but has limited editing permissions.',
    workingHours: { scheduleType: 'fixed', startTime: '08:00', endTime: '17:00', days: WEEKDAY_DAYS },
    defaultPermissions: viewOnly(['reports', 'tasks', 'settings', 'dashboard']),
  },
  {
    id: 'role-finance-hr',
    name: 'Finance/HR',
    description: 'Manages payroll, invoicing, company expenses, and human resources tasks like onboarding and employee records. Has access to sensitive financial and employee data.',
    workingHours: { scheduleType: 'fixed', startTime: '10:00', endTime: '18:00', days: WEEKDAY_DAYS },
    defaultPermissions: viewPlusEdit(
      ['inbox', 'listings', 'reservations', 'cleaning', 'operations', 'upsells', 'reviews', 'inventory', 'journeys', 'guest_guides', 'dashboard'],
      ['finance', 'reports', 'settings'],
    ),
  },
  {
    id: 'role-housekeeping-manager',
    name: 'Housekeeping Manager',
    description: 'Responsible for overseeing all housekeeping operations. Ensures properties are cleaned, prepared, and inspected to the highest standard before guest arrivals. Can manage cleaning schedules, assign tasks, and review reports.',
    workingHours: { scheduleType: 'fixed', startTime: '10:00', endTime: '18:00', days: WEEKDAY_DAYS },
    defaultPermissions: viewPlusEdit(
      ['inbox', 'reviews', 'inventory', 'reports', 'finance', 'dashboard', 'settings'],
      ['cleaning', 'tasks', 'operations', 'listings'],
    ),
  },
  {
    id: 'role-housekeeping',
    name: 'Housekeeping',
    description: 'Responsible for the cleaning and preparation of properties for guest arrivals. Can view cleaning schedules, report maintenance issues, and update property status.',
    workingHours: { scheduleType: 'fixed', startTime: '10:00', endTime: '18:00', days: ALL_DAYS },
    defaultPermissions: viewOnly(['cleaning', 'tasks', 'listings', 'dashboard']),
  },
  {
    id: 'role-gardener',
    name: 'Gardener',
    description: 'Maintains the gardens, landscaping, and all outdoor areas of the properties. Can view work schedules and report on landscaping needs.',
    workingHours: { scheduleType: 'fixed', startTime: '10:00', endTime: '18:00', days: WEEKDAY_DAYS },
    defaultPermissions: viewOnly(['tasks', 'operations', 'listings', 'dashboard']),
  },
  {
    id: 'role-pool',
    name: 'Pool',
    description: 'Responsible for the cleaning, maintenance, and chemical balancing of all swimming pools. Can view maintenance schedules and log service reports.',
    workingHours: { scheduleType: 'fixed', startTime: '10:00', endTime: '18:00', days: WEEKDAY_DAYS },
    defaultPermissions: viewOnly(['tasks', 'operations', 'listings', 'dashboard']),
  },
  {
    id: 'role-engineering',
    name: 'Engineering',
    description: 'Oversees general property maintenance and repairs. Manages the maintenance team, assigns tasks, and tracks the completion of work orders.',
    workingHours: { scheduleType: 'fixed', startTime: '10:00', endTime: '18:00', days: WEEKDAY_DAYS },
    defaultPermissions: viewPlusEdit(
      ['inbox', 'reviews', 'inventory', 'reports', 'dashboard'],
      ['tasks', 'operations', 'listings'],
    ),
  },
  {
    id: 'role-electrician',
    name: 'Electrician',
    description: 'Specialized role for handling all electrical installations, repairs, and safety checks. Can access and respond to electrical-specific maintenance requests.',
    workingHours: { scheduleType: 'fixed', startTime: '10:00', endTime: '18:00', days: WEEKDAY_DAYS },
    defaultPermissions: viewOnly(['tasks', 'operations', 'listings', 'dashboard']),
  },
  {
    id: 'role-it-team',
    name: 'IT Team',
    description: "Manages the company's technology infrastructure, including Wi-Fi, smart home devices, and software systems. Provides technical support to staff and guests.",
    workingHours: { scheduleType: 'flexible', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
    defaultPermissions: viewOnly(['settings', 'tasks', 'dashboard']),
  },
  {
    id: 'role-laundry',
    name: 'Laundry',
    description: 'Manages the collection, washing, drying, and distribution of linens and towels for all listings. Can view schedules and report on linen inventory levels.',
    workingHours: { scheduleType: 'fixed', startTime: '10:00', endTime: '18:00', days: WEEKDAY_DAYS },
    defaultPermissions: viewOnly(['tasks', 'operations', 'listings', 'dashboard']),
  },
  {
    id: 'role-owner',
    name: 'Owner',
    description: 'Property owner with high-level visibility into reservations and overall business performance. Can view guest reservations and stay activity, but does not manage daily operations, listings, payments, staff, or system configuration unless explicitly granted additional permissions.',
    workingHours: { scheduleType: 'flexible', days: WEEKDAY_DAYS },
    defaultPermissions: viewOnly(ALL_MODULES),
  },
]

// Helper to find a role's defaults (used by "Reset to defaults" button)
export function findDefaultRole(id: RoleId): Role | undefined {
  return defaultRoles.find(r => r.id === id)
}

export function isRoleId(value: string): value is RoleId {
  return defaultRoles.some(r => r.id === value)
}
