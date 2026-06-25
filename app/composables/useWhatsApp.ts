import { computed, ref } from 'vue'

export interface WhatsAppAccount {
  id: string
  phoneNumber: string
  businessName: string
  status: 'connected' | 'disconnected' | 'pending'
  connectedAt: string
  listingIds: string[]
}

const defaultAccounts: WhatsAppAccount[] = [
  {
    id: 'wa-1',
    phoneNumber: '+49 170 1234567',
    businessName: 'Zum Grauen Wolf',
    status: 'connected',
    connectedAt: 'June 15, 2026',
    listingIds: ['lst-1', 'lst-2'],
  },
]

export function useWhatsApp() {
  const whatsappAccounts = useState<WhatsAppAccount[]>('whatsapp-accounts', () =>
    defaultAccounts.map(a => ({ ...a, listingIds: [...a.listingIds] })),
  )

  const isConnected = computed(() => whatsappAccounts.value.some(a => a.status === 'connected'))

  function connect(account: Omit<WhatsAppAccount, 'id' | 'connectedAt'>) {
    const newAccount: WhatsAppAccount = {
      ...account,
      id: `wa-${Date.now()}`,
      connectedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    }
    whatsappAccounts.value = [...whatsappAccounts.value, newAccount]
  }

  function disconnect() {
    whatsappAccounts.value = []
  }

  function addAccount(account: WhatsAppAccount) {
    whatsappAccounts.value = [...whatsappAccounts.value, account]
  }

  function updateAccount(id: string, updates: Partial<WhatsAppAccount>) {
    whatsappAccounts.value = whatsappAccounts.value.map(a =>
      a.id === id ? { ...a, ...updates } : a,
    )
  }

  function removeAccount(id: string) {
    whatsappAccounts.value = whatsappAccounts.value.filter(a => a.id !== id)
  }

  function assignListings(accountId: string, listingIds: string[]) {
    // Remove listings from other accounts first (one account per listing)
    whatsappAccounts.value = whatsappAccounts.value.map((a) => {
      if (a.id === accountId) {
        return { ...a, listingIds: [...listingIds] }
      }
      return { ...a, listingIds: a.listingIds.filter(id => !listingIds.includes(id)) }
    })
  }

  function bulkAssign(accountId: string, listingIds: string[]) {
    whatsappAccounts.value = whatsappAccounts.value.map((a) => {
      if (a.id === accountId) {
        const merged = Array.from(new Set([...a.listingIds, ...listingIds]))
        return { ...a, listingIds: merged }
      }
      return { ...a, listingIds: a.listingIds.filter(id => !listingIds.includes(id)) }
    })
  }

  return {
    whatsappAccounts,
    isConnected,
    connect,
    disconnect,
    addAccount,
    updateAccount,
    removeAccount,
    assignListings,
    bulkAssign,
  }
}
