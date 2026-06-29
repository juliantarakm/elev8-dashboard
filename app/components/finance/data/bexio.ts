export interface BexioAccount {
  id: string
  code: string
  name: string
  category: 'asset' | 'liability' | 'revenue' | 'expense'
}

export const bexioAccounts: BexioAccount[] = [
  // ── Assets (1-xxx) ─────────────────────────────────────────────────────
  { id: 'ba-1100', code: '1100', name: 'Bank Account (CHF)', category: 'asset' },
  { id: 'ba-1110', code: '1110', name: 'PostFinance', category: 'asset' },
  // ── Liabilities (2-xxx) ────────────────────────────────────────────────
  { id: 'ba-2100', code: '2100', name: 'Security Deposit Liability', category: 'liability' },
  { id: 'ba-2200', code: '2200', name: 'City Tax Payable (MWST)', category: 'liability' },
  // ── Revenue (3-xxx) ───────────────────────────────────────────────────
  { id: 'ba-3000', code: '3000', name: 'Short-term Rental Revenue (CH)', category: 'revenue' },
  { id: 'ba-3010', code: '3010', name: 'Short-term Rental Revenue (Bali)', category: 'revenue' },
  { id: 'ba-3100', code: '3100', name: 'Long-term Rental Revenue', category: 'revenue' },
  { id: 'ba-3200', code: '3200', name: 'Upsell & Additional Services', category: 'revenue' },
  { id: 'ba-3300', code: '3300', name: 'Transfer & Logistics Revenue', category: 'revenue' },
  { id: 'ba-3400', code: '3400', name: 'Forfeited Deposit Revenue', category: 'revenue' },
  // ── Expenses (4-xxx, 5-xxx) ───────────────────────────────────────────
  { id: 'ba-4000', code: '4000', name: 'Platform Fees', category: 'expense' },
  { id: 'ba-5000', code: '5000', name: 'Operating Costs', category: 'expense' },
  { id: 'ba-6100', code: '6000', name: 'OTA Merchant Fees', category: 'expense' },
]

// Helper to filter accounts by category
export function getAccountsByCategory(category: BexioAccount['category']): BexioAccount[] {
  return bexioAccounts.filter(a => a.category === category)
}

// Helper to filter accounts by code prefix
export function getAccountsByPrefix(prefix: string): BexioAccount[] {
  return bexioAccounts.filter(a => a.code.startsWith(prefix))
}

// Helper to get expense accounts (4-xxx, 5-xxx, 6-xxx)
export function getExpenseAccounts(): BexioAccount[] {
  return bexioAccounts.filter(a => a.category === 'expense')
}
