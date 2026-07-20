import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultTenantBranding } from '~/components/settings/data/branding'
import { buildGuestGuideCssVariables } from '~/lib/branding-colors'
import handler from '~/server/api/guest-guides/by-token/[token].get'
import { resetTenantBranding, setTenantBranding } from '~/server/utils/tenant-branding-store'

function invoke(token: string) {
  return handler({
    context: { params: { token } },
    node: { req: { url: `/api/guest-guides/by-token/${token}` }, res: {} },
  } as any)
}

describe('GET /api/guest-guides/by-token/:token branding', () => {
  beforeEach(() => resetTenantBranding())

  it('includes the singleton branding object', async () => {
    const branding = createDefaultTenantBranding()
    branding.guestGuideColors.primary = '#123456'
    branding.invoiceLogo = { name: 'private.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' }
    setTenantBranding(branding)

    const result = await invoke('abc123def456')

    expect(result.branding).toEqual({
      primaryLogo: branding.primaryLogo,
      favicon: branding.favicon,
      guestGuideColors: branding.guestGuideColors,
      cssVariables: buildGuestGuideCssVariables(branding.guestGuideColors),
    })
    expect(result.branding).not.toHaveProperty('invoiceLogo')
    expect(result.guide.id).toBe('gg-mock-001')
  })
})
