import type { TenantBranding } from '~/components/settings/data/branding'
import { computed, getCurrentInstance, onMounted } from 'vue'
import {
  BRANDING_STORAGE_KEY,
  cloneTenantBranding,
  createDefaultTenantBranding,
  getBrandingFaviconHref,
  isTenantBranding,
  resolveInvoiceLogo,
} from '~/components/settings/data/branding'

export interface BrandingSaveResult {
  saved: boolean
  synced: boolean
  error?: string
}

function isClientRuntime(): boolean {
  return import.meta.client || typeof window !== 'undefined'
}

function readStoredBranding(): TenantBranding | null {
  if (!isClientRuntime())
    return null
  try {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY)
    if (!raw)
      return null
    const parsed: unknown = JSON.parse(raw)
    return isTenantBranding(parsed) ? cloneTenantBranding(parsed) : null
  }
  catch {
    return null
  }
}

function getBrandingApiUrl(): string {
  const baseURL = useRuntimeConfig().app.baseURL || '/'
  return `${baseURL.replace(/\/$/, '')}/api/tenant-branding`
}

export function useTenantBranding() {
  const branding = useState<TenantBranding>('tenant-branding', createDefaultTenantBranding)
  const isHydrated = useState<boolean>('tenant-branding-hydrated', () => false)
  const lastSyncError = useState<string | null>('tenant-branding-sync-error', () => null)

  async function syncGuestGuideBranding(): Promise<boolean> {
    try {
      await $fetch(getBrandingApiUrl(), {
        method: 'PUT',
        body: cloneTenantBranding(branding.value),
      })
      lastSyncError.value = null
      return true
    }
    catch {
      lastSyncError.value = 'Guest Guide branding could not be synchronized.'
      return false
    }
  }

  function hydrateBranding(): boolean {
    if (isHydrated.value)
      return false
    const stored = readStoredBranding()
    if (stored)
      branding.value = stored
    isHydrated.value = true
    if (stored)
      void syncGuestGuideBranding()
    return !!stored
  }

  async function saveBranding(draft: TenantBranding): Promise<BrandingSaveResult> {
    const next: TenantBranding = {
      ...cloneTenantBranding(draft),
      updatedAt: new Date().toISOString(),
    }
    if (!isTenantBranding(next)) {
      return { saved: false, synced: false, error: 'Branding contains invalid values.' }
    }

    try {
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(next))
    }
    catch {
      return { saved: false, synced: false, error: 'Unable to save branding in this browser.' }
    }

    branding.value = next
    const synced = await syncGuestGuideBranding()
    return synced
      ? { saved: true, synced: true }
      : { saved: true, synced: false, error: lastSyncError.value ?? undefined }
  }

  if (isClientRuntime() && getCurrentInstance()) {
    onMounted(() => { hydrateBranding() })
  }

  return {
    branding,
    isHydrated,
    lastSyncError,
    resolvedInvoiceLogo: computed(() => resolveInvoiceLogo(branding.value)),
    faviconHref: computed(() => getBrandingFaviconHref(branding.value)),
    createDefaultBrandingDraft: createDefaultTenantBranding,
    hydrateBranding,
    saveBranding,
    syncGuestGuideBranding,
  }
}
