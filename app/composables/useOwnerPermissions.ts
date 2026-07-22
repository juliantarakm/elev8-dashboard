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
// ⚠️  Single canonical template source: `permissionTemplates` at module scope.
//     Both the useState initializer (via `normalizePermissionsSeed`) and
//     `applyTemplate` resolve templates from THIS array. Any drift between
//     the two paths is impossible because they share the same lookup.
//
// ⚠️  Snapshot semantics: `structuredClone` is used wherever we copy a
//     template's dashboard/statement records into either a seeded config or
//     a freshly-applied config. Mutating the source template array later
//     has no effect on already-saved owner configs — even on boolean fields
//     today, this matters the moment those records grow nested objects.

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
// These are the source-of-truth field maps that `applyTemplate` AND the
// `normalizePermissionsSeed` initializer copy from. They are mutable plain
// objects — that lets tests prove the snapshot invariant by editing them in
// place and asserting the stored config is untouched. In the app they are
// read-only constants; the module-level `permissionTemplates` array is the
// single canonical source every code path below resolves from.

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

// --- Seed normalization ----------------------------------------------------

/**
 * Build a fresh `OwnerPermissionConfig` from one of the two built-in
 * templates defined above. `structuredClone` is used for the dashboard and
 * statement records so the resulting object never aliases the source.
 */
function buildConfigFromBuiltInTemplate(
  ownerId: string,
  templateId: 'full_transparency' | 'financial_summary',
  updatedAt: string,
): OwnerPermissionConfig {
  const template = permissionTemplates.find(t => t.id === templateId)
  if (!template) {
    throw new Error(`Built-in permission template "${templateId}" not found.`)
  }
  return {
    ownerId,
    templateId,
    dashboard: structuredClone(template.dashboard),
    statement: structuredClone(template.statement),
    updatedAt,
  }
}

/**
 * Normalize a list of seed permission configs through the canonical
 * composable templates.
 *
 *   - Built-in template ids (`full_transparency`, `financial_summary`) are
 *     REPLACED with the strict canonical field map. This guards against
 *     the data-layer seed drifting (a looser `financial_summary` in the
 *     mock would otherwise be inherited by `useOwnerPermissions`).
 *   - `custom` template ids pass through unchanged (deep-cloned so the
 *     input array isn't aliased).
 *
 * Exported so the useState initializer and tests can both use the same
 * normalization rules from one place — single source of truth.
 */
export function normalizePermissionsSeed(
  seeds: OwnerPermissionConfig[],
): OwnerPermissionConfig[] {
  return seeds.map((seed) => {
    if (seed.templateId === 'custom') {
      return structuredClone(seed)
    }
    return buildConfigFromBuiltInTemplate(
      seed.ownerId,
      seed.templateId,
      seed.updatedAt,
    )
  })
}

// --- Composable ------------------------------------------------------------

export function useOwnerPermissions() {
  /**
   * Shared state key — intentionally matches `useOwners` so the two
   * composables read from the same backing store. Either one can read,
   * either one can write, and a config update done here surfaces in
   * `useOwners().permissions.value` immediately.
   *
   * The initializer feeds `mockOwnerPermissions` through
   * `normalizePermissionsSeed`, so the first read of `configs.value`
   * already reflects the composable's strict templates — NOT the looser
   * data-layer seed.
   */
  const configs = useState<OwnerPermissionConfig[]>(
    'elev8-owner-permissions',
    () => normalizePermissionsSeed(mockOwnerPermissions),
  )

  function nowIso(): string {
    return new Date().toISOString()
  }

  function findPermission(ownerId: string): OwnerPermissionConfig | undefined {
    return configs.value.find((item: OwnerPermissionConfig) => item.ownerId === ownerId)
  }

  /**
   * Apply a built-in template to an owner. `structuredClone` is used for
   * both nested records so the resulting object has zero aliasing with
   * the source template — subsequent in-place mutations of the source
   * `permissionTemplates` array cannot retroactively change the stored
   * config, and mutating the STORED config cannot retroactively change
   * the source.
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
    if (templateId === 'custom') {
      throw new Error(
        'Cannot apply the "custom" template — start from full_transparency or financial_summary and customize via updateDashboardField / updateStatementField.',
      )
    }
    const next = buildConfigFromBuiltInTemplate(ownerId, templateId, nowIso())
    configs.value = [
      ...configs.value.filter((item: OwnerPermissionConfig) => item.ownerId !== ownerId),
      next,
    ]
    // Return a fresh clone so the caller can read/mutate the result without
    // leaking writes back into storage (storage now owns `next`).
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
    // Re-export helpers that downstream tests / future UI call sites might want.
    normalizePermissionsSeed,
  }
}
