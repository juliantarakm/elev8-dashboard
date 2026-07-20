import type { PublicGuestGuideBranding } from '~/components/settings/data/branding'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createDefaultTenantBranding } from '~/components/settings/data/branding'
import { buildGuestGuideCssVariables } from '~/lib/branding-colors'
import BrandHeader from '../../guide-app/app/components/BrandHeader.vue'

function createPublicBranding(): PublicGuestGuideBranding {
  const tenant = createDefaultTenantBranding()
  return {
    primaryLogo: tenant.primaryLogo,
    favicon: tenant.favicon,
    guestGuideColors: tenant.guestGuideColors,
    cssVariables: buildGuestGuideCssVariables(tenant.guestGuideColors),
  }
}

describe('Guest Guide BrandHeader', () => {
  it('omits the bar when no custom primary logo exists', () => {
    const wrapper = mount(BrandHeader, { props: { branding: createPublicBranding() } })
    expect(wrapper.find('[data-testid="guest-guide-brand-header"]').exists()).toBe(false)
  })

  it('renders the custom primary logo', () => {
    const branding = createPublicBranding()
    branding.primaryLogo = {
      name: 'logo.png',
      type: 'image/png',
      size: 1,
      dataUrl: 'data:image/png;base64,AA==',
    }
    const wrapper = mount(BrandHeader, { props: { branding } })

    const image = wrapper.get('[data-testid="guest-guide-brand-logo"]')
    expect(image.attributes('src')).toBe(branding.primaryLogo.dataUrl)
    expect(image.attributes('alt')).toBe('Property manager logo')
  })
})
