# Users & Roles Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a tenant-side Users & Roles feature to the Elev8 dashboard — a `/users` page with two tabs (Users + Roles) where tenants can create users, assign them to listings, and edit 16 system-defined roles with working hours and per-module permissions.

**Architecture:** Two composables (`useUsers`, `useRoles`) using `useState` + `localStorage` (mirrors `useWhatsApp`/`useSmartLock` pattern). Eight Vue components organized under `app/components/users/`. Page is `/users` with `Tabs` shell wrapped in `<ClientOnly>` for SSR safety. No backend, no auth, no enforcement on other modules (state-only v1).

**Tech Stack:** Nuxt 3, Vue 3 Composition API, shadcn-vue (Sheet, Dialog, Popover, Tabs, Select, Switch, Tooltip, Card, Badge, Avatar, Button, Input, Textarea), TanStack Vue Table, lucide-vue-next icons.

**Spec:** `docs/superpowers/specs/2026-07-15-users-feature-design.md`

---

## File Structure

```
app/
├── constants/
│   └── menus.ts                          (MODIFY: add Users entry under General)
├── pages/
│   └── users.vue                         (CREATE: page shell with Tabs)
├── components/users/
│   ├── data/
│   │   ├── permissions.ts                (CREATE: PermissionModule + ModulePermissions types)
│   │   ├── roles.ts                      (CREATE: Role type + 16 default roles seed)
│   │   └── users.ts                      (CREATE: User type + 8 seed users)
│   ├── SalaryDisplay.vue                 (CREATE: read-only IDR summary card)
│   ├── UserPersonalInfoForm.vue          (CREATE: name/phone/lang/email/employee# fields)
│   ├── UserAssignmentPicker.vue          (CREATE: multi-select listings Popover)
│   ├── UserDetailSheet.vue               (CREATE: full create/edit/view Sheet)
│   ├── PermissionMatrix.vue              (CREATE: module × view/edit matrix)
│   ├── RoleDetailSheet.vue               (CREATE: role working hours + permissions)
│   ├── UsersTable.vue                    (CREATE: TanStack users table)
│   └── RolesGrid.vue                     (CREATE: role cards grid)
└── composables/
    ├── useRoles.ts                       (CREATE: role config CRUD)
    └── useUsers.ts                       (CREATE: user CRUD + listing assignment)
```

---

## Task 1: Create permissions data types

**Files:**
- Create: `app/components/users/data/permissions.ts`

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm dev` (or skip if dev server already running)
Expected: No TypeScript errors related to `permissions.ts`

- [ ] **Step 3: Commit**

```bash
git add app/components/users/data/permissions.ts
git commit -m "feat(users): add PermissionModule and ModulePermissions types"
```

---

## Task 2: Create roles data with 16 default roles

**Files:**
- Create: `app/components/users/data/roles.ts`

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm typecheck` (or check the dev server console)
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add app/components/users/data/roles.ts
git commit -m "feat(users): add 16 default roles with descriptions and working hours"
```

---

## Task 3: Create users data with seed mock users

**Files:**
- Create: `app/components/users/data/users.ts`

- [ ] **Step 1: Create the file**

```ts
// app/components/users/data/users.ts
import type { RoleId } from './roles'

export type PreferredLanguage = 'en' | 'de' | 'fr' | 'id' | 'es' | 'it' | 'pt' | 'nl'

export const PREFERRED_LANGUAGES: { value: PreferredLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'es', label: 'Spanish' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'nl', label: 'Dutch' },
]

export interface User {
  id: string
  // Personal info
  name: string
  phone: string
  preferredLanguage: PreferredLanguage
  email: string
  employeeNumber: string
  // Salary (display-only in v1)
  monthlySalaryAmount: number
  workingDaysPerMonth: number
  hoursPerDay: number
  // Role + scope
  roleId: RoleId
  listingIds: string[]
  // Meta
  status: 'active' | 'inactive'
  avatarUrl?: string
  initials: string
  createdAt: string
  updatedAt: string
}

// Computes initials from a name (e.g. "Reto Wyss Test" → "RWT")
export function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const now = new Date('2026-07-15T00:00:00Z').toISOString()

// 8 seed users — references existing staff from inbox conversations where possible
export const seedUsers: User[] = [
  {
    id: 'user-1',
    name: 'Komang Juliantara',
    phone: '6281234567801',
    preferredLanguage: 'id',
    email: 'komang@elev8.io',
    employeeNumber: 'EMP-001',
    monthlySalaryAmount: 8500000,
    workingDaysPerMonth: 26,
    hoursPerDay: 8,
    roleId: 'role-guest-experience-manager',
    listingIds: ['lst-1', 'lst-2', 'lst-3', 'lst-4'],
    status: 'active',
    initials: 'KJ',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'user-2',
    name: 'Made Surya',
    phone: '6281234567802',
    preferredLanguage: 'id',
    email: 'made.surya@elev8.io',
    employeeNumber: 'EMP-002',
    monthlySalaryAmount: 9000000,
    workingDaysPerMonth: 26,
    hoursPerDay: 8,
    roleId: 'role-listing-manager',
    listingIds: ['lst-1', 'lst-2', 'lst-5', 'lst-6', 'lst-7', 'lst-8'],
    status: 'active',
    initials: 'MS',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'user-3',
    name: 'Wayan Adi',
    phone: '6281234567803',
    preferredLanguage: 'id',
    email: 'wayan.adi@elev8.io',
    employeeNumber: 'EMP-003',
    monthlySalaryAmount: 9000000,
    workingDaysPerMonth: 26,
    hoursPerDay: 8,
    roleId: 'role-listing-manager',
    listingIds: ['lst-3', 'lst-4', 'lst-9', 'lst-10'],
    status: 'active',
    initials: 'WA',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'user-4',
    name: 'Reto Wyss Test',
    phone: '41768165541',
    preferredLanguage: 'de',
    email: 'reto@iwyss.ch',
    employeeNumber: 'EMP-004',
    monthlySalaryAmount: 0,
    workingDaysPerMonth: 0,
    hoursPerDay: 0,
    roleId: 'role-owner',
    listingIds: [],
    status: 'active',
    initials: 'RW',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'user-5',
    name: 'Made Wirawan',
    phone: '6281234567805',
    preferredLanguage: 'id',
    email: 'made.wirawan@elev8.io',
    employeeNumber: 'EMP-005',
    monthlySalaryAmount: 12000000,
    workingDaysPerMonth: 26,
    hoursPerDay: 9,
    roleId: 'role-general-manager',
    listingIds: [],
    status: 'active',
    initials: 'MW',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'user-6',
    name: 'Ni Putu Sari',
    phone: '6281234567806',
    preferredLanguage: 'id',
    email: 'putu.sari@elev8.io',
    employeeNumber: 'EMP-006',
    monthlySalaryAmount: 7500000,
    workingDaysPerMonth: 26,
    hoursPerDay: 8,
    roleId: 'role-housekeeping-manager',
    listingIds: ['lst-1', 'lst-2', 'lst-3', 'lst-4', 'lst-5'],
    status: 'active',
    initials: 'NP',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'user-7',
    name: 'Ketut Antara',
    phone: '6281234567807',
    preferredLanguage: 'id',
    email: 'ketut.antara@elev8.io',
    employeeNumber: 'EMP-007',
    monthlySalaryAmount: 5500000,
    workingDaysPerMonth: 26,
    hoursPerDay: 8,
    roleId: 'role-housekeeping',
    listingIds: ['lst-1', 'lst-2'],
    status: 'active',
    initials: 'KA',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'user-8',
    name: 'Gede Pratama',
    phone: '6281234567808',
    preferredLanguage: 'id',
    email: 'gede.pratama@elev8.io',
    employeeNumber: 'EMP-008',
    monthlySalaryAmount: 6000000,
    workingDaysPerMonth: 26,
    hoursPerDay: 8,
    roleId: 'role-pool',
    listingIds: ['lst-1', 'lst-3', 'lst-5'],
    status: 'inactive',
    initials: 'GP',
    createdAt: now,
    updatedAt: now,
  },
]
```

- [ ] **Step 2: Verify it compiles**

Run: dev server console
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add app/components/users/data/users.ts
git commit -m "feat(users): add User type and 8 seed users"
```

---

## Task 4: Create useRoles composable

**Files:**
- Create: `app/composables/useRoles.ts`

- [ ] **Step 1: Create the file**

```ts
// app/composables/useRoles.ts
import type { Role, RoleId } from '~/components/users/data/roles'
import { defaultRoles, findDefaultRole } from '~/components/users/data/roles'

const STORAGE_KEY = 'elev8-tenant-roles'

function hasStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function loadFromStorage(): Role[] | null {
  if (!hasStorage()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Role[]
  }
  catch {
    return null
  }
}

function saveToStorage(roles: Role[]): void {
  if (!hasStorage()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roles))
  }
  catch {
    // ignore quota errors
  }
}

export function useRoles() {
  const roles = useState<Role[]>('tenant-roles', () => {
    const stored = loadFromStorage()
    return stored ?? JSON.parse(JSON.stringify(defaultRoles))
  })

  function getRole(id: string): Role | undefined {
    return roles.value.find(r => r.id === id)
  }

  function updateRole(id: RoleId, patch: Partial<Omit<Role, 'id'>>): void {
    roles.value = roles.value.map(r => r.id === id ? { ...r, ...patch } : r)
    saveToStorage(roles.value)
  }

  function resetRoleToDefaults(id: RoleId): void {
    const defaults = findDefaultRole(id)
    if (!defaults) return
    const fresh = JSON.parse(JSON.stringify(defaults))
    roles.value = roles.value.map(r => r.id === id ? fresh : r)
    saveToStorage(roles.value)
  }

  function resetAllRolesToDefaults(): void {
    roles.value = JSON.parse(JSON.stringify(defaultRoles))
    saveToStorage(roles.value)
  }

  return {
    roles,
    getRole,
    updateRole,
    resetRoleToDefaults,
    resetAllRolesToDefaults,
  }
}
```

- [ ] **Step 2: Verify it compiles**

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/composables/useRoles.ts
git commit -m "feat(users): add useRoles composable with localStorage persistence"
```

---

## Task 5: Create useUsers composable

**Files:**
- Create: `app/composables/useUsers.ts`

- [ ] **Step 1: Create the file**

```ts
// app/composables/useUsers.ts
import type { User } from '~/components/users/data/users'
import { computeInitials, seedUsers } from '~/components/users/data/users'
import type { RoleId } from '~/components/users/data/roles'

const STORAGE_KEY = 'elev8-tenant-users'

function hasStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function loadFromStorage(): User[] | null {
  if (!hasStorage()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User[]
  }
  catch {
    return null
  }
}

function saveToStorage(users: User[]): void {
  if (!hasStorage()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  }
  catch {
    // ignore quota errors
  }
}

function nextUserId(): string {
  return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export type UserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'initials'>

export function useUsers() {
  const users = useState<User[]>('tenant-users', () => {
    const stored = loadFromStorage()
    return stored ?? JSON.parse(JSON.stringify(seedUsers))
  })

  function getUser(id: string): User | undefined {
    return users.value.find(u => u.id === id)
  }

  function addUser(input: UserInput): User {
    const now = new Date().toISOString()
    const user: User = {
      ...input,
      id: nextUserId(),
      initials: computeInitials(input.name),
      createdAt: now,
      updatedAt: now,
    }
    users.value = [user, ...users.value]
    saveToStorage(users.value)
    return user
  }

  function updateUser(id: string, patch: Partial<Omit<User, 'id' | 'createdAt'>>): void {
    users.value = users.value.map((u) => {
      if (u.id !== id) return u
      const next = { ...u, ...patch }
      if (patch.name) next.initials = computeInitials(patch.name)
      next.updatedAt = new Date().toISOString()
      return next
    })
    saveToStorage(users.value)
  }

  function deleteUser(id: string): void {
    users.value = users.value.filter(u => u.id !== id)
    saveToStorage(users.value)
  }

  function toggleActive(id: string): void {
    users.value = users.value.map((u) => {
      if (u.id !== id) return u
      return { ...u, status: u.status === 'active' ? 'inactive' : 'active', updatedAt: new Date().toISOString() }
    })
    saveToStorage(users.value)
  }

  function setListingAssignments(userId: string, listingIds: string[]): void {
    updateUser(userId, { listingIds })
  }

  function getUsersForListing(listingId: string): User[] {
    return users.value.filter(u => u.listingIds.includes(listingId))
  }

  function getUsersByRole(roleId: RoleId): User[] {
    return users.value.filter(u => u.roleId === roleId)
  }

  function findByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase()
    return users.value.find(u => u.email.toLowerCase() === normalized)
  }

  const activeUsers = computed(() => users.value.filter(u => u.status === 'active'))
  const inactiveUsers = computed(() => users.value.filter(u => u.status === 'inactive'))
  const totalCount = computed(() => users.value.length)
  const userCountByRole = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    for (const u of users.value) {
      counts[u.roleId] = (counts[u.roleId] ?? 0) + 1
    }
    return counts
  })

  return {
    users,
    getUser,
    addUser,
    updateUser,
    deleteUser,
    toggleActive,
    setListingAssignments,
    getUsersForListing,
    getUsersByRole,
    findByEmail,
    activeUsers,
    inactiveUsers,
    totalCount,
    userCountByRole,
  }
}
```

- [ ] **Step 2: Verify it compiles**

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/composables/useUsers.ts
git commit -m "feat(users): add useUsers composable with listing assignment"
```

---

## Task 6: Create SalaryDisplay component

**Files:**
- Create: `app/components/users/SalaryDisplay.vue`

- [ ] **Step 1: Create the file**

```vue
<!-- app/components/users/SalaryDisplay.vue -->
<script setup lang="ts">
import { Card, CardContent } from '~/components/ui/card'

interface Props {
  amount: number
  workingDaysPerMonth: number
  hoursPerDay: number
}

const props = defineProps<Props>()

const formattedAmount = computed(() => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(props.amount)
})

const hasData = computed(() =>
  props.amount > 0 || props.workingDaysPerMonth > 0 || props.hoursPerDay > 0,
)
</script>

<template>
  <Card class="bg-muted/50 border-dashed">
    <CardContent class="p-4 space-y-2">
      <div class="flex items-baseline gap-2 flex-wrap">
        <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Monthly
        </span>
        <span v-if="hasData" class="text-base font-semibold font-mono">
          {{ formattedAmount }}
        </span>
        <span v-else class="text-sm text-muted-foreground italic">
          IDR 0 / 0 working days — 0 hours/day
        </span>
      </div>
      <div v-if="hasData" class="text-xs text-muted-foreground">
        {{ workingDaysPerMonth }} working days · {{ hoursPerDay }} hours/day
      </div>
      <p class="text-xs text-muted-foreground italic pt-1 border-t border-border/50 mt-2">
        Salary is managed in the HR module (coming soon). This is a display-only summary.
      </p>
    </CardContent>
  </Card>
</template>
```

- [ ] **Step 2: Verify it renders**

Open any test usage (we'll use it in Task 10). For now, verify the file compiles.

- [ ] **Step 3: Commit**

```bash
git add app/components/users/SalaryDisplay.vue
git commit -m "feat(users): add SalaryDisplay read-only summary card"
```

---

## Task 7: Create UserPersonalInfoForm component

**Files:**
- Create: `app/components/users/UserPersonalInfoForm.vue`

- [ ] **Step 1: Create the file**

```vue
<!-- app/components/users/UserPersonalInfoForm.vue -->
<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import type { PreferredLanguage } from '~/components/users/data/users'
import { PREFERRED_LANGUAGES } from '~/components/users/data/users'

interface FormState {
  name: string
  phone: string
  preferredLanguage: PreferredLanguage
  email: string
  employeeNumber: string
}

interface Props {
  modelValue: FormState
  errors?: Partial<Record<keyof FormState, string>>
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({}),
})

const emit = defineEmits<{
  'update:modelValue': [value: FormState]
}>()

function update<K extends keyof FormState>(key: K, value: FormState[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const countryCodes = [
  { code: '+62', country: 'ID' },
  { code: '+41', country: 'CH' },
  { code: '+1', country: 'US' },
  { code: '+44', country: 'GB' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+31', country: 'NL' },
]

const selectedDialCode = ref('+62')

// Split phone into dial code + number
watchEffect(() => {
  const phone = props.modelValue.phone
  const match = countryCodes.find(c => phone.startsWith(c.code))
  if (match) {
    selectedDialCode.value = match.code
  }
})

function onPhoneInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  update('phone', selectedDialCode.value + raw)
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1.5">
      <Label for="user-name">
        Name <span class="text-destructive">*</span>
      </Label>
      <Input
        id="user-name"
        :model-value="modelValue.name"
        placeholder="e.g. Reto Wyss Test"
        @update:model-value="(v) => update('name', v)"
      />
      <p v-if="errors.name" class="text-xs text-destructive">
        {{ errors.name }}
      </p>
    </div>

    <div class="space-y-1.5">
      <Label for="user-phone">Phone / WhatsApp Number</Label>
      <div class="flex gap-2">
        <Select :model-value="selectedDialCode" @update:model-value="(v) => selectedDialCode = v as string">
          <SelectTrigger class="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="c in countryCodes" :key="c.code" :value="c.code">
              {{ c.country }} {{ c.code }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Input
          id="user-phone"
          :model-value="modelValue.phone.replace(selectedDialCode, '')"
          type="tel"
          inputmode="numeric"
          placeholder="41768165541"
          class="flex-1"
          @update:model-value="onPhoneInput($event as unknown as Event)"
        />
      </div>
    </div>

    <div class="space-y-1.5">
      <Label for="user-lang">Preferred Language</Label>
      <Select
        :model-value="modelValue.preferredLanguage"
        @update:model-value="(v) => update('preferredLanguage', v as PreferredLanguage)"
      >
        <SelectTrigger id="user-lang">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="l in PREFERRED_LANGUAGES" :key="l.value" :value="l.value">
            {{ l.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="space-y-1.5">
      <Label for="user-email">Email</Label>
      <Input
        id="user-email"
        type="email"
        :model-value="modelValue.email"
        placeholder="user@example.com"
        @update:model-value="(v) => update('email', v)"
      />
      <p v-if="errors.email" class="text-xs text-destructive">
        {{ errors.email }}
      </p>
    </div>

    <div class="space-y-1.5">
      <Label for="user-emp-num">Employee Number</Label>
      <Input
        id="user-emp-num"
        :model-value="modelValue.employeeNumber"
        placeholder="Enter employee number"
        @update:model-value="(v) => update('employeeNumber', v)"
      />
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify the file compiles**

- [ ] **Step 3: Commit**

```bash
git add app/components/users/UserPersonalInfoForm.vue
git commit -m "feat(users): add UserPersonalInfoForm with phone country selector"
```

---

## Task 8: Create UserAssignmentPicker component

**Files:**
- Create: `app/components/users/UserAssignmentPicker.vue`

- [ ] **Step 1: Read existing listings data shape to confirm field names**

Run: `grep -n "id:\|name:\|location:" app/components/listings/data/listings.ts | head -10`

Look for the `Listing` interface and confirm `id` and `name` field names.

- [ ] **Step 2: Create the file**

```vue
<!-- app/components/users/UserAssignmentPicker.vue -->
<script setup lang="ts">
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { ScrollArea } from '~/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { allProperties } from '~/components/listings/data/listings'
import Icon from '~/components/ui/icon/Icon.vue'

interface Props {
  modelValue: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const open = ref(false)
const search = ref('')

const selected = computed(() => new Set(props.modelValue))

const filteredProperties = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return allProperties
  return allProperties.filter((p) =>
    p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q),
  )
})

function toggle(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  emit('update:modelValue', Array.from(next))
}

function clearAll() {
  emit('update:modelValue', [])
  search.value = ''
}

function removeOne(id: string) {
  emit('update:modelValue', props.modelValue.filter(x => x !== id))
}

const selectedProperties = computed(() =>
  allProperties.filter(p => selected.value.has(p.id)),
)
</script>

<template>
  <div class="space-y-2">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button variant="outline" class="w-full justify-start font-normal">
          <Icon icon="lucide:building" class="mr-2 size-4 text-muted-foreground" />
          <span v-if="modelValue.length === 0" class="text-muted-foreground">
            Select listings...
          </span>
          <span v-else class="text-sm">
            {{ modelValue.length }} listing{{ modelValue.length === 1 ? '' : 's' }} selected
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-80 p-0" align="start">
        <div class="border-b p-2">
          <Input
            v-model="search"
            placeholder="Search listings..."
            class="h-8"
          />
        </div>
        <ScrollArea class="h-64">
          <div class="p-1">
            <div
              v-for="p in filteredProperties"
              :key="p.id"
              class="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-muted"
              @click="toggle(p.id)"
            >
              <div
                class="flex size-4 items-center justify-center rounded-[4px] border"
                :class="selected.has(p.id)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input'"
              >
                <Icon v-if="selected.has(p.id)" icon="lucide:check" class="size-3" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm truncate">
                  {{ p.name }}
                </div>
                <div class="text-xs text-muted-foreground truncate">
                  {{ p.location }}
                </div>
              </div>
            </div>
            <div v-if="filteredProperties.length === 0" class="p-4 text-center text-sm text-muted-foreground">
              No listings match "{{ search }}"
            </div>
          </div>
        </ScrollArea>
        <div class="border-t p-2 flex justify-between">
          <span class="text-xs text-muted-foreground self-center">
            {{ modelValue.length }} selected
          </span>
          <Button variant="ghost" size="sm" :disabled="modelValue.length === 0" @click="clearAll">
            Clear all
          </Button>
        </div>
      </PopoverContent>
    </Popover>

    <div v-if="selectedProperties.length > 0" class="flex flex-wrap gap-1">
      <Badge
        v-for="p in selectedProperties.slice(0, 4)"
        :key="p.id"
        variant="secondary"
        class="gap-1"
      >
        {{ p.name }}
        <button
          type="button"
          class="ml-1 rounded-full hover:bg-muted-foreground/20"
          @click.stop="removeOne(p.id)"
        >
          <Icon icon="lucide:x" class="size-3" />
        </button>
      </Badge>
      <Badge v-if="selectedProperties.length > 4" variant="outline">
        +{{ selectedProperties.length - 4 }} more
      </Badge>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Verify the file compiles**

Note: If `~/components/ui/icon/Icon.vue` doesn't exist, use `<LucideIcon name="..." />` style or plain `<svg>` — search `app/components/listings/` for how the existing code uses icons.

- [ ] **Step 4: Commit**

```bash
git add app/components/users/UserAssignmentPicker.vue
git commit -m "feat(users): add UserAssignmentPicker multi-select"
```

---

## Task 9: Create PermissionMatrix component

**Files:**
- Create: `app/components/users/PermissionMatrix.vue`

- [ ] **Step 1: Create the file**

```vue
<!-- app/components/users/PermissionMatrix.vue -->
<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { PERMISSION_MODULES, type ModulePermissions, type PermissionModule } from '~/components/users/data/permissions'
import { cn } from '@/lib/utils'
import Icon from '~/components/ui/icon/Icon.vue'

interface Props {
  permissions: Record<PermissionModule, ModulePermissions>
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), { readonly: false })

const emit = defineEmits<{
  'update:permissions': [value: Record<PermissionModule, ModulePermissions>]
}>()

function toggle(module: PermissionModule, key: keyof ModulePermissions) {
  if (props.readonly) return
  const next = { ...props.permissions }
  next[module] = { ...next[module], [key]: !next[module][key] }
  emit('update:permissions', next)
}

function isChecked(module: PermissionModule, key: keyof ModulePermissions): boolean {
  return props.permissions[module]?.[key] ?? false
}
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <CardTitle class="text-base">Permissions</CardTitle>
      <p class="text-xs text-muted-foreground">
        Configure which modules this role can view or edit in the dashboard. Mobile app permissions are coming soon.
      </p>
    </CardHeader>
    <CardContent class="p-0">
      <TooltipProvider>
        <div class="border-y">
          <!-- Header row -->
          <div class="grid grid-cols-[1fr_80px_80px_80px_80px] text-xs font-medium text-muted-foreground px-4 py-2 border-b bg-muted/30">
            <div>Module</div>
            <div class="text-center">
              Dashboard
              <div class="text-[10px] font-normal">
                View
              </div>
            </div>
            <div class="text-center">
              Dashboard
              <div class="text-[10px] font-normal">
                Edit
              </div>
            </div>
            <div class="text-center">
              Mobile
              <div class="text-[10px] font-normal">
                View
              </div>
            </div>
            <div class="text-center">
              Mobile
              <div class="text-[10px] font-normal">
                Edit
              </div>
            </div>
          </div>

          <!-- Module rows -->
          <div
            v-for="m in PERMISSION_MODULES"
            :key="m.id"
            class="grid grid-cols-[1fr_80px_80px_80px_80px] items-center px-4 py-2 border-b last:border-b-0 hover:bg-muted/20"
          >
            <div class="text-sm">
              {{ m.label }}
            </div>

            <!-- Dashboard View -->
            <div class="flex justify-center">
              <button
                type="button"
                :disabled="readonly"
                class="flex size-5 items-center justify-center rounded border transition-colors"
                :class="isChecked(m.id, 'dashboardView')
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-muted'"
                @click="toggle(m.id, 'dashboardView')"
              >
                <Icon v-if="isChecked(m.id, 'dashboardView')" icon="lucide:check" class="size-3" />
              </button>
            </div>

            <!-- Dashboard Edit -->
            <div class="flex justify-center">
              <button
                type="button"
                :disabled="readonly"
                class="flex size-5 items-center justify-center rounded border transition-colors"
                :class="isChecked(m.id, 'dashboardEdit')
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-muted'"
                @click="toggle(m.id, 'dashboardEdit')"
              >
                <Icon v-if="isChecked(m.id, 'dashboardEdit')" icon="lucide:check" class="size-3" />
              </button>
            </div>

            <!-- Mobile View (locked) -->
            <div class="flex justify-center">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    disabled
                    class="flex size-5 items-center justify-center rounded border border-muted-foreground/30 bg-muted text-muted-foreground cursor-not-allowed"
                  >
                    <Icon icon="lucide:lock" class="size-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mobile app coming soon</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <!-- Mobile Edit (locked) -->
            <div class="flex justify-center">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    disabled
                    class="flex size-5 items-center justify-center rounded border border-muted-foreground/30 bg-muted text-muted-foreground cursor-not-allowed"
                  >
                    <Icon icon="lucide:lock" class="size-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mobile app coming soon</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </CardContent>
  </Card>
</template>
```

- [ ] **Step 2: Verify the file compiles**

- [ ] **Step 3: Commit**

```bash
git add app/components/users/PermissionMatrix.vue
git commit -m "feat(users): add PermissionMatrix with locked mobile columns"
```

---

## Task 10: Create UserDetailSheet component

**Files:**
- Create: `app/components/users/UserDetailSheet.vue`

- [ ] **Step 1: Create the file**

```vue
<!-- app/components/users/UserDetailSheet.vue -->
<script setup lang="ts">
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '~/components/ui/sheet'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Separator } from '~/components/ui/separator'
import { useUsers } from '~/composables/useUsers'
import { useRoles } from '~/composables/useRoles'
import UserPersonalInfoForm from './UserPersonalInfoForm.vue'
import UserAssignmentPicker from './UserAssignmentPicker.vue'
import SalaryDisplay from './SalaryDisplay.vue'
import type { User } from '~/components/users/data/users'
import type { PreferredLanguage } from '~/components/users/data/users'
import type { RoleId } from '~/components/users/data/roles'

interface Props {
  open: boolean
  userId?: string  // undefined = create mode
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [user: User]
}>()

const { addUser, updateUser, getUser, findByEmail } = useUsers()
const { roles } = useRoles()

const isEdit = computed(() => !!props.userId)
const editingUser = computed(() => props.userId ? getUser(props.userId) : undefined)

// Form state
const form = ref({
  name: '',
  phone: '+62',
  preferredLanguage: 'en' as PreferredLanguage,
  email: '',
  employeeNumber: '',
  monthlySalaryAmount: 0,
  workingDaysPerMonth: 0,
  hoursPerDay: 0,
  roleId: '' as RoleId | '',
  listingIds: [] as string[],
  status: 'active' as 'active' | 'inactive',
})

const errors = ref<Record<string, string>>({})

// Load form when sheet opens or userId changes
watch(() => [props.open, props.userId], () => {
  if (!props.open) return
  errors.value = {}
  if (editingUser.value) {
    form.value = {
      name: editingUser.value.name,
      phone: editingUser.value.phone || '+62',
      preferredLanguage: editingUser.value.preferredLanguage,
      email: editingUser.value.email,
      employeeNumber: editingUser.value.employeeNumber,
      monthlySalaryAmount: editingUser.value.monthlySalaryAmount,
      workingDaysPerMonth: editingUser.value.workingDaysPerMonth,
      hoursPerDay: editingUser.value.hoursPerDay,
      roleId: editingUser.value.roleId,
      listingIds: [...editingUser.value.listingIds],
      status: editingUser.value.status,
    }
  }
  else {
    form.value = {
      name: '',
      phone: '+62',
      preferredLanguage: 'en',
      email: '',
      employeeNumber: '',
      monthlySalaryAmount: 0,
      workingDaysPerMonth: 0,
      hoursPerDay: 0,
      roleId: 'role-housekeeping',
      listingIds: [],
      status: 'active',
    }
  }
}, { immediate: true })

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.value.name.trim()) e.name = 'Name is required'
  if (!form.value.email.trim()) {
    e.email = 'Email is required'
  }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim())) {
    e.email = 'Invalid email format'
  }
  else {
    const existing = findByEmail(form.value.email)
    if (existing && existing.id !== props.userId) {
      e.email = 'A user with this email already exists'
    }
  }
  if (!form.value.roleId) e.roleId = 'Role is required'
  errors.value = e
  return Object.keys(e).length === 0
}

const noListingsWarning = computed(() =>
  form.value.roleId
  && form.value.roleId !== 'role-admin'
  && form.value.roleId !== 'role-owner'
  && form.value.listingIds.length === 0,
)

function handleSave() {
  if (!validate()) return

  const payload = {
    name: form.value.name.trim(),
    phone: form.value.phone,
    preferredLanguage: form.value.preferredLanguage,
    email: form.value.email.trim(),
    employeeNumber: form.value.employeeNumber.trim(),
    monthlySalaryAmount: form.value.monthlySalaryAmount,
    workingDaysPerMonth: form.value.workingDaysPerMonth,
    hoursPerDay: form.value.hoursPerDay,
    roleId: form.value.roleId as RoleId,
    listingIds: form.value.listingIds,
    status: form.value.status,
  }

  let saved: User
  if (editingUser.value) {
    updateUser(editingUser.value.id, payload)
    saved = { ...editingUser.value, ...payload }
  }
  else {
    saved = addUser(payload)
  }
  emit('saved', saved)
  emit('update:open', false)
}
</script>

<template>
  <Sheet :open="open" @update:open="(v) => emit('update:open', v)">
    <SheetContent side="right" class="w-full sm:max-w-2xl p-0 flex flex-col">
      <SheetHeader class="px-6 pt-6 pb-4">
        <SheetTitle>{{ isEdit ? 'Edit user' : 'Add user' }}</SheetTitle>
        <SheetDescription>
          {{ isEdit ? 'Update user details, role, and listing assignments.' : 'Create a new team member with a role and listing assignments.' }}
        </SheetDescription>
      </SheetHeader>

      <div class="flex-1 min-h-0 overflow-y-auto px-6 space-y-6 pb-6">
        <!-- Personal Info -->
        <section class="space-y-3">
          <h3 class="text-sm font-medium">
            Personal Info
          </h3>
          <UserPersonalInfoForm
            v-model="form"
            :errors="{
              name: errors.name,
              email: errors.email,
            }"
          />
        </section>

        <Separator />

        <!-- Salary (display only) -->
        <section class="space-y-3">
          <h3 class="text-sm font-medium">
            Compensation
          </h3>
          <SalaryDisplay
            :amount="form.monthlySalaryAmount"
            :working-days-per-month="form.workingDaysPerMonth"
            :hours-per-day="form.hoursPerDay"
          />
        </section>

        <Separator />

        <!-- Role & Listings -->
        <section class="space-y-4">
          <h3 class="text-sm font-medium">
            Role &amp; Listings
          </h3>

          <div class="space-y-1.5">
            <Label for="user-role">
              Role <span class="text-destructive">*</span>
            </Label>
            <Select
              :model-value="form.roleId"
              @update:model-value="(v) => form.roleId = v as RoleId"
            >
              <SelectTrigger id="user-role">
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="r in roles" :key="r.id" :value="r.id">
                  {{ r.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="errors.roleId" class="text-xs text-destructive">
              {{ errors.roleId }}
            </p>
          </div>

          <div class="space-y-1.5">
            <Label>Assign to Listings</Label>
            <UserAssignmentPicker v-model="form.listingIds" />
            <p class="text-xs text-muted-foreground">
              Leave empty for tenant-wide access (Admin/Owner).
            </p>
          </div>

          <Alert v-if="noListingsWarning" variant="default" class="border-amber-500/50 bg-amber-500/10">
            <Icon icon="lucide:triangle-alert" class="size-4 text-amber-600" />
            <AlertDescription class="text-amber-700 dark:text-amber-400">
              This user will have no listing access. They won't see any properties in their dashboard.
            </AlertDescription>
          </Alert>

          <div class="flex items-center justify-between rounded-lg border p-3">
            <div class="space-y-0.5">
              <Label for="user-active" class="text-sm">Active</Label>
              <p class="text-xs text-muted-foreground">
                Inactive users can't sign in or receive assignments.
              </p>
            </div>
            <Switch
              id="user-active"
              :model-value="form.status === 'active'"
              @update:model-value="(v) => form.status = v ? 'active' : 'inactive'"
            />
          </div>
        </section>
      </div>

      <SheetFooter class="border-t px-6 py-4 flex-row justify-end gap-2">
        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button :disabled="!form.name.trim() || !form.email.trim() || !form.roleId" @click="handleSave">
          {{ isEdit ? 'Save changes' : 'Add user' }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
```

- [ ] **Step 2: Verify the file compiles**

- [ ] **Step 3: Commit**

```bash
git add app/components/users/UserDetailSheet.vue
git commit -m "feat(users): add UserDetailSheet for create/edit/view"
```

---

## Task 11: Create RoleDetailSheet component

**Files:**
- Create: `app/components/users/RoleDetailSheet.vue`

- [ ] **Step 1: Create the file**

```vue
<!-- app/components/users/RoleDetailSheet.vue -->
<script setup lang="ts">
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '~/components/ui/sheet'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'
import { Input as TimeInput } from '~/components/ui/input'
import { cn } from '@/lib/utils'
import PermissionMatrix from './PermissionMatrix.vue'
import { useRoles } from '~/composables/useRoles'
import type { Role, RoleId, WeekDay } from '~/components/users/data/roles'
import { WEEK_DAYS } from '~/components/users/data/roles'
import { defaultPerms, type ModulePermissions, type PermissionModule } from '~/components/users/data/permissions'

interface Props {
  open: boolean
  roleId?: RoleId
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [role: Role]
}>()

const { getRole, updateRole, resetRoleToDefaults } = useRoles()

const editingRole = computed(() => props.roleId ? getRole(props.roleId) : undefined)

// Working copy of role
const draft = ref<Role | null>(null)

watch(() => [props.open, props.roleId], () => {
  if (props.open && editingRole.value) {
    draft.value = JSON.parse(JSON.stringify(editingRole.value))
  }
}, { immediate: true })

function toggleDay(day: WeekDay) {
  if (!draft.value) return
  const set = new Set(draft.value.workingHours.days)
  if (set.has(day)) set.delete(day)
  else set.add(day)
  draft.value.workingHours.days = Array.from(set) as WeekDay[]
}

function setPermissions(next: Record<PermissionModule, ModulePermissions>) {
  if (!draft.value) return
  draft.value.defaultPermissions = next
}

function handleSave() {
  if (!draft.value) return
  updateRole(draft.value.id, {
    name: draft.value.name,
    description: draft.value.description,
    workingHours: draft.value.workingHours,
    defaultPermissions: draft.value.defaultPermissions,
  })
  emit('saved', draft.value)
  emit('update:open', false)
}

function handleReset() {
  if (!draft.value) return
  resetRoleToDefaults(draft.value.id)
  const fresh = getRole(draft.value.id)
  if (fresh) draft.value = JSON.parse(JSON.stringify(fresh))
}
</script>

<template>
  <Sheet v-if="draft" :open="open" @update:open="(v) => emit('update:open', v)">
    <SheetContent side="right" class="w-full sm:max-w-5xl p-0 flex flex-col">
      <SheetHeader class="px-6 pt-6 pb-4">
        <SheetTitle>{{ draft.name }}</SheetTitle>
        <SheetDescription>
          Edit role metadata, working hours, and default permissions. Changes apply to new users assigned this role.
        </SheetDescription>
      </SheetHeader>

      <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 px-6 pb-6">
          <!-- Left: role metadata -->
          <div class="space-y-5">
            <div class="space-y-1.5">
              <Label for="role-name">Role name</Label>
              <Input id="role-name" v-model="draft.name" />
            </div>

            <div class="space-y-1.5">
              <Label for="role-desc">Description</Label>
              <Textarea
                id="role-desc"
                v-model="draft.description"
                rows="4"
                class="resize-none"
              />
            </div>

            <div class="space-y-2">
              <Label>Working hours</Label>
              <ToggleGroup
                :model-value="draft.workingHours.scheduleType"
                type="single"
                class="justify-start"
                @update:model-value="(v) => draft!.workingHours.scheduleType = (v as 'flexible' | 'fixed')"
              >
                <ToggleGroupItem value="flexible">
                  Flexible
                </ToggleGroupItem>
                <ToggleGroupItem value="fixed">
                  Fixed
                </ToggleGroupItem>
              </ToggleGroup>

              <div v-if="draft.workingHours.scheduleType === 'fixed'" class="grid grid-cols-2 gap-2">
                <div class="space-y-1">
                  <Label for="role-start" class="text-xs">Start</Label>
                  <TimeInput id="role-start" type="time" v-model="draft.workingHours.startTime" />
                </div>
                <div class="space-y-1">
                  <Label for="role-end" class="text-xs">End</Label>
                  <TimeInput id="role-end" type="time" v-model="draft.workingHours.endTime" />
                </div>
              </div>

              <div class="flex flex-wrap gap-1">
                <button
                  v-for="d in WEEK_DAYS"
                  :key="d"
                  type="button"
                  :class="cn(
                    'px-2.5 py-1 rounded-full border text-xs font-medium transition-colors',
                    draft.workingHours.days.includes(d)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-muted',
                  )"
                  @click="toggleDay(d)"
                >
                  {{ d.slice(0, 3) }}
                </button>
              </div>
            </div>

            <Button variant="outline" class="w-full" @click="handleReset">
              <Icon icon="lucide:rotate-ccw" class="mr-2 size-4" />
              Reset to defaults
            </Button>
          </div>

          <!-- Right: permission matrix -->
          <div>
            <PermissionMatrix
              :permissions="draft.defaultPermissions"
              @update:permissions="setPermissions"
            />
          </div>
        </div>
      </div>

      <SheetFooter class="border-t px-6 py-4 flex-row justify-end gap-2">
        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button @click="handleSave">
          Save changes
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
```

- [ ] **Step 2: Verify the file compiles**

Note: If `defaultPerms` isn't imported or unused, remove the import.

- [ ] **Step 3: Commit**

```bash
git add app/components/users/RoleDetailSheet.vue
git commit -m "feat(users): add RoleDetailSheet for editing role metadata and permissions"
```

---

## Task 12: Create UsersTable component

**Files:**
- Create: `app/components/users/UsersTable.vue`

- [ ] **Step 1: Create the file**

```vue
<!-- app/components/users/UsersTable.vue -->
<script setup lang="ts">
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Switch } from '~/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { cn } from '@/lib/utils'
import { useUsers } from '~/composables/useUsers'
import { useRoles } from '~/composables/useRoles'
import { allProperties } from '~/components/listings/data/listings'
import type { User } from '~/components/users/data/users'
import type { RoleId } from '~/components/users/data/roles'
import Icon from '~/components/ui/icon/Icon.vue'

interface Props {
  onEdit?: [user: User]
}

defineProps<Props>()
const emit = defineEmits<{
  edit: [user: User]
}>()

const { users, toggleActive, deleteUser, getUser } = useUsers()
const { roles, getRole } = useRoles()

// Filters
const search = ref('')
const roleFilter = ref<string>('all')
const listingFilter = ref<string>('all')
const statusFilter = ref<string>('all')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return users.value.filter((u) => {
    if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
    if (roleFilter.value !== 'all' && u.roleId !== roleFilter.value) return false
    if (listingFilter.value !== 'all' && !u.listingIds.includes(listingFilter.value)) return false
    if (statusFilter.value !== 'all' && u.status !== statusFilter.value) return false
    return true
  })
})

function getListingNamesFor(user: User): { name: string, id: string }[] {
  return user.listingIds
    .map(id => allProperties.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map(p => ({ name: p.name, id: p.id }))
}

function handleDelete(user: User) {
  if (confirm(`Delete user "${user.name}"? This cannot be undone.`)) {
    deleteUser(user.id)
  }
}
</script>

<template>
  <div class="space-y-3">
    <!-- Filter bar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative flex-1 min-w-48 max-w-sm">
        <Icon icon="lucide:search" class="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input v-model="search" placeholder="Search by name or email..." class="pl-8" />
      </div>

      <Select v-model="roleFilter">
        <SelectTrigger class="w-44">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All roles
          </SelectItem>
          <SelectItem v-for="r in roles" :key="r.id" :value="r.id">
            {{ r.name }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="listingFilter">
        <SelectTrigger class="w-44">
          <SelectValue placeholder="Listing" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All listings
          </SelectItem>
          <SelectItem v-for="p in allProperties" :key="p.id" :value="p.id">
            {{ p.name }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="statusFilter">
        <SelectTrigger class="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All status
          </SelectItem>
          <SelectItem value="active">
            Active
          </SelectItem>
          <SelectItem value="inactive">
            Inactive
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Table -->
    <div class="rounded-md border overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th class="text-left font-medium px-4 py-3">
              User
            </th>
            <th class="text-left font-medium px-4 py-3">
              Role
            </th>
            <th class="text-left font-medium px-4 py-3">
              Listings
            </th>
            <th class="text-left font-medium px-4 py-3">
              Status
            </th>
            <th class="text-right font-medium px-4 py-3 w-12">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="u in filtered"
            :key="u.id"
            class="border-t hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <Avatar class="size-9">
                  <AvatarFallback class="bg-primary/10 text-primary text-xs">
                    {{ u.initials }}
                  </AvatarFallback>
                </Avatar>
                <div class="min-w-0">
                  <div class="font-medium truncate">
                    {{ u.name }}
                  </div>
                  <div class="text-xs text-muted-foreground truncate">
                    {{ u.email }}
                  </div>
                </div>
              </div>
            </td>

            <td class="px-4 py-3">
              <Badge variant="secondary">
                {{ getRole(u.roleId)?.name ?? 'Unknown' }}
              </Badge>
            </td>

            <td class="px-4 py-3">
              <div v-if="u.listingIds.length === 0" class="inline-flex items-center gap-1 text-xs text-muted-foreground italic">
                <Icon icon="lucide:globe" class="size-3" />
                All listings
              </div>
              <div v-else class="flex flex-wrap gap-1">
                <Badge
                  v-for="(p, i) in getListingNamesFor(u).slice(0, 2)"
                  :key="p.id"
                  variant="outline"
                  class="text-xs"
                >
                  {{ p.name }}
                </Badge>
                <Badge v-if="getListingNamesFor(u).length > 2" variant="outline" class="text-xs">
                  +{{ getListingNamesFor(u).length - 2 }}
                </Badge>
              </div>
            </td>

            <td class="px-4 py-3">
              <Switch
                :model-value="u.status === 'active'"
                @update:model-value="() => toggleActive(u.id)"
              />
            </td>

            <td class="px-4 py-3 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="size-8">
                    <Icon icon="lucide:more-horizontal" class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="emit('edit', u)">
                    <Icon icon="lucide:pencil" class="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="toggleActive(u.id)">
                    <Icon :icon="u.status === 'active' ? 'lucide:user-x' : 'lucide:user-check'" class="mr-2 size-4" />
                    {{ u.status === 'active' ? 'Deactivate' : 'Activate' }}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive" @click="handleDelete(u)">
                    <Icon icon="lucide:trash-2" class="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>

          <tr v-if="filtered.length === 0">
            <td colspan="5" class="px-4 py-12 text-center text-sm text-muted-foreground">
              <div class="flex flex-col items-center gap-2">
                <Icon icon="lucide:users-round" class="size-8 opacity-50" />
                <p v-if="users.length === 0">
                  No users yet — add your first team member.
                </p>
                <p v-else>
                  No users match your filters.
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="text-xs text-muted-foreground">
      Showing {{ filtered.length }} of {{ users.length }} users
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify the file compiles**

- [ ] **Step 3: Commit**

```bash
git add app/components/users/UsersTable.vue
git commit -m "feat(users): add UsersTable with filters and row actions"
```

---

## Task 13: Create RolesGrid component

**Files:**
- Create: `app/components/users/RolesGrid.vue`

- [ ] **Step 1: Create the file**

```vue
<!-- app/components/users/RolesGrid.vue -->
<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { useRoles } from '~/composables/useRoles'
import { useUsers } from '~/composables/useUsers'
import type { Role, RoleId, WeekDay } from '~/components/users/data/roles'
import Icon from '~/components/ui/icon/Icon.vue'

defineEmits<{
  edit: [role: Role]
}>()

const { roles } = useRoles()
const { userCountByRole } = useUsers()

function hoursChip(wh: Role['workingHours']): string {
  if (wh.scheduleType === 'flexible') return 'Flexible'
  if (!wh.startTime || !wh.endTime) return 'Fixed'
  return `${wh.startTime} – ${wh.endTime}`
}

function daysChip(days: WeekDay[]): string {
  const order: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  if (days.length === 7) return 'Mon–Sun'
  if (days.length === 5 && order.slice(0, 5).every(d => days.includes(d))) return 'Mon–Fri'
  if (days.length === 6 && order.slice(0, 6).every(d => days.includes(d))) return 'Mon–Sat'
  return days.map(d => d.slice(0, 3)).join(', ')
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    <Card
      v-for="role in roles"
      :key="role.id"
      class="flex flex-col hover:shadow-md transition-shadow"
    >
      <CardHeader class="pb-3">
        <div class="flex items-start justify-between gap-2">
          <CardTitle class="text-base">
            {{ role.name }}
          </CardTitle>
          <Badge variant="outline" class="shrink-0">
            {{ userCountByRole[role.id] ?? 0 }} {{ (userCountByRole[role.id] ?? 0) === 1 ? 'user' : 'users' }}
          </Badge>
        </div>
      </CardHeader>
      <CardContent class="flex-1 flex flex-col gap-4 pt-0">
        <p class="text-sm text-muted-foreground line-clamp-2">
          {{ role.description }}
        </p>

        <div class="flex flex-wrap gap-1.5 mt-auto">
          <Badge variant="secondary" class="text-xs">
            <Icon :icon="role.workingHours.scheduleType === 'flexible' ? 'lucide:clock-4' : 'lucide:clock'" class="mr-1 size-3" />
            {{ hoursChip(role.workingHours) }}
          </Badge>
          <Badge variant="secondary" class="text-xs">
            <Icon icon="lucide:calendar" class="mr-1 size-3" />
            {{ daysChip(role.workingHours.days) }}
          </Badge>
        </div>

        <Button variant="outline" size="sm" class="w-full" @click="$emit('edit', role)">
          <Icon icon="lucide:pencil" class="mr-2 size-4" />
          Edit
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
```

- [ ] **Step 2: Verify the file compiles**

- [ ] **Step 3: Commit**

```bash
git add app/components/users/RolesGrid.vue
git commit -m "feat(users): add RolesGrid with role cards and user counts"
```

---

## Task 14: Create the /users page

**Files:**
- Create: `app/pages/users.vue`

- [ ] **Step 1: Create the file**

```vue
<!-- app/pages/users.vue -->
<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import UsersTable from '~/components/users/UsersTable.vue'
import UserDetailSheet from '~/components/users/UserDetailSheet.vue'
import RolesGrid from '~/components/users/RolesGrid.vue'
import RoleDetailSheet from '~/components/users/RoleDetailSheet.vue'
import { useUsers } from '~/composables/useUsers'
import { useRoles } from '~/composables/useRoles'
import type { User } from '~/components/users/data/users'
import type { Role, RoleId } from '~/components/users/data/roles'
import Icon from '~/components/ui/icon/Icon.vue'

definePageMeta({
  layout: 'default',
})

const { totalCount, activeUsers, inactiveUsers } = useUsers()
const { roles } = useRoles()

// Sheet state
const userSheetOpen = ref(false)
const editingUserId = ref<string | undefined>(undefined)

const roleSheetOpen = ref(false)
const editingRoleId = ref<RoleId | undefined>(undefined)

function openAddUser() {
  editingUserId.value = undefined
  userSheetOpen.value = true
}

function openEditUser(user: User) {
  editingUserId.value = user.id
  userSheetOpen.value = true
}

function openEditRole(role: Role) {
  editingRoleId.value = role.id
  roleSheetOpen.value = true
}
</script>

<template>
  <ClientOnly>
    <div class="space-y-6 p-6">
      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div class="space-y-1">
          <h1 class="text-2xl font-bold tracking-tight">
            Users
          </h1>
          <p class="text-sm text-muted-foreground">
            Manage your team — create users, assign roles and listings.
          </p>
        </div>
        <Button @click="openAddUser">
          <Icon icon="lucide:plus" class="mr-2 size-4" />
          Add user
        </Button>
      </div>

      <!-- KPI strip -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent class="p-4">
            <div class="text-xs text-muted-foreground uppercase tracking-wide">
              Total users
            </div>
            <div class="text-2xl font-bold mt-1">
              {{ totalCount }}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-xs text-muted-foreground uppercase tracking-wide">
              Active
            </div>
            <div class="text-2xl font-bold mt-1 text-green-600">
              {{ activeUsers.length }}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-xs text-muted-foreground uppercase tracking-wide">
              Inactive
            </div>
            <div class="text-2xl font-bold mt-1 text-muted-foreground">
              {{ inactiveUsers.length }}
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Tabs -->
      <Tabs default-value="users" class="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Icon icon="lucide:users-round" class="mr-2 size-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Icon icon="lucide:shield-check" class="mr-2 size-4" />
            Roles
            <Badge variant="secondary" class="ml-2">
              {{ roles.length }}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" class="space-y-4">
          <UsersTable @edit="openEditUser" />
        </TabsContent>

        <TabsContent value="roles">
          <RolesGrid @edit="openEditRole" />
        </TabsContent>
      </Tabs>
    </div>

    <!-- Sheets -->
    <UserDetailSheet
      v-model:open="userSheetOpen"
      :user-id="editingUserId"
    />
    <RoleDetailSheet
      v-model:open="roleSheetOpen"
      :role-id="editingRoleId"
    />

    <template #fallback>
      <div class="space-y-6 p-6">
        <Skeleton class="h-9 w-48" />
        <Skeleton class="h-4 w-72" />
        <Skeleton class="h-24 w-full" />
        <Skeleton class="h-64 w-full" />
      </div>
    </template>
  </ClientOnly>
</template>
```

- [ ] **Step 2: Verify the page loads**

Run: `pnpm dev` and visit `/users`
Expected: Page loads with KPI cards, Users tab active, table renders 8 seed users

- [ ] **Step 3: Commit**

```bash
git add app/pages/users.vue
git commit -m "feat(users): add /users page with Users + Roles tabs"
```

---

## Task 15: Add Users nav entry to sidebar

**Files:**
- Modify: `app/constants/menus.ts`

- [ ] **Step 1: Add the entry**

In the **General** section (after `Listings` and before `Review Hub`), add:

```ts
{
  title: 'Users',
  icon: 'i-lucide-users-round',
  link: '/users',
  new: true,
},
```

The full block becomes:

```ts
items: [
  { title: 'Home', icon: 'i-lucide-home', link: '/' },
  { title: 'Email', icon: 'i-lucide-mail', link: '/email' },
  { title: 'Inbox', icon: 'i-lucide-inbox', link: '/inbox', new: true },
  { title: 'Tasks', icon: 'i-lucide-calendar-check-2', link: '/tasks' },
  { title: 'Cleaning Calendar', icon: 'i-lucide-calendar-range', link: '/cleaning-calendar' },
  { title: 'Operations Calendar', icon: 'i-lucide-calendar-days', link: '/operations-calendar', new: true },
  { title: 'Upsells', icon: 'i-lucide-tag', link: '/upsells', new: true },
  { title: 'Inventory', icon: 'i-lucide-package', link: '/inventory', new: true },
  { title: 'Procurement', icon: 'i-lucide-shopping-cart', link: '/procurement', new: true },
  { title: 'Listings', icon: 'i-lucide-building', link: '/listings', new: true },
  { title: 'Users', icon: 'i-lucide-users-round', link: '/users', new: true },
  { title: 'Review Hub', icon: 'i-lucide-message-square-text', link: '/reviews', new: true },
],
```

- [ ] **Step 2: Verify the sidebar shows Users**

Run: `pnpm dev` and reload any page
Expected: "Users" appears in the General section of the sidebar

- [ ] **Step 3: Commit**

```bash
git add app/constants/menus.ts
git commit -m "feat(users): add Users entry to General sidebar nav"
```

---

## Task 16: Manual QA + final commit

**Files:** none

- [ ] **Step 1: Full manual flow**

Visit `/users` and verify each flow:

1. **Users tab loads** — 8 seed users visible in table
2. **Add user** — click "+ Add user", fill name "Test User", email "test@elev8.io", select a role, leave listings empty → yellow warning shows. Add a listing → warning disappears. Save → table updates with new user, row visible at top.
3. **Edit user** — click row dropdown → Edit → change role → Save → row badge updates.
4. **Toggle active** — click Switch on a row → status updates immediately.
5. **Delete user** — click row dropdown → Delete → confirm dialog → row disappears.
6. **Filters work** — search "Komang" → 1 row; role filter → filters correctly.
7. **Persistence** — refresh page → changes persist (localStorage).
8. **Roles tab loads** — 16 role cards visible with descriptions, working hours chips, user counts.
9. **Edit role** — click Edit on "Housekeeping" → sheet opens with name/desc/working hours/permission matrix. Toggle a permission checkbox. Click Save. Reopen → change persists.
10. **Reset to defaults** — Edit a role → click "Reset to defaults" → all fields revert to seed values.
11. **Mobile column** — both Mobile View and Mobile Edit columns show lock icons with "Mobile app coming soon" tooltip.
12. **Validation** — Add user with empty name → Save disabled. Add user with bad email → inline error. Add user with duplicate email → inline error.

- [ ] **Step 2: Final commit (if any cleanup needed)**

```bash
git status  # see if anything uncommitted
# If anything was changed during QA:
git add -A
git commit -m "chore(users): cleanup from QA pass"
```

---

## Summary of what this plan delivers

- `/users` page with KPI cards + Users/Roles tabs
- Full CRUD for users with personal info, role, listing assignment
- 16 roles with editable working hours and per-module permissions
- Mobile App columns locked with "coming soon" tooltip
- All state persisted via localStorage
- Wrapped in `<ClientOnly>` to avoid SSR hydration mismatches
- Sidebar entry under General
- 8 seed users + 16 seed roles with realistic data
- 11 new files, 1 modified file (`menus.ts`)
- ~1,500 lines of new code

## Out of scope (deferred to v2)

- Permission enforcement on other modules
- User invitations / email flow
- Mobile app parity
- Salary editing
- Audit log for user/role changes
- Bulk operations
- Role deletion / creation