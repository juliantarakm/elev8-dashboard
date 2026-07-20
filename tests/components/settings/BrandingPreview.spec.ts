import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BrandingPreview from '~/components/settings/BrandingPreview.vue'
import { createDefaultTenantBranding } from '~/components/settings/data/branding'
import { buildGuestGuideCssVariables } from '~/lib/branding-colors'

const tabStubs = {
  Tabs: { template: '<div><slot /></div>' },
  TabsList: { template: '<div><slot /></div>' },
  TabsTrigger: { template: '<button><slot /></button>' },
  TabsContent: { template: '<div><slot /></div>' },
  Icon: true,
}

describe('brandingPreview', () => {
  it('uses draft Guest Guide variables', () => {
    const branding = createDefaultTenantBranding()
    branding.guestGuideColors.primary = '#123456'
    const wrapper = mount(BrandingPreview, { props: { branding }, global: { stubs: tabStubs } })
    const element = wrapper.get('[data-testid="guest-guide-preview"]').element as HTMLElement
    const expected = buildGuestGuideCssVariables(branding.guestGuideColors)
    expect(element.style.getPropertyValue('--primary')).toBe(expected['--primary'])
  })

  it('uses primary logo as invoice fallback', () => {
    const branding = createDefaultTenantBranding()
    branding.primaryLogo = { name: 'primary.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' }
    const wrapper = mount(BrandingPreview, { props: { branding }, global: { stubs: tabStubs } })
    expect(wrapper.get('[data-testid="invoice-preview-logo"]').attributes('src')).toBe(branding.primaryLogo.dataUrl)
  })

  it('prefers the invoice-specific logo', () => {
    const branding = createDefaultTenantBranding()
    branding.primaryLogo = { name: 'primary.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' }
    branding.invoiceLogo = { name: 'invoice.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,BB==' }
    const wrapper = mount(BrandingPreview, { props: { branding }, global: { stubs: tabStubs } })
    expect(wrapper.get('[data-testid="invoice-preview-logo"]').attributes('src')).toBe(branding.invoiceLogo.dataUrl)
  })
})
