// Owner statements — the monthly financial summary delivered to each owner.
// A statement is scoped to one (owner, listing, period) and is generated as a
// draft, then either published (frozen, owner-visible) or sent back for edits.
//
// Publication snapshots are immutable copies of the line items, so future
// adjustments to the live ledger do not retroactively change what the owner
// was originally told. Adjustments after publication create a separate
// "issue" record that links back to the original statement.

import type { StatementInput } from './owner-ledger'
import { roundCurrency } from './owner-ledger'

export type OwnerStatementStatus = 'draft' | 'published'

export type OwnerStatementLineCategory
  = | 'revenue'
    | 'expense'
    | 'commission'
    | 'tax'
    | 'fee'
    | 'adjustment'

export interface OwnerStatementLine {
  id: string
  category: OwnerStatementLineCategory
  label: string
  amount: number
  /** Source ledger entry this line was generated from. May be undefined for manual adjustments. */
  ledgerEntryId?: string
}

export interface OwnerStatementIssue {
  id: string
  statementId: string
  /** ID of the statement line the issue is attached to. Optional for
   *  backward-compatibility with existing fixtures (Task 1 seed has no
   *  per-line issues). The "one open issue per line" rule in
   *  `useOwnerStatements.raiseIssue` requires this field to be set for any
   *  issue created through the lifecycle composable. */
  lineId?: string
  description: string
  amount: number
  createdAt: string
  resolvedAt?: string
}

export interface OwnerStatement {
  id: string
  ownerId: string
  listingId: string
  /** YYYY-MM period covered by this statement. */
  period: string
  currency: string
  status: OwnerStatementStatus
  lines: OwnerStatementLine[]
  /** Sum of all line amounts. Stored explicitly so the UI can render it without re-computing. */
  totalAmount: number
  createdAt: string
  publishedAt?: string
  /** Frozen snapshot of the line items at the moment of publication. Only set when status === 'published'. */
  publishedSnapshot?: { lines: OwnerStatementLine[], totalAmount: number, currency: string }
  issues: OwnerStatementIssue[]
}

// --- Pure statement line builder --------------------------------------------

/**
 * Build the signed statement lines from a statement input. Revenue is positive;
 * expenses, commission, and taxes/fees are stored as negative amounts;
 * adjustments keep their sign. The line amounts sum to the net payout. The
 * adjustment line is omitted when there is no adjustment.
 */
export function buildStatementLines(input: StatementInput): OwnerStatementLine[] {
  const lines: OwnerStatementLine[] = [
    { id: 'line-revenue', category: 'revenue', label: 'Gross booking revenue', amount: roundCurrency(input.grossRevenue) },
    { id: 'line-expense', category: 'expense', label: 'Operating expenses', amount: roundCurrency(-input.operatingExpenses) },
    { id: 'line-commission', category: 'commission', label: 'Management commission', amount: roundCurrency(-input.commission) },
    { id: 'line-tax', category: 'tax', label: 'Taxes & platform fees', amount: roundCurrency(-input.taxesAndFees) },
  ]

  if (input.adjustments !== 0)
    lines.push({ id: 'line-adjustment', category: 'adjustment', label: 'Adjustments', amount: roundCurrency(input.adjustments) })

  return lines
}

// --- Seed fixtures ----------------------------------------------------------

export const mockOwnerStatements: OwnerStatement[] = [
  // Wayan — June 2026 statement for lst-1 (draft, awaiting publish).
  {
    id: 'stmt-1',
    ownerId: 'own-1',
    listingId: 'lst-1',
    period: '2026-06',
    currency: 'IDR',
    status: 'draft',
    createdAt: '2026-07-02T08:00:00.000Z',
    lines: [
      { id: 'sl-1', category: 'revenue', label: 'Gross booking revenue', amount: 38_500_000 },
      { id: 'sl-2', category: 'expense', label: 'Cleaning & laundry', amount: -2_100_000 },
      { id: 'sl-3', category: 'expense', label: 'Utilities', amount: -1_400_000 },
      { id: 'sl-4', category: 'commission', label: 'Management commission (20%)', amount: -7_700_000 },
      { id: 'sl-5', category: 'tax', label: 'Local tourism tax', amount: -1_925_000 },
      { id: 'sl-6', category: 'fee', label: 'Platform fees (Airbnb)', amount: -2_310_000 },
    ],
    totalAmount: 23_065_000,
    issues: [],
  },
  // Wayan — May 2026 statement for lst-1 (published, plus one resolved issue).
  {
    id: 'stmt-2',
    ownerId: 'own-1',
    listingId: 'lst-1',
    period: '2026-05',
    currency: 'IDR',
    status: 'published',
    createdAt: '2026-06-02T08:00:00.000Z',
    publishedAt: '2026-06-03T10:30:00.000Z',
    lines: [
      { id: 'sl-7', category: 'revenue', label: 'Gross booking revenue', amount: 42_000_000 },
      { id: 'sl-8', category: 'expense', label: 'Cleaning & laundry', amount: -2_300_000 },
      { id: 'sl-9', category: 'expense', label: 'Utilities', amount: -1_500_000 },
      { id: 'sl-10', category: 'commission', label: 'Management commission (20%)', amount: -8_400_000 },
      { id: 'sl-11', category: 'tax', label: 'Local tourism tax', amount: -2_100_000 },
      { id: 'sl-12', category: 'fee', label: 'Platform fees (Airbnb)', amount: -2_520_000 },
    ],
    totalAmount: 25_180_000,
    publishedSnapshot: {
      currency: 'IDR',
      totalAmount: 25_180_000,
      lines: [
        { id: 'sl-7', category: 'revenue', label: 'Gross booking revenue', amount: 42_000_000 },
        { id: 'sl-8', category: 'expense', label: 'Cleaning & laundry', amount: -2_300_000 },
        { id: 'sl-9', category: 'expense', label: 'Utilities', amount: -1_500_000 },
        { id: 'sl-10', category: 'commission', label: 'Management commission (20%)', amount: -8_400_000 },
        { id: 'sl-11', category: 'tax', label: 'Local tourism tax', amount: -2_100_000 },
        { id: 'sl-12', category: 'fee', label: 'Platform fees (Airbnb)', amount: -2_520_000 },
      ],
    },
    issues: [
      {
        id: 'sti-1',
        statementId: 'stmt-2',
        description: 'Utility undercharge — pool pump electricity corrected.',
        amount: -250_000,
        createdAt: '2026-06-07T09:00:00.000Z',
        resolvedAt: '2026-06-10T14:00:00.000Z',
      },
    ],
  },
  // I Putu — June 2026 statement for lst-8 (draft).
  {
    id: 'stmt-3',
    ownerId: 'own-2',
    listingId: 'lst-8',
    period: '2026-06',
    currency: 'USD',
    status: 'draft',
    createdAt: '2026-07-02T08:00:00.000Z',
    lines: [
      { id: 'sl-13', category: 'revenue', label: 'Gross booking revenue', amount: 9_400 },
      { id: 'sl-14', category: 'expense', label: 'Cleaning & laundry', amount: -320 },
      { id: 'sl-15', category: 'commission', label: 'Management base fee', amount: -250 },
      { id: 'sl-16', category: 'commission', label: 'Management commission (15%)', amount: -1_410 },
      { id: 'sl-17', category: 'tax', label: 'Local tourism tax', amount: -470 },
      { id: 'sl-18', category: 'fee', label: 'Platform fees (Booking.com)', amount: -564 },
    ],
    totalAmount: 6_386,
    issues: [],
  },
  // I Putu — June 2026 statement for lst-3 (draft, 50% co-owner share, IDR).
  // Commission follows cr-2 (tiered 18% / 22% on the first 50M IDR):
  //   Tier 1: 50_000_000 * 18% = 9_000_000
  //   Tier 2: 60_000_000 * 22% = 13_200_000
  //   Total:                       22_200_000 IDR
  {
    id: 'stmt-4',
    ownerId: 'own-2',
    listingId: 'lst-3',
    period: '2026-06',
    currency: 'IDR',
    status: 'draft',
    createdAt: '2026-07-02T08:00:00.000Z',
    lines: [
      { id: 'sl-19', category: 'revenue', label: 'Gross booking revenue (50% share)', amount: 110_000_000 },
      { id: 'sl-20', category: 'expense', label: 'Cleaning & laundry (50% share)', amount: -2_900_000 },
      { id: 'sl-21', category: 'commission', label: 'Management commission (tiered 18% / 22%)', amount: -22_200_000 },
      { id: 'sl-22', category: 'tax', label: 'Local tourism tax (50% share)', amount: -5_500_000 },
      { id: 'sl-23', category: 'fee', label: 'Platform fees (50% share)', amount: -6_600_000 },
    ],
    totalAmount: 72_800_000,
    issues: [],
  },
  // Ni Kadek — June 2026 statement for lst-3 (draft, 50% share).
  {
    id: 'stmt-5',
    ownerId: 'own-3',
    listingId: 'lst-3',
    period: '2026-06',
    currency: 'IDR',
    status: 'draft',
    createdAt: '2026-07-02T08:00:00.000Z',
    lines: [
      { id: 'sl-24', category: 'revenue', label: 'Gross booking revenue (50% share)', amount: 110_000_000 },
      { id: 'sl-25', category: 'expense', label: 'Cleaning & laundry (50% share)', amount: -2_900_000 },
      { id: 'sl-26', category: 'commission', label: 'Management commission (18%)', amount: -19_800_000 },
      { id: 'sl-27', category: 'tax', label: 'Local tourism tax (50% share)', amount: -5_500_000 },
      { id: 'sl-28', category: 'fee', label: 'Platform fees (50% share)', amount: -6_600_000 },
    ],
    totalAmount: 75_200_000,
    issues: [],
  },
]
