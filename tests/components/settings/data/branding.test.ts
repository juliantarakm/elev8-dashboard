import { describe, expect, it } from 'vitest'
import {
  BRANDING_STORAGE_KEY,
  cloneTenantBranding,
  createDefaultTenantBranding,
  getBrandingFaviconHref,
  isTenantBranding,
  resolveInvoiceLogo,
} from '~/components/settings/data/branding'

describe('branding domain', () => {
  it('creates independent Elev8 defaults', () => {
    const first = createDefaultTenantBranding()
    const second = createDefaultTenantBranding()

    first.guestGuideColors.primary = '#000000'

    expect(second.guestGuideColors).toEqual({
      primary: '#F6BB12',
      background: '#FFFFFF',
      text: '#18181B',
    })
    expect(BRANDING_STORAGE_KEY).toBe('elev8-tenant-branding-v1')
  })

  it('deep clones asset and color values', () => {
    const source = createDefaultTenantBranding()
    source.primaryLogo = {
      name: 'logo.png',
      type: 'image/png',
      size: 128,
      dataUrl: 'data:image/png;base64,AA==',
    }

    const clone = cloneTenantBranding(source)
    clone.primaryLogo!.name = 'changed.png'
    clone.guestGuideColors.text = '#000000'

    expect(source.primaryLogo.name).toBe('logo.png')
    expect(source.guestGuideColors.text).toBe('#18181B')
  })

  it('validates the complete branding shape', () => {
    const valid = createDefaultTenantBranding()
    expect(isTenantBranding(valid)).toBe(true)
    expect(isTenantBranding({ ...valid, guestGuideColors: { ...valid.guestGuideColors, text: 'black' } })).toBe(false)
    expect(isTenantBranding({ ...valid, primaryLogo: { name: 'x', type: 'text/plain', size: 1, dataUrl: 'x' } })).toBe(false)
  })

  it('resolves invoice and favicon fallbacks deterministically', () => {
    const branding = createDefaultTenantBranding()
    const primary = { name: 'primary.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' }
    const invoice = { name: 'invoice.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,BB==' }

    branding.primaryLogo = primary
    expect(resolveInvoiceLogo(branding)).toEqual(primary)
    branding.invoiceLogo = invoice
    expect(resolveInvoiceLogo(branding)).toEqual(invoice)
    expect(getBrandingFaviconHref(branding)).toBe('/favicon.ico')
    branding.favicon = { name: 'favicon.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,CC==' }
    expect(getBrandingFaviconHref(branding)).toBe(branding.favicon.dataUrl)
  })
})
