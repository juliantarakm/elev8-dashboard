import type { StaffRole, PermissionAction } from '~/components/platform-console/data/staff'
import { PERMISSIONS } from '~/components/platform-console/data/staff'

const ROLE_STORAGE_KEY = 'elev8-platform-console-role'

function hasStorage(): boolean {
  return typeof globalThis !== 'undefined' && !!(globalThis as any).localStorage
}

function readRoleFromStorage(): StaffRole | null {
  if (!hasStorage()) return null
  const stored = (globalThis as any).localStorage.getItem(ROLE_STORAGE_KEY)
  if (stored === '"viewer"' || stored === '"finance"' || stored === '"approver"' || stored === '"admin"') {
    return stored.slice(1, -1) as StaffRole
  }
  return null
}

function writeRoleToStorage(role: StaffRole): void {
  if (!hasStorage()) return
  (globalThis as any).localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(role))
}

export function useStaffAuth() {
  const currentRole = useState<StaffRole>(
    'staff-role',
    () => readRoleFromStorage() ?? 'admin',
  )

  const approvalThreshold = {
    maxPercentWithoutApproval: 15,
    maxFixedUsdWithoutApproval: 50,
  }

  function setRole(role: StaffRole): void {
    currentRole.value = role
    writeRoleToStorage(role)
  }

  function can(action: PermissionAction): boolean {
    return PERMISSIONS[action]?.includes(currentRole.value) ?? false
  }

  function requiresApproval(discountType: 'percent' | 'fixed', value: number): boolean {
    if (discountType === 'percent') {
      return value > approvalThreshold.maxPercentWithoutApproval
    }
    return value > approvalThreshold.maxFixedUsdWithoutApproval
  }

  return {
    currentRole,
    approvalThreshold,
    setRole,
    can,
    requiresApproval,
  }
}
