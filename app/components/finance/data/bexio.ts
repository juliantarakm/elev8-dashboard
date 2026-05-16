export interface BexioAccount {
  id: string
  code: string
  name: string
}

export const bexioAccounts: BexioAccount[] = [
  { id: 'ba-3000', code: '3000', name: 'Short-term Rental Revenue (CH)' },
  { id: 'ba-3010', code: '3010', name: 'Short-term Rental Revenue (Bali)' },
  { id: 'ba-3100', code: '3100', name: 'Long-term Rental Revenue' },
  { id: 'ba-3200', code: '3200', name: 'Upsell & Additional Services' },
  { id: 'ba-3300', code: '3300', name: 'Transfer & Logistics Revenue' },
]
