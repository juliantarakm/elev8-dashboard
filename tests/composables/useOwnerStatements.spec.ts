// Owner statement lifecycle — TDD tests for `useOwnerStatements`.
// Covers: monthly generation, idempotency, deterministic totals, publishing
// with deep-copy snapshots, immutable financial edits, next-period
// adjustments, single-open-issue rule per line, and mock export activity.

import type { CommissionRule } from '~/components/owners/data/commission-rules'
import type { OwnerLedgerEntry } from '~/components/owners/data/owner-ledger'
import type {
  OwnerStatementIssue,
  OwnerStatementLine,
} from '~/components/owners/data/owner-statements'
import type { Owner, OwnerPropertyMapping } from '~/components/owners/data/owners'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateCommission, mockCommissionRules } from '~/components/owners/data/commission-rules'
import { mockOwnerLedgerEntries } from '~/components/owners/data/owner-ledger'
import { mockOwnerStatements } from '~/components/owners/data/owner-statements'
import { mockOwnerPropertyMappings, mockOwners } from '~/components/owners/data/owners'
import { useOwnerStatements } from '~/composables/useOwnerStatements'

// Restrict the period helper to fixtures we control — keeps tests deterministic
// and prevents flakiness if the seed set ever grows.
const TEST_PERIOD = '2026-06'
const TEST_PERIOD_NEXT = '2026-07'

// Snapshot of the seed before each test so we can detect leaks across the suite.
const initialStatementIds = mockOwnerStatements.map(s => s.id).sort()

beforeEach(() => {
  vi.useRealTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// --- Helpers --------------------------------------------------------------

function findLedgerFor(ownerId: string, listingId: string, period: string): OwnerLedgerEntry {
  const entry = mockOwnerLedgerEntries.find(
    e => e.ownerId === ownerId && e.listingId === listingId && e.period === period,
  )
  if (!entry)
    throw new Error(`Missing ledger entry for ${ownerId}/${listingId}/${period}.`)
  return entry
}

function findOwner(id: string): Owner {
  const owner = mockOwners.find(o => o.id === id)
  if (!owner)
    throw new Error(`Owner ${id} missing from seed.`)
  return owner
}

function findMapping(ownerId: string, listingId: string): OwnerPropertyMapping {
  const mapping = mockOwnerPropertyMappings.find(
    m => m.ownerId === ownerId && m.listingId === listingId,
  )
  if (!mapping)
    throw new Error(`Mapping missing for ${ownerId}/${listingId}.`)
  return mapping
}

function findCommissionRule(id: string): CommissionRule {
  const found = mockCommissionRules.find(r => r.id === id)
  if (!found)
    throw new Error(`Commission rule ${id} missing.`)
  return found
}

describe('useOwnerStatements', () => {
  describe('seed initialization', () => {
    it('seeds statements from the data-layer fixture', () => {
      const { statements } = useOwnerStatements()
      const seededIds = statements.value.map(s => s.id).sort()
      expect(seededIds).toEqual(initialStatementIds)
    })

    it('does NOT mutate the data-layer fixture on init', () => {
      const before = JSON.stringify(mockOwnerStatements)
      useOwnerStatements()
      expect(JSON.stringify(mockOwnerStatements)).toBe(before)
    })

    it('exposes independent state buckets for issues, adjustments, and export activity', () => {
      const { issues, adjustments, exportActivity } = useOwnerStatements()
      expect(Array.isArray(issues.value)).toBe(true)
      expect(Array.isArray(adjustments.value)).toBe(true)
      expect(Array.isArray(exportActivity.value)).toBe(true)
    })
  })

  describe('generateForPeriod', () => {
    it('validates the YYYY-MM format and rejects malformed input', () => {
      const { generateForPeriod } = useOwnerStatements()
      expect(() => generateForPeriod('2026-6')).toThrow(/YYYY-MM/i)
      expect(() => generateForPeriod('2026/06')).toThrow(/YYYY-MM/i)
      expect(() => generateForPeriod('june-2026')).toThrow(/YYYY-MM/i)
      expect(() => generateForPeriod('')).toThrow(/YYYY-MM/i)
    })

    it('returns ok with created=0 when called for a period with no ledger data', () => {
      const { generateForPeriod } = useOwnerStatements()
      const result = generateForPeriod('2030-01')
      expect(result.ok).toBe(true)
      expect(result.created).toBe(0)
    })

    it('skips existing (owner, listing, period) tuples — idempotent on re-run', () => {
      const { generateForPeriod, statements } = useOwnerStatements()
      // 2026-06 ledger entries: led-1 (own-1/lst-1), led-3 (own-2/lst-8),
      // led-4 (own-2/lst-3), led-5 (own-3/lst-3). own-3 is 'invited' so its
      // mapping is excluded from generation. The three active-owner pairs all
      // already have a seed draft (stmt-1, stmt-3, stmt-4) so all three are
      // skipped on re-run — generation is idempotent.
      const before = statements.value.length
      const result = generateForPeriod(TEST_PERIOD)
      expect(result.ok).toBe(true)
      expect(result.created).toBe(0)
      expect(result.skipped).toBe(3)
      expect(statements.value.length).toBe(before)
    })

    it('produces deterministic totals that match a recomputed version of the same inputs', () => {
      const { generateForPeriod, statements } = useOwnerStatements()
      generateForPeriod('2026-04')
      const result = generateForPeriod('2026-05')
      // led-2 = own-1/lst-1/May exists; stmt-2 already seeds that exact draft.
      expect(result.created).toBe(0)

      // Verify stmt-1 (own-1/lst-1/June draft) matches a hand-recompute.
      const stmt1 = statements.value.find(s => s.id === 'stmt-1')!
      const entry = findLedgerFor('own-1', 'lst-1', TEST_PERIOD)
      const rule = findCommissionRule('cr-1')
      const commission = calculateCommission(rule, entry.grossRevenue)
      expect(commission).toBe(7_700_000)
      // 38_500_000 − 2_100_000 − 1_400_000 − 7_700_000 − 1_925_000 − 2_310_000
      expect(stmt1.totalAmount).toBe(23_065_000)
    })

    it('computes tiered-commission totals correctly for the I Putu (lst-3) mapping', () => {
      const { generateForPeriod, statements } = useOwnerStatements()
      generateForPeriod(TEST_PERIOD)
      const stmt4 = statements.value.find(s => s.id === 'stmt-4')!
      // Tiered cr-2: 18% up to 50M IDR, 22% above; revenue 110M IDR; 50% ownership share.
      // Total commission on full revenue: 50M * 18% + 60M * 22% = 22_200_000 IDR.
      const expectedCommission = calculateCommission(
        { type: 'tiered', tiers: [{ upTo: 50_000_000, rate: 18 }, { upTo: null, rate: 22 }] },
        110_000_000,
      )
      expect(expectedCommission).toBe(22_200_000)
      // Total of stmt-4 lines = 110M − 2.9M − 22.2M − 5.5M − 6.6M = 72_800_000 IDR.
      expect(stmt4.totalAmount).toBe(72_800_000)
    })

    it('is idempotent — calling generateForPeriod twice produces the same statement count', () => {
      const { generateForPeriod, statements } = useOwnerStatements()
      const first = generateForPeriod(TEST_PERIOD)
      const before = statements.value.length
      const second = generateForPeriod(TEST_PERIOD)
      expect(first.created + first.skipped).toBeGreaterThan(0)
      expect(second.created).toBe(0)
      expect(statements.value.length).toBe(before)
    })

    it('seeds draft statements with currency matching the owner\'s statementCurrency', () => {
      const { generateForPeriod, statements } = useOwnerStatements()
      generateForPeriod(TEST_PERIOD)
      const putuLst8 = statements.value.find(s => s.id === 'stmt-3')!
      expect(putuLst8.currency).toBe('USD')
      const wayanLst1 = statements.value.find(s => s.id === 'stmt-1')!
      expect(wayanLst1.currency).toBe('IDR')
    })

    it('idempotency does not emit OWNER_STATEMENT_DRAFT_READY on a no-op re-run', () => {
      const callLog: Array<{ type: string, severity: string, context: Record<string, any> }> = []
      const fakeNotifications = {
        createAlert: (type: string, severity: string, context: Record<string, any>) => {
          callLog.push({ type, severity, context })
        },
      }
      const w = globalThis as unknown as Record<string, unknown>
      const previous = w.useNotifications
      w.useNotifications = () => fakeNotifications
      try {
        const { generateForPeriod } = useOwnerStatements()
        const result = generateForPeriod(TEST_PERIOD)
        expect(result.created).toBe(0)
        expect(callLog.filter(c => c.type === 'OWNER_STATEMENT_DRAFT_READY')).toHaveLength(0)
      }
      finally {
        if (previous === undefined)
          delete w.useNotifications
        else w.useNotifications = previous
      }
    })
  })

  describe('publish', () => {
    it('returns { ok: false, reason: "not_publishable" } when the statement is already published', () => {
      const { publish } = useOwnerStatements()
      const result = publish('stmt-2', 'staff-1')
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.reason).toBe('not_publishable')
    })

    it('returns { ok: false, reason: "not_publishable" } when the statement id does not exist', () => {
      const { publish } = useOwnerStatements()
      const result = publish('stmt-missing', 'staff-1')
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.reason).toBe('not_publishable')
    })

    it('flips a draft to published and stamps publishedAt + publishedBy', () => {
      const { publish, statements } = useOwnerStatements()
      const before = statements.value.find(s => s.id === 'stmt-1')!
      expect(before.status).toBe('draft')
      const result = publish('stmt-1', 'staff-1')
      expect(result.ok).toBe(true)
      const after = statements.value.find(s => s.id === 'stmt-1')!
      expect(after.status).toBe('published')
      expect(after.publishedBy).toBe('staff-1')
      expect(after.publishedAt).toBeTruthy()
    })

    it('deep-clones lines and totals into publishedSnapshot (mutating lines does not affect snapshot)', () => {
      const { publish, statements } = useOwnerStatements()
      publish('stmt-1', 'staff-1')
      const after = statements.value.find(s => s.id === 'stmt-1')!
      const snapshot = after.publishedSnapshot
      expect(snapshot).toBeDefined()
      expect(snapshot!.lines).toEqual(after.lines)
      expect(snapshot!.totalAmount).toBe(after.totalAmount)
      expect(snapshot!.currency).toBe(after.currency)

      const originalFirstAmount = after.lines[0].amount
      after.lines[0].amount = 0
      expect(snapshot!.lines[0].amount).toBe(originalFirstAmount)
      after.lines[0].amount = originalFirstAmount
    })

    it('emits an OWNER_STATEMENT_PUBLISHED notification via createAlert', () => {
      const callLog: Array<{ type: string, severity: string, context: Record<string, any> }> = []
      const fakeNotifications = {
        createAlert: (type: string, severity: string, context: Record<string, any>) => {
          callLog.push({ type, severity, context })
        },
      }
      const w = globalThis as unknown as Record<string, unknown>
      const previous = w.useNotifications
      w.useNotifications = () => fakeNotifications
      try {
        const { publish } = useOwnerStatements()
        publish('stmt-3', 'staff-1')
        const matches = callLog.filter(c => c.type === 'OWNER_STATEMENT_PUBLISHED')
        expect(matches).toHaveLength(1)
        expect(matches[0].context.statementId).toBe('stmt-3')
      }
      finally {
        if (previous === undefined)
          delete w.useNotifications
        else w.useNotifications = previous
      }
    })
  })

  describe('immutable edit guards', () => {
    it('rejects line edits after publication', () => {
      const { updateStatementLines } = useOwnerStatements()
      const result = updateStatementLines('stmt-2', [
        { id: 'sl-7', category: 'revenue', label: 'Gross booking revenue', amount: 1 },
      ])
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.reason).toBe('not_editable')
    })

    it('rejects financial edits when the statement id does not exist', () => {
      const { updateStatementLines } = useOwnerStatements()
      const result = updateStatementLines('stmt-missing', [])
      expect(result.ok).toBe(false)
      if (!result.ok)
        expect(result.reason).toBe('not_editable')
    })

    it('accepts line edits while the statement is in draft', () => {
      const { updateStatementLines, statements } = useOwnerStatements()
      const newLines: OwnerStatementLine[] = [
        { id: 'sl-1', category: 'revenue', label: 'Gross booking revenue', amount: 40_000_000 },
        { id: 'sl-2', category: 'expense', label: 'Cleaning & laundry', amount: -2_100_000 },
        { id: 'sl-3', category: 'expense', label: 'Utilities', amount: -1_400_000 },
        { id: 'sl-4', category: 'commission', label: 'Management commission (20%)', amount: -8_000_000 },
        { id: 'sl-5', category: 'tax', label: 'Local tourism tax', amount: -2_000_000 },
        { id: 'sl-6', category: 'fee', label: 'Platform fees (Airbnb)', amount: -2_400_000 },
      ]
      const result = updateStatementLines('stmt-1', newLines)
      expect(result.ok).toBe(true)
      const after = statements.value.find(s => s.id === 'stmt-1')!
      expect(after.lines[0].amount).toBe(40_000_000)
      expect(after.totalAmount).toBe(40_000_000 - 2_100_000 - 1_400_000 - 8_000_000 - 2_000_000 - 2_400_000)
    })

    it('uses spread replacement (Vue ref identity changes) on every edit', () => {
      const { updateStatementLines, statements } = useOwnerStatements()
      const before = statements.value
      updateStatementLines('stmt-1', [
        { id: 'sl-1', category: 'revenue', label: 'Gross booking revenue', amount: 38_500_000 },
      ])
      expect(statements.value).not.toBe(before)
    })
  })

  describe('raiseIssue + resolveIssue', () => {
    it('creates an issue tied to a specific line on the statement', () => {
      const { raiseIssue, issues } = useOwnerStatements()
      const result = raiseIssue({
        statementId: 'stmt-1',
        lineId: 'sl-5',
        description: 'Tourism tax correction',
        amount: -50_000,
      })
      expect(result.ok).toBe(true)
      const created = issues.value.find(i => i.statementId === 'stmt-1' && i.lineId === 'sl-5' && !i.resolvedAt)!
      expect(created).toBeTruthy()
      expect(created.amount).toBe(-50_000)
      expect(created.id).toBeTruthy()
      expect(created.createdAt).toBeTruthy()
    })

    it('enforces the one-open-issue-per-line rule — duplicates return the existing issue', () => {
      const { raiseIssue, issues } = useOwnerStatements()
      const first = raiseIssue({
        statementId: 'stmt-1',
        lineId: 'sl-4',
        description: 'Commission rate review',
        amount: -10_000,
      })
      expect(first.ok).toBe(true)
      const beforeCount = issues.value.length
      const second = raiseIssue({
        statementId: 'stmt-1',
        lineId: 'sl-4',
        description: 'Another review on the same line',
        amount: -20_000,
      })
      expect(second.ok).toBe(false)
      if (!second.ok)
        expect(second.reason).toBe('duplicate_open_issue')
      expect(issues.value.length).toBe(beforeCount)
    })

    it('allows a new issue on the same line after the previous one was resolved', () => {
      const { raiseIssue, resolveIssue } = useOwnerStatements()
      const first = raiseIssue({
        statementId: 'stmt-1',
        lineId: 'sl-2',
        description: 'Cleaning undercharge',
        amount: -100_000,
      })
      expect(first.ok).toBe(true)
      const firstIssue = (first as { ok: true, issue: OwnerStatementIssue }).issue
      resolveIssue(firstIssue.id)
      const second = raiseIssue({
        statementId: 'stmt-1',
        lineId: 'sl-2',
        description: 'Second review on the same line',
        amount: -50_000,
      })
      expect(second.ok).toBe(true)
    })

    it('rejects raiseIssue for an unknown statement', () => {
      const { raiseIssue } = useOwnerStatements()
      const result = raiseIssue({
        statementId: 'stmt-missing',
        lineId: 'sl-x',
        description: '...',
        amount: 0,
      })
      expect(result.ok).toBe(false)
    })

    it('emits an OWNER_ISSUE_RAISED notification via createAlert', () => {
      const callLog: Array<{ type: string, severity: string, context: Record<string, any> }> = []
      const fakeNotifications = {
        createAlert: (type: string, severity: string, context: Record<string, any>) => {
          callLog.push({ type, severity, context })
        },
      }
      const w = globalThis as unknown as Record<string, unknown>
      const previous = w.useNotifications
      w.useNotifications = () => fakeNotifications
      try {
        const { raiseIssue } = useOwnerStatements()
        raiseIssue({
          statementId: 'stmt-1',
          lineId: 'sl-3',
          description: 'Utilities review',
          amount: -10_000,
        })
        const matches = callLog.filter(c => c.type === 'OWNER_ISSUE_RAISED')
        expect(matches).toHaveLength(1)
        expect(matches[0].context.statementId).toBe('stmt-1')
        expect(matches[0].context.lineId).toBe('sl-3')
      }
      finally {
        if (previous === undefined)
          delete w.useNotifications
        else w.useNotifications = previous
      }
    })
  })

  describe('post-publication corrections (next-period adjustments)', () => {
    it('records an adjustment record pointing at the next period', () => {
      const { publish, recordAdjustment, adjustments, statements } = useOwnerStatements()
      publish('stmt-1', 'staff-1')
      const published = statements.value.find(s => s.id === 'stmt-1')!
      const result = recordAdjustment({
        ownerStatementId: published.id,
        ownerId: published.ownerId,
        listingId: published.listingId,
        period: published.period,
        nextPeriod: TEST_PERIOD_NEXT,
        amount: -100_000,
        reason: 'Retroactive utility undercharge correction.',
      })
      expect(result.ok).toBe(true)
      const created = adjustments.value.find(a => a.ownerStatementId === 'stmt-1')!
      expect(created.nextPeriod).toBe(TEST_PERIOD_NEXT)
      expect(created.amount).toBe(-100_000)
      expect(created.reason).toMatch(/retroactive/i)
      expect(created.createdAt).toBeTruthy()
    })

    it('rejects recording an adjustment against an unpublished statement (financial edits are immutable)', () => {
      const { recordAdjustment } = useOwnerStatements()
      const result = recordAdjustment({
        ownerStatementId: 'stmt-3', // still draft
        ownerId: 'own-2',
        listingId: 'lst-8',
        period: TEST_PERIOD,
        nextPeriod: TEST_PERIOD_NEXT,
        amount: -50_000,
        reason: 'test',
      })
      expect(result.ok).toBe(false)
    })

    it('uses spread replacement when storing adjustments', () => {
      const { publish, recordAdjustment, adjustments } = useOwnerStatements()
      publish('stmt-1', 'staff-1')
      const before = adjustments.value
      recordAdjustment({
        ownerStatementId: 'stmt-1',
        ownerId: 'own-1',
        listingId: 'lst-1',
        period: TEST_PERIOD,
        nextPeriod: TEST_PERIOD_NEXT,
        amount: -10_000,
        reason: 'spread test',
      })
      expect(adjustments.value).not.toBe(before)
    })
  })

  describe('mockExport', () => {
    it('records an activity entry with format, owner, statement, actor, and timestamp', async () => {
      const { mockExport, exportActivity } = useOwnerStatements()
      const before = exportActivity.value.length
      const result = await mockExport({
        format: 'pdf',
        statementId: 'stmt-1',
        actor: 'staff-1',
      })
      expect(result.ok).toBe(true)
      expect(exportActivity.value.length).toBe(before + 1)
      const entry = exportActivity.value[exportActivity.value.length - 1]
      expect(entry.format).toBe('pdf')
      expect(entry.statementId).toBe('stmt-1')
      expect(entry.actor).toBe('staff-1')
      expect(entry.ownerId).toBe('own-1')
      expect(entry.listingId).toBe('lst-1')
      expect(entry.period).toBe(TEST_PERIOD)
      expect(entry.createdAt).toBeTruthy()
    })

    it('returns { ok: false } when the statement id does not exist', async () => {
      const { mockExport } = useOwnerStatements()
      const result = await mockExport({
        format: 'xlsx',
        statementId: 'stmt-missing',
        actor: 'staff-1',
      })
      expect(result.ok).toBe(false)
    })

    it('supports the xlsx format alongside pdf', async () => {
      const { mockExport, exportActivity } = useOwnerStatements()
      const before = exportActivity.value.length
      const result = await mockExport({
        format: 'xlsx',
        statementId: 'stmt-3',
        actor: 'staff-2',
      })
      expect(result.ok).toBe(true)
      const entry = exportActivity.value[exportActivity.value.length - 1]
      expect(entry.format).toBe('xlsx')
      expect(entry.actor).toBe('staff-2')
      expect(exportActivity.value.length).toBe(before + 1)
    })

    it('returns control after a short delay (does not hang the test)', async () => {
      const { mockExport } = useOwnerStatements()
      const start = Date.now()
      const result = await mockExport({
        format: 'pdf',
        statementId: 'stmt-1',
        actor: 'staff-1',
      })
      const elapsed = Date.now() - start
      expect(result.ok).toBe(true)
      expect(elapsed).toBeLessThan(5_000)
    })

    it('does NOT mutate statements when exporting (read-only operation)', async () => {
      const { mockExport, statements } = useOwnerStatements()
      const beforeIds = statements.value.map(s => s.id).sort()
      await mockExport({
        format: 'pdf',
        statementId: 'stmt-1',
        actor: 'staff-1',
      })
      const afterIds = statements.value.map(s => s.id).sort()
      expect(afterIds).toEqual(beforeIds)
    })
  })

  describe('computeDrafts (helper exposed for testing)', () => {
    it('lists drafts and totals for the dashboard view', () => {
      const { computeDrafts, statements } = useOwnerStatements()
      const drafts = computeDrafts()
      expect(drafts.length).toBe(statements.value.filter(s => s.status === 'draft').length)
      expect(drafts.every(d => d.status === 'draft')).toBe(true)
    })

    it('reproduces the seeded totalAmount for stmt-1 (38.5M − 2.1M − 1.4M − 7.7M − 1.925M − 2.31M)', () => {
      const { computeDrafts } = useOwnerStatements()
      const stmt1 = computeDrafts().find(d => d.id === 'stmt-1')!
      expect(stmt1.totalAmount).toBe(23_065_000)
    })
  })

  describe('spread / replacement mutations', () => {
    it('publish replaces the statements array (no in-place mutation)', () => {
      const { publish, statements } = useOwnerStatements()
      const before = statements.value
      publish('stmt-1', 'staff-1')
      expect(statements.value).not.toBe(before)
    })

    it('raiseIssue replaces the issues array (no in-place mutation)', () => {
      const { raiseIssue, issues } = useOwnerStatements()
      const before = issues.value
      raiseIssue({
        statementId: 'stmt-1',
        lineId: 'sl-1',
        description: 'spread test',
        amount: -10_000,
      })
      expect(issues.value).not.toBe(before)
    })

    it('mockExport replaces the exportActivity array', async () => {
      const { mockExport, exportActivity } = useOwnerStatements()
      const before = exportActivity.value
      await mockExport({
        format: 'pdf',
        statementId: 'stmt-1',
        actor: 'staff-1',
      })
      expect(exportActivity.value).not.toBe(before)
    })
  })

  describe('cross-composable integration', () => {
    it('shares the seed with useOwners — period generation respects the ownership map', () => {
      const { generateForPeriod } = useOwnerStatements()
      const result = generateForPeriod(TEST_PERIOD)
      // own-3 is 'invited' — generation excludes it. Active-owner mappings
      // (own-1 + own-2) all already have seed drafts, so the run is a no-op.
      expect(result.created + result.skipped).toBeGreaterThanOrEqual(3)
    })

    it('does NOT mutate mockOwnerPropertyMappings / mockOwners on read', () => {
      const beforeOwners = JSON.stringify(mockOwners)
      const beforeMappings = JSON.stringify(mockOwnerPropertyMappings)
      const { generateForPeriod } = useOwnerStatements()
      generateForPeriod(TEST_PERIOD)
      expect(JSON.stringify(mockOwners)).toBe(beforeOwners)
      expect(JSON.stringify(mockOwnerPropertyMappings)).toBe(beforeMappings)
    })
  })
})

// Touch the helpers to avoid "unused" warnings if lint enforces strict refs.
void findOwner
void findMapping
