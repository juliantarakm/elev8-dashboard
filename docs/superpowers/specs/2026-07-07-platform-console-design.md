# Platform Console — Design Spec

> **Date**: 2026-07-07
> **Module**: Platform Console (`/platform-console/*`)
> **Status**: Draft (pending Finance + Engineering sign-off on Open Questions)
> **Author**: Juli (Product)
> **Source PRD**: `/Users/juli/Downloads/PRD-Platform-Console-Tenant-Management.md`
> **Depends on**: Promo Code module, Notification Center, Billing Engine, Nuxt 3 dashboard shell

---

## 1. Overview

Platform Console is a new internal-only surface that lets Elev8 staff (CS, Sales, Finance, Approvers, Admins) operate the platform *across* all tenants. It is explicitly separate from the tenant-facing "Admin" role and lives behind a separate staff-side auth/role tier.

This spec implements the PRD as a **fully mocked prototype** inside the existing Nuxt 3 dashboard. Real Stripe, real email, real audit-log infrastructure are deferred — all integrations are stubbed at the composable boundary so the UI is fully demoable end-to-end.

### Surface area

1. **Tenant Directory** — list + detail of every tenant with plan, status, usage, billing.
2. **Custom Pricing Override** — propose → approve → active → revoke/expire workflow on top of the existing Promo Code module.
3. **Broadcast Banner** — compose, target (all / segment / individual), schedule, preview, and retract in-app banners for tenants.
4. **Audit log + role/permission layer** — cross-cutting foundation that gates every action and records every read.

### Non-Goals (this phase)

- Reassigning a tenant's plan/package tier from Platform Console (stays tenant-initiated).
- Impersonation / "view as tenant" mode.
- Editing Stripe's base price catalog.
- Real Stripe API, real email delivery, real audit-log service.
- Stackable pricing overrides (V1 blocks a second override until revoke/expiry).
- Multi-language banner copy.

---

## 2. User Roles (Platform Console)

Distinct from tenant-side roles. These live in `useStaffAuth` and have **no bearing** on tenant-side permissions.

| Role | Real-world equivalent | Access summary |
|---|---|---|
| **Platform Viewer** | CS / Support | Tenant Directory read-only, no billing detail, no actions |
| **Platform Finance** | Sales / Finance | Full billing detail; can propose overrides (not self-approve) |
| **Platform Approver** | Finance Lead / Founder | + Approves/rejects overrides above threshold |
| **Platform Admin** | Ops Lead / Founder | + Retracts overrides; composes/retracts banners; manages role assignments |

### Permission matrix

| Action | Viewer | Finance | Approver | Admin |
|---|:-:|:-:|:-:|:-:|
| View Tenant Directory | ✓ | ✓ | ✓ | ✓ |
| View Tenant Detail — Billing tab | — | ✓ | ✓ | ✓ |
| View Tenant Detail — Pricing tab | — | ✓ | ✓ | ✓ |
| View Tenant Detail — Users / Activity tabs | ✓ | ✓ | ✓ | ✓ |
| Propose pricing override | — | ✓ | ✓ | ✓ |
| Approve / reject override (not own) | — | — | ✓ | ✓ |
| Retract active override | — | — | — | ✓ |
| Compose banner | — | — | — | ✓ |
| Retract live / scheduled banner | — | — | — | ✓ |
| View audit log | — | ✓ | ✓ | ✓ |
| Manage role assignments (Settings) | — | — | — | ✓ |

---

## 3. Architecture

### Route group + staff layout

Platform Console lives at `/platform-console/*` with its own layout (`platform-console.vue`). The existing tenant dashboard (`default.vue`) is untouched.

```
app/
├── layouts/
│   └── platform-console.vue          (NEW staff shell — uses StaffSidebar + StaffHeader)
├── pages/platform-console/
│   ├── index.vue                     (redirect → /tenants)
│   ├── tenants/
│   │   ├── index.vue                 (Directory list)
│   │   └── [id].vue                  (Detail with 4 tabs)
│   ├── broadcasts/
│   │   ├── index.vue                 (Banner list)
│   │   └── new.vue                   (Composer wizard)
│   ├── approvals/index.vue           (Pricing override approval queue)
│   ├── audit/index.vue               (Platform audit log + outbound email queue)
│   └── settings.vue                  (Role assignments)
├── components/platform-console/
│   ├── StaffSidebar.vue
│   ├── StaffHeader.vue
│   ├── RoleSwitcher.vue
│   ├── RoleGate.vue
│   ├── TenantDirectoryTable.vue
│   ├── TenantStatusBadge.vue
│   ├── TenantPlanBadge.vue
│   ├── TenantDetailHeader.vue
│   ├── TenantBillingTab.vue
│   ├── TenantPricingTab.vue
│   ├── TenantUsersTab.vue
│   ├── TenantActivityTab.vue
│   ├── ApplyOverrideDialog.vue
│   ├── OverrideApprovalCard.vue
│   ├── BannerComposer.vue
│   ├── BannerTargetingControl.vue
│   ├── BannerPreview.vue
│   ├── BannerCard.vue                (used in composer preview AND tenant dashboard)
│   ├── PlatformBannerSlot.vue        (renders into tenant dashboard layout)
│   ├── AuditLogTable.vue
│   └── data/
│       ├── tenants.ts
│       ├── pricing-overrides.ts
│       ├── banners.ts
│       └── staff.ts                  (Staff users + role helpers)
├── composables/
│   ├── useStaffAuth.ts
│   ├── useTenants.ts
│   ├── usePricingOverrides.ts
│   ├── usePlatformBanners.ts
│   └── usePlatformAudit.ts
└── plugins/
    └── platform-console.client.ts    (mounts scheduling/expiry sweep + RoleSwitcher init)
```

### Reuse from existing modules

- shadcn-vue UI primitives (Sheet, Dialog, Popover, Tabs, Stepper, TanStack Table, Form + zod)
- Design tokens (primary, destructive, muted-foreground, etc.) — no hardcoded colors
- `useNotifications` composable — for the in-app side of critical banner emails (synthetic entry)
- `usePromoCodes` composable — extended with one new optional join field (`internalOverrideId`)
- `useToast` (Sonner) — for action feedback
- `<ClientOnly>` SSR-hydration guard for TanStack tables with icon columns

---

## 4. Data Models

### 4.1 `Tenant`

```ts
type TenantStatus = 'active' | 'suspended' | 'churned' | 'switching'
type TenantPlan = 'per_booking' | 'per_property'
type PackageTier = 'starter' | 'growth' | 'pro' | 'enterprise'
type Region = 'id' | 'ch' | 'th' | 'pt' | 'other'

interface Tenant {
  id: string
  name: string
  logoText: string                // initials for avatar
  status: TenantStatus
  switchingToPlan?: TenantPlan    // present only during transition
  plan: TenantPlan
  packageTier: PackageTier
  hasChannelManager: boolean
  region: Region
  isInternal: boolean             // test/demo — flagged, excluded from rollups
  mrrUsd: number | null           // null for per_booking; 0 if churned
  quotaRemaining: number | null   // bookings left for per_booking; null for per_property
  quotaTotal: number | null
  activeUnits: number
  lastLoginAt: string
  createdAt: string
  contractEndDate?: string        // for per_property — used by override expiry guard
  billingCycleDay: number         // day of month (1–28)
  contactEmail: string
  contactName: string
  // Denormalized for table display:
  activeOverridesCount: number
  liveBannersCount: number
}
```

### 4.2 `PricingOverride`

```ts
type OverrideStatus = 'pending_approval' | 'active' | 'expired' | 'revoked' | 'rejected'
type DiscountType = 'percent' | 'fixed'

interface PricingOverride {
  id: string
  tenantId: string
  promoCodeId: string             // joins to PromoCode
  discountType: DiscountType
  value: number                   // % or fixed USD
  currency?: 'USD'                // only when discountType === 'fixed'
  reason: string                  // required, min 10 chars (enforced in form)
  proposedByStaffId: string
  proposedAt: string
  approvedByStaffId?: string
  approvedAt?: string
  rejectedAt?: string
  rejectionNote?: string
  revokedAt?: string
  revokedByStaffId?: string
  stripeCouponId?: string         // generated on approval, prefixed 'mock_coupon_'
  effectiveDate: string           // defaults to next billing cycle
  expiryDate?: string             // optional
  status: OverrideStatus
  queuedForSwitch?: boolean       // set when tenant is mid plan-switch (edge case 6.4)
}
```

### 4.3 `PlatformBanner`

```ts
type BannerSeverity = 'info' | 'warning' | 'critical'
type BannerStatus = 'scheduled' | 'live' | 'expired' | 'retracted'   // no 'draft' — composer always publishes on completion
type TargetScope = 'all' | 'segment' | 'individual'
type DismissalScope = 'account' | 'user'

interface PlatformBanner {
  id: string
  title: string                   // max 60 chars (form-enforced)
  body: string                    // max 200 chars (form-enforced)
  severity: BannerSeverity
  ctaLabel?: string
  ctaUrl?: string                 // validated URL when both CTA fields set
  targetScope: TargetScope
  targetFilter:
    | { scope: 'all' }
    | {
        scope: 'segment'
        planTypes?: TenantPlan[]
        tiers?: PackageTier[]
        regions?: Region[]
        hasChannelManager?: boolean
      }
    | { scope: 'individual'; tenantIds: string[] }
  visibleRoles: StaffRoleName[]   // tenant-side roles
  dismissible: boolean
  dismissalScope: DismissalScope
  startAt: string                 // ISO; 'now' or future
  endAt?: string                  // optional auto-expire
  status: BannerStatus
  createdByStaffId: string
  createdAt: string
  retractedAt?: string
  retractedByStaffId?: string
  retractionReason?: string
}

interface BannerDismissal {
  bannerId: string
  tenantId: string
  userId: string                  // only set when dismissalScope === 'user'
  dismissedAt: string
}
```

### 4.4 `PlatformAuditEntry`

```ts
type AuditAction =
  | 'view_billing' | 'view_pricing' | 'view_users' | 'view_activity'
  | 'override_proposed' | 'override_approved' | 'override_rejected' | 'override_revoked' | 'override_expired'
  | 'banner_created' | 'banner_scheduled' | 'banner_live' | 'banner_retracted' | 'banner_retracted_before_live' | 'banner_expired'
  | 'banner_target_excluded' | 'banner_email_sent'
  | 'role_changed' | 'login' | 'logout'

interface PlatformAuditEntry {
  id: string
  actorStaffId: string
  actorRole: StaffRole
  action: AuditAction
  targetType: 'tenant' | 'banner' | 'override' | 'system'
  targetId: string
  metadata?: Record<string, unknown>
  createdAt: string
}
```

---

## 5. Composables

### 5.1 `useStaffAuth`

```ts
const currentRole = useState<StaffRole>('staff-role', () => 'admin')  // persisted via watchEffect → localStorage
const approvalThreshold = {
  maxPercentWithoutApproval: 15,   // placeholder per PRD Open Q #1
  maxFixedUsdWithoutApproval: 50,  // placeholder per PRD Open Q #1
}

function can(action: PermissionAction): boolean { /* role matrix lookup */ }
function requiresApproval(discountType: DiscountType, value: number): boolean
function setRole(role: StaffRole): void

// Component: <RoleGate role="approver"> ... </RoleGate> — render only if can(action)
// Component: <RoleGate action="approve_override"> ... </RoleGate>
```

### 5.2 `useTenants`

```ts
const tenants = useState<Tenant[]>('platform-tenants')
const filteredTenants = computed(...)
const byId = (id) => tenants.value.find(...)
const statusCounts = computed(...)
function suspend(tenantId, reason) { /* updates status, audit log */ }
function markChurning(tenantId, targetPlan) { /* sets switchingToPlan, audit log */ }
function completePlanSwitch(tenantId) { /* clears switchingToPlan, applies queued overrides */ }
```

### 5.3 `usePricingOverrides`

```ts
const overrides = useState<PricingOverride[]>('pricing-overrides')
const byTenant = (tenantId) => overrides.value.filter(...)
const activeFor = (tenantId) => /* single active or undefined */  // stacking blocked V1
const hasActive = (tenantId) => boolean
const pendingApprovals = computed(...)  // status === 'pending_approval'

function propose(input): PricingOverride           // status → active or pending_approval
function approve(overrideId, approverStaffId): PricingOverride
function reject(overrideId, approverStaffId, note): PricingOverride
function revoke(overrideId, staffId): PricingOverride
function runExpirySweep(): PricingOverride[]       // expired based on expiryDate
function run7DayWarningSweep(): void                // pushes notification 7 days before expiry
```

### 5.4 `usePlatformBanners`

```ts
const banners = useState<PlatformBanner[]>('platform-banners')
const dismissals = useState<BannerDismissal[]>('banner-dismissals')

function resolveRecipients(banner): string[]                          // pure, given current tenants
function liveBannersForTenant(tenantId, userRole): PlatformBanner[]   // max 2, priority-sorted
function createBanner(input): PlatformBanner
function updateBanner(id, patch): PlatformBanner
function retractBanner(id, staffId, reason): PlatformBanner
function runSchedulingSweep(): { wentLive, expired }                  // called by plugin + interval
function dismiss(bannerId, tenantId, userId): void                    // respects dismissalScope
```

### 5.5 `usePlatformAudit`

```ts
const auditLog = useState<PlatformAuditEntry[]>('platform-audit-log')
const filtered = computed(...)

function log(action, targetType, targetId, metadata?): PlatformAuditEntry
function byTenant(tenantId): PlatformAuditEntry[]
function byActor(staffId): PlatformAuditEntry[]
```

### 5.6 Plugin (`platform-console.client.ts`)

On mount:
- Initialize `currentRole` from localStorage (default `'admin'`)
- Schedule a `setInterval` at 60s running `runSchedulingSweep()` + `runExpirySweep()` + `run7DayWarningSweep()`
- Clear interval on unmount

---

## 6. Module 1 — Tenant Directory

### 6.1 List page (`/platform-console/tenants`)

**`<TenantDirectoryTable>`** — TanStack table, wrapped in `<ClientOnly>` (SSR hydration safety per existing convention).

Columns:
| Column | Source | Component |
|---|---|---|
| Name | `name` + `logoText` avatar + "Internal" pill when `isInternal` | — |
| Plan | `plan` + `packageTier` + Switching badge if `switchingToPlan` | `TenantPlanBadge` |
| MRR / Quota | `mrrUsd` (per_property) or `quotaRemaining/quotaTotal` progress bar (per_booking) | — |
| Active units | `activeUnits` | — |
| Status | `status` | `TenantStatusBadge` |
| Last login | `lastLoginAt` (relative) | — |
| Live activity | `liveBannersCount` + `activeOverridesCount` chips | clickable → filters to detail tab |

Toolbar:
- Search (name, contact name, email) — debounced 200ms
- Plan filter (All · Per Booking · Per Property)
- Status filter (Active · Suspended · Churned · Switching)
- Tier multi-select Popover (reuses existing tag-filter pattern)
- Region multi-select Popover
- "Hide internal tenants" Switch (default ON)
- Sort: MRR ↓ (default) · Name A→Z · Last login ↓

Row click → `/platform-console/tenants/[id]`.

Footer: "X internal tenants hidden from rollups" when any are filtered out.

Permission: Viewer+.

### 6.2 Detail page (`/platform-console/tenants/[id]`)

**`<TenantDetailHeader>`** — name + Internal pill, plan badge + Switching badge if applicable, status badge, MRR/quota, last login, contact. Has a "View in tenant dashboard" link (visual only, disabled — out of scope).

Four tabs:

**Tab: Billing** (`TenantBillingTab.vue`) — Finance+
- Per_booking: quota progress bar, last refill date, next refill trigger (10% remaining)
- Per_property: package tier, contract end date, monthly cost, proration preview if mid-cycle
- Invoice history list (last 6 months, mock)
- **Mount writes audit entry** `view_billing` (per PRD Section 5)

**Tab: Pricing** (`TenantPricingTab.vue`) — Finance+
- Active override summary card (status, dates, value, reason, proposer, approver)
- "Apply Custom Pricing" button → `<ApplyOverrideDialog>`
- Override history list (proposed / active / expired / revoked / rejected) sorted newest first
- Apply button disabled if `hasActive(tenantId)` with tooltip "Revoke or wait for expiry"

**Tab: Users** (`TenantUsersTab.vue`) — Viewer+
- Read-only list of tenant's internal users: name, email, role, last active
- 6–12 mock users per tenant, mix of Admin / GM / Finance-HR / Housekeeping / etc.
- No actions — informational only

**Tab: Activity** (`TenantActivityTab.vue`) — Viewer+
- Chronological feed joined from `usePricingOverrides`, `usePlatformBanners`, `usePlatformAudit` filtered to this tenant
- Each entry: actor (staff user or "System"), timestamp, summary, link to related record
- Sortable newest first

### 6.3 Edge cases

| Situation | Behavior |
|---|---|
| Mid plan-switch (`switchingToPlan` set) | Directory row + detail header show `Switching → Per Property` amber badge next to current plan badge. Plan field never blank. |
| Internal test tenant (`isInternal: true`) | "Internal" pill on name; MRR column shows "—"; footer shows hidden count; excluded from rollups (filter default + visual) |
| Suspended tenant | Status destructive; Pricing tab Apply button visible but disabled with tooltip "Tenant is suspended — override blocked" |
| Churned tenant | Status destructive + dim row; override propose blocked entirely (Apply button hidden, Pricing tab shows explanatory note) |

---

## 7. Module 2 — Pricing Override

### 7.1 Apply Override dialog (`ApplyOverrideDialog.vue`)

Triggered from Tenant Pricing tab.

Form fields (Form + zod schema):
1. **Discount type** — RadioGroup: Percentage / Fixed amount
2. **Value** — NumberField, currency-aware when fixed
3. **Effective date** — DatePicker, defaults to next billing cycle (`tenant.billingCycleDay`)
4. **Expiry date** — DatePicker, optional
5. **Reason** — Textarea, required, min 10 chars, live counter

Below the form, live status box shows one of:
- ✓ Within threshold — will auto-apply on save (green)
- ⚠ Approval required — Finance will be notified (amber)
- ⚠ Expiry falls before contract end. Force-override requires Admin confirmation (amber, Admin only — checkbox to confirm)
- Tenant is suspended/churned — override blocked (red)
- An active override already exists — revoke first (red)

Submit:
- Under threshold + eligible → `propose()` returns `'active'`, toast.success, dialog closes
- Over threshold → `propose()` returns `'pending_approval'`, toast.info "Sent for approval", dialog closes
- Ineligible → button disabled

### 7.2 Approval queue (`/platform-console/approvals`)

Visible to: Approver, Admin.

KPI row: `X pending · Y approved this month · Z rejected this month`.

TanStack table of `pending_approval` overrides:
| Column | Source |
|---|---|
| Tenant | name + Internal pill |
| Discount | type + value |
| Reason | truncated + tooltip on hover |
| Proposed by | staff name + role badge |
| Proposed at | relative time |
| Actions | View · Approve · Reject |

Empty state: "No pending overrides".

`<OverrideApprovalCard>` opens in a Sheet on View — full detail + Approve/Reject buttons inline.
Approve/Reject require `AlertDialog` confirmation. Reject requires additional note (Textarea, min 5 chars).

Self-approval blocked: if `proposedByStaffId === currentStaffId`, Approve button disabled with tooltip "Cannot approve your own proposal".

On approve: `approve()` → status `'active'`, mock `stripe_coupon_id` generated (e.g. `mock_coupon_${nanoid(8)}`), linked `PromoCode` activated, audit entry written, toast.success, row removed from queue.

On reject: `reject()` → status `'rejected'` with note, audit entry written, toast.info to proposer, row removed.

### 7.3 Pricing tab integration

- Active override card: status, value, dates, reason, proposer, approver, Stripe coupon ID
  - Admin: "Revoke" button → confirmation → `revoke()`
  - Finance/Approver: read-only with note "Admin can revoke"
- History list: 8 mock historical overrides per tenant (mix of statuses). Each row clickable to read-only Sheet.

### 7.4 Edge cases

| Situation | Behavior |
|---|---|
| Override proposed while another active | Apply button disabled (covered in 7.1) |
| Override applied mid-cycle | Per-property proration rule applies; form shows "Proration preview: $X charged on next invoice" |
| Expiry before 1-year contract end | Blocked by default. Per-property: form checks `tenant.contractEndDate > expiryDate`; shows warning + Admin-only force-override checkbox |
| Tenant mid plan-switch | Override `propose()`d normally, flagged with `queuedForSwitch: true`; `useTenants.completePlanSwitch()` calls `applyQueuedOverride(id)` once switch completes |
| Discount silently applied (decrease) | No in-app/email; audit log only (per PRD Section 7) |
| 7-day expiry warning | `run7DayWarningSweep()` pushes notification to tenant's `useNotifications` queue using PRD Section 7 copy |

### 7.5 Promo Code integration

Per the brainstorming decision: separate `PricingOverride` entity with join field on `PromoCode`. The existing `PromoCode` type gains one new optional field:

```ts
interface PromoCode {
  // ... existing fields unchanged
  internalOverrideId?: string   // present when this promo code backs an internal override
}
```

On `propose()`: create a `PromoCode` (auto-generated code `OVERRIDE-{tenantId}-{nanoid(6)}`, non-public, `active: false`), set its `internalOverrideId` to the new `PricingOverride.id`, persist both.

On `approve()`: set the linked `PromoCode.active = true`, generate `stripe_coupon_id` on the override.

On `revoke()` / `runExpirySweep()`: set the linked `PromoCode.active = false`.

The existing `/promo-codes` page gets an "Internal only" filter chip that filters on `internalOverrideId != null`.

---

## 8. Module 3 — Broadcast Banner

### 8.1 Targeting control (`BannerTargetingControl.vue`)

Single Tabs component, three mutually exclusive modes:

**Tab 1: All tenants** — "This banner will be delivered to all tenants matching the role filter (X tenants currently match)". Count updates live as `visibleRoles` changes.

**Tab 2: Segment** — three multi-select Popovers (Plan types, Package tiers, Regions) + "With Channel Manager only" Switch. Live "X tenants match this segment" counter.

**Tab 3: Specific tenant(s)** — searchable multi-select Combobox of all tenants (avatar + name + plan badge), selected tenants as removable Badges above input, live "X tenants selected" counter.

Shared under all three tabs: `visibleRoles` multi-select Command list of all 16 tenant-side roles.

### 8.2 Composer (`/platform-console/broadcasts/new`) — 4-step wizard

Stepper pattern using `Stepper` shadcn primitive.

**Step 1: Compose**
- Title (Input, max 60 chars, live counter)
- Body (Textarea, max 200 chars, live counter)
- Severity (3-card selector: Info · Warning · Critical — color-coded with icons)
- CTA (optional): Label + URL (URL validated when both filled)
- Dismissible Switch (default ON)
- Dismissal scope RadioGroup: "Per account" (default) / "Per user" — only visible when Dismissible ON

**Step 2: Target**
- Full `<BannerTargetingControl>` + "Exclude internal test tenants" Switch (default ON)

**Step 3: Schedule**
- Publish: "Publish now" / "Schedule for later" (DatePicker + time)
- Auto-expire: Switch (default ON for info, OFF for critical). When ON: DatePicker, defaults to start + 7 days
- Live summary card showing the delivery window in human form

**Step 4: Preview**
- Sample tenant picker (Combobox, defaults to first matching tenant)
- `<BannerPreview>` rendering the same `<BannerCard>` markup used in tenant dashboard
- Below: "Visible to these roles: [Admin] [Finance/HR]" + "Delivered to: [tenant name + N others]"
- For Critical: extra "📧 Email will be sent to [N matching users]" red-tinted callout

On Publish: validate all steps, set status to `'live'` or `'scheduled'`, navigate to `/platform-console/broadcasts`, toast.success. Critical banners fire email trigger on live transition.

### 8.3 Banner list page (`/platform-console/broadcasts`)

TanStack table:
| Column | Source |
|---|---|
| Title | severity icon prefix + title |
| Severity badge | color-coded |
| Targeting summary | "All" / "Segment: Growth, ID" / "5 tenants" |
| Schedule | start → end + "Live now" pulse |
| Status badge | Scheduled · Live · Expired · Retracted |
| Recipient count | from `resolveRecipients()` |
| Actions | View · Edit (scheduled only) · Duplicate · Retract (Admin only, live/scheduled) |

Filters: Status · Severity · Search (title). KPI cards: Live now · Scheduled · Sent this month.

Empty state: "Create your first banner" → opens composer.

### 8.4 Tenant-side rendering

**`<PlatformBannerSlot>`** is added above the page content in `default.vue` tenant layout (Phase 1 — non-invasive add):

- Reads `usePlatformBanners().liveBannersForTenant(currentTenantId, currentUserRole)`
- Renders the top 2 as `<BannerCard>` components (stacked)
- Each card honors `dismissible` + `dismissalScope` via `usePlatformBanners().dismiss()`
- CTA button uses `window.open(ctaUrl)` for external URLs

**`<BannerCard>`** markup:
- Severity backgrounds: critical → destructive-tinted, warning → amber, info → primary-tinted
- Icon: `octagon-alert` / `triangle-alert` / `info`
- Title + body + optional CTA + dismiss ×
- Single component used by both composer preview AND tenant dashboard

### 8.5 Edge cases

| Situation | Behavior |
|---|---|
| Two banners live at once | `liveBannersForTenant()` returns max 2 sorted by priority; composer preview shows "Note: 2 banners already live — this will queue behind them" when relevant |
| Scheduled banner retracted | `retractBanner()` sets `'retracted'` immediately; never reaches tenant; audit entry `banner_retracted_before_live` |
| Targeted tenant churns mid-campaign | `useTenants` watcher re-runs `resolveRecipients` for all `scheduled|live` banners; audit entry `banner_target_excluded` |
| Tenant has zero matching roles | `liveBannersForTenant` returns empty — silent skip |

---

## 9. Cross-cutting Concerns

### 9.1 Audit log (`usePlatformAudit`)

- Append-only `useState('platform-audit-log')` seeded with ~30 mock entries
- Every action in `usePricingOverrides`, `usePlatformBanners`, and Billing/Pricing tab mounts calls `log()`
- `/platform-console/audit` page renders `<AuditLogTable>` (TanStack, filterable by actor / action / target / date range)
- Also shows an "Outbound email queue" panel listing any `banner_email_sent` entries with the would-be-recipient count, since real email isn't wired

### 9.2 Notifications

- Tenant-side: override expiry warnings push to `useNotifications` (subject: "Your custom rate ends on [date]")
- Staff-side: approval notifications toast via Sonner; no separate staff notification center (out of scope)
- Banner dismissals: stored in `BannerDismissal[]` (no toast needed)

### 9.3 Scheduling + expiry sweeps

- `platform-console.client.ts` plugin runs `runSchedulingSweep()`, `runExpirySweep()`, `run7DayWarningSweep()` every 60s
- Sweeps are idempotent — safe to run on every interval tick
- Each sweep logs audit entries for any state changes it causes

### 9.4 Role persistence

- `currentRole` stored in `localStorage` under key `elev8-platform-console-role`
- Plugin hydrates on mount; `RoleSwitcher` writes on change
- Default role: `'admin'` (so first-load demo is fully featured)

### 9.5 Banner slot in tenant layout

The `<PlatformBannerSlot>` is a minimal addition to `default.vue` (the existing tenant layout) — only renders content when the staff-mode composable has any banners for the current user. Existing pages unaffected when no banners exist.

---

## 10. Placeholder values for PRD Open Questions

These will be flagged in the spec body so the placeholder is easy to find and swap later.

| # | Open Question | Placeholder for V1 | Where to swap |
|---|---|---|---|
| 1 | Approval thresholds (% / $) | ≤15% OR ≤$50/mo auto-apply | `useStaffAuth.approvalThreshold` |
| 2 | Architecture | Gated route group inside existing Nuxt app (already built) | N/A |
| 3 | Audit logging service | `usePlatformAudit` composable, `useState('platform-audit-log')` | Replace with service call |
| 4 | Critical-banner email pipeline | Sonner toast + audit entry `banner_email_sent`; no real email | Wire to email provider |
| 5 | Stackable overrides | Blocked in V1 (per PRD non-goals) | Add `stackable: boolean` flag + UI |

---

## 11. Implementation Phasing

Each phase is independently demoable and ends with a verifiable checkpoint.

### Phase 1 — Foundation + Tenant Directory + Audit
- `useStaffAuth` + RoleSwitcher + RoleGate
- `usePlatformAudit` (with seed)
- `useTenants` + 10 mock tenants covering all statuses/plan types
- `layouts/platform-console.vue` + StaffSidebar + StaffHeader
- All `/platform-console/*` routes scaffolded with placeholder content
- Tenant Directory list + detail (all 4 tabs)
- Audit log page
- Role switcher fully working
- **Checkpoint**: switch roles, navigate tenants, verify Billing tab is hidden for Viewer

### Phase 2 — Pricing Override
- `usePricingOverrides` + 8 historical overrides per tenant (mock seed)
- Extend `PromoCode` with `internalOverrideId` join field
- Update `/promo-codes` with "Internal only" filter chip
- `ApplyOverrideDialog` with full form + live status box
- Approval queue at `/platform-console/approvals`
- Override history in Pricing tab
- Pricing tab integration (active card + history list)
- All edge cases from Section 7.4
- **Checkpoint**: switch Finance → propose 20% (pending_approval); switch Approver → approve; verify it appears as active in Pricing tab

### Phase 3 — Broadcast Banner
- `usePlatformBanners` + `usePlatformBannersDismissals` + 4 seed banners (mix of statuses)
- `BannerTargetingControl` with all three modes
- `BannerComposer` 4-step wizard
- Banner list page
- `<BannerCard>` (single component for preview + dashboard)
- `<PlatformBannerSlot>` injection in `default.vue` tenant layout
- Scheduling sweep + critical email trigger
- All edge cases from Section 8.5
- **Checkpoint**: compose Critical banner targeted to one tenant → verify it appears in their dashboard + audit shows `banner_email_sent`

---

## 12. Acceptance Criteria Cross-Walk (PRD Section 8)

### Tenant Directory
- ✓ Staff with Viewer+ see full directory — `useStaffAuth.can('view_directory')` gate on page
- ✓ Viewer cannot see Billing detail — tab hidden via `<RoleGate action="view_billing">`
- ✓ Every Billing/Pricing tab mount writes audit entry — `onMounted` in each tab component calls `usePlatformAudit().log()`

### Pricing Override
- ✓ Discount requires reason — zod schema `reason: z.string().min(10)`
- ✓ Over threshold requires approval — `requiresApproval()` short-circuits `propose()` to `'pending_approval'`
- ✓ Active override blocks second — `hasActive(tenantId)` gate on Apply button
- ✓ Expiry reverts to standard + 7-day warning — `runExpirySweep()` + `run7DayWarningSweep()`
- ✓ All actions logged — `propose`, `approve`, `reject`, `revoke`, expire-by-sweep each call `log()`

### Broadcast Banner
- ✓ Single targeting control, 3 modes — `<BannerTargetingControl>` Tabs
- ✓ `visible_roles[]` respected — filter in `liveBannersForTenant`
- ✓ Critical → email; Info/Warning → in-app only — branch on `severity === 'critical'` in scheduling sweep
- ✓ Scheduled banner retractable before live — `retractBanner()` short-circuits
- ✓ Max 2 banners, priority order — `liveBannersForTenant().slice(0, 2)` sorted by `priorityRank`

---

## 13. Files Created / Modified

### New files (~25)
- `app/layouts/platform-console.vue`
- `app/pages/platform-console/{index,settings}.vue`
- `app/pages/platform-console/tenants/{index,[id]}.vue`
- `app/pages/platform-console/broadcasts/{index,new}.vue`
- `app/pages/platform-console/approvals/index.vue`
- `app/pages/platform-console/audit/index.vue`
- `app/components/platform-console/*.vue` (~18 components, see Section 3)
- `app/components/platform-console/data/{tenants,pricing-overrides,banners,staff}.ts`
- `app/composables/{useStaffAuth,useTenants,usePricingOverrides,usePlatformBanners,usePlatformAudit}.ts`
- `app/plugins/platform-console.client.ts`

### Modified files (~4)
- `app/layouts/default.vue` — add `<PlatformBannerSlot>` above page content (Phase 3 only)
- `app/components/promo-code/data/promo-codes.ts` — add `internalOverrideId?: string` to `PromoCode`
- `app/pages/promo-codes/index.vue` — add "Internal only" filter chip (Phase 2)
- `app/constants/menus.ts` — add Platform Console entry in sidebar

---

## 14. Out of Scope (Confirmed)

- Real Stripe API (coupons created via mock function only)
- Real email delivery (critical-banner emails are Sonner toasts + audit entries)
- Impersonation / "view as tenant" mode
- Reassigning tenant plan/package tier from Platform Console
- Editing Stripe's base price catalog
- Stackable pricing overrides (V1)
- Multi-language banner copy
- Per-banner analytics / impression tracking
- Webhook / event-driven banner delivery
- Tenant self-service visibility into "your rate is custom due to override"

---

## 15. Dependencies on Existing Modules

- **Promo Code** (`usePromoCodes`) — extended with one new optional join field
- **Notification Center** (`useNotifications`) — receives synthetic tenant-side entries for override expiry warnings
- **Billing Engine** (`/billing` rules) — proration and contract-length logic reused for override timing
- **shadcn-vue primitives** — Sheet, Dialog, Popover, Tabs, Stepper, TanStack Table, Form + zod
- **Sonner toaster** — already configured in `app.vue`

---

## 16. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Placeholder thresholds (15% / $50) too aggressive or lax for real Finance team | Threshold config centralized in `useStaffAuth` — one-line swap |
| `PromoCode` extension breaks existing booking-widget flow | New field is **optional** with no default; existing widget code unaffected |
| Banner slot in `default.vue` causes SSR hydration mismatch | Wrap slot in `<ClientOnly>` (same convention as inbox/listings) |
| Sweep interval running every 60s on every page mount could leak timers | Plugin scopes the interval to app lifecycle, clears on `app:beforeMount` |
| Role switcher state shared across tabs could lead to confusion | `currentRole` is `useState` (per-request isolated) and persisted per browser tab via `localStorage` |
| Mock data confusion if seed changes between dev sessions | All mock seeds live in dedicated `data/*.ts` files with `import.meta.hot` reset for HMR |