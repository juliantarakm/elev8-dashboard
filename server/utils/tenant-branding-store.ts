import type { TenantBranding } from '../../app/components/settings/data/branding'
import {
  cloneTenantBranding,
  createDefaultTenantBranding,
} from '../../app/components/settings/data/branding'

let currentBranding = createDefaultTenantBranding()

export function getTenantBranding(): TenantBranding {
  return cloneTenantBranding(currentBranding)
}

export function setTenantBranding(value: TenantBranding): TenantBranding {
  currentBranding = cloneTenantBranding(value)
  return getTenantBranding()
}

export function resetTenantBranding(): void {
  currentBranding = createDefaultTenantBranding()
}
