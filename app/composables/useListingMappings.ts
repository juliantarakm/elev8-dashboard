import { computed } from 'vue'
import { revenueByListing } from '@/components/finance/data/revenue'

export type MappingIntegration = 'jurnal' | 'bexio'

export interface ListingMapping {
  integration: MappingIntegration
  accountId: string
}

const BALI_KEYWORDS = ['Tambora', 'Kalmantan', 'Pererenan', 'Sinabung', 'Merapi', 'Sanur', 'Ubud', 'Canggu', 'Bali', 'Badung', 'Kerobokan']

export const allListings = revenueByListing.map(r => ({
  name: r.listing,
  city: r.city,
  region: BALI_KEYWORDS.some(k => r.city.includes(k) || r.listing.includes(k)) ? 'Bali' : 'Switzerland' as 'Bali' | 'Switzerland',
}))

const initialMappings: Record<string, ListingMapping> = {
  // ── Jurnal (IDR) — Bali listings ──────────────────────────────────────────
  'The R Pererenan Mezzanine Studio + Plunge Pool': { integration: 'jurnal', accountId: 'ja-4110' },
  'Cozy 2BR - the R Villa Sinabung w/ Pool in Sanur': { integration: 'jurnal', accountId: 'ja-4110' },
  'Cozy 2BR- the R Villa Sinabung w/ Pool in Sanur': { integration: 'jurnal', accountId: 'ja-4110' },
  'The R Villa Merapi': { integration: 'jurnal', accountId: 'ja-4110' },
  'TAMBORA - The R Tambora: Stylish 3BR Tropical Escape': { integration: 'jurnal', accountId: 'ja-4110' },
  'The R Loft - Cosy Suite Kalmantan incl Breakfast': { integration: 'jurnal', accountId: 'ja-4110' },
  'The R Loft - Cosy Suite Kalmantan incl Breakfast, Roof Top': { integration: 'jurnal', accountId: 'ja-4110' },
  'The R Loft Bali - Cosy Room incl Breakfast, Roof Top': { integration: 'jurnal', accountId: 'ja-4110' },
  'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu': { integration: 'jurnal', accountId: 'ja-4110' },
  'KABA - Stylish 2BR the R Villa Kaba-Kerobokan+Pool/Bikes': { integration: 'jurnal', accountId: 'ja-4110' },
  'The R Apartments Studio walk to the Beach': { integration: 'jurnal', accountId: 'ja-4110' },
  'Tranquil the R Villa Patuha-Pool/Rice Field Views': { integration: 'jurnal', accountId: 'ja-4110' },
  'Cozy Meets Luxe – 3BR the R Villa Ranakah Stay': { integration: 'jurnal', accountId: 'ja-4110' },
  'Tropical 2BR the R Villa Dempo w/Pool - Pererenan': { integration: 'jurnal', accountId: 'ja-4110' },
  '2BR-Tropical Escape at Villa Toba | Pool & Bikes': { integration: 'jurnal', accountId: 'ja-4110' },
  '5BR Pool the R Villa Luwa – Serene near Canggu': { integration: 'jurnal', accountId: 'ja-4110' },
  'Modern 2BR the R Villa Swantika w/Pool - Pererenan': { integration: 'jurnal', accountId: 'ja-4110' },
  'The R Pererenan Mezzanine Apartment w/ balcony': { integration: 'jurnal', accountId: 'ja-4110' },
  'The R Villa Samalas | 4BR Retreat in Pererenan': { integration: 'jurnal', accountId: 'ja-4110' },
  // ── Jurnal (IDR) — Switzerland listings ───────────────────────────────────
  'Modern Apartment in Schaffhausen Center': { integration: 'jurnal', accountId: 'ja-4100' },
  'The R Apartment Zugerberg - EV Wallbox - Terrasse': { integration: 'jurnal', accountId: 'ja-4100' },
  'The R Apartment Hagen': { integration: 'jurnal', accountId: 'ja-4100' },
  'The R Apartment Uetliberg, Klima, Parken - Wallbox': { integration: 'jurnal', accountId: 'ja-4100' },
  'The R Apartment Mittelfelsen - Quiet, Free Parking': { integration: 'jurnal', accountId: 'ja-4100' },
  'The R Apartment Vogelberg, Gym, Balkon, Parking': { integration: 'jurnal', accountId: 'ja-4100' },
  'The R Apartment Laufen - relaxing, free parking': { integration: 'jurnal', accountId: 'ja-4100' },
  'Stockhorn Loft - central, free parking': { integration: 'jurnal', accountId: 'ja-4100' },
  'The R Apartment Farnsberg': { integration: 'jurnal', accountId: 'ja-4100' },
  'The R Apartment Rheinfall - central, free parking': { integration: 'jurnal', accountId: 'ja-4100' },
  'The R Apartment Randen': { integration: 'jurnal', accountId: 'ja-4100' },
  'The R Apartment Bodensee - Old Town': { integration: 'jurnal', accountId: 'ja-4100' },
  // ── Bexio (CHF) — Switzerland listings ───────────────────────────────────
  'The R Loft - Cosy Suite incl Breakfast, Roof Top': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Loft - Cosy Suite incl Breakfast, Roof Top, Communal Kitchen and Bathroom': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Apartment Rosengasse': { integration: 'bexio', accountId: 'ba-3000' },
  'Luxurious Renovated Apartment in Basel': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Apartment Margaretha - free public transport': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Apartment Hurbig - old Town': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Apartment Roggen': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Apartment Chrischona - free public transport': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Apartment Adlisberg': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Suites Hasenberg': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Apartment Munot - Old Town': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Apartment Hemmental': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Apartment Froburg, Parking, ÖV, Golfplatz': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Apartment Weinsteig': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Loft (Suites)': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Apartment Engelberg, Gym, Balkon, Parking': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Hasenberg Suite': { integration: 'bexio', accountId: 'ba-3000' },
  'The R Apartment Passwang, Gym, Balkon, Parking': { integration: 'bexio', accountId: 'ba-3000' },
}

export function useListingMappings() {
  const mappings = useState<Record<string, ListingMapping>>('listing-integration-mappings', () => ({ ...initialMappings }))

  const mappedCount = computed(() =>
    allListings.filter(l => !!mappings.value[l.name]).length,
  )

  const mappedByIntegration = computed(() => {
    const counts = { jurnal: 0, bexio: 0 }
    Object.values(mappings.value).forEach(m => counts[m.integration]++)
    return counts
  })

  const hasAnyMapping = computed(() => mappedCount.value > 0)

  function setMapping(listingName: string, integration: MappingIntegration, accountId: string) {
    mappings.value = { ...mappings.value, [listingName]: { integration, accountId } }
  }

  function clearMapping(listingName: string) {
    const updated = { ...mappings.value }
    delete updated[listingName]
    mappings.value = updated
  }

  function applyToAll(integration: MappingIntegration, accountId: string, region?: 'Bali' | 'Switzerland') {
    const updated = { ...mappings.value }
    allListings
      .filter(l => !region || l.region === region)
      .forEach((l) => { updated[l.name] = { integration, accountId } })
    mappings.value = updated
  }

  function getMappingFor(listingName: string): ListingMapping | null {
    return mappings.value[listingName] ?? null
  }

  return {
    mappings,
    mappedCount,
    mappedByIntegration,
    hasAnyMapping,
    totalListings: allListings.length,
    setMapping,
    clearMapping,
    applyToAll,
    getMappingFor,
  }
}
