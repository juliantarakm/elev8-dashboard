import { computed, ref } from 'vue'
import { bexioAccounts } from '@/components/finance/data/bexio'
import { allListings, useListingMappings } from '@/composables/useListingMappings'

export type BexioStep = 'connect' | 'mapping' | 'connected'

export function useBexio() {
  const isConnected = useState<boolean>('bexio-connected', () => false)
  const step = useState<BexioStep>('bexio-step', () => 'connect')
  const apiKey = useState<string>('bexio-api-key', () => '')
  const apiKeyInput = ref('')
  const companyName = useState<string>('bexio-company', () => '')
  const lastConnected = useState<string | null>('bexio-last-connected', () => null)
  const isSaving = ref(false)

  // Local tag selections (bexio-only, during the setup flow)
  const localSelections = useState<Record<string, string>>('bexio-local-selections', () => ({
    'The R Apartment Rosengasse': 'Schaffhausen',
    'Luxurious Renovated Apartment in Basel': 'Basel',
    'The R Apartment Margaretha - free public transport': 'Basel',
    'The R Apartment Hurbig - old Town': 'Schaffhausen',
    'The R Apartment Roggen': 'Kestenholz',
    'The R Apartment Chrischona - free public transport': 'Basel',
    'The R Apartment Adlisberg': 'Zürich',
    'The R Suites Hasenberg': 'Aargau',
    'The R Apartment Munot - Old Town': 'Schaffhausen',
    'The R Apartment Hemmental': 'Schaffhausen',
    'The R Apartment Froburg, Parking, ÖV, Golfplatz': 'Obergösgen',
    'The R Apartment Weinsteig': 'Schaffhausen',
    'The R Loft (Suites)': 'Olten',
    'The R Apartment Engelberg, Gym, Balkon, Parking': 'Solothurn',
    'The R Hasenberg Suite': 'Widen',
    'The R Apartment Passwang, Gym, Balkon, Parking': 'Solothurn',
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
        pre[l.name] = existing.tag
    })
    localSelections.value = pre
    isConnected.value = true
    step.value = 'connected'
    isSaving.value = false
  }

  function setLocalSelection(listingName: string, tag: string) {
    localSelections.value = { ...localSelections.value, [listingName]: tag }
  }

  function applyTagToAll(tag: string, region?: 'Bali' | 'Switzerland') {
    const updated = { ...localSelections.value }
    bexioListings
      .filter(l => !region || l.region === region)
      .filter(l => getMappingFor(l.name)?.integration !== 'jurnal')
      .forEach((l) => { updated[l.name] = tag })
    localSelections.value = updated
  }

  function confirmMapping() {
    // Clear existing bexio mappings then write new ones
    bexioListings.forEach((l) => {
      const existing = getMappingFor(l.name)
      if (existing?.integration === 'bexio')
        clearMapping(l.name)
    })
    Object.entries(localSelections.value).forEach(([name, tag]) => {
      if (tag)
        setMapping(name, 'bexio', tag)
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

  // Read from shared mappings for the summary view
  const confirmedMappings = computed(() =>
    bexioListings.map(l => ({
      ...l,
      tag: getMappingFor(l.name)?.integration === 'bexio' ? getMappingFor(l.name)!.tag : '',
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
    applyTagToAll,
    confirmMapping,
    editMapping,
    disconnect,
  }
}
