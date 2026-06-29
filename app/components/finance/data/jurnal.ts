export interface JurnalAccount {
  id: string
  code: string
  name: string
  category: 'asset' | 'liability' | 'revenue' | 'expense'
}

export const jurnalAccounts: JurnalAccount[] = [
  // ── Assets (1-xxx) ─────────────────────────────────────────────────────
  { id: 'ja-1100', code: '1-1100', name: 'Kas dan Bank', category: 'asset' },
  { id: 'ja-1110', code: '1-1110', name: 'Bank BCA', category: 'asset' },
  { id: 'ja-1120', code: '1-1120', name: 'Bank Mandiri', category: 'asset' },
  // ── Liabilities (2-xxx) ────────────────────────────────────────────────
  { id: 'ja-2100', code: '2-1100', name: 'Deposit Jaminan (Security Deposit)', category: 'liability' },
  { id: 'ja-2200', code: '2-1200', name: 'Hutang Pajak Hotel (City Tax)', category: 'liability' },
  // ── Revenue (4-xxx) ───────────────────────────────────────────────────
  { id: 'ja-4100', code: '4-10000', name: 'Pendapatan Sewa Harian – Switzerland', category: 'revenue' },
  { id: 'ja-4110', code: '4-10100', name: 'Pendapatan Sewa Harian – Bali', category: 'revenue' },
  { id: 'ja-4200', code: '4-10200', name: 'Pendapatan Sewa Jangka Panjang', category: 'revenue' },
  { id: 'ja-4300', code: '4-20000', name: 'Pendapatan Jasa Tambahan (Upsell)', category: 'revenue' },
  { id: 'ja-4400', code: '4-30000', name: 'Pendapatan Deposit Diklaim (Forfeited)', category: 'revenue' },
  // ── Expenses (5-xxx) ──────────────────────────────────────────────────
  { id: 'ja-5100', code: '5-10000', name: 'Biaya Platform (Fee)', category: 'expense' },
  { id: 'ja-5200', code: '5-20000', name: 'Biaya Pemeliharaan', category: 'expense' },
  { id: 'ja-5300', code: '5-30000', name: 'Biaya Utilitas', category: 'expense' },
  { id: 'ja-5400', code: '5-40000', name: 'Biaya Operasional (Cost)', category: 'expense' },
  // ── COGS / Direct Costs (6-xxx) ───────────────────────────────────────
  { id: 'ja-6100', code: '6-0110', name: 'Biaya Merchant (OTA Fee)', category: 'expense' },
]

// Helper to filter accounts by category
export function getAccountsByCategory(category: JurnalAccount['category']): JurnalAccount[] {
  return jurnalAccounts.filter(a => a.category === category)
}

// Helper to filter accounts by code prefix
export function getAccountsByPrefix(prefix: string): JurnalAccount[] {
  return jurnalAccounts.filter(a => a.code.startsWith(prefix))
}

// Helper to get expense accounts (5-xxx and 6-xxx)
export function getExpenseAccounts(): JurnalAccount[] {
  return jurnalAccounts.filter(a => a.category === 'expense')
}

export type SyncType = 'Cost' | 'Revenue'
export type SyncStatus = 'Success' | 'Failed' | 'Partial'

export interface SyncLog {
  id: string
  date: string
  type: SyncType
  entriesTotal: number
  entriesSuccess: number
  status: SyncStatus
  jurnalReference?: string
  errorMessage?: string
  pushedBy: string
}

export const mockSyncLogs: SyncLog[] = [
  {
    id: 'sync-1',
    date: '2026-05-07T14:22:00Z',
    type: 'Cost',
    entriesTotal: 4,
    entriesSuccess: 4,
    status: 'Success',
    jurnalReference: 'JRN-2026-0501',
    pushedBy: 'Komang Juliantara',
  },
  {
    id: 'sync-2',
    date: '2026-05-07T14:20:00Z',
    type: 'Revenue',
    entriesTotal: 12,
    entriesSuccess: 12,
    status: 'Success',
    jurnalReference: 'JRN-2026-0502',
    pushedBy: 'Komang Juliantara',
  },
  {
    id: 'sync-3',
    date: '2026-04-30T09:10:00Z',
    type: 'Cost',
    entriesTotal: 6,
    entriesSuccess: 5,
    status: 'Partial',
    jurnalReference: 'JRN-2026-0489',
    errorMessage: '1 entry failed: account code not found in Jurnal chart of accounts.',
    pushedBy: 'Komang Juliantara',
  },
  {
    id: 'sync-4',
    date: '2026-04-30T09:05:00Z',
    type: 'Revenue',
    entriesTotal: 16,
    entriesSuccess: 16,
    status: 'Success',
    jurnalReference: 'JRN-2026-0488',
    pushedBy: 'Komang Juliantara',
  },
  {
    id: 'sync-5',
    date: '2026-04-15T11:45:00Z',
    type: 'Cost',
    entriesTotal: 3,
    entriesSuccess: 0,
    status: 'Failed',
    errorMessage: 'Authentication failed. API key may have expired.',
    pushedBy: 'Komang Juliantara',
  },
]
