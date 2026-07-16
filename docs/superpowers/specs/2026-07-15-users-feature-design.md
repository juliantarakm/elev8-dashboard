# Users & Roles Feature — Design Spec

**Date**: 2026-07-15
**Status**: Draft (awaiting user review)
**Branch**: `task-4-intent-resolver`

## 1. Overview

Add a tenant-side **Users** feature to the Elev8 dashboard. Tenants can:

- Create users (team members) with personal info, role, and listing assignments
- Manage **16 system-defined roles** with editable working hours and per-module permissions
- View users assigned per listing

This is a **UI + state-only v1** — no real auth, no permission enforcement on other modules, no invitations. The data layer is fully reactive and persisted to `localStorage`, so the seed/structure is ready to wire into enforcement in v2.

## 2. Navigation Placement

Top-level route in the **General** section of the sidebar:

```ts
// app/constants/menus.ts (add to General section)
{
  title: 'Users',
  icon: 'i-lucide-users-round',
  link: '/users',
  new: true,
}
```

The page has two tabs — **Users** and **Roles** — under a single `/users` route. Roles does NOT get its own top-level nav entry.

## 3. Data Model

### 3.1 Permission types — `app/components/users/data/permissions.ts`

```ts
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
  mobileView: boolean   // always false in v1 (read-only future)
  mobileEdit: boolean   // always false in v1
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
```

### 3.2 Role type — `app/components/users/data/roles.ts`

```ts
export type RoleId =
  | 'role-admin' | 'role-general-manager' | 'role-listing-manager'
  | 'role-guest-experience-manager' | 'role-quality-manager' | 'role-back-office'
  | 'role-finance-hr' | 'role-housekeeping-manager'
  | 'role-housekeeping' | 'role-gardener' | 'role-pool' | 'role-engineering'
  | 'role-electrician' | 'role-it-team' | 'role-laundry' | 'role-owner'

export type WeekDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

export interface WorkingHours {
  scheduleType: 'flexible' | 'fixed'
  startTime?: string  // 'HH:MM', required if fixed
  endTime?: string    // 'HH:MM', required if fixed
  days: WeekDay[]
}

export interface Role {
  id: RoleId
  name: string
  description: string
  workingHours: WorkingHours
  defaultPermissions: Record<PermissionModule, ModulePermissions>
}
```

### 3.3 User type — `app/components/users/data/users.ts`

```ts
export type PreferredLanguage = 'en' | 'de' | 'fr' | 'id' | 'es' | 'it' | 'pt' | 'nl'

export interface User {
  id: string
  // Personal info
  name: string
  phone: string                  // free-form like '41768165541'
  preferredLanguage: PreferredLanguage
  email: string
  employeeNumber: string
  // Salary (display-only)
  monthlySalaryAmount: number    // IDR
  workingDaysPerMonth: number
  hoursPerDay: number
  // Role + scope
  roleId: RoleId
  listingIds: string[]           // empty = tenant-wide (Admin-style)
  // Meta
  status: 'active' | 'inactive'
  avatarUrl?: string
  initials: string               // computed for Avatar fallback
  createdAt: string              // ISO
  updatedAt: string              // ISO
}
```

## 4. Default Roles (16 total)

All 16 roles seeded with the description and working hours from the user's spec, plus sensible default permissions. Each role's default permissions can be tuned on the Roles tab; a "Reset to defaults" button restores the seed values.

| Role | Working hours | Default access |
|---|---|---|
| **Admin** | Flexible · Mon–Sun | All modules view + edit, including settings |
| **General Manager** | Flexible · Mon–Sun | All modules view + edit except settings (view only) |
| **Listing Manager** | Flexible · Mon–Sun | Listings + reservations + reviews full; inbox/finance view only |
| **Guest Experience Manager** | Flexible · Mon–Sun | Inbox + reservations + reviews full; listings view only |
| **Quality Manager** | 10:00–18:00 · Mon–Fri | Reviews + operations + listings view; tasks view + edit |
| **Back Office** | 08:00–17:00 · Mon–Fri | Reports + tasks + settings view; no edit |
| **Finance/HR** | 10:00–18:00 · Mon–Fri | Finance + reports + settings full; other modules view only |
| **Housekeeping Manager** | 10:00–18:00 · Mon–Fri | Cleaning + tasks + operations + listings full; settings view |
| **Housekeeping** | 10:00–18:00 · Mon–Sun | Cleaning + tasks view; listings view |
| **Gardener** | 10:00–18:00 · Mon–Fri | Tasks + operations view; listings view |
| **Pool** | 10:00–18:00 · Mon–Fri | Tasks + operations view; listings view |
| **Electrician** | 10:00–18:00 · Mon–Fri | Tasks + operations view; listings view |
| **IT Team** | Flexible · Mon–Sat | Settings + tasks view; no edit |
| **Engineering** | 10:00–18:00 · Mon–Fri | Tasks + operations + listings full; inbox view |
| **Laundry** | 10:00–18:00 · Mon–Fri | Tasks + operations view; listings view |
| **Owner** | Flexible · Mon–Fri | All modules view only (including finance + reservations) |

## 5. Components

### 5.1 Page shell — `app/pages/users.vue`

Two-tab layout:

```
<Tabs defaultValue="users">
  <TabsList>
    <TabsTrigger value="users">Users</TabsTrigger>
    <TabsTrigger value="roles">Roles</TabsTrigger>
  </TabsList>
  <TabsContent value="users"><UsersTabContent /></TabsContent>
  <TabsContent value="roles"><RolesTabContent /></TabsContent>
</Tabs>
```

Wrapped in `<ClientOnly>` with a `#fallback` skeleton (matches `app/pages/inbox.vue` pattern).

### 5.2 UsersTabContent
- Filter bar (search + role + listing + status)
- `<UsersTable>` TanStack table
- "+ Add user" primary button (top right)

### 5.3 `UsersTable.vue`
TanStack Table, columns:
1. **Avatar + Name** (initials fallback, Tooltip shows email)
2. **Role** (Badge, role-color coded)
3. **Listings** (chip list, max 2 + "+N more")
4. **Status** (Switch — active/inactive)
5. **Actions** (DropdownMenu: View / Edit / Deactivate / Delete)

### 5.4 `UserDetailSheet.vue`
Right-side Sheet (~640px wide), three sections:

**Section 1 — Personal Info** (`UserPersonalInfoForm.vue`):
- Name * (Input, required)
- Phone / WhatsApp (Input with country flag + dial code prefix)
- Preferred Language (Select: en/de/fr/id/es/it/pt/nl)
- Email (Input, validated)
- Employee Number (Input, optional)

**Section 2 — Salary** (`SalaryDisplay.vue`) — *read-only card*:
- Gray background, monospace IDR formatted amount
- "Monthly IDR 5,000,000 · 22 working days · 8 hours/day"
- Helper text: "Salary is managed in the HR module (coming soon)."

**Section 3 — Role & Listings**:
- Role (Select, single, required)
- Listing assignment (`UserAssignmentPicker.vue`):
  - Multi-select Popover with searchable checkbox list
  - Selected items shown as removable Badges below trigger
  - Empty + Admin → "All listings" badge (tenant-wide)
  - Empty + non-Admin → yellow warning + confirmation
- Active toggle (Switch)

**Footer**: Cancel / Save (primary, disabled until valid).

### 5.5 `UserAssignmentPicker.vue`
Popover + inner search Input + ScrollArea of custom-checkbox rows (per CLAUDE.md pattern for `useInbox` listing filter). Selected items use AND logic. Emits `update:modelValue`.

### 5.6 RolesTabContent
- `<RolesGrid>` — 3-column grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`) of role cards

### 5.7 `RolesGrid.vue` / role card
Each card:
- Role name (h3)
- Description (2-line clamp)
- Working hours chip ("Flexible · Mon–Sun" or "10:00–18:00 · Mon–Fri")
- User count Badge ("12 users")
- "Edit" button → opens `RoleDetailSheet`

### 5.8 `RoleDetailSheet.vue`
Right-side Sheet (~960px wide), two-column layout:

**Left column** (~360px) — Role metadata:
- Name (Input)
- Description (Textarea)
- Working Hours:
  - Schedule type (ToggleGroup: Flexible / Fixed)
  - If Fixed: Start time + End time pickers
  - Days: 7 pill toggles (Mon–Sun)
- "Reset to defaults" button at bottom

**Right column** — `PermissionMatrix.vue`:
- Table: rows = 16 modules, columns = `[Dashboard View | Dashboard Edit | Mobile View 🔒 | Mobile Edit 🔒]`
- Dashboard columns: custom checkbox (per CLAUDE.md anti-pattern — use `div @click` + custom visual, NOT reka-ui `<label>`)
- Mobile columns: locked gray checkboxes with Tooltip "Mobile app coming soon"

### 5.9 `PermissionMatrix.vue`
Props: `permissions: Record<PermissionModule, ModulePermissions>`, `readonly: boolean`. Emits `update:permissions` on every checkbox toggle.

## 6. Composables

### 6.1 `app/composables/useUsers.ts`

```ts
export function useUsers() {
  const users = useState<User[]>('tenant-users', () =>
    JSON.parse(JSON.stringify(seedUsers))
  )
  // Hydrate from localStorage on client mount
  // Save on every mutation (SSR-safe guarded by typeof window)

  function getUser(id: string): User | undefined
  function addUser(input: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'initials'>): User
  function updateUser(id: string, patch: Partial<User>): void  // spread syntax
  function deleteUser(id: string): void
  function toggleActive(id: string): void
  function setListingAssignments(userId: string, listingIds: string[]): void
  function getUsersForListing(listingId: string): User[]
  function getUsersByRole(roleId: RoleId): User[]

  const activeUsers = computed(() => users.value.filter(u => u.status === 'active'))
  const userCountByRole = computed<Record<RoleId, number>>(() => /* map */)
  const totalCount = computed(() => users.value.length)

  return { users, getUser, addUser, updateUser, deleteUser, toggleActive,
           setListingAssignments, getUsersForListing, getUsersByRole,
           activeUsers, userCountByRole, totalCount }
}
```

### 6.2 `app/composables/useRoles.ts`

```ts
export function useRoles() {
  const roles = useState<Role[]>('tenant-roles', () =>
    JSON.parse(JSON.stringify(defaultRoles))
  )

  function getRole(id: string): Role | undefined
  function updateRole(id: string, patch: Partial<Role>): void  // spread syntax
  function resetRoleToDefaults(id: RoleId): void
  function resetAllRolesToDefaults(): void

  return { roles, getRole, updateRole, resetRoleToDefaults, resetAllRolesToDefaults }
}
```

### 6.3 Mutation pattern (per CLAUDE.md)
```ts
// ✅ Spread (Vue reactivity)
users.value = users.value.map(u => u.id === id ? { ...u, ...patch } : u)

// ❌ Direct mutation (no reactivity)
const u = users.value.find(x => x.id === id)
if (u) u.name = 'new'  // bad
```

### 6.4 Persistence
- `localStorage['elev8-tenant-users']` — JSON serialized `User[]`
- `localStorage['elev8-tenant-roles']` — JSON serialized `Role[]`
- SSR-safe via `if (typeof window !== 'undefined')` guard
- Mirror the exact pattern used by `useWhatsApp` (lines 1-50) and `useSmartLock`

## 7. Reactive Flow

1. User opens `/users`
2. `useUsers` and `useRoles` hydrate from `localStorage` if present, else seed
3. Click "+ Add user" → opens `UserDetailSheet` (create mode)
4. Fill form → Save → `addUser()` mutates `users.value` (spread), localStorage updated
5. TanStack table re-renders automatically via Vue reactivity
6. Click role card → opens `RoleDetailSheet` → edit permissions → Save → `useRoles.updateRole()`

## 8. Edge Cases & Validation

| Case | Handling |
|---|---|
| Empty name | Inline error "Name is required"; Save disabled |
| Invalid email | Inline error "Invalid email format" |
| Duplicate email | Inline error "A user with this email already exists" |
| Phone validation | Optional — accept any non-empty string |
| Admin role + no listings | Allowed — shows "All listings" badge |
| Non-Admin + no listings | Yellow warning "User will have no listing access"; Save still works after confirmation |
| Delete user | Confirmation Dialog with warning (mock-only — no real session) |
| Role defaults edited | "Reset to defaults" button per role |
| Role delete | Roles are **never deletable** (only editable) |
| Initial load timing | `<ClientOnly>` wrapper on `/users` page |
| Currency formatting | `new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })` |
| Phone input UX | Country selector (Select with flag) + dial-code prefix display |
| Permission checkbox | Use `div @click` + custom visual (CLAUDE.md anti-pattern note) |

## 9. File Layout

```
app/
├── pages/
│   └── users.vue                    # Page shell with Tabs(Users/Roles)
├── components/users/
│   ├── UsersTable.vue               # TanStack table + filters + row actions
│   ├── UserDetailSheet.vue          # Right-side Sheet: create/edit/view
│   ├── UserPersonalInfoForm.vue     # Name/phone/lang/email/employee#
│   ├── SalaryDisplay.vue            # Display-only IDR summary card
│   ├── UserAssignmentPicker.vue     # Multi-select listings (Popover)
│   ├── RolesGrid.vue                # Grid of role cards
│   ├── RoleDetailSheet.vue          # Editable role working hours + permissions
│   ├── PermissionMatrix.vue         # Module × (view/edit) matrix
│   └── data/
│       ├── roles.ts                 # 16 roles + descriptions + working hours + default permissions
│       ├── permissions.ts           # PermissionModule enum + helpers
│       └── users.ts                 # User types + 8-10 mock users
└── composables/
    ├── useUsers.ts                  # CRUD + listing assignment, persisted
    └── useRoles.ts                  # Role config CRUD, persisted
```

## 10. Out of Scope (v1)

- **No permission enforcement** on other modules (stored only, displayed only)
- **No invitations / email flow** — users created directly without confirmation
- **No mobile app** — Mobile column is locked placeholder
- **No salary editing** — display only
- **No audit log** for user/role changes (could add in v2 via `usePlatformAudit` pattern)
- **No bulk operations** — single-row actions only
- **No role deletion** — roles are system-managed, only editable
- **No role creation** — 16 roles are seeded constants

## 11. Mock Data

**8 seed users**:
- Komang Juliantara (existing) — Guest Experience Manager · 4 listings
- Made Surya (existing) — Listing Manager · 6 listings
- Wayan Adi (existing) — Listing Manager · 4 listings
- Reto Wyss Test — Owner · all listings (matches the example in the spec request)
- Made Wirawan — General Manager · all listings
- Ni Putu Sari — Housekeeping Manager · 5 listings
- Ketut Antara — Housekeeping · 2 listings
- Gede Pratama — Pool · 3 listings

All seed users include personal info, salary placeholder (IDR 0/0/0), and listing assignments.

**16 seed roles** with descriptions + working hours from the user's spec text.

## 12. Reused Patterns (from CLAUDE.md)

- `useState` + `localStorage` (mirrors `useWhatsApp`, `useSmartLock`)
- `<ClientOnly>` wrapper (matches `inbox.vue`, `operations-calendar.vue`)
- `cn()` for class merging
- `<Tabs>`, `<Sheet>`, `<Dialog>`, `<Popover>` from `app/components/ui/`
- `Avatar` + `AvatarFallback` for initials
- Custom checkbox visual (`div @click`) — never wrap reka-ui `Checkbox` in `<label>`
- TanStack Table for the users table (matches `listings/index.vue`, `tasks.vue`)
- `flex-1 min-h-0` on scroll containers
- `lucide:users-round`, `lucide:shield-check` icons
- All `lucide:` icons via `@iconify-json/lucide` SVG mode (no CSS mode DOM reuse)

## 13. Success Criteria

1. Tenant can create/edit/delete users via the UI
2. Tenant can edit any of the 16 roles' working hours and default permissions
3. Users can be assigned to multiple listings
4. All state persists across page reloads via localStorage
5. Page loads without SSR hydration mismatch (verified via ClientOnly)
6. All shadcn-vue components used (no custom primitives)
7. Permission matrix reflects Dashboard view/edit; Mobile locked with tooltip
8. Roles grid shows correct user counts per role
9. Validation works for name, email, duplicate email
10. Salary displays formatted IDR with helper text