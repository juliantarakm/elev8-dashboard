import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStaffAuth } from '~/composables/useStaffAuth'

describe('useStaffAuth', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    })
  })

  it('defaults currentRole to admin', () => {
    const { currentRole } = useStaffAuth()
    expect(currentRole.value).toBe('admin')
  })

  it('hydrates currentRole from localStorage', () => {
    ;(localStorage.getItem as any).mockReturnValue('"viewer"')
    const { currentRole } = useStaffAuth()
    expect(currentRole.value).toBe('viewer')
  })

  it('can() respects permission matrix', () => {
    const { setRole, can } = useStaffAuth()
    setRole('viewer')
    expect(can('view_billing')).toBe(false)
    expect(can('view_directory')).toBe(true)
    setRole('finance')
    expect(can('view_billing')).toBe(true)
    expect(can('approve_override')).toBe(false)
    setRole('approver')
    expect(can('approve_override')).toBe(true)
    expect(can('compose_banner')).toBe(false)
    setRole('admin')
    expect(can('compose_banner')).toBe(true)
  })

  it('requiresApproval returns true for >15%', () => {
    const { requiresApproval } = useStaffAuth()
    expect(requiresApproval('percent', 15)).toBe(false)
    expect(requiresApproval('percent', 20)).toBe(true)
  })

  it('requiresApproval returns true for >$50 fixed', () => {
    const { requiresApproval } = useStaffAuth()
    expect(requiresApproval('fixed', 50)).toBe(false)
    expect(requiresApproval('fixed', 75)).toBe(true)
  })

  it('setRole persists to localStorage', () => {
    const { setRole } = useStaffAuth()
    setRole('finance')
    expect(localStorage.setItem).toHaveBeenCalledWith('elev8-platform-console-role', '"finance"')
  })
})
