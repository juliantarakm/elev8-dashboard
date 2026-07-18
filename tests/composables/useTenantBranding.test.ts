import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cloneTenantBranding,
  createDefaultTenantBranding,
} from '~/components/settings/data/branding'
import { useTenantBranding } from '~/composables/useTenantBranding'

const storage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
}
const fetchMock = vi.fn()

beforeEach(() => {
  storage.getItem.mockReset().mockReturnValue(null)
  storage.setItem.mockReset()
  fetchMock.mockReset().mockResolvedValue({})
  vi.stubGlobal('localStorage', storage)
  vi.stubGlobal('useRuntimeConfig', () => ({ app: { baseURL: '/dashboard/' } }))
  vi.stubGlobal('$fetch', fetchMock)
})

describe('useTenantBranding', () => {
  it('starts from Elev8 defaults', () => {
    const { branding, resolvedInvoiceLogo, faviconHref } = useTenantBranding()
    expect(branding.value).toEqual(createDefaultTenantBranding())
    expect(resolvedInvoiceLogo.value).toBeNull()
    expect(faviconHref.value).toBe('/favicon.ico')
  })

  it('hydrates a valid stored value and synchronizes it', async () => {
    const stored = createDefaultTenantBranding()
    stored.guestGuideColors.primary = '#123456'
    storage.getItem.mockReturnValue(JSON.stringify(stored))

    const { branding, hydrateBranding } = useTenantBranding()
    expect(hydrateBranding()).toBe(true)

    expect(branding.value.guestGuideColors.primary).toBe('#123456')
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/dashboard/api/tenant-branding', {
      method: 'PUT',
      body: stored,
    }))
  })

  it('ignores invalid stored data', () => {
    storage.getItem.mockReturnValue(JSON.stringify({ guestGuideColors: { primary: 'bad' } }))
    const { branding, hydrateBranding } = useTenantBranding()
    expect(hydrateBranding()).toBe(false)
    expect(branding.value).toEqual(createDefaultTenantBranding())
  })

  it('does not change saved state when LocalStorage fails', async () => {
    storage.setItem.mockImplementation(() => { throw new Error('quota') })
    const { branding, saveBranding } = useTenantBranding()
    const before = cloneTenantBranding(branding.value)
    const draft = createDefaultTenantBranding()
    draft.guestGuideColors.primary = '#123456'

    const result = await saveBranding(draft)

    expect(result).toEqual({ saved: false, synced: false, error: 'Unable to save branding in this browser.' })
    expect(branding.value).toEqual(before)
  })

  it('keeps a local save and exposes retry state when synchronization fails', async () => {
    ;(fetchMock as any).mockRejectedValue(new Error('offline'))
    const { branding, lastSyncError, saveBranding, syncGuestGuideBranding } = useTenantBranding()
    const draft = createDefaultTenantBranding()
    draft.guestGuideColors.primary = '#123456'

    const result = await saveBranding(draft)

    expect(result.saved).toBe(true)
    expect(result.synced).toBe(false)
    expect(branding.value.guestGuideColors.primary).toBe('#123456')
    expect(lastSyncError.value).toBe('Guest Guide branding could not be synchronized.')

    ;(fetchMock as any).mockResolvedValue({})
    await expect(syncGuestGuideBranding()).resolves.toBe(true)
    expect(lastSyncError.value).toBeNull()
  })

  it('uses the primary logo as the invoice fallback', () => {
    const { branding, resolvedInvoiceLogo } = useTenantBranding()
    branding.value = {
      ...branding.value,
      primaryLogo: { name: 'logo.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' },
    }
    expect(resolvedInvoiceLogo.value?.name).toBe('logo.png')
  })
})
