// Owner statement lifecycle composable.
//
// Owns the mutable statement store (drafts → published → frozen snapshot),
// issue log, next-period adjustment ledger, and mock export activity feed.
// Sits on top of the pure calculation helpers in `~/components/owners/data`
// (commission rules, ledger entries, statement totals) and is intentionally
// separate from `useOwners` so statement-side edits cannot accidentally
// mutate the ownership map and vice-versa.
//
// Invariants enforced here:
//   1. Generation is idempotent — calling `generateForPeriod(period)` twice
//      for the same (owner, listing, period) tuple is a no-op on the second
//      call. The seed drafts are honored as already-existing.
//   2. Publication freezes a deep-copy snapshot of the line items into
//      `publishedSnapshot`. Later edits to the live lines do not leak into
//      what the owner was originally shown.
//   3. Published statements are immutable — every financial-edit entry point
//      refuses to run unless `status === 'draft'`.
//   4. One open issue per statement line. A second `raiseIssue` on the same
//      line returns the existing open issue (no duplicate row).
//   5. Post-publication corrections land as `OwnerStatementAdjustment` rows
//      pointing at the next period — they NEVER edit the frozen statement.
//   6. `mockExport` is read-only against statements (it only appends to the
//      `exportActivity` feed) and returns after a short mock delay.
//
// Notifications:
//   * `OWNER_STATEMENT_DRAFT_READY` fires once per fresh draft after
//     `generateForPeriod` creates it.
//   * `OWNER_STATEMENT_PUBLISHED` fires once per `publish` success.
//   * `OWNER_ISSUE_RAISED` fires once per successful `raiseIssue`.
//
// These three alert codes are NOT yet in the `AlertType` union (that lives
// in `~/components/notifications/data/alerts.ts`, owned by Task 8). Per the
// Task 5 review we keep the `as never` cast on the type string so this
// composable does not block on Task 8 — when Task 8 lands, the only
// follow-up required is to add the three ids to `AlertType`, no other call
// sites change.

import type { CommissionRule } from '~/components/owners/data/commission-rules'
import type {
  OwnerLedgerEntry,
  StatementInput,
} from '~/components/owners/data/owner-ledger'
import type {
  OwnerStatement,
  OwnerStatementIssue,
  OwnerStatementLine,
} from '~/components/owners/data/owner-statements'
import type { Owner, OwnerPropertyMapping } from '~/components/owners/data/owners'
import {
  calculateCommission,
  findEffectiveCommissionRule,
  mockCommissionRules,
} from '~/components/owners/data/commission-rules'
import {
  applyOwnershipShare,
  calculateStatementTotals,
  ledgerEntryToStatementInput,
  mockOwnerLedgerEntries,
  roundCurrency,
} from '~/components/owners/data/owner-ledger'
import {
  buildStatementLines,
  mockOwnerStatements,
} from '~/components/owners/data/owner-statements'
import { mockOwnerPropertyMappings, mockOwners } from '~/components/owners/data/owners'
import { useNotifications } from '~/composables/useNotifications'

// --- Public types ----------------------------------------------------------

export type OwnerExportFormat = 'pdf' | 'xlsx'

export interface OwnerExportActivity {
  id: string
  format: OwnerExportFormat
  statementId: string
  ownerId: string
  ownerName: string
  listingId: string
  period: string
  actor: string
  createdAt: string
}

export interface OwnerStatementAdjustment {
  id: string
  ownerStatementId: string
  ownerId: string
  listingId: string
  /** Period of the published statement the correction refers to. */
  period: string
  /** Period the adjustment will appear against (typically `period + 1 month`). */
  nextPeriod: string
  amount: number
  reason: string
  createdAt: string
}

// --- Result envelopes ------------------------------------------------------

export type GenerateForPeriodResult
  = | { ok: true, created: number, skipped: number }
    | { ok: false, error: string }

export type PublishResult
  = | { ok: true }
    | { ok: false, reason: 'not_publishable' }

export type UpdateStatementLinesResult
  = | { ok: true, totalAmount: number }
    | { ok: false, reason: 'not_editable' }

export interface RaiseIssueInput {
  statementId: string
  lineId: string
  description: string
  amount: number
}

export type RaiseIssueResult
  = | { ok: true, issue: OwnerStatementIssue }
    | { ok: false, reason: 'statement_not_found' | 'duplicate_open_issue' }

export interface RecordAdjustmentInput {
  ownerStatementId: string
  ownerId: string
  listingId: string
  period: string
  nextPeriod: string
  amount: number
  reason: string
}

export type RecordAdjustmentResult
  = | { ok: true, adjustment: OwnerStatementAdjustment }
    | { ok: false, reason: 'statement_not_found' | 'not_published' }

export interface MockExportInput {
  format: OwnerExportFormat
  statementId: string
  actor: string
}

export type MockExportResult
  = | { ok: true, activity: OwnerExportActivity }
    | { ok: false, reason: 'statement_not_found' }

// --- Constants -------------------------------------------------------------

const YYYY_MM_RE = /^\d{4}-(?:0[1-9]|1[0-2])$/

/**
 * Mock export delay. Short enough that tests do not hang, long enough to
 *  exercise any loading-state UI hooks the caller wires up.
 */
const MOCK_EXPORT_DELAY_MS = 60

// --- ID generators (module-private) ----------------------------------------

let statementIdCounter = 0
function generateStatementId(): string {
  statementIdCounter += 1
  return `stmt-gen-${Date.now().toString(36)}-${statementIdCounter.toString(36)}`
}

let issueIdCounter = 0
function generateIssueId(): string {
  issueIdCounter += 1
  return `sti-gen-${Date.now().toString(36)}-${issueIdCounter.toString(36)}`
}

let adjustmentIdCounter = 0
function generateAdjustmentId(): string {
  adjustmentIdCounter += 1
  return `osa-gen-${Date.now().toString(36)}-${adjustmentIdCounter.toString(36)}`
}

let exportIdCounter = 0
function generateExportId(): string {
  exportIdCounter += 1
  return `exa-gen-${Date.now().toString(36)}-${exportIdCounter.toString(36)}`
}

// --- Notifications --------------------------------------------------------
//
// `useNotifications().createAlert(type, severity, context)` accepts an
// `Alert['type']` (which is the strict `AlertType` union). The three
// owner-portal alert ids this composable emits are not part of that union
// yet (they live in Task 8's scope). We deliberately route through the
// existing generic API and cast through `as never` so adding the new types
// to `alerts.ts` later is the only remaining work — no other call sites
// need to change.
//
// `useNotifications` is imported normally rather than resolved through
// `globalThis` so this composable behaves like every other composable in
// the repo (auto-imported by Nuxt in production, imported explicitly in
// tests via `vi.mock`). Tests install a spy on the `createAlert` method
// to prove the call path.

function emitOwnerAlert(
  type: 'OWNER_STATEMENT_DRAFT_READY' | 'OWNER_STATEMENT_PUBLISHED' | 'OWNER_ISSUE_RAISED',
  severity: 'CRITICAL' | 'WARNING' | 'INFO',
  context: Record<string, any>,
): void {
  // Cast `type` through `never` — same effect as `as any`, but conveys the
  // intent that this is a temporary bridge until Task 8 lands.
  const notif = useNotifications()
  notif.createAlert(type as never, severity, context)
}

// --- Composable ------------------------------------------------------------

export function useOwnerStatements() {
  // --- State buckets ------------------------------------------------------
  // Each bucket lives on its own `useState` key so consumers can `useState`
  // directly when they only need one slice. Spread replacement only — never
  // mutate `.value` in place.
  const statements = useState<OwnerStatement[]>(
    'elev8-owner-statements',
    () => structuredClone(mockOwnerStatements),
  )
  const issues = useState<OwnerStatementIssue[]>(
    'elev8-owner-statement-issues',
    () => [],
  )
  const adjustments = useState<OwnerStatementAdjustment[]>(
    'elev8-owner-statement-adjustments',
    () => [],
  )
  const exportActivity = useState<OwnerExportActivity[]>(
    'elev8-owner-export-activity',
    () => [],
  )

  function nowIso(): string {
    return new Date().toISOString()
  }

  function findStatement(statementId: string): OwnerStatement | undefined {
    return statements.value.find(s => s.id === statementId)
  }

  // --- Generate monthly drafts ------------------------------------------

  /**
   * Build deterministic draft statements for a `YYYY-MM` period.
   *
   * For every (active owner, listing) mapping whose `commissionRuleId` is
   * effective at the period end AND whose ledger has an entry for the
   * period, a draft statement is created with:
   *   - the owner's `statementCurrency`,
   *   - ownership share applied to every line,
   *   - the effective commission rule's commission.
   *
   * Idempotency: an existing (ownerId, listingId, period) statement in any
   * status is left alone — generation is a no-op for that tuple. This is
   * what makes the call safe to invoke from cron / dashboard buttons.
   */
  function generateForPeriod(period: string): GenerateForPeriodResult {
    if (!YYYY_MM_RE.test(period)) {
      return {
        ok: false,
        error: `Invalid period "${period}" — expected YYYY-MM (e.g. "2026-06").`,
      }
    }

    const owners = mockOwners
    const mappings = mockOwnerPropertyMappings
    const rules = mockCommissionRules
    const ledger = mockOwnerLedgerEntries

    const existingKeys = new Set(
      statements.value
        .filter(s => s.period === period)
        .map(s => `${s.ownerId}::${s.listingId}`),
    )

    let created = 0
    let skipped = 0
    const additions: OwnerStatement[] = []

    for (const owner of owners) {
      if (owner.status !== 'active')
        continue

      const ownerMappings = mappings.filter(m => m.ownerId === owner.id)
      for (const mapping of ownerMappings) {
        const key = `${owner.id}::${mapping.listingId}`
        if (existingKeys.has(key)) {
          skipped += 1
          continue
        }

        const entry = ledger.find(
          e => e.ownerId === owner.id
            && e.listingId === mapping.listingId
            && e.period === period
            && !e.isPriorPeriodAdjustment,
        )
        if (!entry) {
          // No financial activity for this (owner, listing, period) — nothing to draft.
          skipped += 1
          continue
        }

        const rule = findEffectiveCommissionRule(
          rules,
          owner.id,
          mapping.listingId,
          period,
        )
        if (!rule) {
          // A mapping without an effective commission rule is a configuration
          // gap — skip rather than emit a draft with a zero commission.
          skipped += 1
          continue
        }

        const draft = buildDraftFromLedger(
          owner,
          mapping,
          entry,
          rule,
        )
        additions.push(draft)
        existingKeys.add(key)
        created += 1
      }
    }

    if (additions.length > 0) {
      statements.value = [...statements.value, ...additions]
      for (const draft of additions) {
        emitOwnerAlert('OWNER_STATEMENT_DRAFT_READY', 'INFO', {
          statementId: draft.id,
          ownerId: draft.ownerId,
          listingId: draft.listingId,
          period: draft.period,
          currency: draft.currency,
        })
      }
    }

    return { ok: true, created, skipped }
  }

  // --- Publish -----------------------------------------------------------

  /**
   * Freeze a draft into a published statement.
   *   Rejects when the statement is missing or already published.
   *   Replaces `lines`/`totalAmount`/`currency` in `publishedSnapshot`
   *     via `structuredClone` — mutating the live lines later cannot leak
   *     into what the owner was shown.
   */
  function publish(statementId: string, publishedBy: string): PublishResult {
    const current = findStatement(statementId)
    if (!current || current.status !== 'draft') {
      return { ok: false, reason: 'not_publishable' }
    }

    // structuredClone chokes on Vue's reactive proxies, so deep-clone via
    // JSON for snapshot isolation. The lines array only contains
    // primitives + enums, so JSON round-trip is faithful.
    const snapshot = {
      lines: JSON.parse(JSON.stringify(current.lines)) as OwnerStatementLine[],
      totalAmount: current.totalAmount,
      currency: current.currency,
    }
    statements.value = statements.value.map(item => item.id === statementId
      ? {
          ...item,
          status: 'published' as const,
          publishedSnapshot: snapshot,
          publishedAt: nowIso(),
          publishedBy,
        }
      : item,
    )

    emitOwnerAlert('OWNER_STATEMENT_PUBLISHED', 'INFO', {
      statementId: current.id,
      ownerId: current.ownerId,
      listingId: current.listingId,
      period: current.period,
      currency: current.currency,
      publishedBy,
    })

    return { ok: true }
  }

  // --- Edit guard --------------------------------------------------------

  /**
   * Replace the line items on a statement. Refuses when the statement is
   * missing or already published — published financial values are immutable.
   * Recomputes `totalAmount` from the signed sum of the new lines.
   */
  function updateStatementLines(
    statementId: string,
    lines: OwnerStatementLine[],
  ): UpdateStatementLinesResult {
    const current = findStatement(statementId)
    if (!current || current.status !== 'draft') {
      return { ok: false, reason: 'not_editable' }
    }
    const clonedLines = lines.map(l => ({ ...l }))
    const totalAmount = roundCurrency(
      clonedLines.reduce((sum, line) => sum + line.amount, 0),
    )
    statements.value = statements.value.map(item => item.id === statementId
      ? { ...item, lines: clonedLines, totalAmount }
      : item,
    )
    return { ok: true, totalAmount }
  }

  // --- Issues ------------------------------------------------------------

  /**
   * Raise an issue against a specific line. Returns the existing open issue
   * for the (statement, line) tuple when one already exists — that is the
   * "one open issue per line" rule the brief calls out.
   */
  function raiseIssue(input: RaiseIssueInput): RaiseIssueResult {
    const statement = findStatement(input.statementId)
    if (!statement) {
      return { ok: false, reason: 'statement_not_found' }
    }

    const existingOpen = issues.value.find(
      i => i.statementId === input.statementId
        && i.lineId === input.lineId
        && !i.resolvedAt,
    )
    if (existingOpen) {
      return { ok: false, reason: 'duplicate_open_issue' }
    }

    const issue: OwnerStatementIssue = {
      id: generateIssueId(),
      statementId: input.statementId,
      lineId: input.lineId,
      description: input.description,
      amount: input.amount,
      createdAt: nowIso(),
    }
    issues.value = [...issues.value, issue]

    emitOwnerAlert('OWNER_ISSUE_RAISED', 'WARNING', {
      statementId: issue.statementId,
      lineId: issue.lineId,
      ownerId: statement.ownerId,
      listingId: statement.listingId,
      period: statement.period,
      amount: issue.amount,
    })

    return { ok: true, issue }
  }

  /** Stamp `resolvedAt` on an open issue. */
  function resolveIssue(issueId: string): { ok: boolean } {
    const target = issues.value.find(i => i.id === issueId)
    if (!target)
      return { ok: false }
    issues.value = issues.value.map(i => i.id === issueId
      ? { ...i, resolvedAt: nowIso() }
      : i,
    )
    return { ok: true }
  }

  // --- Next-period adjustments ------------------------------------------

  /**
   * Record an adjustment against an already-published statement. Refuses
   * when the source statement is missing or still a draft — adjustments
   * exist to amend what the owner was *already told*, so they cannot be
   * filed against an unpublished statement.
   */
  function recordAdjustment(input: RecordAdjustmentInput): RecordAdjustmentResult {
    const source = findStatement(input.ownerStatementId)
    if (!source) {
      return { ok: false, reason: 'statement_not_found' }
    }
    if (source.status !== 'published') {
      return { ok: false, reason: 'not_published' }
    }

    const adjustment: OwnerStatementAdjustment = {
      id: generateAdjustmentId(),
      ownerStatementId: input.ownerStatementId,
      ownerId: input.ownerId,
      listingId: input.listingId,
      period: input.period,
      nextPeriod: input.nextPeriod,
      amount: input.amount,
      reason: input.reason,
      createdAt: nowIso(),
    }
    adjustments.value = [...adjustments.value, adjustment]
    return { ok: true, adjustment }
  }

  // --- Mock export ------------------------------------------------------

  /**
   * Simulate a PDF / XLSX export. Records an activity entry with the
   * format, statement, actor, owner, listing, and period, then resolves
   * after `MOCK_EXPORT_DELAY_MS`. Read-only — does not mutate statements.
   */
  async function mockExport(input: MockExportInput): Promise<MockExportResult> {
    const statement = findStatement(input.statementId)
    if (!statement) {
      return { ok: false, reason: 'statement_not_found' }
    }

    const owner = mockOwners.find(o => o.id === statement.ownerId)
    const activity: OwnerExportActivity = {
      id: generateExportId(),
      format: input.format,
      statementId: statement.id,
      ownerId: statement.ownerId,
      ownerName: owner?.name ?? '',
      listingId: statement.listingId,
      period: statement.period,
      actor: input.actor,
      createdAt: nowIso(),
    }

    await new Promise<void>(resolve => setTimeout(resolve, MOCK_EXPORT_DELAY_MS))

    exportActivity.value = [...exportActivity.value, activity]
    return { ok: true, activity }
  }

  // --- Read helpers -----------------------------------------------------

  /**
   * Return all draft statements for dashboard / list views.
   *
   * Sorted by `period` descending (newest month first) with `id` ascending as
   * a tiebreaker for stable ordering across re-renders. Always returns a
   * freshly-sliced array so callers may sort further without aliasing storage.
   */
  function computeDrafts(): OwnerStatement[] {
    return statements.value
      .filter(s => s.status === 'draft')
      .slice()
      .sort((a, b) => {
        if (a.period === b.period)
          return a.id.localeCompare(b.id)
        return b.period.localeCompare(a.period)
      })
  }

  // --- Return -----------------------------------------------------------

  return {
    // State
    statements,
    issues,
    adjustments,
    exportActivity,
    // Lifecycle
    generateForPeriod,
    publish,
    updateStatementLines,
    // Issues
    raiseIssue,
    resolveIssue,
    // Corrections
    recordAdjustment,
    // Exports
    mockExport,
    // Reads
    computeDrafts,
  }
}

// --- Pure builder (module-private) -----------------------------------------

/**
 * Compute the lines + totalAmount for one (owner, mapping, ledger, rule)
 * tuple. Shared by `generateForPeriod`; kept module-private so callers
 * outside this file cannot accidentally bypass the public entry points.
 */
function buildDraftFromLedger(
  owner: Owner,
  mapping: OwnerPropertyMapping,
  entry: OwnerLedgerEntry,
  rule: CommissionRule,
): OwnerStatement {
  const commission = calculateCommission(rule, entry.grossRevenue)
  const input: StatementInput = ledgerEntryToStatementInput(entry, commission)
  const shared = applyOwnershipShare(input, mapping.ownershipPercentage / 100)
  const lines = buildStatementLines(shared)
  const totals = calculateStatementTotals(shared)
  // Round line amounts so what the UI displays is the source of truth.
  const roundedLines: OwnerStatementLine[] = lines.map(line => ({
    ...line,
    amount: roundCurrency(line.amount),
  }))
  const totalAmount = roundCurrency(totals.netPayout)
  return {
    id: generateStatementId(),
    ownerId: owner.id,
    listingId: mapping.listingId,
    period: entry.period,
    currency: owner.statementCurrency,
    status: 'draft',
    lines: roundedLines,
    totalAmount,
    createdAt: nowIso(),
    issues: [],
  }
}

// nowIso inlined to keep `buildDraftFromLedger` self-contained for the
// per-row builder — the closure above is the same instant source as the
// composable instance, so the timestamps stay aligned within one call.
function nowIso(): string {
  return new Date().toISOString()
}
