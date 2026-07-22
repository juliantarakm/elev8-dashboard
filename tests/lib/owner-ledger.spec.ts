import { describe, expect, it } from 'vitest'
import { calculateCommission } from '@/components/owners/data/commission-rules'
import {
  applyOwnershipShare,
  calculateStatementTotals,
  ledgerEntryToStatementInput,
  mockOwnerLedgerEntries,
} from '@/components/owners/data/owner-ledger'
import { buildStatementLines, mockOwnerStatements } from '@/components/owners/data/owner-statements'

describe('calculateStatementTotals', () => {
  it('derives net payout with the correct calculation order', () => {
    expect(calculateStatementTotals({
      grossRevenue: 10_000,
      operatingExpenses: 1_000,
      commission: 1_500,
      taxesAndFees: 500,
      adjustments: -250,
    })).toEqual({
      grossRevenue: 10_000,
      operatingExpenses: 1_000,
      commission: 1_500,
      taxesAndFees: 500,
      adjustments: -250,
      netPayout: 6_750,
    })
  })

  it('adds positive adjustments back into the net payout', () => {
    const totals = calculateStatementTotals({
      grossRevenue: 10_000,
      operatingExpenses: 1_000,
      commission: 1_500,
      taxesAndFees: 500,
      adjustments: 250,
    })
    expect(totals.netPayout).toBe(7_250)
  })

  it('rounds currency to two decimals at the domain boundary', () => {
    const totals = calculateStatementTotals({
      grossRevenue: 100.005,
      operatingExpenses: 0,
      commission: 0,
      taxesAndFees: 0,
      adjustments: 0,
    })
    expect(totals.netPayout).toBe(100.01)
  })
})

describe('applyOwnershipShare', () => {
  it('applies a 40% ownership share to all property amounts before owner totals', () => {
    const shared = applyOwnershipShare({
      grossRevenue: 10_000,
      operatingExpenses: 1_000,
      commission: 1_500,
      taxesAndFees: 500,
      adjustments: -250,
    }, 0.4)

    expect(shared).toEqual({
      grossRevenue: 4_000,
      operatingExpenses: 400,
      commission: 600,
      taxesAndFees: 200,
      adjustments: -100,
    })

    // The net payout of the shared amounts equals 40% of the full net payout.
    expect(calculateStatementTotals(shared).netPayout).toBe(2_700)
  })
})

describe('ledgerEntryToStatementInput + calculateStatementTotals (integration)', () => {
  it('reproduces the stmt-1 total from the led-1 ledger entry and cr-1 commission', () => {
    const entry = mockOwnerLedgerEntries.find(e => e.id === 'led-1')!
    const commission = calculateCommission({ type: 'flat', rate: 20 }, entry.grossRevenue)
    const input = ledgerEntryToStatementInput(entry, commission)
    const totals = calculateStatementTotals(input)

    const stmt1 = mockOwnerStatements.find(s => s.id === 'stmt-1')!
    expect(totals.netPayout).toBe(stmt1.totalAmount)
  })
})

describe('buildStatementLines', () => {
  it('builds signed statement lines that sum to the net payout', () => {
    const input = {
      grossRevenue: 10_000,
      operatingExpenses: 1_000,
      commission: 1_500,
      taxesAndFees: 500,
      adjustments: -250,
    }
    const lines = buildStatementLines(input)
    const sum = lines.reduce((acc, line) => acc + line.amount, 0)

    expect(sum).toBe(calculateStatementTotals(input).netPayout)
    expect(lines.find(l => l.category === 'revenue')?.amount).toBe(10_000)
    expect(lines.find(l => l.category === 'commission')?.amount).toBe(-1_500)
    expect(lines.find(l => l.category === 'adjustment')?.amount).toBe(-250)
  })

  it('omits the adjustment line when there is no adjustment', () => {
    const lines = buildStatementLines({
      grossRevenue: 10_000,
      operatingExpenses: 1_000,
      commission: 1_500,
      taxesAndFees: 500,
      adjustments: 0,
    })
    expect(lines.some(l => l.category === 'adjustment')).toBe(false)
  })
})
