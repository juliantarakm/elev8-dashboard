// Owner Portal permission composable.
//
// Owners see a portal that exposes two surfaces — a dashboard (live numbers
// for the properties they own) and a monthly statement (per-booking revenue
// and expense breakdown). This composable decides *which* of those surfaces
// each owner can see by storing a per-owner `OwnerPermissionConfig` snapshot.
//
// Two built-in templates cover most cases:
//   - `full_transparency`  → every field visible
//   - `financial_summary` → only net revenue, occupancy, ADR (dashboard) and
//                            commission summary, net payout (statement)
//
// Staff can flip individual fields afterwards — that marks the owner as
// templateId='custom' so future template edits don't trample the override.
//
// ⚠️  Snapshot semantics: applying a template copies the dashboard/statement
//     records into a fresh object. Later mutations to the source template
//     must NOT retroactively change already-saved owner configs (a real
//     staff workflow: someone iterates on a template during onboarding, but
//     owners who already accepted an invite must keep what they were given).

import type {
  OwnerDashboardField,
  OwnerPermissionConfig,
  OwnerPermissionTemplateId,
  OwnerStatementField,
} from '~/components/owners/data/owner-permissions'
import { mockOwnerPermissions } from '~/components/owners/data/owner-permissions'

// Re-export the domain types + seed so downstream consumers (UI tables,
// settings sheets) don't have to reach into `~/components/owners/data/...`.
export type {
  OwnerDashboardField,
  OwnerPermissionConfig,
  OwnerPermissionTemplateId,
  OwnerStatementField,
} from '~/components/owners/data/owner-permissions'
export { mockOwnerPermissions } from '~/components/owners/data/owner-permissions'

// --- Built-in permission templates -----------------------------------------
//
// These are the source-of-truth field maps that `applyTemplate` copies from.
// They are mutable plain objects — that lets tests prove the snapshot
// invariant by editing them in place and asserting the stored config is
// untouched. In the app they are read-only constants.

interface OwnerPermissionTemplate {
  id: Exclude<OwnerPermissionTemplateId, 'custom'>
  dashboard: Record<OwnerDashboardField, boolean>
  statement: Record<OwnerStatementField, boolean>
}

const allDashboardFieldsOn: Record<OwnerDashboardField, boolean> = {
  grossRevenue: true,
  netRevenue: true,
  occupancy: true,
  adr: true,
  bookingSources: true,
  upcomingReservations: true,
  guestRatings: true,
}

const allStatementFieldsOn: Record<OwnerStatementField, boolean> = {
  revenueLines: true,
  expenseDetails: true,
  commissionDetails: true,
  taxesAndFees: true,
  adjustments: true,
  netPayout: true,
}

/**
 * Financial-summary template — the brief is explicit: only
 *   dashboard.netRevenue, dashboard.occupancy, dashboard.adr,
 *   statement.commissionDetails, statement.netPayout
 * are visible. Every other field is off.
 */
const financialSummaryDashboard: Record<OwnerDashboardField, boolean> = {
  grossRevenue: false,
  netRevenue: true,
  occupancy: true,
  adr: true,
  bookingSources: false,
  upcomingReservations: false,
  guestRatings: false,
}

const financialSummaryStatement: Record<OwnerStatementField, boolean> = {
  revenueLines: false,
  expenseDetails: false,
  commissionDetails: true,
  taxesAndFees: false,
  adjustments: false,
  netPayout: true,
}

export const permissionTemplates: OwnerPermissionTemplate[] = [
  {
    id: 'full_transparency',
    dashboard: { ...allDashboardFieldsOn },
    statement: { ...allStatementFieldsOn },
  },
  {
    id: 'financial_summary',
    dashboard: { ...financialSummaryDashboard },
    statement: { ...financialSummaryStatement },
  },
]

// --- Patch types -----------------------------------------------------------

/**
 * Patch shape for `updatePermissions`. Top-level keys are partial — callers
 * can flip a single dashboard visibility bit, swap the templateId, or both.
 * Nested dashboard/statement records are *merged into a fresh copy* so the
 * composable never stores the caller's patch object verbatim. That keeps the
 * snapshot invariant intact even if the caller mutates `patch.dashboard`
 * after the call returns.
 */
export interface UpdatePermissionsPatch {
  templateId?: OwnerPermissionTemplateId
  dashboard?: Partial<Record<OwnerDashboardField, boolean>>
  statement?: Partial<Record<OwnerStatementField, boolean>>
}

export interface MutationResult {
  success: boolean
  error?: string
}

// --- Composable ------------------------------------------------------------

export function useOwnerPermissions() {
  /**
   * Shared state key — intentionally matches `useOwners` so the two
   * composables read from the same backing store. Either one can read,
   * either one can write, and a config update done here surfaces in
   * `useOwners().permissions.value` immediately.
   */
  const configs = useState<OwnerPermissionConfig[]>(
    'elev8-owner-permissions',
    () => structuredClone(mockOwnerPermissions),
  )

  function nowIso(): string {
    return new Date().toISOString()
  }

  function findPermission(ownerId: string): OwnerPermissionConfig | undefined {
    return configs.value.find((item: OwnerPermissionConfig) => item.ownerId === ownerId)
  }

  /**
   * Apply a built-in template to an owner. The dashboard/statement records
   * are copied into a fresh object, so subsequent mutations of the source
   * template (`permissionTemplates`) cannot retroactively change the stored
   * config — the snapshot guarantee called out in the task brief.
   *
   * `templateId === 'custom'` is rejected: there is no "custom" template to
   * apply. To create an owner that diverges from a built-in template, start
   * from `full_transparency` (or `financial_summary`) and call
   * `updateDashboardField` / `updateStatementField` afterwards.
   */
  function applyTemplate(
    ownerId: string,
    templateId: OwnerPermissionTemplateId,
  ): OwnerPermissionConfig {
    const template = permissionTemplates.find(item => item.id === templateId)
    if (!template) {
      throw new Error(
        `Permission template "${templateId}" not found. `
        + `Pick one of: ${permissionTemplates.map(t => t.id).join(', ')}.`,
      )
    }

    const next: OwnerPermissionConfig = {
      ownerId,
      templateId,
      dashboard: { ...template.dashboard },
      statement: { ...template.statement },
      updatedAt: nowIso(),
    }
    configs.value = [
      ...configs.value.filter((item: OwnerPermissionConfig) => item.ownerId !== ownerId),
      next,
    ]
    // Return a clone so the caller can read/mutate the result without leaking
    // writes back into storage (storage now owns `next`).
    return structuredClone(next)
  }

  function canViewDashboardField(ownerId: string, field: OwnerDashboardField): boolean {
    return findPermission(ownerId)?.dashboard[field] ?? false
  }

  function canViewStatementField(ownerId: string, field: OwnerStatementField): boolean {
    return findPermission(ownerId)?.statement[field] ?? false
  }

  /**
   * Internal writer — looks the existing config up, asks the caller to
   * produce the next record, and replaces the row in `configs` via spread
   * (no in-place mutation, so Vue refs stay reactive).
   */
  function writeConfig(
    ownerId: string,
    next: (existing: OwnerPermissionConfig) => OwnerPermissionConfig,
  ): MutationResult {
    const existing = findPermission(ownerId)
    if (!existing) {
      return { success: false, error: 'Permission config not found for owner.' }
    }
    const updated = next(existing)
    configs.value = configs.value.map((item: OwnerPermissionConfig) =>
      (item.ownerId === ownerId ? updated : item),
    )
    return { success: true }
  }

  /**
   * Flip a single dashboard visibility bit. Marks `templateId` as `custom`
   * so future UI can show "this owner diverged from a built-in".
   */
  function updateDashboardField(
    ownerId: string,
    field: OwnerDashboardField,
    visible: boolean,
  ): MutationResult {
    return writeConfig(ownerId, (existing) => ({
      ...existing,
      dashboard: { ...existing.dashboard, [field]: visible },
      templateId: 'custom',
      updatedAt: nowIso(),
    }))
  }

  function updateStatementField(
    ownerId: string,
    field: OwnerStatementField,
    visible: boolean,
  ): MutationResult {
    return writeConfig(ownerId, (existing) => ({
      ...existing,
      statement: { ...existing.statement, [field]: visible },
      templateId: 'custom',
      updatedAt: nowIso(),
    }))
  }

  /**
   * Patch the whole config at once. Nested dashboard/statement records are
   * *spread into a new object* so the caller's patch is never aliased into
   * storage — mutating `patch.dashboard` after the call returns will NOT
   * change the persisted visibility bits.
   *
   * If the patch only contains `templateId` and that id already matches the
   * stored id, the dashboard/statement records are left untouched (no
   * wasteful spread that would still produce the same value).
   */
  function updatePermissions(ownerId: string, patch: UpdatePermissionsPatch): MutationResult {
    return writeConfig(ownerId, (existing) => {
      const dashboard = patch.dashboard
        ? { ...existing.dashboard, ...patch.dashboard }
        : existing.dashboard
      const statement = patch.statement
        ? { ...existing.statement, ...patch.statement }
        : existing.statement
      // Divergence marker — flipping any field moves the owner out of the
      // built-in template bucket, but a pure `templateId` swap (re-applying
      // the same template) is not divergence.
      const touchedFields = patch.dashboard !== undefined || patch.statement !== undefined
      const templateId: OwnerPermissionTemplateId = touchedFields
        ? 'custom'
        : (patch.templateId ?? existing.templateId)
      return {
        ...existing,
        templateId,
        dashboard,
        statement,
        updatedAt: nowIso(),
      }
    })
  }

  return {
    configs,
    applyTemplate,
    canViewDashboardField,
    canViewStatementField,
    updateDashboardField,
    updateStatementField,
    updatePermissions,
    findPermission,
  }
}
