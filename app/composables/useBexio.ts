import { computed, ref } from 'vue'
import { bexioAccounts } from '@/components/finance/data/bexio'
import { allListings, useListingMappings } from '@/composables/useListingMappings'

export type BexioStep = 'connect' | 'mapping' | 'connected'

export function useBexio() {
  const isConnected = useState<boolean>('bexio-connected', () => true)
  const step = useState<BexioStep>('bexio-step', () => 'connected')
  const apiKey = useState<string>('bexio-api-key', () => 'bx-••••••••••••••••••••••••')
  const apiKeyInput = ref('')
  const companyName = useState<string>('bexio-company', () => 'Elev8 Suite AG')
  const lastConnected = useState<string | null>('bexio-last-connected', () => '2026-05-01')
  const isSaving = ref(false)

  // Local mapping selection (bexio-only, during the setup flow)
  // Pre-seeded to match the initial shared mappings for Bexio
  const localSelections = useState<Record<string, string>>('bexio-local-selections', () => ({
    'The R Apartment Rosengasse': 'ba-3000',
    'Luxurious Renovated Apartment in Basel': 'ba-3000',
    'The R Apartment Margaretha - free public transport': 'ba-3000',
    'The R Apartment Hurbig - old Town': 'ba-3000',
    'The R Apartment Roggen': 'ba-3000',
    'The R Apartment Chrischona - free public transport': 'ba-3000',
    'The R Apartment Adlisberg': 'ba-3000',
    'The R Suites Hasenberg': 'ba-3000',
    'The R Apartment Munot - Old Town': 'ba-3000',
    'The R Apartment Hemmental': 'ba-3000',
    'The R Apartment Froburg, Parking, ÖV, Golfplatz': 'ba-3000',
    'The R Apartment Weinsteig': 'ba-3000',
    'The R Loft (Suites)': 'ba-3000',
    'The R Apartment Engelberg, Gym, Balkon, Parking': 'ba-3000',
    'The R Hasenberg Suite': 'ba-3000',
    'The R Apartment Passwang, Gym, Balkon, Parking': 'ba-3000',
  }))

  const { setMapping, clearMapping, getMappingFor, mappings } = useListingMappings()

  const bexioListings = allListings

  const availableListings = computed(() =>
    bexioListings.filter(l => getMappingFor(l.name)?.integration !== 'jurnal'),
  )

  const localMappedCount = computed(() =>
    availableListings.value.filter(l => !!localSelections.value[l.name]).length,
  )
  const isFullyMapped = computed(() => localMappedCount.value === availableListings.value.length)

  // bexio uses CHF — same as our base currency
  const accountingCurrency = 'CHF'
  const exchangeRate = 1

  function convertToAccounting(chf: number): number {
    return chf
  }

  function formatAccounting(amount: number): string {
    return `CHF ${amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  async function connect(key: string) {
    isSaving.value = true
    await new Promise(r => setTimeout(r, 1200))
    apiKey.value = key.replace(/.(?=.{4})/g, '•')
    apiKeyInput.value = ''
    companyName.value = 'Elev8 Suite AG'
    lastConnected.value = new Date().toISOString().slice(0, 10)
    // Pre-fill local selections from existing mappings (listings already mapped to bexio)
    const pre: Record<string, string> = {}
    bexioListings.forEach((l) => {
      const existing = getMappingFor(l.name)
      if (existing?.integration === 'bexio')
        pre[l.name] = existing.accountId
    })
    localSelections.value = pre
    step.value = 'mapping'
    isSaving.value = false
  }

  function setLocalSelection(listingName: string, accountId: string) {
    localSelections.value = { ...localSelections.value, [listingName]: accountId }
  }

  function applyAccountToAll(accountId: string, region?: 'Bali' | 'Switzerland') {
    const updated = { ...localSelections.value }
    bexioListings
      .filter(l => !region || l.region === region)
      .filter(l => getMappingFor(l.name)?.integration !== 'jurnal')
      .forEach((l) => { updated[l.name] = accountId })
    localSelections.value = updated
  }

  function confirmMapping() {
    // Clear existing bexio mappings then write new ones
    bexioListings.forEach((l) => {
      const existing = getMappingFor(l.name)
      if (existing?.integration === 'bexio')
        clearMapping(l.name)
    })
    Object.entries(localSelections.value).forEach(([name, accountId]) => {
      if (accountId)
        setMapping(name, 'bexio', accountId)
    })
    isConnected.value = true
    step.value = 'connected'
  }

  function editMapping() {
    step.value = 'mapping'
  }

  function disconnect() {
    // Remove bexio mappings from shared state
    bexioListings.forEach((l) => {
      const existing = getMappingFor(l.name)
      if (existing?.integration === 'bexio')
        clearMapping(l.name)
    })
    isConnected.value = false
    step.value = 'connect'
    apiKey.value = ''
    companyName.value = ''
    lastConnected.value = null
    localSelections.value = {}
  }

  function accountLabel(id: string) {
    const acc = bexioAccounts.find(a => a.id === id)
    return acc ? `${acc.code} – ${acc.name}` : '—'
  }

  // Read from shared mappings for the summary view
  const confirmedMappings = computed(() =>
    bexioListings.map(l => ({
      ...l,
      accountId: getMappingFor(l.name)?.integration === 'bexio' ? getMappingFor(l.name)!.accountId : '',
    })),
  )

  return {
    isConnected,
    step,
    apiKey,
    apiKeyInput,
    companyName,
    lastConnected,
    isSaving,
    bexioListings,
    bexioAccounts,
    localSelections,
    localMappedCount,
    availableListings,
    isFullyMapped,
    confirmedMappings,
    accountingCurrency,
    exchangeRate,
    convertToAccounting,
    formatAccounting,
    connect,
    setLocalSelection,
    applyAccountToAll,
    confirmMapping,
    editMapping,
    disconnect,
    accountLabel,
  }
}
