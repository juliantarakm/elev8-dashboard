import { computed } from 'vue'
import { useBexio } from '@/composables/useBexio'
import { useJurnal } from '@/composables/useJurnal'
import { useListingMappings } from '@/composables/useListingMappings'

export function useActiveIntegration() {
  const jurnal = useJurnal()
  const bexio = useBexio()
  const { hasAnyMapping, getMappingFor, mappedByIntegration } = useListingMappings()

  // Show the accounting column if any integration is connected and has mapped listings
  const showConvertedColumn = computed(() => {
    if (!hasAnyMapping.value)
      return false
    if (mappedByIntegration.value.jurnal > 0 && jurnal.isConnected.value)
      return true
    if (mappedByIntegration.value.bexio > 0 && bexio.isConnected.value)
      return true
    return false
  })

  // Per-listing: return the formatted accounting amount for the mapped integration
  function getAccountingAmount(listingName: string, chfAmount: number): string | null {
    const mapping = getMappingFor(listingName)
    if (!mapping)
      return null

    if (mapping.integration === 'jurnal' && jurnal.isConnected.value) {
      return jurnal.formatAccounting(jurnal.convertToAccounting(chfAmount))
    }
    if (mapping.integration === 'bexio' && bexio.isConnected.value) {
      return bexio.formatAccounting(bexio.convertToAccounting(chfAmount))
    }
    return null
  }

  // For cost entries: amount is already in the cost's own currency (IDR, CHF, or other).
  // Convert to the integration's accounting currency as needed.
  // Returns null (→ '—') if the currency pair has no known conversion rate.
  function getCostAccountingAmount(listingName: string, amount: number, currency: string): string | null {
    const mapping = getMappingFor(listingName)
    if (!mapping)
      return null

    if (mapping.integration === 'jurnal' && jurnal.isConnected.value) {
      if (currency === 'IDR')
        return jurnal.formatAccounting(amount)
      if (currency === 'CHF')
        return jurnal.formatAccounting(Math.round(amount * jurnal.exchangeRate))
      return null // EUR, USD, etc. — no rate available
    }
    if (mapping.integration === 'bexio' && bexio.isConnected.value) {
      if (currency === 'CHF')
        return bexio.formatAccounting(amount)
      if (currency === 'IDR')
        return bexio.formatAccounting(amount / jurnal.exchangeRate)
      return null
    }
    return null
  }

  return {
    showConvertedColumn,
    getAccountingAmount,
    getCostAccountingAmount,
  }
}
