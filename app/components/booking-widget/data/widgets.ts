export type BookingWidgetMode = 'single' | 'multi'

export interface BookingWidgetPromoCode {
  code: string
  discountType: '%' | 'fixed'
  value: number
  currency?: string | null
  active: boolean
  redemptionCount: number
  validFrom?: string | null
  validUntil?: string | null
}

export interface BookingWidgetConfig {
  id: string
  name: string
  mode: BookingWidgetMode
  listingIds: string[]
  primaryListingId?: string | null
  currency?: string | null
  paymentMethods?: string[]
  defaultPaymentOption?: string | null
  requestNumberOfPersons?: string | null
  contactCopy?: string | null
  legalRequirementsCopy?: string | null
  detailsCopy?: string | null
  successfullyBookedCopy?: string | null
  customStyleCopy?: string | null
  accentColor: string
  cornerRadius: number
  depositPct: number
  minDaysBeforeArrival: number
  allowedDomains: string[]
  promoCodes: BookingWidgetPromoCode[]
  embedVersion: 'v1'
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
}

export const bookingWidgets = ref<BookingWidgetConfig[]>([
  {
    id: 'bk-widget-1',
    name: 'Canggu Portfolio Widget',
    mode: 'multi',
    listingIds: ['lst-1', 'lst-3', 'lst-4'],
    primaryListingId: null,
    accentColor: '#C8A84B',
    cornerRadius: 14,
    depositPct: 30,
    minDaysBeforeArrival: 2,
    allowedDomains: ['partner-bali.com', '*.agency.com'],
    promoCodes: [
      { code: 'WELCOME10', discountType: '%', value: 10, active: true, redemptionCount: 3 },
    ],
    embedVersion: 'v1',
    utmSource: 'partner-bali',
    utmMedium: 'partner-site',
    utmCampaign: 'summer-2026',
  },
])

export function useBookingWidgets() {
  function getWidgetById(id: string) {
    return bookingWidgets.value.find(widget => widget.id === id) ?? null
  }

  function buildEmbedPreview(widget: BookingWidgetConfig) {
    const listingLabel = widget.mode === 'single'
      ? `Listing ${widget.primaryListingId ?? widget.listingIds[0] ?? 'none'}`
      : `${widget.listingIds.length} listings`

    return {
      title: widget.name,
      listingLabel,
      currency: widget.currency ?? 'EUR',
      paymentMethods: widget.paymentMethods ?? [],
      defaultPaymentOption: widget.defaultPaymentOption ?? null,
      requestNumberOfPersons: widget.requestNumberOfPersons ?? null,
      contactCopy: widget.contactCopy ?? null,
      legalRequirementsCopy: widget.legalRequirementsCopy ?? null,
      detailsCopy: widget.detailsCopy ?? null,
      successfullyBookedCopy: widget.successfullyBookedCopy ?? null,
      customStyleCopy: widget.customStyleCopy ?? null,
      accentColor: widget.accentColor,
      cornerRadius: widget.cornerRadius,
      depositPct: widget.depositPct,
      minDaysBeforeArrival: widget.minDaysBeforeArrival,
      allowedDomains: widget.allowedDomains,
      promoCodes: widget.promoCodes,
      embedVersion: widget.embedVersion,
      utmSource: widget.utmSource ?? null,
      utmMedium: widget.utmMedium ?? null,
      utmCampaign: widget.utmCampaign ?? null,
    }
  }

  function copyEmbedSnippet(widget: BookingWidgetConfig) {
    const listingAttr = widget.mode === 'single'
      ? `data-listing="${widget.primaryListingId ?? widget.listingIds[0] ?? ''}"`
      : `data-listings="${widget.listingIds.join(',')}"`

    const utmAttrs = [widget.utmSource ? `data-utm-source="${widget.utmSource}"` : '', widget.utmMedium ? `data-utm-medium="${widget.utmMedium}"` : '', widget.utmCampaign ? `data-utm-campaign="${widget.utmCampaign}"` : '']
      .filter(Boolean)
      .join(' ')

    return [
      `<script async src="https://booking.elev8-suite.com/v1/elev8-booking.js"></script>`,
      `<div class="e8bk-root" ${listingAttr} data-widget-id="${widget.id}" ${utmAttrs}></div>`,
    ].join('\n')
  }

  function getSnippetForForm(widget: BookingWidgetConfig) {
    return copyEmbedSnippet({
      ...widget,
      allowedDomains: widget.allowedDomains ?? [],
      promoCodes: widget.promoCodes ?? [],
      paymentMethods: widget.paymentMethods ?? [],
    })
  }

  return { bookingWidgets, getWidgetById, buildEmbedPreview, copyEmbedSnippet, getSnippetForForm }
}

export function buildEmbedPreview(widget: BookingWidgetConfig) {
  return useBookingWidgets().buildEmbedPreview(widget)
}

export function getSnippetForForm(widget: BookingWidgetConfig) {
  return useBookingWidgets().getSnippetForForm(widget)
}
