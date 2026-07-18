import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultTenantBranding } from '~/components/settings/data/branding'
import {
  getTenantBranding,
  resetTenantBranding,
  setTenantBranding,
} from '~/server/utils/tenant-branding-store'

describe('tenant branding store', () => {
  beforeEach(() => resetTenantBranding())

  it('starts with Elev8 defaults', () => {
    expect(getTenantBranding()).toEqual(createDefaultTenantBranding())
  })

  it('stores defensive copies', () => {
    const branding = createDefaultTenantBranding()
    branding.guestGuideColors.primary = '#123456'
    setTenantBranding(branding)
    branding.guestGuideColors.primary = '#000000'

    expect(getTenantBranding().guestGuideColors.primary).toBe('#123456')
  })
})