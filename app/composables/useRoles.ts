// app/composables/useRoles.ts
import type { Role, RoleId } from '~/components/users/data/roles'
import { defaultRoles, findDefaultRole } from '~/components/users/data/roles'

const STORAGE_KEY = 'elev8-tenant-roles'

function hasStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function loadFromStorage(): Role[] | null {
  if (!hasStorage()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Role[]
  }
  catch {
    return null
  }
}

function saveToStorage(roles: Role[]): void {
  if (!hasStorage()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roles))
  }
  catch {
    // ignore quota errors
  }
}

export function useRoles() {
  const roles = useState<Role[]>('tenant-roles', () => {
    const stored = loadFromStorage()
    return stored ?? JSON.parse(JSON.stringify(defaultRoles))
  })

  function getRole(id: string): Role | undefined {
    return roles.value.find(r => r.id === id)
  }

  function updateRole(id: RoleId, patch: Partial<Omit<Role, 'id'>>): void {
    roles.value = roles.value.map(r => r.id === id ? { ...r, ...patch } : r)
    saveToStorage(roles.value)
  }

  function resetRoleToDefaults(id: RoleId): void {
    const defaults = findDefaultRole(id)
    if (!defaults) return
    const fresh = JSON.parse(JSON.stringify(defaults))
    roles.value = roles.value.map(r => r.id === id ? fresh : r)
    saveToStorage(roles.value)
  }

  function resetAllRolesToDefaults(): void {
    roles.value = JSON.parse(JSON.stringify(defaultRoles))
    saveToStorage(roles.value)
  }

  return {
    roles,
    getRole,
    updateRole,
    resetRoleToDefaults,
    resetAllRolesToDefaults,
  }
}